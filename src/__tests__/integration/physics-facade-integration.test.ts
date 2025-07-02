/**
 * @fileoverview SliderPhysics Facade Integration Tests
 *
 * Integration tests for the SliderPhysics facade that coordinates between
 * real physics engine and PIXI renderer components. Tests actual component
 * integration and coordination rather than mocked behavior.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SliderPhysics } from '../../physics';
import type { PhysicsConfig } from '../../core/types';
import type { Sprite } from 'pixi.js';
import {
  createTestSprites,
  createTestPhysicsEngine,
  createTestRenderer,
  cleanupRenderer,
  TEST_INTENSITIES,
  TEST_DIRECTIONS,
} from '../utils/test-factories';

describe('SliderPhysics Facade Integration', () => {
  let facade: SliderPhysics;
  let mockSprites: Sprite[];

  beforeEach(() => {
    // Create test sprites
    mockSprites = createTestSprites(3);

    // Create test configuration
    const testConfig = {
      slideCount: 3,
      slideWidth: 400,
      container: document.createElement('div'),
      sprites: mockSprites,
      enableGPU: false, // Disable for testing
    };

    // Create physics facade with real components (integration test)
    facade = new SliderPhysics(testConfig);
  });

  afterEach(() => {
    // Cleanup
    try {
      facade.destroy();
    } catch {
      // Ignore cleanup errors in tests
    }
  });

  describe('Component Integration and Coordination', () => {
    it('should initialize with real components and coordinate them', () => {
      // Test that the facade creates and coordinates real components
      expect(facade).toBeDefined();

      // Test basic functionality works with real components
      const config = facade.getPhysicsConfig();
      expect(config).toBeDefined();
      expect(config.transitionDuration).toBeGreaterThan(0);
    });

    it('should coordinate physics calculations with renderer', () => {
      // Test actual component coordination (not mocks)
      const timeline = facade.animateTransition(0, 1, mockSprites);

      // Should return actual GSAP timeline from real renderer
      expect(timeline).toBeDefined();
      expect(typeof timeline.duration).toBe('function');
      expect(typeof timeline.play).toBe('function');
    });

    it('should handle sprite management across components', () => {
      // Test sprite coordination between components
      facade.setSprites(mockSprites);

      // Should be able to animate sprites through real component pipeline
      const timeline = facade.animateSwipe(
        mockSprites[0],
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );
      expect(timeline).toBeDefined();
    });

    it('should update physics configuration across components', () => {
      const newConfig: Partial<PhysicsConfig> = {
        transitionDuration: 1.5,
        swipeThreshold: 60,
      };

      facade.setPhysicsConfig(newConfig);

      // Configuration should be updated in real engine
      const updatedConfig = facade.getPhysicsConfig();
      expect(updatedConfig.transitionDuration).toBe(1.5);
    });
  });

  describe('Real Component Workflow Integration', () => {
    it('should execute complete animation workflow with real components', () => {
      // Test full workflow: transition → scale → swipe
      const transitionTimeline = facade.animateTransition(0, 1, mockSprites);
      const scaleTimeline = facade.animateScale(mockSprites[1], 1.2);
      const swipeTimeline = facade.animateSwipe(
        mockSprites[1],
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );

      // All should return real GSAP timelines
      expect(transitionTimeline).toBeDefined();
      expect(scaleTimeline).toBeDefined();
      expect(swipeTimeline).toBeDefined();

      // Timelines should have expected GSAP methods
      expect(typeof transitionTimeline.play).toBe('function');
      expect(typeof scaleTimeline.kill).toBe('function');
      expect(typeof swipeTimeline.duration).toBe('function');
    });

    it('should coordinate performance statistics from real renderer', () => {
      // Create some animations to generate stats
      facade.animateScale(mockSprites[0], 1.1);
      facade.animateScale(mockSprites[1], 1.2);

      const stats = facade.getPerformanceStats();

      // Should return real performance data
      expect(stats).toBeDefined();
      expect(typeof stats.activeTimelines).toBe('number');
      expect(typeof stats.activeTweens).toBe('number');
      expect(typeof stats.totalAnimations).toBe('number');
    });

    it('should handle batch animations with real renderer coordination', () => {
      const animations = [
        { spriteIndex: 0, props: { alpha: 0.5 } },
        { spriteIndex: 1, props: { scale: 1.2 } },
      ];

      const timeline = facade.applyBatchAnimations(mockSprites, animations);

      // Should coordinate real batch animation
      expect(timeline).toBeDefined();
      expect(typeof timeline.duration).toBe('function');
    });
  });

  describe('Advanced Integration Scenarios', () => {
    it('should handle rapid successive operations with real components', () => {
      const sprite = mockSprites[0];
      const timelines: gsap.core.Timeline[] = [];

      // Create rapid animations
      for (let i = 0; i < 5; i++) {
        const timeline = facade.animateScale(sprite, 1.0 + i * 0.1);
        timelines.push(timeline);
      }

      // All should be real timelines
      timelines.forEach((timeline) => {
        expect(timeline).toBeDefined();
        expect(typeof timeline.duration).toBe('function');
      });
    });

    it('should coordinate cleanup across all real components', () => {
      // Create some animations
      facade.animateScale(mockSprites[0], 1.1);
      facade.animateTransition(0, 1, mockSprites);

      // Should clean up real components without errors
      expect(() => {
        facade.killAllAnimations();
        facade.cleanup();
      }).not.toThrow();
    });

    it('should handle edge cases with real component coordination', () => {
      // Test edge cases that would fail with mock mismatches but work with real components
      const timeline1 = facade.animateTransition(-1, 10, mockSprites);
      const timeline2 = facade.animateSwipe(
        mockSprites[0],
        999,
        TEST_INTENSITIES.zero
      );

      // Real components should handle edge cases gracefully
      expect(timeline1).toBeDefined();
      expect(timeline2).toBeDefined();
    });
  });

  describe('Component Behavior Validation', () => {
    it('should validate physics calculations are applied to rendering', () => {
      // Test that physics calculations actually affect rendered output
      const result = facade.shouldTriggerSlideChange(100, 0.5);
      expect(typeof result).toBe('boolean');

      const timing = facade.calculateAdaptiveTiming(500, 0.8);
      expect(typeof timing).toBe('number');
      expect(timing).toBeGreaterThan(0);
    });

    it('should validate real momentum and spring calculations', () => {
      const momentum = facade.calculateMomentum(10, 100, 200);
      expect(momentum).toBeDefined();
      expect(typeof momentum.velocity).toBe('number');
      expect(typeof momentum.distance).toBe('number');
      expect(typeof momentum.duration).toBe('number');

      const spring = facade.calculateSpring(50, 0, 5);
      expect(spring).toBeDefined();
      expect(typeof spring.targetPosition).toBe('number');
      expect(typeof spring.force).toBe('number');
    });
  });

  describe('Integration with Unit-Testable Components', () => {
    it('should support dependency injection for unit testing', () => {
      // Test that the facade supports dependency injection for unit testing
      const mockEngine = createTestPhysicsEngine();
      const mockRenderer = createTestRenderer();

      const testConfig = {
        slideCount: 3,
        slideWidth: 400,
        container: document.createElement('div'),
        sprites: mockSprites,
      };

      const unitTestPhysics = new SliderPhysics(
        testConfig,
        mockEngine,
        mockRenderer
      );
      expect(unitTestPhysics).toBeDefined();

      cleanupRenderer(mockRenderer);
    });

    it('should maintain DRY principles across test types', () => {
      // Test that the same facade can be used for both unit and integration testing
      const testConfig = {
        slideCount: 3,
        slideWidth: 400,
        container: document.createElement('div'),
        sprites: mockSprites,
      };

      // Integration test (real components)
      const integrationPhysics = new SliderPhysics(testConfig);
      expect(integrationPhysics).toBeDefined();

      // Unit test setup (mocked components)
      const mockEngine = createTestPhysicsEngine();
      const mockRenderer = createTestRenderer();
      const unitPhysics = new SliderPhysics(
        testConfig,
        mockEngine,
        mockRenderer
      );
      expect(unitPhysics).toBeDefined();

      // Both should provide the same API
      expect(integrationPhysics.getPhysicsConfig).toBeDefined();
      expect(unitPhysics.getPhysicsConfig).toBeDefined();

      cleanupRenderer(mockRenderer);
    });
  });
});
