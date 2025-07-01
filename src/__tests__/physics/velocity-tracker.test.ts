/**
 * @fileoverview VelocityTracker Tests
 * Tests for the actual VelocityTracker implementation API
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VelocityTracker } from '../../physics/velocity-tracker';
import type { VelocityConfig } from '../../physics/velocity-tracker';
import { PHYSICS, PERFORMANCE, INPUT, TEST_CONFIG } from '../../core/constants';

describe('VelocityTracker', () => {
  let tracker: VelocityTracker;
  let config: Partial<VelocityConfig>;

  beforeEach(() => {
    config = {
      bufferSize: TEST_CONFIG.BUFFER_SIZE.SMALL,
      throttleInterval: TEST_CONFIG.THROTTLE.LIGHT,
      minDistance: INPUT.MIN_MOVEMENT_THRESHOLD,
      maxVelocity: PHYSICS.MAX_VELOCITY,
      smoothingFactor: 0.3,
    };
    tracker = new VelocityTracker(config);
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with provided configuration', () => {
      expect(tracker).toBeDefined();
      const trackerConfig = tracker.getConfig();
      expect(trackerConfig.bufferSize).toBe(config.bufferSize);
      expect(trackerConfig.throttleInterval).toBe(config.throttleInterval);
    });

    it('should initialize with default configuration when none provided', () => {
      const defaultTracker = new VelocityTracker();
      expect(defaultTracker).toBeDefined();
      const defaultConfig = defaultTracker.getConfig();
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.bufferSize).toBe(PERFORMANCE.SAMPLE_BUFFER_SIZE);
    });

    it('should handle partial configuration', () => {
      const partialConfig = {
        bufferSize: TEST_CONFIG.BUFFER_SIZE.MEDIUM,
        throttleInterval: TEST_CONFIG.THROTTLE.MEDIUM,
      };

      const partialTracker = new VelocityTracker(partialConfig);
      expect(partialTracker).toBeDefined();
      const resultConfig = partialTracker.getConfig();
      expect(resultConfig.bufferSize).toBe(partialConfig.bufferSize);
      expect(resultConfig.throttleInterval).toBe(
        partialConfig.throttleInterval
      );
    });
  });

  describe('Sample Recording', () => {
    it('should record position samples correctly', () => {
      const x = 100,
        y = 150;
      const timestamp = performance.now();

      const result = tracker.addSample(x, y, timestamp);

      expect(result).toBe(true);
      const samples = tracker.getSamples();
      expect(samples).toHaveLength(1);
      expect(samples[0].x).toBe(x);
      expect(samples[0].y).toBe(y);
    });

    it('should respect buffer size limits', () => {
      const bufferSize = 3;
      const limitedTracker = new VelocityTracker({
        ...config,
        bufferSize,
      });

      // Record more samples than buffer size
      for (let i = 0; i < 5; i++) {
        limitedTracker.addSample(i * 10, i * 10, performance.now() + i * 20);
      }

      const samples = limitedTracker.getSamples();
      expect(samples.length).toBeLessThanOrEqual(bufferSize);
    });

    it('should handle rapid sample recording with throttling', () => {
      const start = performance.now();
      let successfulSamples = 0;

      for (let i = 0; i < 10; i++) {
        if (tracker.addSample(i, i, start + i)) {
          successfulSamples++;
        }
      }

      // Some samples should be throttled
      expect(successfulSamples).toBeLessThan(10);
    });
  });

  describe('Velocity Calculation', () => {
    it('should calculate velocity from multiple samples', () => {
      const start = performance.now();

      // Record samples with consistent movement
      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 100); // 100 pixels in 100ms
      tracker.addSample(200, 0, start + 200);

      const velocity = tracker.getVelocity();
      expect(velocity.velocity).toBeGreaterThan(0);
    });

    it('should return zero velocity with insufficient samples', () => {
      const velocity = tracker.getVelocity();
      expect(velocity.velocity).toBe(0);

      tracker.addSample(100, 100, performance.now());
      const velocity2 = tracker.getVelocity();
      expect(velocity2.velocity).toBe(0);
    });

    it('should calculate velocity direction correctly', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 100); // Moving right

      const velocity = tracker.getVelocity();
      expect(velocity.direction).toBeCloseTo(0, 2); // 0 radians = right
    });

    it('should calculate velocity components correctly', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 100); // Moving right

      const velocity = tracker.getVelocity();
      expect(velocity.velocityX).toBeGreaterThan(0);
      expect(Math.abs(velocity.velocityY)).toBeCloseTo(0, 1);
    });
  });

  describe('Peak Velocity and Averages', () => {
    it('should detect peak velocity correctly', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 50); // Fast movement
      tracker.addSample(150, 0, start + 100); // Slower movement

      const peakVelocity = tracker.getPeakVelocity();
      expect(peakVelocity).toBeGreaterThan(0);
    });

    it('should return zero for no samples', () => {
      expect(tracker.getPeakVelocity()).toBe(0);
    });

    it('should calculate average velocity', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 100);
      tracker.addSample(200, 0, start + 200);

      const velocity = tracker.getVelocity();
      expect(velocity.averageVelocity).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should reset tracker state correctly', () => {
      tracker.addSample(100, 100, performance.now());
      tracker.addSample(200, 200, performance.now() + 100);

      expect(tracker.getSamples()).toHaveLength(2);

      tracker.reset();

      expect(tracker.getSamples()).toHaveLength(0);
      expect(tracker.getVelocity().velocity).toBe(0);
    });

    it('should maintain configuration after reset', () => {
      const originalConfig = tracker.getConfig();
      tracker.reset();
      expect(tracker.getConfig()).toEqual(originalConfig);
    });

    it('should update configuration correctly', () => {
      const newConfig = { bufferSize: 15, maxVelocity: 500 };
      tracker.updateConfig(newConfig);

      const updatedConfig = tracker.getConfig();
      expect(updatedConfig.bufferSize).toBe(newConfig.bufferSize);
      expect(updatedConfig.maxVelocity).toBe(newConfig.maxVelocity);
    });
  });

  describe('Gesture Recognition', () => {
    it('should detect swipe gestures correctly', () => {
      const start = performance.now();

      // Fast, long movement
      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 50);
      tracker.addSample(200, 0, start + 100);

      expect(tracker.isSwipeGesture()).toBe(true);
    });

    it('should reject non-swipe movements', () => {
      // Use stricter thresholds to ensure rejection
      const result = tracker.isSwipeGesture(1000, 100); // High velocity and distance thresholds
      expect(result).toBe(false);
    });

    it('should calculate total distance correctly', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 50);
      tracker.addSample(200, 0, start + 100);

      const totalDistance = tracker.getTotalDistance();
      expect(totalDistance).toBeCloseTo(200, 1);
    });

    it('should calculate motion duration correctly', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 100);

      const duration = tracker.getMotionDuration();
      expect(duration).toBeCloseTo(100, 10);
    });
  });

  describe('Position Prediction', () => {
    it('should predict future positions correctly', () => {
      const start = performance.now();

      tracker.addSample(0, 0, start);
      tracker.addSample(100, 0, start + 100); // Moving right

      const futurePos = tracker.predictPosition(100); // 100ms ahead
      expect(futurePos.x).toBeGreaterThan(100);
      expect(Math.abs(futurePos.y)).toBeCloseTo(0, 5);
    });

    it('should handle prediction with no data', () => {
      const futurePos = tracker.predictPosition(100);
      expect(futurePos.x).toBe(0);
      expect(futurePos.y).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should efficiently handle large numbers of samples', () => {
      // Test with many samples
      for (let i = 0; i < 1000; i++) {
        tracker.addSample(i, i * 0.5, performance.now() + i);
      }

      const velocity = tracker.getVelocity();
      expect(velocity.velocity).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(() => {
        tracker.addSample(NaN, 0, performance.now());
        tracker.addSample(100, 100, NaN);
        tracker.getVelocity();
      }).not.toThrow();
    });
  });

  describe('Static Methods', () => {
    it('should calculate velocity between two points', () => {
      const velocity = VelocityTracker.calculateVelocity(0, 0, 0, 100, 0, 1000);
      expect(velocity).toBeCloseTo(100, 1); // 100 pixels in 1 second = 100 px/s
    });

    it('should calculate direction between two points', () => {
      const direction = VelocityTracker.calculateDirection(0, 0, 100, 0);
      expect(direction).toBeCloseTo(0, 2); // Moving right = 0 radians
    });

    it('should handle zero time intervals in static calculation', () => {
      const velocity = VelocityTracker.calculateVelocity(
        0,
        0,
        100,
        100,
        0,
        100
      );
      expect(velocity).toBe(0);
    });
  });
});
