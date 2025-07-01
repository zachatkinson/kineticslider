/**
 * @fileoverview KineticPhysics Tests
 *
 * Unit tests for pure kinetic and momentum physics calculations.
 * Tests velocity calculations, friction, momentum, and drag scale effects.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KineticPhysics } from '../../physics/kinetic-physics';
import { PHYSICS, ANIMATION_DURATION, EASING, SCALE, INTENSITY, INPUT } from '../../core/constants';

describe('KineticPhysics', () => {
  let kineticPhysics: KineticPhysics;

  beforeEach(() => {
    kineticPhysics = new KineticPhysics();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = kineticPhysics.getConfig();

      expect(config.friction).toBe(PHYSICS.FRICTION);
      expect(config.scaleIntensity).toBe(INTENSITY.VERY_LOW);
      expect(config.velocityThreshold).toBe(PHYSICS.VELOCITY_THRESHOLD);
      expect(config.maxVelocity).toBe(PHYSICS.MAX_VELOCITY);
      expect(config.swipeThreshold).toBe(INPUT.SWIPE_THRESHOLD);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        friction: 0.7,
        scaleIntensity: 0.3,
        velocityThreshold: 1.5,
        maxVelocity: 150,
        swipeThreshold: 80,
      };

      const physics = new KineticPhysics(customConfig);
      const config = physics.getConfig();

      expect(config.friction).toBe(0.7);
      expect(config.scaleIntensity).toBe(0.3);
      expect(config.velocityThreshold).toBe(1.5);
      expect(config.maxVelocity).toBe(150);
      expect(config.swipeThreshold).toBe(80);
    });

    it('should update configuration', () => {
      kineticPhysics.updateConfig({ friction: 0.6, scaleIntensity: 0.4 });
      const config = kineticPhysics.getConfig();

      expect(config.friction).toBe(0.6);
      expect(config.scaleIntensity).toBe(0.4);
      expect(config.velocityThreshold).toBe(PHYSICS.VELOCITY_THRESHOLD); // Unchanged
    });

    it('should reset configuration to defaults', () => {
      kineticPhysics.updateConfig({ friction: 0.9, maxVelocity: 200 });
      kineticPhysics.resetConfig();
      const config = kineticPhysics.getConfig();

      expect(config.friction).toBe(PHYSICS.FRICTION);
      expect(config.maxVelocity).toBe(PHYSICS.MAX_VELOCITY);
    });
  });

  describe('Static Velocity Calculations', () => {
    it('should calculate velocity from distance and time', () => {
      const velocity = KineticPhysics.calculateVelocity(100, 2);
      expect(velocity).toBe(50);
    });

    it('should calculate velocity with zero time', () => {
      const velocity = KineticPhysics.calculateVelocity(100, 0);
      expect(velocity).toBe(0);
    });

    it('should calculate velocity with negative distance (absolute value)', () => {
      const velocity = KineticPhysics.calculateVelocity(-80, 4);
      expect(velocity).toBe(20);
    });

    it('should handle very small time values', () => {
      const velocity = KineticPhysics.calculateVelocity(50, 0.001);
      expect(velocity).toBe(50000);
    });
  });

  describe('Static Friction Calculations', () => {
    it('should apply friction to reduce velocity', () => {
      const velocity = KineticPhysics.applyFriction(100, 0.2);
      expect(velocity).toBeCloseTo(80, 5); // 100 * (1 - 0.2)
    });

    it('should handle zero friction (no change)', () => {
      const velocity = KineticPhysics.applyFriction(75, 0);
      expect(velocity).toBe(75);
    });

    it('should handle maximum friction (stop)', () => {
      const velocity = KineticPhysics.applyFriction(50, 1.0);
      expect(velocity).toBe(0);
    });

    it('should handle negative velocity', () => {
      const velocity = KineticPhysics.applyFriction(-60, 0.3);
      expect(velocity).toBeCloseTo(-42, 5); // -60 * (1 - 0.3)
    });
  });

  describe('Static Snap Position Calculations', () => {
    it('should calculate snap to nearest slide position', () => {
      const snap = KineticPhysics.calculateSnapPosition(150, 100);
      
      expect(snap.targetPosition).toBe(200); // Nearest slide at 2 * 100
      expect(snap.snapDistance).toBe(50); // |200 - 150|
      expect(snap.duration).toBeGreaterThan(0);
    });

    it('should snap to exact slide position', () => {
      const snap = KineticPhysics.calculateSnapPosition(300, 100);
      
      expect(snap.targetPosition).toBe(300);
      expect(snap.snapDistance).toBe(0);
    });

    it('should handle negative positions', () => {
      const snap = KineticPhysics.calculateSnapPosition(-75, 100);
      
      expect(snap.targetPosition).toBe(-100); // Nearest slide at -1 * 100
      expect(snap.snapDistance).toBe(25);
    });

    it('should calculate duration based on distance', () => {
      const shortSnap = KineticPhysics.calculateSnapPosition(95, 100);
      const longSnap = KineticPhysics.calculateSnapPosition(50, 100);
      
      expect(longSnap.duration).toBeGreaterThan(shortSnap.duration);
    });
  });

  describe('Momentum Calculations', () => {
    it('should calculate momentum physics from drag interaction', () => {
      const result = kineticPhysics.calculateMomentum(80, 120, 500);
      
      expect(result.velocity).toBeLessThanOrEqual(PHYSICS.MAX_VELOCITY);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.scaleFactor).toBeGreaterThanOrEqual(1);
    });

    it('should clamp velocity to maximum', () => {
      kineticPhysics.updateConfig({ maxVelocity: 50 });
      const result = kineticPhysics.calculateMomentum(200, 100, 1000);
      
      expect(result.velocity).toBeLessThanOrEqual(50);
    });

    it('should apply friction over time', () => {
      const shortTime = kineticPhysics.calculateMomentum(100, 50, 100);
      const longTime = kineticPhysics.calculateMomentum(100, 50, 1000);
      
      expect(longTime.velocity).toBeLessThan(shortTime.velocity);
    });

    it('should calculate scale factor from drag distance', () => {
      kineticPhysics.updateConfig({ scaleIntensity: 0.2, swipeThreshold: 100 });
      const result = kineticPhysics.calculateMomentum(50, 50, 500); // 50% of threshold
      
      expect(result.scaleFactor).toBeCloseTo(1.1, 2); // 1 + 0.5 * 0.2
    });
  });

  describe('Drag Scale Calculations', () => {
    it('should calculate scale from drag distance', () => {
      kineticPhysics.updateConfig({ scaleIntensity: 0.1, swipeThreshold: 100 });
      const scale = kineticPhysics.calculateDragScale(50); // 50% of threshold
      
      expect(scale).toBeCloseTo(1.05, 3); // 1 * (1 + 0.5 * 0.1)
    });

    it('should use custom base scale', () => {
      kineticPhysics.updateConfig({ scaleIntensity: 0.2, swipeThreshold: 100 });
      const scale = kineticPhysics.calculateDragScale(100, 1.5); // 100% of threshold
      
      expect(scale).toBeCloseTo(1.8, 3); // 1.5 * (1 + 1.0 * 0.2)
    });

    it('should handle zero drag distance', () => {
      const scale = kineticPhysics.calculateDragScale(0, 2);
      
      expect(scale).toBe(2); // No scaling applied
    });

    it('should clamp drag distance to threshold', () => {
      kineticPhysics.updateConfig({ scaleIntensity: 0.1, swipeThreshold: 50 });
      const scale1 = kineticPhysics.calculateDragScale(50);
      const scale2 = kineticPhysics.calculateDragScale(100); // Double threshold
      
      expect(scale1).toBe(scale2); // Both should be clamped to same result
    });
  });

  describe('Slide Change Detection', () => {
    it('should trigger on distance threshold', () => {
      kineticPhysics.updateConfig({ swipeThreshold: 50, velocityThreshold: 2 });
      
      expect(kineticPhysics.shouldTriggerSlideChange(60, 1)).toBe(true);
      expect(kineticPhysics.shouldTriggerSlideChange(40, 1)).toBe(false);
    });

    it('should trigger on velocity threshold', () => {
      kineticPhysics.updateConfig({ swipeThreshold: 100, velocityThreshold: 3 });
      
      expect(kineticPhysics.shouldTriggerSlideChange(20, 5)).toBe(true);
      expect(kineticPhysics.shouldTriggerSlideChange(20, 2)).toBe(false);
    });

    it('should handle negative distance (absolute value)', () => {
      kineticPhysics.updateConfig({ swipeThreshold: 50, velocityThreshold: 2 });
      
      expect(kineticPhysics.shouldTriggerSlideChange(-60, 1)).toBe(true);
      expect(kineticPhysics.shouldTriggerSlideChange(-40, 1)).toBe(false);
    });

    it('should trigger if either threshold is met', () => {
      kineticPhysics.updateConfig({ swipeThreshold: 100, velocityThreshold: 5 });
      
      expect(kineticPhysics.shouldTriggerSlideChange(150, 2)).toBe(true); // Distance only
      expect(kineticPhysics.shouldTriggerSlideChange(30, 8)).toBe(true); // Velocity only
      expect(kineticPhysics.shouldTriggerSlideChange(30, 2)).toBe(false); // Neither
    });
  });

  describe('Spring Reset Calculations', () => {
    it('should calculate spring physics for scale reset', () => {
      const result = kineticPhysics.calculateSpringReset(1.5, 1.0);
      
      expect(result.scaleDelta).toBe(0.5);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.ease).toBe(EASING.EASE_OUT);
    });

    it('should use default target scale', () => {
      const result = kineticPhysics.calculateSpringReset(1.3);
      
      expect(result.scaleDelta).toBeCloseTo(0.3, 5); // |1.3 - SCALE.DEFAULT|
      expect(result.ease).toBe(EASING.EASE_OUT);
    });

    it('should calculate duration based on scale difference', () => {
      const smallDelta = kineticPhysics.calculateSpringReset(1.1, 1.0);
      const largeDelta = kineticPhysics.calculateSpringReset(2.0, 1.0);
      
      expect(largeDelta.duration).toBeGreaterThan(smallDelta.duration);
    });

    it('should cap maximum duration', () => {
      const result = kineticPhysics.calculateSpringReset(10.0, 1.0); // Extreme scale
      
      expect(result.duration).toBeLessThanOrEqual(ANIMATION_DURATION.MEDIUM);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values gracefully', () => {
      expect(KineticPhysics.calculateVelocity(0, 1)).toBe(0);
      expect(KineticPhysics.applyFriction(0, 0.5)).toBe(0);
      expect(kineticPhysics.calculateDragScale(0)).toBe(SCALE.DEFAULT);
    });

    it('should handle very large numbers', () => {
      const velocity = KineticPhysics.calculateVelocity(1000000, 1);
      expect(velocity).toBe(1000000);
      
      const friction = KineticPhysics.applyFriction(1000000, 0.1);
      expect(friction).toBe(900000);
    });

    it('should handle very small numbers', () => {
      const velocity = KineticPhysics.calculateVelocity(0.001, 0.001);
      expect(velocity).toBe(1);
    });

    it('should prevent division by zero', () => {
      const velocity = KineticPhysics.calculateVelocity(100, 0);
      expect(velocity).toBe(0);
    });
  });

  describe('Performance and Integration', () => {
    it('should efficiently calculate many velocity values', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        KineticPhysics.calculateVelocity(Math.random() * 100, Math.random() + 0.1);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in under 10ms
    });

    it('should handle rapid configuration updates efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        kineticPhysics.updateConfig({ friction: Math.random() });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5); // Should complete in under 5ms
    });

    it('should maintain configuration immutability', () => {
      const config1 = kineticPhysics.getConfig();
      config1.friction = 0.999; // Attempt to mutate
      const config2 = kineticPhysics.getConfig();
      
      expect(config2.friction).toBe(PHYSICS.FRICTION); // Should be unchanged
    });
  });
}); 