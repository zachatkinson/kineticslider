/**
 * @fileoverview Memory Manager for Phase 2.3
 *
 * Comprehensive memory management system for GSAP animations and PIXI resources.
 * Tracks memory usage, manages resource lifecycle, and provides automatic cleanup
 * to prevent memory leaks in complex animation scenarios.
 *
 * @version 2.3.0
 */

import { gsap } from 'gsap';
import { SimpleEventEmitter } from '../core/event-emitter';
import { serviceContainer } from '../core/container';
import { PERFORMANCE_THRESHOLDS, ANIMATION_EVENTS } from '../core/constants';

/**
 * Resource tracking interface
 */
export interface ResourceInfo {
  /** Unique resource identifier */
  id: string;
  /** Resource type */
  type: 'timeline' | 'tween' | 'sprite' | 'texture' | 'filter';
  /** Creation timestamp */
  createdAt: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Reference count */
  refCount: number;
  /** Memory footprint estimate (bytes) */
  memorySize: number;
  /** Whether resource is actively in use */
  isActive: boolean;
  /** Resource-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Memory statistics interface
 */
export interface MemoryStats {
  /** Total tracked resources */
  totalResources: number;
  /** Active resources */
  activeResources: number;
  /** Estimated memory usage (bytes) */
  estimatedMemoryUsage: number;
  /** Memory usage by type */
  byType: {
    timeline: { count: number; memory: number };
    tween: { count: number; memory: number };
    sprite: { count: number; memory: number };
    texture: { count: number; memory: number };
    filter: { count: number; memory: number };
  };
  /** Cleanup statistics */
  cleanup: {
    totalCleaned: number;
    memoryReclaimed: number;
    lastCleanupAt: number;
  };
}

/**
 * Memory leak detection interface
 */
export interface MemoryLeak {
  /** Leak identifier */
  id: string;
  /** Resource type causing leak */
  type: ResourceInfo['type'];
  /** Age of the leak (ms) */
  age: number;
  /** Estimated memory impact */
  memoryImpact: number;
  /** Description of potential cause */
  cause: string;
  /** Suggested fix */
  suggestion: string;
}

/**
 * Resource metadata interface
 */
export interface ResourceMetadata {
  /** Resource type */
  type: string;
  /** Estimated size in bytes */
  size: number;
  /** Resource data */
  data?: unknown;
}

/**
 * Memory management system
 */
export class MemoryManager extends SimpleEventEmitter {
  private resources = new Map<string, ResourceInfo>();
  private memoryStats: MemoryStats = {
    totalResources: 0,
    activeResources: 0,
    estimatedMemoryUsage: 0,
    byType: {
      timeline: { count: 0, memory: 0 },
      tween: { count: 0, memory: 0 },
      sprite: { count: 0, memory: 0 },
      texture: { count: 0, memory: 0 },
      filter: { count: 0, memory: 0 },
    },
    cleanup: {
      totalCleaned: 0,
      memoryReclaimed: 0,
      lastCleanupAt: 0,
    },
  };

  // Cleanup intervals and settings
  private cleanupInterval: NodeJS.Timeout | null = null;
  private leakDetectionInterval: NodeJS.Timeout | null = null;
  private autoCleanupEnabled = true;
  private cleanupThreshold = PERFORMANCE_THRESHOLDS.MEMORY_WARNING_THRESHOLD;
  private maxResourceAge = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
    this.setupEventListeners();
  }

  // =============================================================================
  // 🎯 Public API - Resource Management
  // =============================================================================

  /**
   * Start memory management
   */
  start(): void {
    // Start automatic cleanup
    this.startAutoCleanup();

    // Start leak detection
    this.startLeakDetection();

    this.emit('memory:started');
  }

  /**
   * Stop memory management
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
      this.leakDetectionInterval = null;
    }

    this.emit('memory:stopped');
  }

  /**
   * Track a resource
   */
  trackResource(
    resourceOrId:
      | string
      | Omit<ResourceInfo, 'createdAt' | 'lastAccessed' | 'refCount'>,
    resource?: Omit<
      ResourceInfo,
      'id' | 'createdAt' | 'lastAccessed' | 'refCount'
    >
  ): void {
    const now = Date.now();
    let fullResource: ResourceInfo;

    if (typeof resourceOrId === 'string') {
      // Called with (id, resource) signature
      if (!resource)
        throw new Error('Resource info required when using string ID');
      fullResource = {
        id: resourceOrId,
        ...resource,
        createdAt: now,
        lastAccessed: now,
        refCount: 1,
      };
    } else {
      // Called with (resource) signature
      fullResource = {
        ...resourceOrId,
        createdAt: now,
        lastAccessed: now,
        refCount: 1,
      };
    }

    this.resources.set(fullResource.id, fullResource);
    this.updateMemoryStats();

    this.emit('resource:tracked', {
      resourceId: fullResource.id,
      type: fullResource.type,
    });
  }

  /**
   * Increment resource reference count
   */
  addReference(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.refCount++;
      resource.lastAccessed = Date.now();
      this.emit('resource:referenced', {
        resourceId,
        refCount: resource.refCount,
      });
    }
  }

  /**
   * Decrement resource reference count
   */
  removeReference(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.refCount = Math.max(0, resource.refCount - 1);
      resource.lastAccessed = Date.now();

      if (resource.refCount === 0) {
        this.markForCleanup(resourceId);
      }

      this.emit('resource:dereferenced', {
        resourceId,
        refCount: resource.refCount,
      });
    }
  }

  /**
   * Clean up specific resource
   */
  cleanupResource(resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) return false;

    try {
      this.performResourceCleanup(resource);
      this.resources.delete(resourceId);
      this.updateMemoryStats();

      this.emit('resource:cleaned', {
        resourceId,
        type: resource.type,
        memoryReclaimed: resource.memorySize,
      });
      return true;
    } catch (error) {
      this.emit('resource:cleanup:error', { resourceId, error });
      return false;
    }
  }

  /**
   * Force cleanup of all unused resources
   */
  forceCleanup(): number {
    const unusedResources = Array.from(this.resources.values()).filter(
      (resource) => resource.refCount === 0 || !resource.isActive
    );

    let cleanedCount = 0;
    let memoryReclaimed = 0;

    unusedResources.forEach((resource) => {
      if (this.cleanupResource(resource.id)) {
        cleanedCount++;
        memoryReclaimed += resource.memorySize;
      }
    });

    this.memoryStats.cleanup.totalCleaned += cleanedCount;
    this.memoryStats.cleanup.memoryReclaimed += memoryReclaimed;
    this.memoryStats.cleanup.lastCleanupAt = Date.now();

    this.emit('memory:cleanup:complete', { cleanedCount, memoryReclaimed });
    return cleanedCount;
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    return { ...this.memoryStats };
  }

  /**
   * Get resource information
   */
  getResourceInfo(resourceId: string): ResourceInfo | undefined {
    return this.resources.get(resourceId);
  }

  /**
   * Get all tracked resources
   */
  getAllResources(): ResourceInfo[] {
    return Array.from(this.resources.values());
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): MemoryLeak[] {
    const now = Date.now();
    const leaks: MemoryLeak[] = [];

    this.resources.forEach((resource) => {
      const age = now - resource.createdAt;

      // Check for old, unreferenced resources
      if (resource.refCount === 0 && age > this.maxResourceAge) {
        leaks.push({
          id: resource.id,
          type: resource.type,
          age,
          memoryImpact: resource.memorySize,
          cause: 'Resource not properly cleaned up after use',
          suggestion: 'Ensure proper cleanup in animation completion callbacks',
        });
      }

      // Check for resources with high reference counts
      if (resource.refCount > 10) {
        leaks.push({
          id: resource.id,
          type: resource.type,
          age,
          memoryImpact: resource.memorySize * resource.refCount,
          cause: 'Excessive reference count may indicate circular references',
          suggestion: 'Review reference management and ensure proper cleanup',
        });
      }

      // Check for inactive resources that are still referenced
      if (!resource.isActive && resource.refCount > 0 && age > 60000) {
        // 1 minute
        leaks.push({
          id: resource.id,
          type: resource.type,
          age,
          memoryImpact: resource.memorySize,
          cause: 'Inactive resource still has references',
          suggestion: 'Ensure references are removed when animations complete',
        });
      }
    });

    return leaks;
  }

  // =============================================================================
  // 🔧 Private Implementation - Memory Management
  // =============================================================================

  private setupEventListeners(): void {
    // Listen to animation events for automatic resource tracking
    this.on(ANIMATION_EVENTS.ANIMATION_STARTED, (...args: unknown[]) => {
      const data = args[0] as { id?: string } | undefined;
      if (data?.id) {
        this.addReference(data.id);
      }
    });

    this.on(ANIMATION_EVENTS.ANIMATION_COMPLETED, (...args: unknown[]) => {
      const data = args[0] as { id?: string } | undefined;
      if (data?.id) {
        this.removeReference(data.id);
      }
    });

    this.on(ANIMATION_EVENTS.ANIMATION_ERROR, (...args: unknown[]) => {
      const data = args[0] as { id?: string } | undefined;
      if (data?.id) {
        this.removeReference(data.id);
      }
    });
  }

  private startAutoCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      if (this.autoCleanupEnabled) {
        this.performAutoCleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  private startLeakDetection(): void {
    if (this.leakDetectionInterval) return;

    this.leakDetectionInterval = setInterval(() => {
      const leaks = this.detectMemoryLeaks();
      if (leaks.length > 0) {
        this.emit('memory:leaks:detected', { leaks });
      }
    }, 60000); // Check every minute
  }

  private performAutoCleanup(): void {
    const currentMemory = this.estimateCurrentMemoryUsage();

    if (currentMemory > this.cleanupThreshold) {
      const cleanedCount = this.forceCleanup();
      this.emit('memory:auto:cleanup', {
        trigger: 'threshold',
        beforeMemory: currentMemory,
        cleanedCount,
      });
    }

    // Also clean up old, unused resources
    this.cleanupOldResources();
  }

  private cleanupOldResources(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.resources.forEach((resource) => {
      const age = now - resource.lastAccessed;

      if (resource.refCount === 0 && age > this.maxResourceAge) {
        this.cleanupResource(resource.id);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.emit('memory:auto:cleanup', {
        trigger: 'age',
        cleanedCount,
      });
    }
  }

  private markForCleanup(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.isActive = false;
      this.emit('resource:marked:cleanup', { resourceId });
    }
  }

  private performResourceCleanup(resource: ResourceInfo): void {
    try {
      switch (resource.type) {
        case 'timeline':
          this.cleanupTimeline(resource);
          break;
        case 'tween':
          this.cleanupTween(resource);
          break;
        case 'sprite':
          this.cleanupSprite(resource);
          break;
        case 'texture':
          this.cleanupTexture(resource);
          break;
        case 'filter':
          this.cleanupFilter(resource);
          break;
      }
    } catch (error) {
      throw new Error(`Failed to cleanup ${resource.type} resource: ${error}`);
    }
  }

  private cleanupTimeline(resource: ResourceInfo): void {
    // Clean up GSAP timeline
    if (resource.metadata?.timeline) {
      const timeline = resource.metadata.timeline as gsap.core.Timeline;
      if (timeline.isActive()) {
        timeline.kill();
      }
    }
  }

  private cleanupTween(resource: ResourceInfo): void {
    // Clean up GSAP tween
    if (resource.metadata?.tween) {
      const tween = resource.metadata.tween as gsap.core.Tween;
      if (tween.isActive()) {
        tween.kill();
      }
    }
  }

  private cleanupSprite(resource: ResourceInfo): void {
    // Clean up PIXI sprite
    if (resource.metadata?.sprite) {
      const sprite = resource.metadata.sprite as unknown;
      if (
        sprite &&
        typeof sprite === 'object' &&
        'destroy' in sprite &&
        typeof (sprite as { destroy: unknown }).destroy === 'function'
      ) {
        (
          sprite as {
            destroy: (options?: {
              children?: boolean;
              texture?: boolean;
              baseTexture?: boolean;
            }) => void;
          }
        ).destroy({ children: true, texture: false, baseTexture: false });
      }
    }
  }

  private cleanupTexture(resource: ResourceInfo): void {
    // Clean up PIXI texture
    if (resource.metadata?.texture) {
      const texture = resource.metadata.texture as unknown;
      if (
        texture &&
        typeof texture === 'object' &&
        'destroy' in texture &&
        typeof (texture as { destroy: unknown }).destroy === 'function'
      ) {
        (texture as { destroy: (destroyBase?: boolean) => void }).destroy(true);
      }
    }
  }

  private cleanupFilter(resource: ResourceInfo): void {
    // Clean up PIXI filter
    if (resource.metadata?.filter) {
      const filter = resource.metadata.filter as unknown;
      if (
        filter &&
        typeof filter === 'object' &&
        'destroy' in filter &&
        typeof (filter as { destroy: unknown }).destroy === 'function'
      ) {
        (filter as { destroy: () => void }).destroy();
      }
    }
  }

  private updateMemoryStats(): void {
    // Reset counters
    this.memoryStats.totalResources = this.resources.size;
    this.memoryStats.activeResources = 0;
    this.memoryStats.estimatedMemoryUsage = 0;

    // Reset type counters
    Object.keys(this.memoryStats.byType).forEach((type) => {
      this.memoryStats.byType[type as keyof typeof this.memoryStats.byType] = {
        count: 0,
        memory: 0,
      };
    });

    // Recalculate from resources
    this.resources.forEach((resource) => {
      if (resource.isActive) {
        this.memoryStats.activeResources++;
      }

      this.memoryStats.estimatedMemoryUsage += resource.memorySize;

      const typeStats = this.memoryStats.byType[resource.type];
      typeStats.count++;
      typeStats.memory += resource.memorySize;
    });
  }

  private estimateCurrentMemoryUsage(): number {
    // Use browser memory API if available
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = performance.memory as { usedJSHeapSize: number };
      return memory.usedJSHeapSize;
    }
    return this.memoryStats.estimatedMemoryUsage;
  }

  /**
   * Configure cleanup settings
   */
  configure(options: {
    autoCleanupEnabled?: boolean;
    cleanupThreshold?: number;
    maxResourceAge?: number;
  }): void {
    if (options.autoCleanupEnabled !== undefined) {
      this.autoCleanupEnabled = options.autoCleanupEnabled;
    }
    if (options.cleanupThreshold !== undefined) {
      this.cleanupThreshold = options.cleanupThreshold;
    }
    if (options.maxResourceAge !== undefined) {
      this.maxResourceAge = options.maxResourceAge;
    }

    this.emit('memory:configured', options);
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stop();
    this.forceCleanup();
    this.removeAllListeners();
    this.resources.clear();
  }

  /**
   * Enable automatic cleanup (public API)
   */
  enableAutoCleanup(): void {
    this.autoCleanupEnabled = true;
    if (!this.cleanupInterval) {
      this.startAutoCleanup();
    }
  }

  /**
   * Disable automatic cleanup (public API)
   */
  disableAutoCleanup(): void {
    this.autoCleanupEnabled = false;
  }
}

// Register with service container
serviceContainer.register('MemoryManager', () => new MemoryManager());
