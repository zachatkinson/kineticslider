/**
 * @fileoverview ResourceLoader for Progressive Loading with Error Handling
 *
 * Advanced resource loading system with:
 * 1. Progressive loading with chunked batches
 * 2. Comprehensive error handling and recovery
 * 3. Load balancing and concurrency control
 * 4. Cancellation support and cleanup
 *
 * @version 1.0.0
 */

import { Assets } from 'pixi.js';
import type {
  IResourceLoader,
  LoadingProgress,
  ResourceConfig,
} from '../core/types';
import {
  PIXI_CONFIG,
  RESOURCE_CONSTANTS,
  ERROR_CODES,
} from '../core/constants';

/**
 * Resource definition for loading
 */
interface ResourceDefinition {
  url: string;
  type: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Loading operation for tracking
 */
interface LoadingOperation {
  id: string;
  resource: ResourceDefinition;
  promise: Promise<unknown>;
  controller: AbortController;
  startTime: number;
  retryCount: number;
}

/**
 * Loading statistics
 */
interface LoadingStats {
  pending: number;
  completed: number;
  failed: number;
  totalBytes?: number;
  loadedBytes?: number;
  averageSpeed?: number; // bytes per second
}

/**
 * ResourceLoader for progressive loading with error handling
 */
export class ResourceLoader implements IResourceLoader {
  private config: ResourceConfig;
  private activeOperations = new Map<string, LoadingOperation>();
  private stats: LoadingStats = {
    pending: 0,
    completed: 0,
    failed: 0,
  };
  private isCancelled = false;
  private progressCallback?: (progress: LoadingProgress) => void;

  constructor(config?: Partial<ResourceConfig>) {
    this.config = this.createDefaultConfig(config);
  }

  /**
   * Load resources with progress tracking
   */
  async loadResources(
    resources: Array<{ url: string; type: string }>,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<Map<string, unknown>> {
    this.isCancelled = false;
    this.progressCallback = onProgress;
    this.resetStats();

    const results = new Map<string, unknown>();

    try {
      // Convert to resource definitions with priorities
      const resourceDefs: ResourceDefinition[] = resources.map(
        (resource, index) => ({
          ...resource,
          priority: 1000 - index, // Higher priority for earlier items
        })
      );

      // Process in progressive chunks
      const chunks = this.createProgressiveChunks(resourceDefs);

      for (const chunk of chunks) {
        if (this.isCancelled) {
          break;
        }

        const chunkResults = await this.loadChunk(chunk);

        // Merge results
        chunkResults.forEach((value, key) => {
          results.set(key, value);
        });

        // Update progress
        this.updateProgress(resources.length, results.size);
      }

      return results;
    } catch (error) {
      // Cleanup on error
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Load single resource with retry logic
   */
  async loadResource(url: string, type: string): Promise<unknown> {
    const operation = await this.createLoadingOperation({ url, type });

    try {
      const result = await operation.promise;
      this.stats.completed++;
      return result;
    } catch (error) {
      // Attempt retry if configured
      if (operation.retryCount < 3) {
        // Max 3 retries
        operation.retryCount++;

        // Exponential backoff
        const delay = Math.pow(2, operation.retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry
        return this.loadResource(url, type);
      }

      this.stats.failed++;
      throw error;
    } finally {
      this.activeOperations.delete(operation.id);
    }
  }

  /**
   * Cancel ongoing loading operations
   */
  cancelLoading(): void {
    this.isCancelled = true;

    // Cancel all active operations
    this.activeOperations.forEach((operation) => {
      operation.controller.abort();
    });

    this.activeOperations.clear();
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): { pending: number; completed: number; failed: number } {
    return {
      pending: this.activeOperations.size,
      completed: this.stats.completed,
      failed: this.stats.failed,
    };
  }

  /**
   * Dispose of resource loader
   */
  dispose(): void {
    this.cancelLoading();
    this.progressCallback = undefined;
    this.resetStats();
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create default configuration
   */
  private createDefaultConfig(
    config?: Partial<ResourceConfig>
  ): ResourceConfig {
    return {
      cleanupInterval:
        config?.cleanupInterval ?? RESOURCE_CONSTANTS.CLEANUP_INTERVAL,
      idleTimeout: config?.idleTimeout ?? RESOURCE_CONSTANTS.IDLE_TIMEOUT,
      memoryPressureThreshold:
        config?.memoryPressureThreshold ??
        RESOURCE_CONSTANTS.MEMORY_PRESSURE_THRESHOLD,
      criticalMemoryThreshold:
        config?.criticalMemoryThreshold ??
        RESOURCE_CONSTANTS.CRITICAL_MEMORY_THRESHOLD,
      trackReferences:
        config?.trackReferences ?? RESOURCE_CONSTANTS.TRACK_REFERENCES,
      autoCleanup: config?.autoCleanup ?? RESOURCE_CONSTANTS.AUTO_CLEANUP,
    };
  }

  /**
   * Create progressive loading chunks
   */
  private createProgressiveChunks(
    resources: ResourceDefinition[]
  ): ResourceDefinition[][] {
    const chunks: ResourceDefinition[][] = [];
    const chunkSize = PIXI_CONFIG.PROGRESSIVE_CHUNK_SIZE;

    // Sort by priority (highest first)
    const sortedResources = [...resources].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    for (let i = 0; i < sortedResources.length; i += chunkSize) {
      chunks.push(sortedResources.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Load a chunk of resources with concurrency control
   */
  private async loadChunk(
    chunk: ResourceDefinition[]
  ): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    const operations: LoadingOperation[] = [];

    try {
      // Create loading operations for chunk
      for (const resource of chunk) {
        if (this.isCancelled) {
          break;
        }

        const operation = await this.createLoadingOperation(resource);
        operations.push(operation);
      }

      // Wait for all operations in chunk to complete
      const settledResults = await Promise.allSettled(
        operations.map((op) => op.promise)
      );

      // Process results
      settledResults.forEach((result, index) => {
        const operation = operations.at(index);
        if (!operation) return;

        if (result.status === 'fulfilled') {
          const { value } = result;
          results.set(operation.resource.url, value);
          this.stats.completed++;
        } else {
          // Silently handle resource load failures
          this.stats.failed++;
        }
      });

      return results;
    } finally {
      // Cleanup operations
      operations.forEach((operation) => {
        this.activeOperations.delete(operation.id);
      });
    }
  }

  /**
   * Create loading operation with abort support
   */
  private async createLoadingOperation(
    resource: ResourceDefinition
  ): Promise<LoadingOperation> {
    const controller = new AbortController();
    const operationId = `${resource.type}-${resource.url}-${Date.now()}`;

    const operation: LoadingOperation = {
      id: operationId,
      resource,
      controller,
      startTime: performance.now(),
      retryCount: 0,
      promise: this.loadResourceWithType(resource, controller.signal),
    };

    this.activeOperations.set(operationId, operation);
    this.stats.pending++;

    return operation;
  }

  /**
   * Load resource based on type with abort signal
   */
  private async loadResourceWithType(
    resource: ResourceDefinition,
    signal: AbortSignal
  ): Promise<unknown> {
    try {
      switch (resource.type.toLowerCase()) {
        case 'texture':
        case 'image':
          return await this.loadTextureResource(resource.url, signal);

        case 'audio':
          return await this.loadAudioResource(resource.url, signal);

        case 'json':
          return await this.loadJsonResource(resource.url, signal);

        case 'font':
          return await this.loadFontResource(resource.url, signal);

        default:
          throw new Error(`Unsupported resource type: ${resource.type}`);
      }
    } catch (error) {
      if (signal.aborted) {
        throw new Error(`Loading cancelled: ${resource.url}`);
      }

      const loadError = new Error(
        `Failed to load ${resource.type} resource: ${resource.url}. ${(error as Error).message}`
      );
      loadError.name = ERROR_CODES.ASSET_LOAD_FAILED;
      throw loadError;
    }
  }

  /**
   * Load texture resource
   */
  private async loadTextureResource(
    url: string,
    signal: AbortSignal
  ): Promise<unknown> {
    // Use PIXI Assets with abort signal simulation
    const loadPromise = Assets.load(url);

    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      const abortHandler = (): void => {
        reject(new Error('Aborted'));
      };

      signal.addEventListener('abort', abortHandler);

      loadPromise
        .then((result) => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch((error) => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Load audio resource
   */
  private async loadAudioResource(
    url: string,
    signal: AbortSignal
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      const audio = new Audio();

      const abortHandler = (): void => {
        audio.src = '';
        reject(new Error('Aborted'));
      };

      signal.addEventListener('abort', abortHandler);

      audio.onload = (): void => {
        signal.removeEventListener('abort', abortHandler);
        resolve(audio);
      };

      audio.onerror = (): void => {
        signal.removeEventListener('abort', abortHandler);
        reject(new Error(`Failed to load audio: ${url}`));
      };

      audio.src = url;
    });
  }

  /**
   * Load JSON resource
   */
  private async loadJsonResource(
    url: string,
    signal: AbortSignal
  ): Promise<unknown> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Load font resource
   */
  private async loadFontResource(
    url: string,
    signal: AbortSignal
  ): Promise<unknown> {
    if (!('fonts' in document)) {
      throw new Error('Font loading not supported');
    }

    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      const fontFace = new FontFace('CustomFont', `url(${url})`);

      const abortHandler = (): void => {
        reject(new Error('Aborted'));
      };

      signal.addEventListener('abort', abortHandler);

      fontFace
        .load()
        .then((loadedFace) => {
          signal.removeEventListener('abort', abortHandler);
          document.fonts.add(loadedFace);
          resolve(loadedFace);
        })
        .catch((error) => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Update loading progress
   */
  private updateProgress(total: number, loaded: number): void {
    if (this.progressCallback) {
      const progress: LoadingProgress = {
        loaded,
        total,
        percentage: (loaded / total) * 100,
      };

      // Add estimated time remaining
      if (loaded > 0) {
        const elapsed =
          performance.now() -
          (this.activeOperations.values().next().value?.startTime || 0);
        const averageTimePerItem = elapsed / loaded;
        const remaining = total - loaded;
        progress.estimatedTimeRemaining = remaining * averageTimePerItem;
      }

      this.progressCallback(progress);
    }
  }

  /**
   * Reset loading statistics
   */
  private resetStats(): void {
    this.stats = {
      pending: 0,
      completed: 0,
      failed: 0,
    };
  }

  /**
   * Cleanup resources and operations
   */
  private async cleanup(): Promise<void> {
    this.cancelLoading();
    this.resetStats();
  }
}
