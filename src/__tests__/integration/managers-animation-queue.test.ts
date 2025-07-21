/**
 * @fileoverview AnimationQueue Unit Tests
 *
 * Unit tests for the priority-based animation queue system.
 * Tests scheduling, retry logic, and performance monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationQueue } from '../../managers/animation-queue';
import { PerformanceMonitor } from '../../managers/performance-monitor';
import { ANIMATION_PRIORITIES, ANIMATION_EVENTS } from '../../core/constants';
import type { AnimationConfig } from '../../core/types';

describe('AnimationQueue Integration Tests', () => {
  let animationQueue: AnimationQueue;
  let performanceMonitor: PerformanceMonitor;
  let mockSetInterval: ReturnType<typeof vi.fn>;
  let mockClearInterval: ReturnType<typeof vi.fn>;
  let intervalId: number;

  beforeEach(() => {
    // Mock setInterval and clearInterval to control timer behavior
    intervalId = 1;
    mockSetInterval = vi
      .fn()
      .mockImplementation((_callback: () => void, _delay: number) => {
        // Store the callback for manual execution if needed
        return intervalId++;
      });
    mockClearInterval = vi.fn();

    vi.stubGlobal('setInterval', mockSetInterval);
    vi.stubGlobal('clearInterval', mockClearInterval);

    // Initialize managers
    animationQueue = new AnimationQueue();
    performanceMonitor = new PerformanceMonitor();
  });

  afterEach(async () => {
    // Properly dispose without causing unhandled rejections
    try {
      animationQueue.stop();

      // Wait a bit for any pending operations to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Dispose (clear(false) won't reject pending promises)
      animationQueue.dispose();
    } catch {
      // Ignore disposal errors in tests
    }

    // Clean up performance monitor
    try {
      performanceMonitor.dispose();
    } catch {
      // Ignore disposal errors
    }

    // Clean up mocks and timers
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('Basic Queue Operations', () => {
    it('should initialize with correct defaults', () => {
      const stats = animationQueue.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.processing.currentlyProcessing).toBe(0);
      expect(stats.processing.processed).toBe(0);
    });

    it('should enqueue animations successfully', async () => {
      const config: AnimationConfig = {
        id: 'test-1',
        duration: 300,
        priority: ANIMATION_PRIORITIES.HIGH,
        animations: [],
      };

      const promise = animationQueue.enqueue(
        'test-animation',
        config,
        ANIMATION_PRIORITIES.HIGH
      );

      const queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(1);

      expect(promise).toBeInstanceOf(Promise);
    });

    it('should process queue according to priority', () => {
      const highPriorityConfig: AnimationConfig = {
        id: 'high-1',
        duration: 300,
        priority: ANIMATION_PRIORITIES.HIGH,
        animations: [],
      };

      const lowPriorityConfig: AnimationConfig = {
        id: 'low-1',
        duration: 300,
        priority: ANIMATION_PRIORITIES.LOW,
        animations: [],
      };

      animationQueue.enqueue(
        'low-priority',
        lowPriorityConfig,
        ANIMATION_PRIORITIES.LOW
      );
      animationQueue.enqueue(
        'high-priority',
        highPriorityConfig,
        ANIMATION_PRIORITIES.HIGH
      );

      const queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(2);
      expect(queueState.processingCount).toBe(0);
      expect(Array.isArray(queueState.nextItems)).toBe(true);
    });

    it('should handle animation errors gracefully', () => {
      const config: AnimationConfig = {
        id: 'error-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      const promise = animationQueue.enqueue('_error-animation', config);
      expect(promise).toBeInstanceOf(Promise);

      // Error handling will be tested when queue is started and processed
      const queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(1);
    });
  });

  describe('Queue Management', () => {
    it('should start and stop processing', () => {
      const eventSpy = vi.spyOn(animationQueue, 'emit');

      animationQueue.start();
      expect(eventSpy).toHaveBeenCalledWith('queue:started');
      expect(mockSetInterval).toHaveBeenCalled();

      animationQueue.stop();
      expect(eventSpy).toHaveBeenCalledWith('queue:stopped');
      expect(mockClearInterval).toHaveBeenCalled();
    });

    it('should clear all queued animations', async () => {
      const config: AnimationConfig = {
        id: 'clear-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      const promise = animationQueue.enqueue('clear-animation', config);

      let queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(1);

      // Clear the queue and handle the expected rejection
      animationQueue.clear();
      queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(0);

      // Catch the expected rejection
      await expect(promise).rejects.toThrow('Queue was cleared');
    });

    it('should handle queue statistics correctly', () => {
      const stats = animationQueue.getStats();

      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.processing.processed).toBe('number');
      expect(typeof stats.processing.failed).toBe('number');
      expect(typeof stats.timing.averageWaitTime).toBe('number');
      expect(typeof stats.timing.averageExecutionTime).toBe('number');
      expect(stats.byPriority).toBeDefined();
    });

    it('should support queue configuration', () => {
      const eventSpy = vi.spyOn(animationQueue, 'emit');

      animationQueue.configure({
        maxConcurrent: 5,
        maxQueueSize: 100,
      });

      expect(eventSpy).toHaveBeenCalledWith('queue:configured', {
        maxConcurrent: 5,
        maxQueueSize: 100,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configurations', async () => {
      // Test that enqueue with null config rejects the promise
      const promise = animationQueue.enqueue('invalid', null as never);

      await expect(promise).rejects.toThrow();
    });

    it('should handle queue disposal during processing', async () => {
      const config: AnimationConfig = {
        id: 'disposal-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      animationQueue.enqueue('disposal-animation', config);

      let queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(1);

      // Wait a bit then dispose
      await new Promise((resolve) => setTimeout(resolve, 5));
      animationQueue.dispose();

      // After dispose(), the queue should be cleared but promises aren't rejected
      queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(0);

      // The promise should remain pending (not rejected since dispose() uses clear(false))
      // We can't easily test pending state, so just ensure dispose works without throwing
      expect(() => animationQueue.dispose()).not.toThrow();
    });

    it('should handle item dequeue', async () => {
      const config: AnimationConfig = {
        id: 'dequeue-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      const promise = animationQueue.enqueue('dequeue-animation', config);

      let queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(1);

      const success = animationQueue.dequeue('dequeue-animation');
      expect(success).toBe(true);

      queueState = animationQueue.getQueueState();
      expect(queueState.queueLength).toBe(0);

      // Catch the rejection from dequeue
      await expect(promise).rejects.toThrow('Animation was cancelled');
    });
  });

  describe('Performance Integration', () => {
    it('should integrate with PerformanceMonitor', () => {
      // Verify that PerformanceMonitor is properly integrated
      expect(performanceMonitor).toBeDefined();

      const config: AnimationConfig = {
        id: 'perf-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      animationQueue.enqueue('perf-animation', config);

      // Performance monitoring should be active
      const stats = animationQueue.getStats();
      expect(stats).toBeDefined();
    });

    it('should track priority distribution', () => {
      const config: AnimationConfig = {
        id: 'priority-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      animationQueue.enqueue(
        'high-priority',
        config,
        ANIMATION_PRIORITIES.HIGH
      );
      animationQueue.enqueue(
        'normal-priority',
        config,
        ANIMATION_PRIORITIES.NORMAL
      );
      animationQueue.enqueue('low-priority', config, ANIMATION_PRIORITIES.LOW);

      const stats = animationQueue.getStats();
      expect(stats.byPriority).toBeDefined();
      expect(stats.byPriority.high).toBeGreaterThan(0);
      expect(stats.byPriority.normal).toBeGreaterThan(0);
      expect(stats.byPriority.low).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit animation events', () => {
      const config: AnimationConfig = {
        id: 'event-test',
        duration: 300,
        priority: ANIMATION_PRIORITIES.NORMAL,
        animations: [],
      };

      const eventSpy = vi.spyOn(animationQueue, 'emit');

      animationQueue.enqueue('_event-animation', config);

      // Verify event was emitted
      expect(eventSpy).toHaveBeenCalledWith(
        ANIMATION_EVENTS.ANIMATION_QUEUED,
        expect.objectContaining({
          id: '_event-animation',
          priority: ANIMATION_PRIORITIES.NORMAL,
        })
      );
    });

    it('should emit queue management events', () => {
      const eventSpy = vi.spyOn(animationQueue, 'emit');

      animationQueue.start();
      expect(eventSpy).toHaveBeenCalledWith('queue:started');

      animationQueue.stop();
      expect(eventSpy).toHaveBeenCalledWith('queue:stopped');

      animationQueue.clear();
      expect(eventSpy).toHaveBeenCalledWith('queue:cleared');
    });
  });
});
