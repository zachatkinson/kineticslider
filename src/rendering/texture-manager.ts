/**
 * @fileoverview TextureManager for Efficient Texture Loading and Caching
 *
 * Advanced texture management system with:
 * 1. Progressive loading with priority queue
 * 2. Memory-efficient LRU caching
 * 3. Preloading and lazy loading strategies
 * 4. Error handling with exponential backoff retry
 *
 * @version 1.0.0
 */

import { Texture, Assets } from 'pixi.js';
import type {
  ITextureManager,
  TextureConfig,
  LoadingProgress,
} from '../core/types';
import { TEXTURE_CONSTANTS, PIXI_CONFIG, ERROR_CODES } from '../core/constants';

/**
 * Priority queue item for texture loading
 */
interface LoadingQueueItem {
  url: string;
  priority: number;
  resolve: (texture: Texture) => void;
  reject: (error: Error) => void;
  retryCount: number;
  startTime: number;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  texture: Texture;
  url: string;
  lastAccessed: number;
  memorySize: number;
  refCount: number;
}

/**
 * TextureManager for efficient texture loading and caching
 */
export class TextureManager implements ITextureManager {
  private cache = new Map<string, CacheEntry>();
  private loadingQueue: LoadingQueueItem[] = [];
  private isProcessing = false;
  private config: TextureConfig;
  private totalMemoryUsed = 0;
  private loadingStats = {
    pending: 0,
    completed: 0,
    failed: 0,
  };

  // Active loading operations for cancellation
  private activeLoads = new Set<string>();

  constructor(config?: Partial<TextureConfig>) {
    this.config = this.createDefaultConfig(config);
  }

  /**
   * Load single texture with progress tracking
   */
  async loadTexture(url: string, priority = 500): Promise<Texture> {
    // Check cache first
    const cached = this.getCachedTexture(url);
    if (cached) {
      this.updateCacheAccess(url);
      return cached;
    }

    // Add to loading queue
    return new Promise<Texture>((resolve, reject) => {
      const queueItem: LoadingQueueItem = {
        url,
        priority,
        resolve,
        reject,
        retryCount: 0,
        startTime: performance.now(),
      };

      this.loadingQueue.push(queueItem);
      this.loadingStats.pending++;

      // Sort by priority (higher priority first)
      this.loadingQueue.sort((a, b) => b.priority - a.priority);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processLoadingQueue();
      }
    });
  }

  /**
   * Load multiple textures with progress callback
   */
  async loadTextures(
    urls: string[],
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<Texture[]> {
    const results: Texture[] = new Array(urls.length);
    const total = urls.length;
    let loaded = 0;

    const loadPromises = urls.map(async (url, index) => {
      try {
        const texture = await this.loadTexture(url, 1000 - index); // Higher priority for earlier items
        results.splice(index, 1, texture);
        loaded++;

        // Report progress
        if (onProgress) {
          onProgress({
            loaded,
            total,
            percentage: (loaded / total) * 100,
            currentResource: url,
          });
        }

        return texture;
      } catch (error) {
        this.loadingStats.failed++;
        throw error;
      }
    });

    await Promise.all(loadPromises);
    return results;
  }

  /**
   * Preload textures for future use
   */
  async preloadTextures(urls: string[]): Promise<void> {
    const preloadPromises = urls.map((url) =>
      this.loadTexture(url, 100) // Low priority for preloading
        .catch(() => {
          // Silently handle preload failures
        })
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get cached texture
   */
  getCachedTexture(url: string): Texture | null {
    const entry = this.cache.get(url);
    if (entry) {
      this.updateCacheAccess(url);
      return entry.texture;
    }
    return null;
  }

  /**
   * Clear texture cache
   */
  clearCache(): void {
    // Dispose of all cached textures
    this.cache.forEach((entry) => {
      if (entry.texture && !entry.texture.destroyed) {
        entry.texture.destroy(true);
      }
    });

    this.cache.clear();
    this.totalMemoryUsed = 0;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryUsage(): { used: number; cached: number; total: number } {
    return {
      used: this.totalMemoryUsed,
      cached: this.cache.size,
      total: PIXI_CONFIG.TEXTURE_MEMORY_LIMIT,
    };
  }

  /**
   * Dispose of texture manager
   */
  dispose(): void {
    // Cancel all active loads
    this.activeLoads.clear();
    this.loadingQueue = [];
    this.isProcessing = false;

    // Clear cache
    this.clearCache();

    // Reset stats
    this.loadingStats = { pending: 0, completed: 0, failed: 0 };
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create default configuration
   */
  private createDefaultConfig(config?: Partial<TextureConfig>): TextureConfig {
    return {
      supportedFormats:
        config?.supportedFormats ?? TEXTURE_CONSTANTS.SUPPORTED_FORMATS,
      quality: config?.quality ?? TEXTURE_CONSTANTS.DEFAULT_QUALITY,
      cacheSize: config?.cacheSize ?? TEXTURE_CONSTANTS.PRELOAD_CACHE_SIZE,
      lazyLoadThreshold:
        config?.lazyLoadThreshold ?? TEXTURE_CONSTANTS.LAZY_LOAD_THRESHOLD,
      loadTimeout: config?.loadTimeout ?? TEXTURE_CONSTANTS.LOAD_TIMEOUT,
      maxRetries: config?.maxRetries ?? TEXTURE_CONSTANTS.MAX_RETRY_ATTEMPTS,
      retryDelay: {
        base: config?.retryDelay?.base ?? TEXTURE_CONSTANTS.RETRY_DELAY_BASE,
        multiplier: config?.retryDelay?.multiplier ?? 2,
      },
    };
  }

  /**
   * Process loading queue with concurrency control
   */
  private async processLoadingQueue(): Promise<void> {
    if (this.isProcessing || this.loadingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.loadingQueue.length > 0) {
        // Process up to concurrent limit
        const batch = this.loadingQueue.splice(
          0,
          PIXI_CONFIG.LOADER_CONCURRENT_LIMIT
        );

        const loadPromises = batch.map((item) => this.loadSingleTexture(item));
        await Promise.allSettled(loadPromises);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Load single texture with retry logic
   */
  private async loadSingleTexture(item: LoadingQueueItem): Promise<void> {
    try {
      // Validate URL format
      if (!this.isValidTextureUrl(item.url)) {
        throw new Error(`Unsupported texture format: ${item.url}`);
      }

      // Check if already loading
      if (this.activeLoads.has(item.url)) {
        throw new Error(`Texture already loading: ${item.url}`);
      }

      this.activeLoads.add(item.url);

      // Load with timeout
      const texture = await this.loadWithTimeout(
        item.url,
        this.config.loadTimeout
      );

      // Cache the texture
      this.cacheTexture(item.url, texture);

      // Update stats
      this.loadingStats.completed++;
      this.loadingStats.pending--;

      // Resolve the promise
      item.resolve(texture);
    } catch (error) {
      await this.handleLoadError(item, error as Error);
    } finally {
      this.activeLoads.delete(item.url);
    }
  }

  /**
   * Load texture with timeout protection
   */
  private async loadWithTimeout(
    url: string,
    timeout: number
  ): Promise<Texture> {
    const loadPromise = Assets.load(url);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Texture load timeout: ${url}`));
      }, timeout);
    });

    return Promise.race([loadPromise, timeoutPromise]);
  }

  /**
   * Handle loading errors with retry logic
   */
  private async handleLoadError(
    item: LoadingQueueItem,
    error: Error
  ): Promise<void> {
    item.retryCount++;

    if (item.retryCount <= this.config.maxRetries) {
      // Calculate exponential backoff delay
      const delay =
        this.config.retryDelay.base *
        Math.pow(this.config.retryDelay.multiplier, item.retryCount - 1);

      // Schedule retry
      setTimeout(() => {
        this.loadingQueue.unshift(item); // Add back to front of queue
        if (!this.isProcessing) {
          this.processLoadingQueue();
        }
      }, delay);
    } else {
      // Max retries exceeded
      this.loadingStats.failed++;
      this.loadingStats.pending--;

      const finalError = new Error(
        `Failed to load texture after ${this.config.maxRetries} retries: ${item.url}. Last error: ${error.message}`
      );
      finalError.name = ERROR_CODES.ASSET_LOAD_FAILED;

      item.reject(finalError);
    }
  }

  /**
   * Cache texture with memory management
   */
  private cacheTexture(url: string, texture: Texture): void {
    // Calculate estimated memory size
    const memorySize = this.estimateTextureMemorySize(texture);

    // Check memory limit
    if (this.totalMemoryUsed + memorySize > PIXI_CONFIG.TEXTURE_MEMORY_LIMIT) {
      this.evictLeastRecentlyUsed(memorySize);
    }

    const entry: CacheEntry = {
      texture,
      url,
      lastAccessed: Date.now(),
      memorySize,
      refCount: 1,
    };

    this.cache.set(url, entry);
    this.totalMemoryUsed += memorySize;
  }

  /**
   * Evict least recently used textures to free memory
   */
  private evictLeastRecentlyUsed(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .map(([url, entry]) => ({ url, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    let freedSpace = 0;

    for (const { url, entry } of entries) {
      if (freedSpace >= requiredSpace) {
        break;
      }

      // Don't evict textures with active references
      if (entry.refCount > 0) {
        continue;
      }

      // Dispose of texture
      if (entry.texture && !entry.texture.destroyed) {
        entry.texture.destroy(true);
      }

      this.cache.delete(url);
      this.totalMemoryUsed -= entry.memorySize;
      freedSpace += entry.memorySize;
    }
  }

  /**
   * Update cache access time
   */
  private updateCacheAccess(url: string): void {
    const entry = this.cache.get(url);
    if (entry) {
      entry.lastAccessed = Date.now();
      entry.refCount++;
    }
  }

  /**
   * Validate texture URL format
   */
  private isValidTextureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);
      const extension = urlObj.pathname.split('.').pop()?.toLowerCase();

      return extension
        ? this.config.supportedFormats.includes(extension)
        : false;
    } catch {
      return false;
    }
  }

  /**
   * Estimate texture memory size
   */
  private estimateTextureMemorySize(texture: Texture): number {
    if (!texture.source) {
      return 1024; // Default estimate
    }

    const width = texture.source.width || 256;
    const height = texture.source.height || 256;
    const bytesPerPixel = 4; // RGBA

    return width * height * bytesPerPixel;
  }
}
