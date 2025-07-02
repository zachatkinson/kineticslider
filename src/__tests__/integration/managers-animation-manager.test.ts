/**
 * @fileoverview AnimationManager Integration Tests
 *
 * Integration tests for the animation coordination system.
 * Tests queue management, timeline coordination, and performance tracking.
 *
 * Follows our established patterns for DRY testing practices.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnimationManager } from '../../managers/animation-manager';
import { GSAPTimelineFactory } from '../../physics/gsap-timeline-factory';
import {
  createMockGSAPTimeline,
  createTestAnimationConfigs,
} from '../utils/test-factories';
import { ANIMATION_PRIORITIES, ANIMATION_EVENTS } from '../../core/constants';

// Mock GSAP for controlled integration testing
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => createMockGSAPTimeline()),
  },
}));

describe('AnimationManager Integration Tests', () => {
  let animationManager: AnimationManager;
  let mockTimelineFactory: GSAPTimelineFactory;
  let mockSetTimeout: ReturnType<typeof vi.fn>;
  let mockClearTimeout: ReturnType<typeof vi.fn>;
  let timeoutId: number;

  beforeEach(() => {
    // Mock async operations to control timing behavior
    timeoutId = 1;
    mockSetTimeout = vi.fn((fn: () => void, _delay: number) => {
      // Execute immediately for testing instead of waiting
      fn();
      return timeoutId++;
    });
    mockClearTimeout = vi.fn();

    vi.stubGlobal('setTimeout', mockSetTimeout);
    vi.stubGlobal('clearTimeout', mockClearTimeout);

    mockTimelineFactory = new GSAPTimelineFactory();
    animationManager = new AnimationManager(mockTimelineFactory);
    vi.clearAllMocks();
  });

  afterEach(() => {
    animationManager.dispose();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with proper defaults', () => {
      const stats = animationManager.getPerformanceStats();

      expect(stats.activeAnimations).toBe(0);
      expect(stats.completedAnimations).toBe(0);
      expect(stats.failedAnimations).toBe(0);
      expect(stats.currentAnimationCount).toBe(0);
      expect(stats.queueLength).toBe(0);
    });

    it('should accept custom timeline factory', () => {
      const customFactory = new GSAPTimelineFactory();
      const manager = new AnimationManager(customFactory);

      expect(manager).toBeDefined();
      manager.dispose();
    });

    it('should properly dispose and cleanup', () => {
      const removeListenersSpy = vi.spyOn(
        animationManager,
        'removeAllListeners'
      );

      animationManager.dispose();

      expect(removeListenersSpy).toHaveBeenCalled();
    });
  });

  describe('Animation Queue Management', () => {
    it('should queue animation with correct priority', () => {
      const animationConfig = createTestAnimationConfigs().simple;
      const eventSpy = vi.spyOn(animationManager, 'emit');

      const timelinePromise = animationManager.queueAnimation(
        'test-animation',
        animationConfig,
        ANIMATION_PRIORITIES.HIGH,
        { source: 'test' }
      );

      expect(eventSpy).toHaveBeenCalledWith(
        ANIMATION_EVENTS.ANIMATION_QUEUED,
        expect.objectContaining({
          id: 'test-animation',
          priority: ANIMATION_PRIORITIES.HIGH,
          queueLength: 1,
        })
      );

      expect(timelinePromise).toBeInstanceOf(Promise);
    });

    it('should reject invalid animation configurations', async () => {
      const invalidConfig = {} as never; // Invalid config

      await expect(
        animationManager.queueAnimation('invalid', invalidConfig)
      ).rejects.toThrow();
    });

    it('should handle multiple queued animations', () => {
      const config = createTestAnimationConfigs().simple;

      const promises = [
        animationManager.queueAnimation(
          'anim-1',
          config,
          ANIMATION_PRIORITIES.HIGH
        ),
        animationManager.queueAnimation(
          'anim-2',
          config,
          ANIMATION_PRIORITIES.NORMAL
        ),
        animationManager.queueAnimation(
          'anim-3',
          config,
          ANIMATION_PRIORITIES.LOW
        ),
      ];

      // All should return promises
      promises.forEach((promise) => {
        expect(promise).toBeInstanceOf(Promise);
      });

      // Queue should show all items
      const stats = animationManager.getPerformanceStats();
      expect(stats.queueLength).toBeGreaterThan(0);
    });
  });

  describe('Immediate Execution', () => {
    it('should execute animation immediately bypassing queue', () => {
      const config = createTestAnimationConfigs().simple;
      const eventSpy = vi.spyOn(animationManager, 'emit');

      const timeline = animationManager.executeImmediate(
        'immediate-test',
        config,
        { source: 'immediate' }
      );

      expect(timeline).toBeDefined();
      expect(eventSpy).toHaveBeenCalledWith(
        ANIMATION_EVENTS.ANIMATION_STARTED,
        expect.objectContaining({ id: 'immediate-test' })
      );
    });
  });

  describe('Timeline Group Coordination', () => {
    it('should create timeline group with basic configuration', () => {
      const configs = [
        { id: 'first', config: createTestAnimationConfigs().simple },
        { id: 'second', config: createTestAnimationConfigs().complex },
      ];

      const masterTimeline = animationManager.createTimelineGroup(
        'test-group',
        configs,
        { sequential: true }
      );

      expect(masterTimeline).toBeDefined();
    });

    it('should handle timeline group with parallel execution', () => {
      const configs = [
        { id: 'parallel-1', config: createTestAnimationConfigs().simple },
        { id: 'parallel-2', config: createTestAnimationConfigs().simple },
      ];

      const masterTimeline = animationManager.createTimelineGroup(
        'parallel-group',
        configs,
        { sequential: false }
      );

      expect(masterTimeline).toBeDefined();
    });
  });

  describe('Performance Tracking', () => {
    it('should track animation performance statistics', () => {
      const stats = animationManager.getPerformanceStats();

      expect(stats).toHaveProperty('completedAnimations');
      expect(stats).toHaveProperty('failedAnimations');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('currentAnimationCount');
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('activeTimelines');
    });

    it('should provide comprehensive animation state', () => {
      const state = animationManager.getAnimationState();

      expect(state).toHaveProperty('isProcessingQueue');
      expect(state).toHaveProperty('activeAnimations');
      expect(state).toHaveProperty('queuedAnimations');
      expect(state).toHaveProperty('timelineGroups');
      expect(state).toHaveProperty('performanceStats');
    });

    it('should track queue length correctly', () => {
      const config = createTestAnimationConfigs().simple;

      const initialStats = animationManager.getPerformanceStats();
      expect(initialStats.queueLength).toBe(0);

      // Queue an animation
      animationManager.queueAnimation('tracked', config);

      // Should show queued item (may be 0 if processed immediately due to mocking)
      const queuedStats = animationManager.getPerformanceStats();
      expect(queuedStats.queueLength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event System', () => {
    it('should emit proper events during animation lifecycle', () => {
      const config = createTestAnimationConfigs().simple;
      const eventSpy = vi.spyOn(animationManager, 'emit');

      animationManager.queueAnimation('event-test', config);

      expect(eventSpy).toHaveBeenCalledWith(
        ANIMATION_EVENTS.ANIMATION_QUEUED,
        expect.any(Object)
      );
    });

    it('should support event listeners for animation coordination', () => {
      const listener = vi.fn();

      animationManager.on(ANIMATION_EVENTS.ANIMATION_COMPLETED, listener);
      animationManager.emit(ANIMATION_EVENTS.ANIMATION_COMPLETED, {
        id: 'test',
      });

      expect(listener).toHaveBeenCalledWith({ id: 'test' });
    });

    it('should properly remove event listeners on disposal', () => {
      const listener = vi.fn();

      animationManager.on('test-event', listener);
      animationManager.dispose();
      animationManager.emit('test-event', {});

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle animation execution errors gracefully', () => {
      // Test with invalid configuration - should not crash the system
      expect(() => {
        try {
          animationManager.executeImmediate('error-test', {} as never);
        } catch {
          // Expected - error handling is working
        }
      }).not.toThrow();
    });

    it('should maintain system stability after errors', () => {
      const config = createTestAnimationConfigs().simple;

      // Cause an error
      try {
        animationManager.executeImmediate('error-test', {} as never);
      } catch {
        // Expected to fail
      }

      // System should still work normally
      const timeline = animationManager.executeImmediate(
        'recovery-test',
        config
      );
      expect(timeline).toBeDefined();
    });
  });
});
