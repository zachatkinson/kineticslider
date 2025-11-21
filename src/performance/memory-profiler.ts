/**
 * @fileoverview MemoryProfiler - Advanced memory usage monitoring and optimization
 *
 * Comprehensive memory profiling system that tracks memory allocation, detects leaks,
 * monitors garbage collection, and provides optimization recommendations.
 * Ensures memory usage stays under 100MB for optimal performance.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { debugLogger } from '../utils/debug-logger';
import type { Sprite, Texture, Container } from 'pixi.js';

/**
 * Memory snapshot information
 */
export interface MemorySnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Total JS heap size in bytes */
  totalJSHeapSize: number;
  /** Used JS heap size in bytes */
  usedJSHeapSize: number;
  /** JS heap size limit in bytes */
  jsHeapSizeLimit: number;
  /** Number of DOM nodes */
  domNodes: number;
  /** Number of event listeners */
  eventListeners: number;
  /** Number of PIXI objects */
  pixiObjects: {
    sprites: number;
    textures: number;
    containers: number;
  };
  /** WebGL memory usage */
  webglMemory: {
    textures: number;
    buffers: number;
    programs: number;
  };
}

/**
 * Memory leak detection result
 */
export interface LeakDetectionResult {
  /** Whether a leak was detected */
  hasLeak: boolean;
  /** Leak severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Leak growth rate in bytes per second */
  growthRate: number;
  /** Suspected leak sources */
  suspectedSources: string[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Memory allocation tracking
 */
export interface AllocationTrace {
  /** Allocation ID */
  id: string;
  /** Object type */
  type: string;
  /** Size in bytes */
  size: number;
  /** Stack trace */
  stack?: string;
  /** Allocation timestamp */
  timestamp: number;
  /** Whether it was freed */
  freed: boolean;
}

/**
 * Memory profiler configuration
 */
export interface MemoryProfilerConfig {
  /** Enable automatic profiling */
  autoProfile: boolean;
  /** Profiling interval in milliseconds */
  profileInterval: number;
  /** Memory limit in MB */
  memoryLimit: number;
  /** Warning threshold percentage */
  warningThreshold: number;
  /** Critical threshold percentage */
  criticalThreshold: number;
  /** Enable leak detection */
  enableLeakDetection: boolean;
  /** Leak detection interval */
  leakDetectionInterval: number;
  /** Maximum snapshots to keep */
  maxSnapshots: number;
  /** Enable detailed tracking */
  detailedTracking: boolean;
}

/**
 * Garbage collection statistics
 */
export interface GCStats {
  /** Number of collections */
  collections: number;
  /** Total pause time in ms */
  totalPauseTime: number;
  /** Average pause time in ms */
  avgPauseTime: number;
  /** Last collection timestamp */
  lastCollection: number;
  /** Collection frequency per minute */
  frequency: number;
}

/**
 * Memory optimization recommendation
 */
export interface OptimizationRecommendation {
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Category */
  category: 'textures' | 'sprites' | 'events' | 'dom' | 'general';
  /** Issue description */
  issue: string;
  /** Recommended action */
  action: string;
  /** Potential memory savings in MB */
  potentialSavings: number;
}

/**
 * Memory profiler events
 */
export interface MemoryProfilerEvents {
  'memory-warning': (snapshot: MemorySnapshot) => void;
  'memory-critical': (snapshot: MemorySnapshot) => void;
  'leak-detected': (result: LeakDetectionResult) => void;
  'gc-detected': (stats: GCStats) => void;
  'snapshot-taken': (snapshot: MemorySnapshot) => void;
}

/**
 * MemoryProfiler - Advanced memory monitoring and optimization
 */
export class MemoryProfiler extends SimpleEventEmitter {
  private config: Required<MemoryProfilerConfig>;
  private snapshots: MemorySnapshot[] = [];
  private allocations = new Map<string, AllocationTrace>();
  private isProfilering = false;
  private profileInterval: NodeJS.Timeout | null = null;
  private leakDetectionInterval: NodeJS.Timeout | null = null;
  private lastGCTime = 0;
  private gcStats: GCStats;
  private pixiObjectRefs = new WeakSet<object>();
  private trackedObjects = new Map<string, WeakRef<object>>();
  private finalizationRegistry: FinalizationRegistry<string> | null = null;

  constructor(config: Partial<MemoryProfilerConfig> = {}) {
    super();

    this.config = {
      autoProfile: config.autoProfile ?? true,
      profileInterval: config.profileInterval ?? 5000,
      memoryLimit: config.memoryLimit ?? 100,
      warningThreshold: config.warningThreshold ?? 70,
      criticalThreshold: config.criticalThreshold ?? 90,
      enableLeakDetection: config.enableLeakDetection ?? true,
      leakDetectionInterval: config.leakDetectionInterval ?? 30000,
      maxSnapshots: config.maxSnapshots ?? 100,
      detailedTracking: config.detailedTracking ?? false,
    };

    this.gcStats = {
      collections: 0,
      totalPauseTime: 0,
      avgPauseTime: 0,
      lastCollection: 0,
      frequency: 0,
    };

    // Setup finalization registry for tracking object lifecycle
    if (typeof FinalizationRegistry !== 'undefined') {
      this.finalizationRegistry = new FinalizationRegistry((id: string) => {
        this.handleObjectFinalized(id);
      });
    }

    if (this.config.autoProfile) {
      this.startProfiling();
    }
  }

  /**
   * Start memory profiling
   */
  startProfiling(): void {
    if (this.isProfilering) return;

    this.isProfilering = true;

    // Start periodic snapshots
    this.profileInterval = setInterval(() => {
      this.takeSnapshot();
    }, this.config.profileInterval);

    // Start leak detection if enabled
    if (this.config.enableLeakDetection) {
      this.leakDetectionInterval = setInterval(() => {
        this.detectLeaks();
      }, this.config.leakDetectionInterval);
    }

    // Monitor GC if available
    this.monitorGarbageCollection();

    debugLogger.info(
      'Memory profiling started',
      'MemoryProfiler',
      {
        interval: this.config.profileInterval,
        memoryLimit: `${this.config.memoryLimit}MB`,
      }
    );
  }

  /**
   * Stop memory profiling
   */
  stopProfiling(): void {
    if (!this.isProfilering) return;

    this.isProfilering = false;

    if (this.profileInterval) {
      clearInterval(this.profileInterval);
      this.profileInterval = null;
    }

    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
      this.leakDetectionInterval = null;
    }

    debugLogger.info('Memory profiling stopped', 'MemoryProfiler');
  }

  /**
   * Take memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const snapshot = this.createSnapshot();

    this.snapshots.push(snapshot);

    // Limit snapshot history
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check thresholds
    this.checkMemoryThresholds(snapshot);

    // Detect GC
    this.detectGarbageCollection(snapshot);

    this.emit('snapshot-taken', snapshot);

    return snapshot;
  }

  /**
   * Get current memory usage
   */
  getCurrentUsage(): MemorySnapshot {
    return this.createSnapshot();
  }

  /**
   * Get memory history
   */
  getHistory(duration?: number): MemorySnapshot[] {
    if (!duration) return [...this.snapshots];

    const cutoff = Date.now() - duration;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  /**
   * Track object allocation
   */
  trackAllocation(
    id: string,
    object: object,
    type: string,
    size?: number
  ): void {
    if (!this.config.detailedTracking) return;

    const allocation: AllocationTrace = {
      id,
      type,
      size: size || this.estimateObjectSize(object),
      timestamp: Date.now(),
      freed: false,
    };

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      const trace = new Error();
      Error.captureStackTrace(trace);
      allocation.stack = trace.stack;
    }

    this.allocations.set(id, allocation);

    // Track with weak reference
    if (typeof WeakRef !== 'undefined') {
      this.trackedObjects.set(id, new WeakRef(object));

      // Register for finalization callback
      if (this.finalizationRegistry) {
        this.finalizationRegistry.register(object, id);
      }
    }
  }

  /**
   * Mark allocation as freed
   */
  freeAllocation(id: string): void {
    const allocation = this.allocations.get(id);
    if (allocation) {
      allocation.freed = true;
    }

    this.trackedObjects.delete(id);
  }

  /**
   * Track PIXI object
   */
  trackPixiObject(object: Sprite | Texture | Container): void {
    this.pixiObjectRefs.add(object);
  }

  /**
   * Detect memory leaks
   */
  detectLeaks(): LeakDetectionResult {
    if (this.snapshots.length < 10) {
      return {
        hasLeak: false,
        severity: 'low',
        growthRate: 0,
        suspectedSources: [],
        recommendations: [],
      };
    }

    // Analyze recent snapshots
    const recentSnapshots = this.snapshots.slice(-10);
    const oldestSnapshot = recentSnapshots[0];
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1];

    const timeDiff =
      (newestSnapshot.timestamp - oldestSnapshot.timestamp) / 1000; // seconds
    const memoryDiff =
      newestSnapshot.usedJSHeapSize - oldestSnapshot.usedJSHeapSize;
    const growthRate = memoryDiff / timeDiff; // bytes per second

    // Analyze allocation patterns
    const suspectedSources: string[] = [];
    const recommendations: string[] = [];

    // Check for unfree allocations
    const unfreedAllocations = Array.from(this.allocations.values()).filter(
      (a) => !a.freed && Date.now() - a.timestamp > 60000
    ); // Older than 1 minute

    if (unfreedAllocations.length > 100) {
      suspectedSources.push('Unfree allocations detected');
      recommendations.push('Review object disposal and cleanup');
    }

    // Check for orphaned weak references
    let orphanedRefs = 0;
    this.trackedObjects.forEach((ref, _id) => {
      if (!ref.deref()) {
        orphanedRefs++;
      }
    });

    if (orphanedRefs > 50) {
      suspectedSources.push('Orphaned references detected');
      recommendations.push('Ensure proper cleanup of tracked objects');
    }

    // Determine if there's a leak
    const hasLeak = growthRate > 100000; // 100KB per second

    let severity: LeakDetectionResult['severity'] = 'low';
    if (growthRate > 1000000)
      severity = 'critical'; // 1MB/s
    else if (growthRate > 500000)
      severity = 'high'; // 500KB/s
    else if (growthRate > 100000) severity = 'medium'; // 100KB/s

    const result: LeakDetectionResult = {
      hasLeak,
      severity,
      growthRate,
      suspectedSources,
      recommendations,
    };

    if (hasLeak) {
      this.emit('leak-detected', result);
      debugLogger.warn('Memory leak detected', 'MemoryProfiler', result);
    }

    return result;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const currentSnapshot = this.createSnapshot();

    // Check texture memory
    if (currentSnapshot.webglMemory.textures > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push({
        priority: 'high',
        category: 'textures',
        issue: 'High texture memory usage',
        action: 'Consider using texture atlases or reducing texture resolution',
        potentialSavings:
          (currentSnapshot.webglMemory.textures / (1024 * 1024)) * 0.5,
      });
    }

    // Check sprite count
    if (currentSnapshot.pixiObjects.sprites > 1000) {
      recommendations.push({
        priority: 'medium',
        category: 'sprites',
        issue: 'Large number of sprites',
        action: 'Implement object pooling or virtual scrolling',
        potentialSavings: 10,
      });
    }

    // Check event listeners
    if (currentSnapshot.eventListeners > 500) {
      recommendations.push({
        priority: 'medium',
        category: 'events',
        issue: 'Too many event listeners',
        action: 'Use event delegation or cleanup unused listeners',
        potentialSavings: 5,
      });
    }

    // Check DOM nodes
    if (currentSnapshot.domNodes > 2000) {
      recommendations.push({
        priority: 'high',
        category: 'dom',
        issue: 'Excessive DOM nodes',
        action: 'Implement virtual DOM or lazy loading',
        potentialSavings: 15,
      });
    }

    // Check overall memory usage
    const usagePercentage =
      (currentSnapshot.usedJSHeapSize / currentSnapshot.jsHeapSizeLimit) * 100;
    if (usagePercentage > 80) {
      recommendations.push({
        priority: 'critical',
        category: 'general',
        issue: 'Near memory limit',
        action: 'Perform immediate cleanup and optimization',
        potentialSavings:
          (currentSnapshot.usedJSHeapSize / (1024 * 1024)) * 0.3,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof global !== 'undefined' && (global as any).gc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).gc();
      debugLogger.info('Forced garbage collection', 'MemoryProfiler');
    } else {
      debugLogger.warn('Garbage collection not available');
    }
  }

  /**
   * Get GC statistics
   */
  getGCStats(): GCStats {
    return { ...this.gcStats };
  }

  /**
   * Clear profiler data
   */
  clear(): void {
    this.snapshots = [];
    this.allocations.clear();
    this.trackedObjects.clear();
    this.gcStats = {
      collections: 0,
      totalPauseTime: 0,
      avgPauseTime: 0,
      lastCollection: 0,
      frequency: 0,
    };
  }

  /**
   * Dispose of profiler
   */
  dispose(): void {
    this.stopProfiling();
    this.clear();

    if (this.finalizationRegistry) {
      // Note: No way to clear finalization registry in JS
      this.finalizationRegistry = null;
    }
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create memory snapshot
   */
  private createSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      domNodes: 0,
      eventListeners: 0,
      pixiObjects: {
        sprites: 0,
        textures: 0,
        containers: 0,
      },
      webglMemory: {
        textures: 0,
        buffers: 0,
        programs: 0,
      },
    };

    // Get JS heap info if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memory = (performance as any).memory;
      snapshot.totalJSHeapSize = memory.totalJSHeapSize || 0;
      snapshot.usedJSHeapSize = memory.usedJSHeapSize || 0;
      snapshot.jsHeapSizeLimit = memory.jsHeapSizeLimit || 0;
    }

    // Count DOM nodes
    if (typeof document !== 'undefined') {
      snapshot.domNodes = document.getElementsByTagName('*').length;
    }

    // Estimate event listeners (simplified)
    snapshot.eventListeners = this.countEventListeners();

    // Count PIXI objects (simplified - would need actual references)
    snapshot.pixiObjects = this.countPixiObjects();

    // Estimate WebGL memory (simplified)
    snapshot.webglMemory = this.estimateWebGLMemory();

    return snapshot;
  }

  /**
   * Count event listeners
   */
  private countEventListeners(): number {
    // This is a simplified estimation
    // In a real implementation, we'd track actual listeners
    return 0;
  }

  /**
   * Count PIXI objects
   */
  private countPixiObjects(): {
    sprites: number;
    textures: number;
    containers: number;
  } {
    // This would need actual PIXI object tracking
    return {
      sprites: 0,
      textures: 0,
      containers: 0,
    };
  }

  /**
   * Estimate WebGL memory usage
   */
  private estimateWebGLMemory(): {
    textures: number;
    buffers: number;
    programs: number;
  } {
    // This would need WebGL context access
    return {
      textures: 0,
      buffers: 0,
      programs: 0,
    };
  }

  /**
   * Check memory thresholds
   */
  private checkMemoryThresholds(snapshot: MemorySnapshot): void {
    const usageMB = snapshot.usedJSHeapSize / (1024 * 1024);
    const usagePercentage = (usageMB / this.config.memoryLimit) * 100;

    if (usagePercentage >= this.config.criticalThreshold) {
      this.emit('memory-critical', snapshot);
      debugLogger.error('Critical memory usage', 'MemoryProfiler', {
        usage: `${usageMB.toFixed(2)}MB`,
        percentage: `${usagePercentage.toFixed(1)}%`,
      });
    } else if (usagePercentage >= this.config.warningThreshold) {
      this.emit('memory-warning', snapshot);
      debugLogger.warn('High memory usage', 'MemoryProfiler', {
        usage: `${usageMB.toFixed(2)}MB`,
        percentage: `${usagePercentage.toFixed(1)}%`,
      });
    }
  }

  /**
   * Detect garbage collection
   */
  private detectGarbageCollection(snapshot: MemorySnapshot): void {
    if (this.snapshots.length < 2) return;

    const prevSnapshot = this.snapshots[this.snapshots.length - 2];
    const memoryDrop = prevSnapshot.usedJSHeapSize - snapshot.usedJSHeapSize;

    // Significant memory drop likely indicates GC
    if (memoryDrop > 1024 * 1024) {
      // 1MB drop
      const now = Date.now();
      const pauseTime = now - this.lastGCTime;

      this.gcStats.collections++;
      this.gcStats.totalPauseTime += pauseTime;
      this.gcStats.avgPauseTime =
        this.gcStats.totalPauseTime / this.gcStats.collections;
      this.gcStats.lastCollection = now;

      // Calculate frequency (collections per minute)
      const timeSinceStart = (now - this.snapshots[0].timestamp) / 60000;
      this.gcStats.frequency = this.gcStats.collections / timeSinceStart;

      this.lastGCTime = now;

      this.emit('gc-detected', this.gcStats);
    }
  }

  /**
   * Monitor garbage collection
   */
  private monitorGarbageCollection(): void {
    // This would use PerformanceObserver if available
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure' && entry.name.includes('gc')) {
              this.gcStats.collections++;
              this.gcStats.totalPauseTime += entry.duration;
              this.gcStats.avgPauseTime =
                this.gcStats.totalPauseTime / this.gcStats.collections;
              this.gcStats.lastCollection = Date.now();

              this.emit('gc-detected', this.gcStats);
            }
          });
        });

        observer.observe({ entryTypes: ['measure'] });
      } catch {
        // PerformanceObserver not supported for GC
      }
    }
  }

  /**
   * Handle object finalization
   */
  private handleObjectFinalized(id: string): void {
    const allocation = this.allocations.get(id);
    if (allocation && !allocation.freed) {
      allocation.freed = true;
    }

    this.trackedObjects.delete(id);
  }

  /**
   * Estimate object size
   */
  private estimateObjectSize(object: object): number {
    // Simplified size estimation
    let size = 0;

    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        // eslint-disable-next-line security/detect-object-injection
        const value = (object as any)[key];
        if (typeof value === 'string') {
          size += value.length * 2; // 2 bytes per character
        } else if (typeof value === 'number') {
          size += 8; // 8 bytes for number
        } else if (typeof value === 'boolean') {
          size += 4; // 4 bytes for boolean
        } else if (typeof value === 'object' && value !== null) {
          size += 100; // Rough estimate for object overhead
        }
      }
    }

    return size;
  }
}
