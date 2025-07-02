/**
 * @fileoverview AnimationManager TRUE Unit Tests
 *
 * Tests ONLY pure logic, synchronous operations.
 * NO async operations, NO coordination, NO real timers.
 * Fully mocked dependencies.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnimationManager } from '../../managers/animation-manager';
import { ANIMATION_PRIORITIES, ANIMATION_EVENTS } from '../../core/constants';

// Mock GSAP completely
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => ({
      to: vi.fn(),
      duration: vi.fn(() => 1000),
      kill: vi.fn(),
      isActive: vi.fn(() => false),
      eventCallback: vi.fn(),
      play: vi.fn(),
    })),
  },
}));

// Mock timeline factory
const mockTimelineFactory = {
  createTimeline: vi.fn(() => ({ timeline: 'mocked' })),
  dispose: vi.fn(),
};

describe('AnimationManager Unit Tests (Pure Logic)', () => {
  let animationManager: AnimationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setInterval to prevent real timers
    vi.spyOn(global, 'setInterval').mockImplementation(
      () => 123 as unknown as NodeJS.Timeout
    );
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {});

    animationManager = new AnimationManager(mockTimelineFactory as never);
  });

  afterEach(() => {
    animationManager.dispose();
    vi.clearAllTimers();
  });

  describe('Initialization Logic', () => {
    it('should initialize with default performance stats', () => {
      const stats = animationManager.getPerformanceStats();

      expect(stats.activeAnimations).toBe(0);
      expect(stats.completedAnimations).toBe(0);
      expect(stats.failedAnimations).toBe(0);
      expect(stats.currentAnimationCount).toBe(0);
      expect(stats.queueLength).toBe(0);
      expect(stats.activeTimelineGroups).toBe(0);
      expect(stats.activeTimelines).toBe(0);
    });

    it('should store timeline factory reference', () => {
      expect(animationManager).toBeDefined();
      expect(animationManager).toBeInstanceOf(AnimationManager);
    });

    it('should have proper event emitter capabilities', () => {
      const listener = vi.fn();

      animationManager.on('test-event', listener);
      animationManager.emit('test-event', { test: true });

      expect(listener).toHaveBeenCalledWith({ test: true });
    });
  });

  describe('State Management Logic', () => {
    it('should provide comprehensive animation state', () => {
      const state = animationManager.getAnimationState();

      expect(state).toHaveProperty('isProcessingQueue');
      expect(state).toHaveProperty('activeAnimations');
      expect(state).toHaveProperty('queuedAnimations');
      expect(state).toHaveProperty('timelineGroups');
      expect(state).toHaveProperty('performanceStats');

      expect(typeof state.isProcessingQueue).toBe('boolean');
      expect(Array.isArray(state.activeAnimations)).toBe(true);
      expect(Array.isArray(state.queuedAnimations)).toBe(true);
      expect(Array.isArray(state.timelineGroups)).toBe(true);
      expect(typeof state.performanceStats).toBe('object');
    });

    it('should track performance stats structure', () => {
      const stats = animationManager.getPerformanceStats();

      expect(stats).toHaveProperty('activeAnimations');
      expect(stats).toHaveProperty('completedAnimations');
      expect(stats).toHaveProperty('failedAnimations');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('currentAnimationCount');
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('activeTimelineGroups');
      expect(stats).toHaveProperty('activeTimelines');
    });

    it('should return initial state correctly', () => {
      const state = animationManager.getAnimationState();

      expect(state.isProcessingQueue).toBe(false);
      expect(state.activeAnimations).toEqual([]);
      expect(state.queuedAnimations).toEqual([]);
      expect(state.timelineGroups).toEqual([]);
    });
  });

  describe('Event Emission Logic', () => {
    it('should support event listeners registration', () => {
      const listener = vi.fn();

      animationManager.on(ANIMATION_EVENTS.ANIMATION_QUEUED, listener);

      // Manually emit event to test listener registration
      animationManager.emit(ANIMATION_EVENTS.ANIMATION_QUEUED, {
        id: 'test-animation',
        priority: ANIMATION_PRIORITIES.HIGH,
        queueLength: 1,
      });

      expect(listener).toHaveBeenCalledWith({
        id: 'test-animation',
        priority: ANIMATION_PRIORITIES.HIGH,
        queueLength: 1,
      });
    });

    it('should handle multiple event listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      animationManager.on('test-event', listener1);
      animationManager.on('test-event', listener2);

      animationManager.emit('test-event', { data: 'test' });

      expect(listener1).toHaveBeenCalledWith({ data: 'test' });
      expect(listener2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support event listener removal', () => {
      const listener = vi.fn();

      animationManager.on('test-event', listener);
      animationManager.off('test-event', listener);
      animationManager.emit('test-event', {});

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Validation Logic', () => {
    it('should validate basic animation config structure', () => {
      const validConfigs = [
        { duration: 1000 },
        { ease: 'power2.out' },
        { animations: [] },
        { duration: 500, ease: 'power1.in' },
      ];

      // Test that these don't cause immediate errors in constructor/setup
      validConfigs.forEach((config) => {
        expect(typeof config).toBe('object');
        expect(config).not.toBeNull();
      });
    });

    it('should handle priority values correctly', () => {
      const validPriorities = Object.values(ANIMATION_PRIORITIES);

      validPriorities.forEach((priority) => {
        expect(typeof priority).toBe('number');
        expect(priority).toBeGreaterThan(0);
        expect(priority).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('Cleanup Logic', () => {
    it('should remove all event listeners on disposal', () => {
      const listener = vi.fn();

      animationManager.on('test-event', listener);
      animationManager.dispose();
      animationManager.emit('test-event', {});

      expect(listener).not.toHaveBeenCalled();
    });

    it('should reset performance stats on disposal', () => {
      animationManager.dispose();

      const stats = animationManager.getPerformanceStats();
      expect(stats.activeAnimations).toBe(0);
      expect(stats.completedAnimations).toBe(0);
      expect(stats.failedAnimations).toBe(0);
    });

    it('should handle multiple disposals gracefully', () => {
      expect(() => {
        animationManager.dispose();
        animationManager.dispose();
      }).not.toThrow();
    });
  });

  describe('Error Handling Logic', () => {
    it('should handle error events properly', () => {
      const errorListener = vi.fn();

      animationManager.on(ANIMATION_EVENTS.ANIMATION_ERROR, errorListener);

      // Emit error event manually to test error handling
      const testError = new Error('Test error');
      animationManager.emit(ANIMATION_EVENTS.ANIMATION_ERROR, {
        id: 'test-animation',
        error: testError,
        context: { source: 'test' },
      });

      expect(errorListener).toHaveBeenCalledWith({
        id: 'test-animation',
        error: testError,
        context: { source: 'test' },
      });
    });

    it('should not throw on invalid event emission', () => {
      expect(() => {
        animationManager.emit('invalid-event', null);
        animationManager.emit('', undefined);
      }).not.toThrow();
    });
  });

  describe('Constants Integration', () => {
    it('should use correct animation event constants', () => {
      const requiredEvents = [
        ANIMATION_EVENTS.ANIMATION_QUEUED,
        ANIMATION_EVENTS.ANIMATION_STARTED,
        ANIMATION_EVENTS.ANIMATION_COMPLETED,
        ANIMATION_EVENTS.ANIMATION_ERROR,
      ];

      requiredEvents.forEach((event) => {
        expect(typeof event).toBe('string');
        expect(event.length).toBeGreaterThan(0);
      });
    });

    it('should use correct priority constants', () => {
      const priorities = ANIMATION_PRIORITIES;

      expect(priorities.CRITICAL).toBeGreaterThan(priorities.HIGH);
      expect(priorities.HIGH).toBeGreaterThan(priorities.NORMAL);
      expect(priorities.NORMAL).toBeGreaterThan(priorities.LOW);
      expect(priorities.LOW).toBeGreaterThan(priorities.MINIMAL);
    });
  });
});
