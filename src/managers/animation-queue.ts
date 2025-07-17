/**
 * @fileoverview Animation Queue for Phase 2.3
 *
 * Priority-based animation scheduling system with intelligent batching,
 * resource management, and performance optimization.
 *
 * @version 2.3.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { serviceContainer } from '../core/container';
import type {
  AnimationConfig,
  AnimationPriority,
  AnimationContext,
} from '../core/types';
import {
  ANIMATION_PRIORITIES,
  ANIMATION_EVENTS,
  ANIMATION_ERROR_CODES,
} from '../core/constants';
import { safeArrayInsertSorted } from '../utils/safe-array';

/**
 * Animation execution result interface
 */
export interface AnimationResult {
  /** Animation identifier */
  animationId: string;
  /** Completion status */
  completed: boolean;
  /** Optional execution data */
  data?: unknown;
}

/**
 * Queue item interface
 */
export interface QueueItem {
  /** Unique item identifier */
  id: string;
  /** Animation configuration */
  config: AnimationConfig;
  /** Item priority */
  priority: AnimationPriority;
  /** Animation context */
  context: AnimationContext;
  /** Creation timestamp */
  createdAt: number;
  /** Estimated execution time (ms) */
  estimatedDuration: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Resolution callback */
  resolve: (result: AnimationResult) => void;
  /** Rejection callback */
  reject: (error: Error) => void;
}

/**
 * Queue statistics interface
 */
export interface QueueStats {
  /** Total items in queue */
  totalItems: number;
  /** Items by priority level */
  byPriority: {
    critical: number;
    high: number;
    normal: number;
    low: number;
    minimal: number;
  };
  /** Processing statistics */
  processing: {
    currentlyProcessing: number;
    processed: number;
    failed: number;
    retried: number;
  };
  /** Timing statistics */
  timing: {
    averageWaitTime: number;
    averageExecutionTime: number;
    totalWaitTime: number;
    totalExecutionTime: number;
  };
}

/**
 * Queue configuration options
 */
export interface QueueOptions {
  /** Maximum concurrent animations */
  maxConcurrent: number;
  /** Maximum queue size */
  maxQueueSize: number;
  /** Number of retry attempts */
  retryAttempts: number;
  /** Processing delay in milliseconds */
  processingDelay: number;
  /** Batch size for processing */
  batchSize: number;
}

/**
 * Advanced animation queue with priority scheduling
 */
export class AnimationQueue extends SimpleEventEmitter {
  private queue: QueueItem[] = [];
  private processingItems = new Map<string, QueueItem>();
  private completedItems: QueueItem[] = [];
  private failedItems: QueueItem[] = [];

  // Queue configuration
  private maxConcurrent: number;
  private maxQueueSize: number;
  private retryAttempts: number;
  private processingDelay: number;
  private batchSize: number;

  // Processing state
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  // Statistics
  private stats: QueueStats = {
    totalItems: 0,
    byPriority: {
      critical: 0,
      high: 0,
      normal: 0,
      low: 0,
      minimal: 0,
    },
    processing: {
      currentlyProcessing: 0,
      processed: 0,
      failed: 0,
      retried: 0,
    },
    timing: {
      averageWaitTime: 0,
      averageExecutionTime: 0,
      totalWaitTime: 0,
      totalExecutionTime: 0,
    },
  };

  constructor(options: Partial<QueueOptions> = {}) {
    super();

    this.maxConcurrent = options.maxConcurrent ?? 10;
    this.retryAttempts = options.retryAttempts ?? 3;
    this.maxQueueSize = options.maxQueueSize ?? 50;
    this.processingDelay = options.processingDelay ?? 16;
    this.batchSize = options.batchSize ?? 5;
  }

  // =============================================================================
  // 🎯 Public API - Queue Management
  // =============================================================================

  /**
   * Start queue processing
   */
  start(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    // Start processing loop
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.processingDelay);

    this.emit('queue:started');
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    if (!this.isProcessing) return;

    this.isProcessing = false;

    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.emit('queue:stopped');
  }

  /**
   * Add item to queue
   */
  enqueue(
    id: string,
    config: AnimationConfig,
    priority: AnimationPriority = ANIMATION_PRIORITIES.NORMAL,
    context: AnimationContext = {},
    maxRetries: number = 3
  ): Promise<AnimationResult> {
    return new Promise<AnimationResult>((resolve, reject) => {
      // Check queue size limit
      if (this.queue.length >= this.maxQueueSize) {
        const error = new Error(
          `${ANIMATION_ERROR_CODES.QUEUE_OVERFLOW}: Queue size limit exceeded`
        );
        reject(error);
        return;
      }

      const now = Date.now();
      const item: QueueItem = {
        id,
        config,
        priority,
        context,
        createdAt: now,
        estimatedDuration: this.estimateExecutionTime(config),
        retryCount: 0,
        maxRetries,
        resolve,
        reject,
      };

      // Insert in priority order
      this.insertByPriority(item);
      this.updateStats();

      this.emit(ANIMATION_EVENTS.ANIMATION_QUEUED, {
        id,
        priority,
        queueLength: this.queue.length,
        position: this.findItemPosition(id),
      });
    });
  }

  /**
   * Remove item from queue
   */
  dequeue(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return false;

    // Use safe array access with bounds checking
    const item = this.queue.at(index);
    if (!item) return false;

    this.queue.splice(index, 1);
    this.updateStats();

    // Reject the promise
    item.reject(new Error('Animation was cancelled'));

    this.emit(ANIMATION_EVENTS.ANIMATION_CANCELLED, { id });
    return true;
  }

  /**
   * Clear entire queue
   * @param shouldReject - Whether to reject pending promises (default: true)
   */
  clear(shouldReject: boolean = true): void {
    if (shouldReject) {
      // Reject all pending items (normal operation)
      this.queue.forEach((item) => {
        item.reject(new Error('Queue was cleared'));
      });
    }

    this.queue = [];
    this.updateStats();

    this.emit('queue:cleared');
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get current queue state
   */
  getQueueState(): {
    queueLength: number;
    processingCount: number;
    nextItems: QueueItem[];
  } {
    const maxItems = 10;
    return {
      queueLength: this.queue.length,
      processingCount: this.processingItems.size,
      nextItems: this.queue.slice(0, maxItems), // Next 10 items
    };
  }

  /**
   * Configure queue settings
   */
  configure(options: { maxConcurrent?: number; maxQueueSize?: number }): void {
    if (options.maxConcurrent !== undefined) {
      this.maxConcurrent = options.maxConcurrent;
    }
    if (options.maxQueueSize !== undefined) {
      this.maxQueueSize = options.maxQueueSize;
    }

    this.emit('queue:configured', options);
  }

  // =============================================================================
  // 🔧 Private Implementation - Queue Processing
  // =============================================================================

  private processQueue(): void {
    if (!this.isProcessing || this.queue.length === 0) return;

    // Check if we can process more items
    if (this.processingItems.size >= this.maxConcurrent) return;

    // Process individual items
    this.processIndividualItems();
  }

  private processIndividualItems(): void {
    while (this.queue.length > 0 && this.canProcessMoreItems()) {
      const item = this.queue.shift();
      if (!item) continue;

      this.executeItem(item);
    }
  }

  private canProcessMoreItems(): boolean {
    return this.processingItems.size < this.maxConcurrent;
  }

  private async executeItem(item: QueueItem): Promise<void> {
    this.processingItems.set(item.id, item);

    try {
      await this.executeItemInternal(item);
    } catch (error) {
      this.handleItemError(item, error);
    }
  }

  private async executeItemInternal(item: QueueItem): Promise<AnimationResult> {
    const startTime = Date.now();
    const waitTime = startTime - item.createdAt;

    this.emit(ANIMATION_EVENTS.ANIMATION_STARTED, {
      id: item.id,
      context: item.context,
      waitTime,
    });

    // Simulate animation execution (replace with actual AnimationManager call)
    const result = await this.mockAnimationExecution(item);

    const executionTime = Date.now() - startTime;

    // Update statistics
    this.stats.processing.processed++;
    this.updateTimingStats(executionTime, waitTime);

    // Mark as completed
    this.processingItems.delete(item.id);
    this.completedItems.push(item);

    // Resolve promise
    item.resolve(result);

    this.emit(ANIMATION_EVENTS.ANIMATION_COMPLETED, {
      id: item.id,
      executionTime,
      waitTime,
    });

    return result;
  }

  private async mockAnimationExecution(
    item: QueueItem
  ): Promise<AnimationResult> {
    // Simulate variable execution time based on configuration
    const delay = item.estimatedDuration + Math.random() * 50;

    return new Promise<AnimationResult>((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures for testing
        if (Math.random() < 0.05) {
          // 5% failure rate
          reject(new Error('Simulated animation failure'));
        } else {
          resolve({
            animationId: item.id,
            completed: true,
          });
        }
      }, delay);
    });
  }

  private handleItemError(item: QueueItem, error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Try retry if possible
    if (item.retryCount < item.maxRetries) {
      item.retryCount++;
      this.stats.processing.retried++;

      // Re-queue with lower priority (type-safe assignment)
      let reducedPriority: number;
      switch (item.priority) {
        case ANIMATION_PRIORITIES.CRITICAL:
          reducedPriority = ANIMATION_PRIORITIES.HIGH;
          break;
        case ANIMATION_PRIORITIES.HIGH:
          reducedPriority = ANIMATION_PRIORITIES.NORMAL;
          break;
        case ANIMATION_PRIORITIES.NORMAL:
          reducedPriority = ANIMATION_PRIORITIES.LOW;
          break;
        case ANIMATION_PRIORITIES.LOW:
          reducedPriority = ANIMATION_PRIORITIES.MINIMAL;
          break;
        default:
          reducedPriority = ANIMATION_PRIORITIES.MINIMAL;
          break;
      }
      item.priority = reducedPriority as AnimationPriority;

      this.insertByPriority(item);
      this.processingItems.delete(item.id);

      this.emit('animation:retried', { id: item.id, attempt: item.retryCount });
      return;
    }

    // Max retries exceeded
    this.stats.processing.failed++;
    this.failedItems.push(item);
    this.processingItems.delete(item.id);

    item.reject(errorObj);

    this.emit(ANIMATION_EVENTS.ANIMATION_ERROR, {
      id: item.id,
      error: errorObj,
      context: item.context,
    });
  }

  private insertByPriority(item: QueueItem): void {
    // Use safe array insertion with priority comparison
    safeArrayInsertSorted(this.queue, item, (a, b) => {
      // Higher priority items come first (reverse order)
      return b.priority - a.priority;
    });
  }

  private findItemPosition(id: string): number {
    return this.queue.findIndex((item) => item.id === id) + 1; // 1-based position
  }

  private estimateExecutionTime(config: AnimationConfig): number {
    // Simple estimation based on animation configuration
    const baseDuration = config.duration || 300;
    const complexity = config.animations ? config.animations.length : 1;
    const additionalTime = complexity * 50; // Add 50ms per animation step
    return baseDuration + additionalTime;
  }

  private updateStats(): void {
    this.stats.totalItems = this.queue.length + this.processingItems.size;

    // Safe priority counting without object injection
    this.stats.byPriority.critical = this.queue.filter(
      (item) => item.priority === ANIMATION_PRIORITIES.CRITICAL
    ).length;
    this.stats.byPriority.high = this.queue.filter(
      (item) => item.priority === ANIMATION_PRIORITIES.HIGH
    ).length;
    this.stats.byPriority.normal = this.queue.filter(
      (item) => item.priority === ANIMATION_PRIORITIES.NORMAL
    ).length;
    this.stats.byPriority.low = this.queue.filter(
      (item) => item.priority === ANIMATION_PRIORITIES.LOW
    ).length;
    this.stats.byPriority.minimal = this.queue.filter(
      (item) => item.priority === ANIMATION_PRIORITIES.MINIMAL
    ).length;

    this.stats.processing.currentlyProcessing = this.processingItems.size;
  }

  private updateTimingStats(executionTime: number, waitTime?: number): void {
    // Update execution time
    this.stats.timing.totalExecutionTime += executionTime;
    this.stats.timing.averageExecutionTime =
      this.stats.timing.totalExecutionTime /
      Math.max(1, this.stats.processing.processed);

    // Update wait time if provided
    if (waitTime !== undefined) {
      this.stats.timing.totalWaitTime += waitTime;
      this.stats.timing.averageWaitTime =
        this.stats.timing.totalWaitTime /
        Math.max(1, this.stats.processing.processed);
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stop();
    this.clear(false); // Don't reject pending promises during disposal
    this.removeAllListeners();
    this.completedItems = [];
    this.failedItems = [];
  }
}

// Register with service container
serviceContainer.register('AnimationQueue', () => new AnimationQueue());
