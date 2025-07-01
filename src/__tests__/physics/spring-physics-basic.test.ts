/**
 * @fileoverview SpringPhysics Basic Tests
 *
 * Basic unit tests for spring-based physics calculations.
 * Tests core spring force calculations and configuration management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpringPhysics } from '../../physics/spring-physics';
import { PHYSICS, EASING, ANIMATION_DURATION } from '../../core/constants';

describe('SpringPhysics - Basic Tests', () => {
  let springPhysics: SpringPhysics;

  beforeEach(() => {
    springPhysics = new SpringPhysics();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = springPhysics.getConfig();

      expect(config.springConstant).toBe(PHYSICS.SPRING_CONSTANT);
      expect(config.damping).toBe(PHYSICS.MOMENTUM_DAMPING);
      expect(config.duration).toBe(ANIMATION_DURATION.STANDARD);
      expect(config.ease).toBe(EASING.ELASTIC);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        springConstant: 0.2,
        damping: 0.7,
        duration: 1.5,
        ease: 'elastic.out',
      };

      const physics = new SpringPhysics(customConfig);
      const config = physics.getConfig();

      expect(config.springConstant).toBe(0.2);
      expect(config.damping).toBe(0.7);
      expect(config.duration).toBe(1.5);
      expect(config.ease).toBe('elastic.out');
    });

    it('should update configuration', () => {
      springPhysics.updateConfig({ springConstant: 0.15, damping: 0.8 });
      const config = springPhysics.getConfig();

      expect(config.springConstant).toBe(0.15);
      expect(config.damping).toBe(0.8);
      expect(config.duration).toBe(ANIMATION_DURATION.STANDARD); // Unchanged
    });

    it('should get immutable configuration copy', () => {
      const config1 = springPhysics.getConfig();
      config1.springConstant = 0.999; // Attempt to mutate
      const config2 = springPhysics.getConfig();

      expect(config2.springConstant).toBe(PHYSICS.SPRING_CONSTANT);
    });
  });

  describe('Static Spring Force Calculations', () => {
    it('should calculate spring force from displacement', () => {
      const force = SpringPhysics.calculateSpringForce(10, 0.1);
      expect(force).toBe(-1); // -10 * 0.1
    });

    it('should calculate spring force with negative displacement', () => {
      const force = SpringPhysics.calculateSpringForce(-15, 0.2);
      expect(force).toBe(3); // -(-15) * 0.2
    });

    it('should handle zero displacement', () => {
      const force = SpringPhysics.calculateSpringForce(0, 0.5);
      expect(force).toBeCloseTo(0, 10); // Handle -0 vs +0 JavaScript quirk
    });

    it('should handle zero spring constant', () => {
      const force = SpringPhysics.calculateSpringForce(20, 0);
      expect(force).toBeCloseTo(0, 10); // Handle -0 vs +0 JavaScript quirk
    });

    it('should use default spring constant when not provided', () => {
      const force = SpringPhysics.calculateSpringForce(10);
      const expectedForce = -10 * PHYSICS.SPRING_CONSTANT;
      expect(force).toBe(expectedForce);
    });
  });

  describe('Elastic Motion Calculations', () => {
    it('should calculate elastic motion from position difference', () => {
      const result = springPhysics.calculateElasticMotion(100, 50);

      expect(result.targetPosition).toBe(50);
      expect(result.force).toBeLessThan(0); // Should be negative (restoring)
      expect(result.duration).toBeGreaterThan(0);
      expect(result.ease).toBe(EASING.ELASTIC);
    });

    it('should handle zero displacement', () => {
      const result = springPhysics.calculateElasticMotion(75, 75);

      expect(result.targetPosition).toBe(75);
      expect(result.force).toBeCloseTo(0, 10); // Handle -0 vs +0 JavaScript quirk
      expect(result.duration).toBeGreaterThanOrEqual(0); // Zero displacement = zero duration
    });

    it('should handle negative displacement', () => {
      const result = springPhysics.calculateElasticMotion(30, 80);

      expect(result.targetPosition).toBe(80);
      expect(result.force).toBeGreaterThan(0); // Positive restoring force
    });

    it('should calculate duration based on displacement magnitude', () => {
      const smallResult = springPhysics.calculateElasticMotion(100, 95);
      const largeResult = springPhysics.calculateElasticMotion(100, 50);

      expect(largeResult.duration).toBeGreaterThan(smallResult.duration);
    });

    it('should respect spring configuration', () => {
      springPhysics.updateConfig({ springConstant: 0.2 });
      const result = springPhysics.calculateElasticMotion(100, 80);

      // Force should use the updated spring constant
      expect(result.force).toBe(-20 * 0.2); // -(100-80) * 0.2
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small spring constants', () => {
      springPhysics.updateConfig({ springConstant: 0.001 });
      const result = springPhysics.calculateElasticMotion(100, 50);

      expect(result.force).toBeCloseTo(-0.05, 5); // -(100-50) * 0.001
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle very large displacements', () => {
      const result = springPhysics.calculateElasticMotion(0, 10000);

      expect(result.targetPosition).toBe(10000);
      expect(result.force).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle negative positions', () => {
      const result = springPhysics.calculateElasticMotion(-50, -100);

      expect(result.targetPosition).toBe(-100);
      expect(result.force).toBeLessThan(0); // Force is negative: -(-50 - (-100)) * spring = -50 * spring
    });
  });

  describe('Performance', () => {
    it('should efficiently calculate multiple spring forces', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        SpringPhysics.calculateSpringForce(
          Math.random() * 200 - 100,
          Math.random()
        );
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in under 10ms
    });

    it('should efficiently calculate multiple elastic motions', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        springPhysics.calculateElasticMotion(
          Math.random() * 200,
          Math.random() * 200
        );
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20); // Should complete in under 20ms
    });

    it('should handle rapid configuration updates efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        springPhysics.updateConfig({
          springConstant: Math.random() * 0.5,
          damping: Math.random(),
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5); // Should complete in under 5ms
    });
  });
});
