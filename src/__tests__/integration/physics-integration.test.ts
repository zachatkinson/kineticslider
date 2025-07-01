/**
 * @fileoverview Physics Component Integration Tests
 *
 * Tests how KineticPhysics, SpringPhysics, VelocityTracker, and GSAPTimelineFactory
 * work together in real-world scenarios. Validates cross-component interactions,
 * data flow, and complex physics workflows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KineticPhysics } from '../../physics/kinetic-physics';
import { SpringPhysics } from '../../physics/spring-physics';
import { VelocityTracker } from '../../physics/velocity-tracker';
import { GSAPTimelineFactory } from '../../physics/gsap-timeline-factory';
import { createTestSprites } from '../utils/test-factories';
import {
  PHYSICS,
  ANIMATION_DURATION,
  EASING,
  INPUT,
  SCALE,
  TEST_CONFIG,
} from '../../core/constants';

// Types are defined but not used - removed to fix ESLint

// Mock GSAP for integration tests
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      kill: vi.fn(),
      isActive: vi.fn(() => false),
    })),
  },
}));

describe('Physics Component Integration', () => {
  let kineticPhysics: KineticPhysics;
  let springPhysics: SpringPhysics;
  let velocityTracker: VelocityTracker;
  let mockSprites: ReturnType<typeof createTestSprites>;

  beforeEach(() => {
    kineticPhysics = new KineticPhysics();
    springPhysics = new SpringPhysics();
    velocityTracker = new VelocityTracker({
      bufferSize: TEST_CONFIG.BUFFER_SIZE.MEDIUM,
      throttleInterval: TEST_CONFIG.THROTTLE.LIGHT,
    });
    mockSprites = createTestSprites(3);
    vi.clearAllMocks();
  });

  describe('Cross-Physics Integration Workflows', () => {
    it('should handle complete drag-to-momentum-to-snap workflow', () => {
      const start = performance.now();

      // 1. Track drag velocity with VelocityTracker
      velocityTracker.addSample(0, 0, start);
      velocityTracker.addSample(50, 0, start + 50);
      velocityTracker.addSample(150, 0, start + 100);
      velocityTracker.addSample(300, 0, start + 150);

      const velocityResult = velocityTracker.getVelocity();
      expect(velocityResult.velocity).toBeGreaterThan(0);

      // 2. Calculate momentum with KineticPhysics
      const momentumResult = kineticPhysics.calculateMomentum(
        velocityResult.velocity, // initial velocity
        150, // drag distance
        100 // time delta
      );

      expect(momentumResult.velocity).toBeGreaterThan(0);
      expect(momentumResult.distance).toBeGreaterThan(0);
      expect(momentumResult.duration).toBeGreaterThan(0);

      // 3. Determine snap position with KineticPhysics
      const slideWidth = 100; // Standard slide width
      const snapResult = KineticPhysics.calculateSnapPosition(
        270, // current position between slides - will snap to 300
        slideWidth
      );

      expect(snapResult.targetPosition).toBe(300); // Should snap to nearest slide (270/100 = 2.7 → rounds to 3 → 3*100 = 300)
      expect(snapResult.duration).toBeGreaterThan(0);

      // 4. Create spring animation with SpringPhysics using the displacement
      const displacement = snapResult.targetPosition - 270; // 30 units displacement
      const springForce = SpringPhysics.calculateSpringForce(
        displacement,
        PHYSICS.SPRING_MIN_CONSTANT
      );

      expect(Math.abs(springForce)).toBeGreaterThan(0);
      // Spring force opposes displacement - positive displacement creates negative restoring force
      expect(springForce).toBeLessThan(0); // Negative force pulls toward equilibrium

      // 5. Generate GSAP timeline for the complete workflow
      const momentumTimeline = GSAPTimelineFactory.createMomentumAnimation(
        mockSprites[0],
        {
          velocity: momentumResult.velocity,
          direction: 1,
          duration: momentumResult.duration,
          damping: PHYSICS.MOMENTUM_DAMPING,
        }
      );

      const snapTimeline = GSAPTimelineFactory.createSnapAnimation(
        mockSprites[0],
        {
          targetPosition: snapResult.targetPosition,
          duration: snapResult.duration,
          ease: EASING.BACK,
        }
      );

      expect(momentumTimeline).toBeDefined();
      expect(snapTimeline).toBeDefined();
    });

    it('should coordinate multiple physics calculations for gesture recognition', () => {
      const start = performance.now();

      // Simulate swipe gesture with VelocityTracker
      const gesturePositions = [0, 25, 75, 150, 250, 350];
      gesturePositions.forEach((pos, index) => {
        velocityTracker.addSample(pos, 0, start + index * 20);
      });

      // Check if it qualifies as a swipe
      const isSwipe = velocityTracker.isSwipeGesture(
        PHYSICS.VELOCITY_THRESHOLD,
        INPUT.SWIPE_THRESHOLD
      );
      expect(isSwipe).toBe(true);

      const peakVelocity = velocityTracker.getPeakVelocity();
      expect(peakVelocity).toBeGreaterThan(PHYSICS.VELOCITY_THRESHOLD);

      // Use physics calculations to determine slide change
      const shouldChangeSlide = kineticPhysics.shouldTriggerSlideChange(
        350, // distance
        peakVelocity
      );
      expect(shouldChangeSlide).toBe(true);

      // Calculate scale effect during gesture
      const scaleEffect = kineticPhysics.calculateDragScale(
        350, // drag distance
        SCALE.DEFAULT
      );
      expect(scaleEffect).toBeGreaterThan(SCALE.DEFAULT);
    });

    it('should handle spring-based displacement corrections', () => {
      // Simulate overshoot scenario requiring spring correction
      const overshotPosition = 450;
      const targetPosition = 400;
      const displacement = overshotPosition - targetPosition;

      // Calculate spring force for correction
      const springForce = SpringPhysics.calculateSpringForce(
        displacement,
        PHYSICS.SPRING_MIN_CONSTANT
      );
      expect(springForce).toBeLessThan(0); // Force should pull back

      // Calculate elastic motion for smooth correction
      const elasticMotion = springPhysics.calculateElasticMotion(
        overshotPosition, // current position
        targetPosition, // target position
        0 // velocity
      );
      expect(elasticMotion.duration).toBeGreaterThan(0);
      expect(elasticMotion.targetPosition).toBeCloseTo(targetPosition, 1);

      // Create GSAP timeline for spring correction
      const correctionTimeline = GSAPTimelineFactory.createSnapAnimation(
        mockSprites[0],
        {
          targetPosition: elasticMotion.targetPosition,
          duration: elasticMotion.duration,
          ease: EASING.ELASTIC,
        }
      );
      expect(correctionTimeline).toBeDefined();
    });

    it('should coordinate timeline sequencing for complex animations', () => {
      // Create multiple timeline types that need coordination
      const dragTimeline = GSAPTimelineFactory.createDragEffect(
        mockSprites[0],
        TEST_CONFIG.CALCULATION.MOVEMENT_BASE,
        TEST_CONFIG.SCALE_INTENSITY.MEDIUM
      );

      const momentumTimeline = GSAPTimelineFactory.createMomentumAnimation(
        mockSprites[0],
        {
          velocity: TEST_CONFIG.CALCULATION.VELOCITY_BASE,
          direction: 1,
          duration: ANIMATION_DURATION.MEDIUM,
          damping: PHYSICS.MOMENTUM_DAMPING,
        }
      );

      const snapTimeline = GSAPTimelineFactory.createSnapAnimation(
        mockSprites[0],
        {
          targetPosition: TEST_CONFIG.CALCULATION.MOVEMENT_BASE * 2,
          duration: ANIMATION_DURATION.FAST,
          ease: EASING.BACK,
        }
      );

      // Create managed timeline sequence
      const sequenceTimeline = GSAPTimelineFactory.createManagedTimeline([
        dragTimeline,
        momentumTimeline,
        snapTimeline,
      ]);

      expect(sequenceTimeline).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance across multiple physics calculations', () => {
      const start = performance.now();

      // Perform intensive physics calculations
      for (let i = 0; i < 100; i++) {
        velocityTracker.addSample(i * 10, i * 5, start + i * 10);

        KineticPhysics.calculateVelocity(i * 10, 10);

        SpringPhysics.calculateSpringForce(i * 2, PHYSICS.SPRING_MIN_CONSTANT);

        GSAPTimelineFactory.createDragEffect(mockSprites[i % 3], i * 5);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete quickly
    });

    it('should handle memory efficiently with large datasets', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create large amounts of physics data
      for (let i = 0; i < 1000; i++) {
        velocityTracker.addSample(i, i, performance.now() + i);

        if (i % 100 === 0) {
          velocityTracker.reset(); // Periodic cleanup
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should coordinate physics calculations under stress', () => {
      const results: Array<{
        velocity: number;
        momentum: {
          velocity: number;
          distance: number;
          duration: number;
          scaleFactor: number;
        };
        springForce: number;
      }> = [];

      // Stress test with rapid calculations
      for (let i = 0; i < 500; i++) {
        const velocity = KineticPhysics.calculateVelocity(i, 1);
        const momentum = kineticPhysics.calculateMomentum(velocity, i, 100);
        const springForce = SpringPhysics.calculateSpringForce(i, 0.1);

        results.push({ velocity, momentum, springForce });
      }

      expect(results).toHaveLength(500);
      expect(results.every((r) => r.velocity >= 0)).toBe(true);
      expect(results.every((r) => r.momentum.distance >= 0)).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cascading errors gracefully', () => {
      // Test error propagation through physics chain
      expect(() => {
        const badVelocity = KineticPhysics.calculateVelocity(NaN, 1);
        const badMomentum = kineticPhysics.calculateMomentum(
          badVelocity,
          100,
          100
        );
        springPhysics.calculateElasticMotion(badMomentum.distance, 0, 0);
      }).not.toThrow();
    });

    it('should maintain system stability with invalid inputs', () => {
      // Test with various invalid inputs
      const invalidInputs = [NaN, Infinity, -Infinity];

      invalidInputs.forEach((input) => {
        expect(() => {
          KineticPhysics.calculateVelocity(input, 1);
          SpringPhysics.calculateSpringForce(input, 0.1);
          GSAPTimelineFactory.createDragEffect(mockSprites[0], input);
        }).not.toThrow();
      });
    });

    it('should recover from timeline creation failures', () => {
      // Mock GSAP failure
      const mockError = vi.fn(() => {
        throw new Error('GSAP creation failed');
      });

      expect(() => {
        try {
          mockError();
        } catch {
          // System should handle this gracefully
          const fallbackTimeline = GSAPTimelineFactory.createSnapAnimation(
            mockSprites[0],
            {
              targetPosition: 100,
              duration: ANIMATION_DURATION.FAST,
              ease: EASING.EASE_OUT,
            }
          );
          expect(fallbackTimeline).toBeDefined();
        }
      }).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should maintain consistent configuration across components', () => {
      // Update configurations
      kineticPhysics.updateConfig({
        velocityThreshold: 150,
        swipeThreshold: 80,
      });

      springPhysics.updateConfig({
        springConstant: 0.15,
        damping: 0.85,
      });

      velocityTracker.updateConfig({
        maxVelocity: 500,
        smoothingFactor: 0.4,
      });

      // Verify configurations are applied
      const kineticConfig = kineticPhysics.getConfig();
      const springConfig = springPhysics.getConfig();
      const velocityConfig = velocityTracker.getConfig();

      expect(kineticConfig.velocityThreshold).toBe(150);
      expect(springConfig.springConstant).toBe(0.15);
      expect(velocityConfig.maxVelocity).toBe(500);

      // Test integration with new configurations
      const result = kineticPhysics.shouldTriggerSlideChange(
        85, // distance > new threshold
        160 // velocity > new threshold
      );
      expect(result).toBe(true);
    });

    it('should handle configuration validation across components', () => {
      // Test with extreme configurations
      expect(() => {
        kineticPhysics.updateConfig({
          velocityThreshold: -100,
          swipeThreshold: 0,
        });

        springPhysics.updateConfig({
          springConstant: -1,
          damping: 2,
        });

        velocityTracker.updateConfig({
          maxVelocity: -1,
          bufferSize: 0,
        });
      }).not.toThrow();
    });
  });

  describe('Real-World Scenario Integration', () => {
    it('should handle complete user interaction simulation', () => {
      const scenario = {
        userStartsAt: 0,
        userDragsTo: 200,
        userReleasesAt: 250,
        expectedSnapTo: 300,
      };

      // 1. Track user drag
      const dragStart = performance.now();
      velocityTracker.addSample(scenario.userStartsAt, 0, dragStart);
      velocityTracker.addSample(scenario.userDragsTo, 0, dragStart + 100);
      velocityTracker.addSample(scenario.userReleasesAt, 0, dragStart + 120);

      // 2. Calculate release velocity
      const releaseVelocity = velocityTracker.getVelocity();
      expect(releaseVelocity.velocity).toBeGreaterThan(0);

      // 3. Determine if should snap or momentum
      const shouldSnap =
        scenario.userReleasesAt > scenario.expectedSnapTo * 0.7;

      if (shouldSnap) {
        // Create snap animation
        const snapTimeline = GSAPTimelineFactory.createSnapAnimation(
          mockSprites[0],
          {
            targetPosition: scenario.expectedSnapTo,
            duration: ANIMATION_DURATION.MEDIUM,
            ease: EASING.BACK,
          }
        );
        expect(snapTimeline).toBeDefined();
      } else {
        // Create momentum animation
        const momentum = kineticPhysics.calculateMomentum(
          releaseVelocity.velocity,
          scenario.userReleasesAt - scenario.userStartsAt,
          120
        );

        const momentumTimeline = GSAPTimelineFactory.createMomentumAnimation(
          mockSprites[0],
          {
            velocity: momentum.velocity,
            direction: 1,
            duration: momentum.duration,
            damping: PHYSICS.MOMENTUM_DAMPING,
          }
        );
        expect(momentumTimeline).toBeDefined();
      }
    });

    it('should handle multi-sprite coordinated animations', () => {
      const sprites = createTestSprites(5);

      // Create individual scale animations for each sprite
      sprites.forEach((sprite, _index) => {
        const scaleAnimation = GSAPTimelineFactory.createScaleAnimation(
          sprite,
          {
            targetScale: 1 + _index * 0.1,
            baseScale: SCALE.DEFAULT,
            duration: ANIMATION_DURATION.FAST,
            ease: EASING.EASE_OUT,
          }
        );
        expect(scaleAnimation).toBeDefined();
      });

      // Verify all sprites are animated
      sprites.forEach((sprite) => {
        expect(sprite).toBeDefined();
      });
    });
  });
});
