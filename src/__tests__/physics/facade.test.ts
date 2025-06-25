/**
 * @fileoverview SliderPhysics Facade Tests
 *
 * Unit tests for the SliderPhysics facade that coordinates between
 * the pure physics engine and PIXI renderer. Tests the public API
 * and integration between components.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SliderPhysics } from '../../physics';
import { SliderPhysicsEngine } from '../../physics/engine';
import { PixiSliderRenderer } from '../../physics/renderer';
import type { PhysicsConfig } from '../../core/types';
import type { Sprite } from 'pixi.js';
import {
  createTestSprites,
  createTestPhysicsEngine,
  createTestRenderer,
  TEST_PHYSICS_CONFIGS,
  TEST_INTENSITIES,
  TEST_DIRECTIONS,
} from '../utils/test-factories';
import {
  ANIMATION_DURATION,
  DEFAULT_PHYSICS_CONFIG,
  TEST_CONFIG,
} from '../../core/constants';

describe('SliderPhysics', () => {
  let physics: SliderPhysics;
  let mockEngine: SliderPhysicsEngine;
  let mockRenderer: PixiSliderRenderer;
  let sprites: Sprite[];

  beforeEach(() => {
    // Create mock engine and properly spy on all methods
    mockEngine = createTestPhysicsEngine();
    vi.spyOn(mockEngine, 'setConfig').mockImplementation(() => {});
    vi.spyOn(mockEngine, 'getConfig').mockReturnValue(DEFAULT_PHYSICS_CONFIG);
    vi.spyOn(mockEngine, 'calculateTransition').mockReturnValue({
      hideSprites: [0, 2],
      targetSprite: {
        index: 1,
        initialState: { visible: true, alpha: 0, scale: 1.1 },
        finalState: { alpha: 1, scale: 1 },
        duration: TEST_CONFIG.DURATION.STANDARD,
        ease: 'power2.out',
      },
    });
    vi.spyOn(mockEngine, 'calculateSwipe').mockReturnValue({
      initialPhase: {
        movement: 50,
        scale: 1.05,
        duration: ANIMATION_DURATION.FAST,
      },
      springPhase: {
        movement: -42.5,
        scale: 1,
        duration: TEST_CONFIG.DURATION.STANDARD,
        ease: 'elastic.out',
      },
    });
    vi.spyOn(mockEngine, 'calculateScale').mockReturnValue({
      targetScale: 1.5,
      duration: ANIMATION_DURATION.STANDARD,
      ease: 'power2.out',
    });
    vi.spyOn(mockEngine, 'shouldTriggerSlideChange').mockReturnValue(true);
    vi.spyOn(mockEngine, 'calculateAdaptiveTiming').mockReturnValue(0.8);

    // Create mock renderer
    mockRenderer = createTestRenderer();
    const mockTimeline = {
      duration: vi.fn().mockReturnValue(1),
      play: vi.fn(),
      pause: vi.fn(),
      kill: vi.fn(),
    };
    vi.spyOn(mockRenderer, 'applyTransition').mockReturnValue(mockTimeline as never);
    vi.spyOn(mockRenderer, 'applySwipe').mockReturnValue(mockTimeline as never);
    vi.spyOn(mockRenderer, 'applyScale').mockReturnValue(mockTimeline as never);
    vi.spyOn(mockRenderer, 'killAllAnimations').mockImplementation(() => {});
    vi.spyOn(mockRenderer, 'cleanup').mockImplementation(() => {});
    vi.spyOn(mockRenderer, 'getPerformanceStats').mockReturnValue({
      activeTimelines: 0,
      activeTweens: 0,
      totalAnimations: 0,
    });
    vi.spyOn(mockRenderer, 'markSpritesForGSAP').mockImplementation(() => {});
    vi.spyOn(mockRenderer, 'applyBatchAnimations').mockReturnValue(mockTimeline as never);

    // Create test sprites
    sprites = createTestSprites(3);

    // Create physics facade with mocked dependencies
    physics = new SliderPhysics(mockEngine, mockRenderer);
  });

  afterEach(() => {
    // Only cleanup if it won't throw - avoid test errors in cleanup
    try {
      physics.cleanup();
    } catch {
      // Ignore cleanup errors in tests
    }
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = physics.getPhysicsConfig();
      
      expect(config).toEqual(DEFAULT_PHYSICS_CONFIG);
    });

    it('should update physics configuration', () => {
      const newConfig = {
        transitionDuration: TEST_CONFIG.DURATION.LONG,
        swipeThreshold: TEST_CONFIG.SWIPE.THRESHOLD,
      };

      physics.setPhysicsConfig(newConfig);

      expect(mockEngine.setConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should retrieve current physics configuration', () => {
      vi.mocked(mockEngine.getConfig).mockReturnValue(TEST_PHYSICS_CONFIGS.fast as PhysicsConfig);

      const config = physics.getPhysicsConfig();

      expect(config).toEqual(TEST_PHYSICS_CONFIGS.fast);
      expect(mockEngine.getConfig).toHaveBeenCalled();
    });
  });

  describe('Transition Animation', () => {
    it('should animate transition between slides', () => {
      const timeline = physics.animateTransition(0, 1, sprites);

      // Should calculate transition using engine
      expect(mockEngine.calculateTransition).toHaveBeenCalledWith(0, 1, 3);

      // Should apply transition using renderer
      expect(mockRenderer.applyTransition).toHaveBeenCalledWith(
        sprites,
        expect.objectContaining({
          hideSprites: [0, 2],
          targetSprite: expect.objectContaining({
            index: 1,
          }),
        })
      );

      // Should return timeline
      expect(timeline).toBeDefined();
      expect(timeline.duration).toBeDefined();
    });

    it('should handle edge case with empty sprite array', () => {
      const timeline = physics.animateTransition(0, 0, []);

      expect(mockEngine.calculateTransition).toHaveBeenCalledWith(0, 0, 0);
      expect(mockRenderer.applyTransition).toHaveBeenCalledWith([], expect.any(Object));
      expect(timeline).toBeDefined();
    });

    it('should handle invalid indices gracefully', () => {
      const timeline = physics.animateTransition(-1, 10, sprites);

      expect(mockEngine.calculateTransition).toHaveBeenCalledWith(-1, 10, 3);
      expect(timeline).toBeDefined();
    });
  });

  describe('Swipe Animation', () => {
    it('should animate swipe gesture with momentum', () => {
      const sprite = sprites[0];
      const timeline = physics.animateSwipe(sprite, TEST_DIRECTIONS.right, TEST_INTENSITIES.medium);

      // Should calculate swipe using engine
      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );

      // Should apply swipe using renderer
      expect(mockRenderer.applySwipe).toHaveBeenCalledWith(
        sprite,
        expect.objectContaining({
          initialPhase: expect.objectContaining({
            movement: 50,
            scale: 1.05,
          }),
          springPhase: expect.objectContaining({
            movement: -42.5,
            scale: 1,
          }),
        })
      );

      expect(timeline).toBeDefined();
    });

    it('should handle different swipe directions', () => {
      const sprite = sprites[0];

      // Test left swipe
      physics.animateSwipe(sprite, TEST_DIRECTIONS.left, TEST_INTENSITIES.low);
      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(
        TEST_DIRECTIONS.left,
        TEST_INTENSITIES.low
      );

      // Test right swipe
      physics.animateSwipe(sprite, TEST_DIRECTIONS.right, TEST_INTENSITIES.high);
      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.high
      );
    });

    it('should handle zero intensity swipe', () => {
      const sprite = sprites[0];
      const timeline = physics.animateSwipe(sprite, TEST_DIRECTIONS.right, TEST_INTENSITIES.zero);

      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.zero
      );
      expect(timeline).toBeDefined();
    });

    it('should handle maximum intensity swipe', () => {
      const sprite = sprites[0];
      const timeline = physics.animateSwipe(sprite, TEST_DIRECTIONS.right, TEST_INTENSITIES.max);

      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.max
      );
      expect(timeline).toBeDefined();
    });
  });

  describe('Scale Animation', () => {
    it('should animate sprite scaling with default duration', () => {
      const sprite = sprites[0];
      const timeline = physics.animateScale(sprite, TEST_CONFIG.SCALE_VALUES.SMALL);

      // Should calculate scale using engine
      expect(mockEngine.calculateScale).toHaveBeenCalledWith(
        TEST_CONFIG.SCALE_VALUES.SMALL,
        ANIMATION_DURATION.STANDARD
      );

      // Should apply scale using renderer
      expect(mockRenderer.applyScale).toHaveBeenCalledWith(
        sprite,
        expect.objectContaining({
          targetScale: 1.5,
          duration: ANIMATION_DURATION.STANDARD,
        })
      );

      expect(timeline).toBeDefined();
    });

    it('should animate sprite scaling with custom duration', () => {
      const sprite = sprites[0];
      const customDuration = ANIMATION_DURATION.SLOW;
      
      const timeline = physics.animateScale(sprite, TEST_CONFIG.SCALE_VALUES.LARGE, customDuration);

      expect(mockEngine.calculateScale).toHaveBeenCalledWith(
        TEST_CONFIG.SCALE_VALUES.LARGE,
        customDuration
      );
      expect(timeline).toBeDefined();
    });

    it('should handle edge scale values', () => {
      const sprite = sprites[0];

      // Test zero scale (should be clamped)
      physics.animateScale(sprite, TEST_CONFIG.SCALE_VALUES.ZERO);
      expect(mockEngine.calculateScale).toHaveBeenCalledWith(
        TEST_CONFIG.SCALE_VALUES.ZERO,
        ANIMATION_DURATION.STANDARD
      );

      // Test large scale
      physics.animateScale(sprite, TEST_CONFIG.SCALE_VALUES.LARGE);
      expect(mockEngine.calculateScale).toHaveBeenCalledWith(
        TEST_CONFIG.SCALE_VALUES.LARGE,
        ANIMATION_DURATION.STANDARD
      );
    });
  });

  describe('Advanced Engine Methods', () => {
    it('should expose slide change threshold calculation', () => {
      const result = physics.shouldTriggerSlideChange(100, 0.5);

      expect(mockEngine.shouldTriggerSlideChange).toHaveBeenCalledWith(100, 0.5);
      expect(result).toBe(true);
    });

    it('should expose adaptive timing calculation', () => {
      const result = physics.calculateAdaptiveTiming(TEST_CONFIG.INTERACTION.QUICK, TEST_INTENSITIES.high);

      expect(mockEngine.calculateAdaptiveTiming).toHaveBeenCalledWith(
        TEST_CONFIG.INTERACTION.QUICK,
        TEST_INTENSITIES.high
      );
      expect(result).toBe(0.8);
    });
  });

  describe('Performance and Statistics', () => {
    it('should expose performance statistics', () => {
      const stats = physics.getPerformanceStats();

      expect(mockRenderer.getPerformanceStats).toHaveBeenCalled();
      expect(stats).toEqual({
        activeTimelines: 0,
        activeTweens: 0,
        totalAnimations: 0,
      });
    });

    it('should mark sprites for GSAP targeting', () => {
      physics.markSpritesForGSAP(sprites);

      expect(mockRenderer.markSpritesForGSAP).toHaveBeenCalledWith(sprites);
    });

    it('should apply batch animations efficiently', () => {
      const animations = [
        { spriteIndex: 0, props: { alpha: 0.5 } },
        { spriteIndex: 1, props: { scale: 1.2 } },
      ];

      const timeline = physics.applyBatchAnimations(sprites, animations);

      expect(mockRenderer.applyBatchAnimations).toHaveBeenCalledWith(sprites, animations);
      expect(timeline).toBeDefined();
    });
  });

  describe('Animation Control and Cleanup', () => {
    it('should kill all active animations', () => {
      physics.killAllAnimations();

      expect(mockRenderer.killAllAnimations).toHaveBeenCalled();
    });

    it('should cleanup physics resources', () => {
      physics.cleanup();

      expect(mockRenderer.cleanup).toHaveBeenCalled();
    });

    it('should handle multiple cleanup calls gracefully', () => {
      physics.cleanup();
      physics.cleanup();

      expect(mockRenderer.cleanup).toHaveBeenCalledTimes(2);
    });

  });

  describe('Integration Scenarios', () => {
    it('should handle complete slide transition workflow', () => {
      // Start transition
      const transitionTimeline = physics.animateTransition(0, 1, sprites);
      
      // Apply scale during interaction
      const scaleTimeline = physics.animateScale(sprites[1], 1.1, ANIMATION_DURATION.STANDARD);
      
      // Apply swipe gesture
      const swipeTimeline = physics.animateSwipe(sprites[1], TEST_DIRECTIONS.right, TEST_INTENSITIES.medium);

      // All operations should complete successfully
      expect(transitionTimeline).toBeDefined();
      expect(scaleTimeline).toBeDefined();
      expect(swipeTimeline).toBeDefined();

      // Engine should have been called for each calculation
      expect(mockEngine.calculateTransition).toHaveBeenCalledTimes(1);
      expect(mockEngine.calculateScale).toHaveBeenCalledTimes(1);
      expect(mockEngine.calculateSwipe).toHaveBeenCalledTimes(1);

      // Renderer should have been called for each application
      expect(mockRenderer.applyTransition).toHaveBeenCalledTimes(1);
      expect(mockRenderer.applyScale).toHaveBeenCalledTimes(1);
      expect(mockRenderer.applySwipe).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive animations', () => {
      const sprite = sprites[0];

      // Rapid animations
      for (let i = 0; i < 5; i++) {
        physics.animateScale(sprite, 1.0 + i * 0.1);
      }

      // Should handle all animations
      expect(mockEngine.calculateScale).toHaveBeenCalledTimes(5);
      expect(mockRenderer.applyScale).toHaveBeenCalledTimes(5);
    });

    it('should maintain performance under load', () => {
      // Create many animations
      const animations = [];
      for (let i = 0; i < 20; i++) {
        animations.push({
          spriteIndex: i % sprites.length,
          props: { alpha: Math.random(), scale: 1 + Math.random() * 0.5 },
        });
      }

      const timeline = physics.applyBatchAnimations(sprites, animations);

      expect(timeline).toBeDefined();
      expect(mockRenderer.applyBatchAnimations).toHaveBeenCalledWith(sprites, animations);
    });
  });

  describe('Error Handling', () => {
    it('should handle engine calculation errors gracefully', () => {
      vi.mocked(mockEngine.calculateTransition).mockImplementation(() => {
        throw new Error('Engine calculation failed');
      });

      expect(() => {
        physics.animateTransition(0, 1, sprites);
      }).toThrow('Engine calculation failed');
    });

    it('should handle renderer application errors gracefully', () => {
      vi.mocked(mockRenderer.applyTransition).mockImplementation(() => {
        throw new Error('Renderer application failed');
      });

      expect(() => {
        physics.animateTransition(0, 1, sprites);
      }).toThrow('Renderer application failed');
    });

    it('should handle cleanup errors gracefully', () => {
      // Override the cleanup spy temporarily for this test
      vi.mocked(mockRenderer.cleanup).mockImplementationOnce(() => {
        throw new Error('Cleanup failed');
      });

      // Should not throw error due to input validation
      expect(() => {
        physics.cleanup();
      }).not.toThrow();
      
      // But should have attempted cleanup
      expect(mockRenderer.cleanup).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined sprites gracefully', () => {
      // These should not throw but may produce undefined behavior
      // The facade should validate inputs
      const timeline1 = physics.animateTransition(0, 1, null as never);
      expect(timeline1).toBeDefined(); // Should return a timeline even with null sprites
      
      const timeline2 = physics.animateSwipe(null as never, 1, 0.5);
      expect(timeline2).toBeDefined(); // Should return a timeline even with null sprite
      
      const timeline3 = physics.animateScale(undefined as never, 1.5);
      expect(timeline3).toBeDefined(); // Should return a timeline even with undefined sprite
    });

    it('should handle invalid animation parameters', () => {
      const sprite = sprites[0];

      // Invalid direction (should still work)
      physics.animateSwipe(sprite, 999, TEST_INTENSITIES.medium);
      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(999, TEST_INTENSITIES.medium);

      // Invalid intensity (should be handled by engine)
      physics.animateSwipe(sprite, TEST_DIRECTIONS.right, -5);
      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(TEST_DIRECTIONS.right, -5);

      // Invalid scale (should be handled by engine)
      physics.animateScale(sprite, -1);
      expect(mockEngine.calculateScale).toHaveBeenCalledWith(-1, ANIMATION_DURATION.STANDARD);
    });
  });
}); 