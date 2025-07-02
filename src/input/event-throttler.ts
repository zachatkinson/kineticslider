/**
 * @fileoverview EventThrottler - Performance-optimized event handling
 *
 * Modern event throttling with requestAnimationFrame alignment, batch processing,
 * and performance monitoring. Based on latest web standards and research on
 * high-frequency input event optimization.
 *
 * Key Features:
 * - RAF-aligned throttling for 60fps performance
 * - Automatic fallback throttling when RAF unavailable
 * - Event coalescing for high-frequency inputs
 * - Memory-efficient event batching
 * - Performance monitoring and metrics
 * - Cross-browser compatibility
 *
 * @version 1.0.0
 */

import { PERFORMANCE } from '../core/constants';

/**
 * Configuration for event throttling behavior
 */
export interface ThrottleConfig {
  /** Use requestAnimationFrame for throttling (recommended) */
  useRAF: boolean;
  /** Fallback throttle interval when RAF unavailable */
  fallbackInterval: number;
  /** Maximum number of events to batch */
  maxBatchSize: number;
  /** Enable performance monitoring */
  enableMetrics: boolean;
  /** Maximum time to hold events before forcing dispatch */
  maxHoldTime: number;
}

/**
 * Event throttling metrics for performance monitoring
 */
export interface ThrottleMetrics {
  /** Total events processed */
  totalEvents: number;
  /** Events throttled (not immediately dispatched) */
  throttledEvents: number;
  /** Average batch size */
  averageBatchSize: number;
  /** Current performance score (0-1, higher is better) */
  performanceScore: number;
  /** Last update timestamp */
  lastUpdate: number;
}

/**
 * High-performance event throttler with RAF alignment
 *
 * Optimizes event handling for 60fps performance using modern browser APIs.
 * Intelligently batches and throttles events while maintaining responsiveness.
 *
 * @example
 * ```typescript
 * const throttler = new EventThrottler();
 *
 * element.addEventListener('pointermove', (e) => {
 *   throttler.throttle('pointermove', e, (events) => {
 *     // Process batched events for smooth 60fps handling
 *     events.forEach(event => updateUI(event));
 *   });
 * });
 * ```
 */
export class EventThrottler {
  private config: ThrottleConfig;
  private eventQueue = new Map<string, Event[]>();
  private rafId: number | null = null;
  private lastDispatchTime = 0;
  private metrics: ThrottleMetrics;
  private handlerCallbacks = new Map<string, (events: Event[]) => void>();

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.config = {
      useRAF: true,
      fallbackInterval: PERFORMANCE.THROTTLE_INTERVAL,
      maxBatchSize: 10,
      enableMetrics: true,
      maxHoldTime: 100, // Maximum 100ms hold time
      ...config,
    };

    this.metrics = {
      totalEvents: 0,
      throttledEvents: 0,
      averageBatchSize: 0,
      performanceScore: 1.0,
      lastUpdate: performance.now(),
    };
  }

  /**
   * Throttle an event with intelligent batching
   *
   * @param eventType - Type of event for grouping
   * @param event - Event to throttle
   * @param handler - Function to call with batched events
   */
  throttle(
    eventType: string,
    event: Event,
    handler: (events: Event[]) => void
  ): void {
    this.updateMetrics(eventType);

    // Store handler for this event type
    this.handlerCallbacks.set(eventType, handler);

    // Add event to queue
    if (!this.eventQueue.has(eventType)) {
      this.eventQueue.set(eventType, []);
    }

    const queue = this.eventQueue.get(eventType)!;
    queue.push(event);

    // Limit batch size to prevent memory issues
    if (queue.length > this.config.maxBatchSize) {
      queue.shift(); // Remove oldest event
    }

    this.scheduleDispatch();
  }

  /**
   * Throttle specifically for pointer move events with coalescing
   */
  throttlePointerMove(
    event: PointerEvent,
    handler: (events: PointerEvent[]) => void
  ): void {
    // Use coalesced events if available for maximum precision
    const events =
      'getCoalescedEvents' in event &&
      typeof event.getCoalescedEvents === 'function'
        ? event.getCoalescedEvents()
        : [event];

    this.throttle('pointermove', event, () => {
      handler(events as PointerEvent[]);
    });
  }

  /**
   * Schedule event dispatch using RAF or fallback timer
   */
  private scheduleDispatch(): void {
    // Don't schedule if already scheduled
    if (this.rafId !== null) return;

    const currentTime = performance.now();
    const timeSinceLastDispatch = currentTime - this.lastDispatchTime;

    // Force dispatch if events are being held too long
    const shouldForceDispatch = timeSinceLastDispatch > this.config.maxHoldTime;

    if (shouldForceDispatch) {
      this.dispatchBatchedEvents();
      return;
    }

    if (this.config.useRAF && typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(() => this.dispatchBatchedEvents());
    } else {
      // Fallback to setTimeout with throttle interval
      this.rafId = setTimeout(
        () => this.dispatchBatchedEvents(),
        this.config.fallbackInterval
      ) as unknown as number;
    }
  }

  /**
   * Dispatch all batched events
   */
  private dispatchBatchedEvents(): void {
    this.rafId = null;
    this.lastDispatchTime = performance.now();

    // Process each event type
    for (const [eventType, events] of this.eventQueue.entries()) {
      if (events.length === 0) continue;

      const handler = this.handlerCallbacks.get(eventType);
      if (handler) {
        try {
          // Clone events array and clear queue atomically
          const eventsToProcess = [...events];
          events.length = 0;

          // Call handler with batched events
          handler(eventsToProcess);

          // Update metrics
          if (this.config.enableMetrics) {
            this.updateBatchMetrics(eventsToProcess.length);
          }
        } catch (error) {
          // Error processing events - handle gracefully
          // TODO: Implement proper error handling/reporting
          void error; // Suppress unused variable
        }
      }
    }
  }

  /**
   * Update throttling metrics
   */
  private updateMetrics(eventType: string): void {
    if (!this.config.enableMetrics) return;

    this.metrics.totalEvents++;

    // Count as throttled if we have pending events
    const hasQueuedEvents = this.eventQueue.get(eventType)?.length || 0;
    if (hasQueuedEvents > 0) {
      this.metrics.throttledEvents++;
    }

    // Update performance score based on throttling efficiency
    const throttleRatio =
      this.metrics.throttledEvents / this.metrics.totalEvents;
    this.metrics.performanceScore = Math.max(0.1, 1 - throttleRatio * 0.5);

    this.metrics.lastUpdate = performance.now();
  }

  /**
   * Update batch processing metrics
   */
  private updateBatchMetrics(batchSize: number): void {
    if (!this.config.enableMetrics) return;

    // Update rolling average batch size
    const currentAverage = this.metrics.averageBatchSize;
    this.metrics.averageBatchSize =
      currentAverage === 0 ? batchSize : currentAverage * 0.9 + batchSize * 0.1;
  }

  /**
   * Get current throttling metrics
   */
  getMetrics(): ThrottleMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      throttledEvents: 0,
      averageBatchSize: 0,
      performanceScore: 1.0,
      lastUpdate: performance.now(),
    };
  }

  /**
   * Check if throttler is performing well
   */
  isPerformant(): boolean {
    return this.metrics.performanceScore > 0.7;
  }

  /**
   * Get current queue size for debugging
   */
  getQueueSize(eventType?: string): number {
    if (eventType) {
      return this.eventQueue.get(eventType)?.length || 0;
    }

    // Return total queue size across all event types
    let totalSize = 0;
    for (const queue of this.eventQueue.values()) {
      totalSize += queue.length;
    }
    return totalSize;
  }

  /**
   * Force immediate dispatch of all pending events
   */
  flush(): void {
    if (this.rafId !== null) {
      if (this.config.useRAF && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.rafId);
      } else {
        clearTimeout(this.rafId);
      }
      this.rafId = null;
    }

    this.dispatchBatchedEvents();
  }

  /**
   * Clean up and stop all throttling
   */
  destroy(): void {
    this.flush();
    this.eventQueue.clear();
    this.handlerCallbacks.clear();
    this.resetMetrics();
  }

  /**
   * Update throttler configuration
   */
  updateConfig(newConfig: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
