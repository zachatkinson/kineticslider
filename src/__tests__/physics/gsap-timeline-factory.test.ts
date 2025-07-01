/**
 * @fileoverview GSAPTimelineFactory Tests
 *
 * Comprehensive unit tests for GSAP timeline creation patterns.
 * Tests all static methods, animation coordination, and resource management.
 * Follows DRY principles using test factories and constants.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gsap } from 'gsap';
import type { Sprite } from 'pixi.js';
import { GSAPTimelineFactory } from '../../physics/gsap-timeline-factory';
import type {
  TransitionConfig,
  MomentumConfig,
  SnapConfig,
  ScaleConfig,
} from '../../physics/gsap-timeline-factory';
import {
  ANIMATION_DURATION,
  EASING,
  SCALE,
  PHYSICS,
  TEST_CONFIG,
} from '../../core/constants';
import {
  createMockPixiSprite,
  createTestSprites,
} from '../utils/test-factories';

// Define proper interfaces for test mocks
interface MockTimeline {
  to: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  isActive: ReturnType<typeof vi.fn>;
  duration: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  restart: ReturnType<typeof vi.fn>;
  progress: ReturnType<typeof vi.fn>;
  totalProgress: ReturnType<typeof vi.fn>;
  seek: ReturnType<typeof vi.fn>;
}

type AnimationConfigFunction = (
  sprite: Sprite,
  index: number
) => gsap.core.Tween;

// Mock GSAP for testing
const mockTimeline: MockTimeline = {
  to: vi.fn().mockReturnThis(),
  add: vi.fn().mockReturnThis(),
  kill: vi.fn(),
  isActive: vi.fn(() => false),
  duration: vi.fn(() => 1),
  play: vi.fn(),
  pause: vi.fn(),
  restart: vi.fn(),
  progress: vi.fn(),
  totalProgress: vi.fn(),
  seek: vi.fn(),
};

vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => mockTimeline),
  },
}));

describe('GSAPTimelineFactory', () => {
  let mockSprites: ReturnType<typeof createTestSprites>;

  beforeEach(() => {
    mockSprites = createTestSprites(3);
    vi.clearAllMocks();
  });

  describe('Static Timeline Creation Methods', () => {
    describe('createSlideTransition', () => {
      it('should create slide transition timeline with proper configuration', () => {
        const config: TransitionConfig = {
          fromIndex: 0,
          toIndex: 1,
          scaleIntensity: TEST_CONFIG.SCALE_INTENSITY.MEDIUM,
          duration: ANIMATION_DURATION.STANDARD,
          ease: EASING.EASE_OUT,
          onStart: vi.fn(),
          onComplete: vi.fn(),
        };

        const timeline = GSAPTimelineFactory.createSlideTransition(
          mockSprites[0],
          mockSprites[1],
          config
        );

        // Verify timeline creation
        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            onStart: config.onStart,
            onComplete: config.onComplete,
          })
        );

        // Verify sprite visibility setup
        expect(mockSprites[0].visible).toBe(true);
        expect(mockSprites[1].visible).toBe(true);
        expect(mockSprites[1].alpha).toBe(0);

        // Verify timeline animations were added
        expect(mockTimeline.to).toHaveBeenCalledTimes(4); // scale out, alpha out, scale in, alpha in
        expect(timeline).toBe(mockTimeline);
      });

      it('should handle different scale intensities', () => {
        const config: TransitionConfig = {
          fromIndex: 0,
          toIndex: 1,
          scaleIntensity: TEST_CONFIG.SCALE_INTENSITY.HIGH,
          duration: ANIMATION_DURATION.FAST,
          ease: EASING.EASE_IN,
        };

        GSAPTimelineFactory.createSlideTransition(
          mockSprites[0],
          mockSprites[1],
          config
        );

        // Verify scale calculations with high intensity
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0].scale,
          expect.objectContaining({
            duration: ANIMATION_DURATION.FAST,
            ease: EASING.EASE_IN,
          }),
          0
        );
      });

      it('should handle same sprite transition gracefully', () => {
        const config: TransitionConfig = {
          fromIndex: 0,
          toIndex: 0,
          scaleIntensity: TEST_CONFIG.SCALE_INTENSITY.LOW,
          duration: ANIMATION_DURATION.QUICK,
          ease: EASING.EASE_OUT,
        };

        expect(() => {
          GSAPTimelineFactory.createSlideTransition(
            mockSprites[0],
            mockSprites[0],
            config
          );
        }).not.toThrow();
      });

      it('should handle missing callbacks gracefully', () => {
        const config: TransitionConfig = {
          fromIndex: 0,
          toIndex: 1,
          scaleIntensity: TEST_CONFIG.SCALE_INTENSITY.MEDIUM,
          duration: ANIMATION_DURATION.STANDARD,
          ease: EASING.EASE_OUT,
          // No onStart/onComplete callbacks
        };

        expect(() => {
          GSAPTimelineFactory.createSlideTransition(
            mockSprites[0],
            mockSprites[1],
            config
          );
        }).not.toThrow();
      });
    });

    describe('createMomentumAnimation', () => {
      it('should create momentum animation with physics calculations', () => {
        const config: MomentumConfig = {
          velocity: TEST_CONFIG.CALCULATION.VELOCITY_BASE,
          direction: 1,
          duration: ANIMATION_DURATION.MEDIUM,
          damping: PHYSICS.MOMENTUM_DAMPING,
          onComplete: vi.fn(),
        };

        const timeline = GSAPTimelineFactory.createMomentumAnimation(
          mockSprites[0],
          config
        );

        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            onComplete: config.onComplete,
          })
        );
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0],
          expect.objectContaining({
            duration: config.duration,
            ease: EASING.EASE_OUT,
          })
        );
        expect(timeline).toBe(mockTimeline);
      });

      it('should calculate momentum distance correctly', () => {
        const config: MomentumConfig = {
          velocity: 200,
          direction: -1, // Negative direction
          duration: TEST_CONFIG.DURATION.SHORT,
          damping: TEST_CONFIG.DAMPING.LIGHT,
        };

        GSAPTimelineFactory.createMomentumAnimation(mockSprites[0], config);

        // Verify momentum calculation affects position
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0],
          expect.objectContaining({
            x: expect.stringContaining('-'), // Should move in negative direction
          })
        );
      });

      it('should handle zero velocity', () => {
        const config: MomentumConfig = {
          velocity: 0,
          direction: 1,
          duration: ANIMATION_DURATION.STANDARD,
          damping: PHYSICS.MOMENTUM_DAMPING,
        };

        expect(() => {
          GSAPTimelineFactory.createMomentumAnimation(mockSprites[0], config);
        }).not.toThrow();
      });

      it('should handle extreme damping values', () => {
        const config: MomentumConfig = {
          velocity: TEST_CONFIG.CALCULATION.VELOCITY_BASE,
          direction: 1,
          duration: ANIMATION_DURATION.STANDARD,
          damping: 0.99, // Very high damping
        };

        expect(() => {
          GSAPTimelineFactory.createMomentumAnimation(mockSprites[0], config);
        }).not.toThrow();
      });
    });

    describe('createSnapAnimation', () => {
      it('should create snap animation to target position', () => {
        const config: SnapConfig = {
          targetPosition: TEST_CONFIG.CALCULATION.MOVEMENT_BASE,
          duration: ANIMATION_DURATION.FAST,
          ease: EASING.BACK,
          onComplete: vi.fn(),
        };

        const timeline = GSAPTimelineFactory.createSnapAnimation(
          mockSprites[0],
          config
        );

        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            onComplete: config.onComplete,
          })
        );
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0],
          expect.objectContaining({
            x: config.targetPosition,
            duration: config.duration,
            ease: config.ease,
          })
        );
        expect(timeline).toBe(mockTimeline);
      });

      it('should handle negative target positions', () => {
        const config: SnapConfig = {
          targetPosition: -TEST_CONFIG.CALCULATION.MOVEMENT_BASE,
          duration: ANIMATION_DURATION.STANDARD,
          ease: EASING.EASE_OUT,
        };

        expect(() => {
          GSAPTimelineFactory.createSnapAnimation(mockSprites[0], config);
        }).not.toThrow();
      });

      it('should handle zero target position', () => {
        const config: SnapConfig = {
          targetPosition: 0,
          duration: ANIMATION_DURATION.QUICK,
          ease: EASING.EASE_OUT,
        };

        expect(() => {
          GSAPTimelineFactory.createSnapAnimation(mockSprites[0], config);
        }).not.toThrow();
      });
    });

    describe('createScaleAnimation', () => {
      it('should create scale animation with proper calculations', () => {
        const config: ScaleConfig = {
          targetScale: TEST_CONFIG.CALCULATION.SCALE_TEST_15,
          baseScale: SCALE.DEFAULT,
          duration: ANIMATION_DURATION.STANDARD,
          ease: EASING.ELASTIC,
          onComplete: vi.fn(),
        };

        const timeline = GSAPTimelineFactory.createScaleAnimation(
          mockSprites[0],
          config
        );

        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            onComplete: config.onComplete,
          })
        );
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0].scale,
          expect.objectContaining({
            x: config.targetScale * config.baseScale,
            y: config.targetScale * config.baseScale,
            duration: config.duration,
            ease: config.ease,
          })
        );
        expect(timeline).toBe(mockTimeline);
      });

      it('should handle scale calculations with different base scales', () => {
        const config: ScaleConfig = {
          targetScale: TEST_CONFIG.CALCULATION.SCALE_TEST_20,
          baseScale: 1.5,
          duration: ANIMATION_DURATION.MEDIUM,
          ease: EASING.EASE_OUT,
        };

        GSAPTimelineFactory.createScaleAnimation(mockSprites[1], config);

        const expectedScale = config.targetScale * config.baseScale;
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[1].scale,
          expect.objectContaining({
            x: expectedScale,
            y: expectedScale,
          })
        );
      });

      it('should handle zero target scale', () => {
        const config: ScaleConfig = {
          targetScale: 0,
          baseScale: SCALE.DEFAULT,
          duration: ANIMATION_DURATION.FAST,
          ease: EASING.EASE_OUT,
        };

        expect(() => {
          GSAPTimelineFactory.createScaleAnimation(mockSprites[0], config);
        }).not.toThrow();
      });
    });

    describe('createDragEffect', () => {
      it('should create drag effect with scale calculations', () => {
        const dragDistance = TEST_CONFIG.CALCULATION.MOVEMENT_BASE;
        const scaleIntensity = TEST_CONFIG.SCALE_INTENSITY.MEDIUM;

        const timeline = GSAPTimelineFactory.createDragEffect(
          mockSprites[0],
          dragDistance,
          scaleIntensity
        );

        expect(gsap.timeline).toHaveBeenCalled();
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0].scale,
          expect.objectContaining({
            duration: ANIMATION_DURATION.QUICK,
            ease: EASING.EASE_OUT,
          })
        );
        expect(timeline).toBe(mockTimeline);
      });

      it('should use default scale intensity when not provided', () => {
        const dragDistance = 50;

        expect(() => {
          GSAPTimelineFactory.createDragEffect(mockSprites[0], dragDistance);
        }).not.toThrow();
      });

      it('should handle zero drag distance', () => {
        expect(() => {
          GSAPTimelineFactory.createDragEffect(mockSprites[0], 0);
        }).not.toThrow();
      });

      it('should handle negative drag distance', () => {
        expect(() => {
          GSAPTimelineFactory.createDragEffect(mockSprites[0], -75);
        }).not.toThrow();
      });
    });

    describe('createScaleReset', () => {
      it('should create scale reset with default target', () => {
        const timeline = GSAPTimelineFactory.createScaleReset(mockSprites[0]);

        expect(gsap.timeline).toHaveBeenCalled();
        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0].scale,
          expect.objectContaining({
            duration: ANIMATION_DURATION.FAST,
            ease: EASING.EASE_OUT,
          })
        );
        expect(timeline).toBe(mockTimeline);
      });

      it('should create scale reset with custom target', () => {
        const targetScale = TEST_CONFIG.CALCULATION.SCALE_TEST_15;

        const timeline = GSAPTimelineFactory.createScaleReset(
          mockSprites[0],
          targetScale
        );

        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0].scale,
          expect.objectContaining({
            x: 1.5, // targetScale = 1.5
            y: 1.5,
            duration: 0.2,
            ease: 'power2.out',
          })
        );
        expect(timeline).toBe(mockTimeline);
      });

      it('should handle sprites without baseScale', () => {
        const spriteWithoutBase = createMockPixiSprite() as unknown as Sprite;

        expect(() => {
          GSAPTimelineFactory.createScaleReset(spriteWithoutBase);
        }).not.toThrow();
      });
    });

    describe('createAnimationGroup', () => {
      it('should create coordinated animation group', () => {
        // Create mock tweens using vi.fn() to return tween-like objects
        const createMockTween = () => vi.fn(() => ({ then: vi.fn() }));
        const mockTween1 = createMockTween()();
        const mockTween2 = createMockTween()();
        const animations = [
          mockTween1,
          mockTween2,
        ] as unknown as gsap.core.Tween[];

        const options = {
          onStart: vi.fn(),
          onComplete: vi.fn(),
          delay: 0.2,
        };

        const timeline = GSAPTimelineFactory.createAnimationGroup(
          animations,
          options
        );

        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            delay: options.delay,
            onStart: options.onStart,
            onComplete: options.onComplete,
          })
        );
        expect(mockTimeline.add).toHaveBeenCalledTimes(2);
        expect(timeline).toBe(mockTimeline);
      });

      it('should handle empty animation array', () => {
        expect(() => {
          GSAPTimelineFactory.createAnimationGroup([]);
        }).not.toThrow();
      });

      it('should use default options when not provided', () => {
        const createMockTween = () => vi.fn(() => ({ then: vi.fn() }));
        const animations = [
          createMockTween()(),
        ] as unknown as gsap.core.Tween[];

        expect(() => {
          GSAPTimelineFactory.createAnimationGroup(animations);
        }).not.toThrow();
      });
    });

    describe('createStaggeredAnimation', () => {
      it('should create staggered animation with proper timing', () => {
        const sprites = createTestSprites(3);
        const animationConfig = vi.fn(() => ({
          then: vi.fn(),
        })) as unknown as AnimationConfigFunction;
        const staggerDelay = 0.1;

        const timeline = GSAPTimelineFactory.createStaggeredAnimation(
          sprites,
          animationConfig,
          staggerDelay
        );

        expect(gsap.timeline).toHaveBeenCalled();
        expect(animationConfig).toHaveBeenCalledTimes(3);
        expect(mockTimeline.add).toHaveBeenCalledTimes(3);

        // Verify stagger timing
        expect(mockTimeline.add).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          0
        );
        expect(mockTimeline.add).toHaveBeenNthCalledWith(
          2,
          expect.anything(),
          0.1
        );
        expect(mockTimeline.add).toHaveBeenNthCalledWith(
          3,
          expect.anything(),
          0.2
        );

        expect(timeline).toBe(mockTimeline);
      });

      it('should use default stagger delay when not provided', () => {
        const sprites = createTestSprites(2);
        const animationConfig = vi.fn(() => ({
          then: vi.fn(),
        })) as unknown as AnimationConfigFunction;

        expect(() => {
          GSAPTimelineFactory.createStaggeredAnimation(
            sprites,
            animationConfig
          );
        }).not.toThrow();
      });

      it('should handle empty sprite array', () => {
        const animationConfig = vi.fn();

        expect(() => {
          GSAPTimelineFactory.createStaggeredAnimation([], animationConfig);
        }).not.toThrow();
      });
    });

    describe('createFadeTransition', () => {
      it('should create fade transition with default duration', () => {
        const timeline = GSAPTimelineFactory.createFadeTransition(
          mockSprites[0],
          mockSprites[1]
        );

        expect(gsap.timeline).toHaveBeenCalled();
        expect(mockSprites[0].visible).toBe(true);
        expect(mockSprites[1].visible).toBe(true);
        expect(mockSprites[1].alpha).toBe(0);
        expect(mockTimeline.to).toHaveBeenCalledTimes(2); // fade out + fade in
        expect(timeline).toBe(mockTimeline);
      });

      it('should create fade transition with custom duration', () => {
        const customDuration = ANIMATION_DURATION.SLOW;

        GSAPTimelineFactory.createFadeTransition(
          mockSprites[0],
          mockSprites[1],
          customDuration
        );

        expect(mockTimeline.to).toHaveBeenCalledWith(
          mockSprites[0],
          expect.objectContaining({
            duration: customDuration,
          }),
          0
        );
      });

      it('should handle same sprite fade transition', () => {
        expect(() => {
          GSAPTimelineFactory.createFadeTransition(
            mockSprites[0],
            mockSprites[0]
          );
        }).not.toThrow();
      });
    });

    describe('createManagedTimeline', () => {
      it('should create managed timeline with cleanup', () => {
        const childTimeline1 = {
          kill: vi.fn(),
          isActive: vi.fn(() => true),
        };
        const childTimeline2 = {
          kill: vi.fn(),
          isActive: vi.fn(() => false),
        };
        const childTimelines = [
          childTimeline1,
          childTimeline2,
        ] as unknown as gsap.core.Timeline[];
        const onComplete = vi.fn();

        const timeline = GSAPTimelineFactory.createManagedTimeline(
          childTimelines,
          onComplete
        );

        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            onComplete: expect.any(Function),
          })
        );
        expect(mockTimeline.add).toHaveBeenCalledTimes(2);
        expect(timeline).toBe(mockTimeline);

        // Test cleanup behavior by calling onComplete
        const timelineConfig = vi.mocked(gsap.timeline).mock.calls[0][0];
        if (timelineConfig?.onComplete) {
          timelineConfig.onComplete();
        }

        expect(childTimeline1.kill).toHaveBeenCalled();
        expect(childTimeline2.kill).not.toHaveBeenCalled(); // Not active
        expect(onComplete).toHaveBeenCalled();
      });

      it('should handle missing onComplete callback', () => {
        const childTimelines = [
          { kill: vi.fn(), isActive: vi.fn(() => true) },
        ] as unknown as gsap.core.Timeline[];

        expect(() => {
          const timeline =
            GSAPTimelineFactory.createManagedTimeline(childTimelines);
          expect(timeline).toBe(mockTimeline);
        }).not.toThrow();
      });

      it('should handle empty child timeline array', () => {
        expect(() => {
          GSAPTimelineFactory.createManagedTimeline([]);
        }).not.toThrow();
      });

      it('should handle null child timelines gracefully', () => {
        const childTimelines = [
          null,
          undefined,
          { kill: vi.fn(), isActive: vi.fn(() => true) },
        ] as unknown as gsap.core.Timeline[];

        const timeline =
          GSAPTimelineFactory.createManagedTimeline(childTimelines);

        // Verify timeline was created successfully
        expect(timeline).toBe(mockTimeline);

        // Trigger cleanup
        const timelineConfig = vi.mocked(gsap.timeline).mock.calls[0][0];

        expect(() => {
          if (timelineConfig?.onComplete) {
            timelineConfig.onComplete();
          }
        }).not.toThrow();
      });
    });
  });

  describe('Performance and Resource Management', () => {
    it('should efficiently create multiple timelines', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        GSAPTimelineFactory.createFadeTransition(
          mockSprites[0],
          mockSprites[1]
        );
        GSAPTimelineFactory.createScaleReset(mockSprites[0]);
        GSAPTimelineFactory.createDragEffect(mockSprites[0], i);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should handle rapid timeline creation without memory issues', () => {
      const timelines: gsap.core.Timeline[] = [];

      for (let i = 0; i < 1000; i++) {
        timelines.push(
          GSAPTimelineFactory.createFadeTransition(
            mockSprites[0],
            mockSprites[1]
          )
        );
      }

      expect(timelines).toHaveLength(1000);
      expect(gsap.timeline).toHaveBeenCalledTimes(1000);
    });

    it('should properly configure GSAP defaults', () => {
      GSAPTimelineFactory.createScaleAnimation(mockSprites[0], {
        targetScale: 1.5,
        baseScale: 1.0,
        duration: ANIMATION_DURATION.STANDARD,
        ease: EASING.EASE_OUT,
      });

      // Verify GSAP defaults are applied
      expect(gsap.timeline).toHaveBeenCalledWith(
        expect.objectContaining({
          force3D: true,
          ease: EASING.EASE_OUT,
        })
      );
    });
  });

  describe('Integration and Configuration', () => {
    it('should maintain timeline consistency across methods', () => {
      const config = {
        duration: ANIMATION_DURATION.MEDIUM,
        ease: EASING.BOUNCE,
      };

      // Test consistent configuration across different timeline types
      GSAPTimelineFactory.createSlideTransition(
        mockSprites[0],
        mockSprites[1],
        {
          fromIndex: 0,
          toIndex: 1,
          scaleIntensity: 0.5,
          ...config,
        }
      );

      GSAPTimelineFactory.createSnapAnimation(mockSprites[0], {
        targetPosition: 100,
        ...config,
      });

      // Verify consistent GSAP configuration
      expect(
        vi
          .mocked(gsap.timeline)
          .mock.calls.every(
            (call) => call[0]?.ease === config.ease || call[0]?.force3D === true
          )
      ).toBe(true);
    });

    it('should handle configuration validation gracefully', () => {
      // Test with extreme values that should be handled gracefully
      const extremeConfig: TransitionConfig = {
        fromIndex: -1,
        toIndex: 999,
        scaleIntensity: -100,
        duration: 0,
        ease: 'invalid-ease' as string,
      };

      expect(() => {
        GSAPTimelineFactory.createSlideTransition(
          mockSprites[0],
          mockSprites[1],
          extremeConfig
        );
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null sprites gracefully', () => {
      expect(() => {
        GSAPTimelineFactory.createFadeTransition(
          null as unknown as Sprite,
          mockSprites[1]
        );
      }).toThrow();

      expect(() => {
        GSAPTimelineFactory.createScaleReset(null as unknown as Sprite);
      }).toThrow();
    });

    it('should handle undefined sprites gracefully', () => {
      expect(() => {
        GSAPTimelineFactory.createDragEffect(
          undefined as unknown as Sprite,
          50
        );
      }).toThrow();
    });

    it('should handle sprites with missing properties', () => {
      const incompleteSprite = { x: 100 } as unknown as Sprite;

      expect(() => {
        GSAPTimelineFactory.createScaleAnimation(incompleteSprite, {
          targetScale: 1.5,
          baseScale: 1.0,
          duration: ANIMATION_DURATION.STANDARD,
          ease: EASING.EASE_OUT,
        });
      }).not.toThrow();
    });

    it('should handle GSAP timeline creation failures', () => {
      vi.mocked(gsap.timeline).mockImplementationOnce(() => {
        throw new Error('GSAP Error');
      });

      expect(() => {
        GSAPTimelineFactory.createFadeTransition(
          mockSprites[0],
          mockSprites[1]
        );
      }).toThrow('GSAP Error');
    });

    it('should handle invalid animation configurations', () => {
      const invalidConfig = {
        targetScale: NaN,
        baseScale: Infinity,
        duration: -1,
        ease: null,
      } as unknown as ScaleConfig;

      expect(() => {
        GSAPTimelineFactory.createScaleAnimation(mockSprites[0], invalidConfig);
      }).not.toThrow();
    });
  });
});
