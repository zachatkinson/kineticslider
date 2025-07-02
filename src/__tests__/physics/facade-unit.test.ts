/**
 * @fileoverview SliderPhysics Facade Unit Tests
 *
 * Pure unit tests for the facade logic using dependency injection.
 * Tests the facade coordination logic without testing the injected components.
 * Focuses on the facade's API, delegation, and state management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SliderPhysics } from '../../physics';
import { SliderPhysicsEngine } from '../../physics/engine';
import { SliderRenderer } from '../../rendering';
import type { Sprite } from 'pixi.js';
import {
  createTestSprites,
  createTestPhysicsEngine,
  createTestRenderer,
  TEST_INTENSITIES,
  TEST_DIRECTIONS,
} from '../utils/test-factories';

// Test constants
const DEFAULT_PHYSICS_CONFIG = {
  transitionDuration: 1.0,
  swipeThreshold: 50,
  scaleIntensity: 0.1,
  dampingFactor: 0.8,
  transitionEase: 'power2.out',
  momentumDamping: 0.95,
};

const ANIMATION_DURATION = {
  STANDARD: 1.0,
  FAST: 0.3,
};

const testConfig = {
  slideCount: 3,
  slideWidth: 400,
  container: document.createElement('div'),
};

describe('SliderPhysics Facade Unit Tests', () => {
  let facade: SliderPhysics;
  let mockEngine: SliderPhysicsEngine;
  let mockRenderer: SliderRenderer;
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
    };

    // Create mocked dependencies for unit testing
    mockEngine = createTestPhysicsEngine();
    vi.spyOn(mockEngine, 'setConfig').mockImplementation(() => {});
    vi.spyOn(mockEngine, 'getConfig').mockReturnValue(DEFAULT_PHYSICS_CONFIG);
    vi.spyOn(mockEngine, 'calculateTransition').mockReturnValue({
      hideSprites: [0, 2],
      targetSprite: {
        index: 1,
        initialState: { visible: true, alpha: 0, scale: 1.1 },
        finalState: { alpha: 1, scale: 1 },
        duration: ANIMATION_DURATION.STANDARD,
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
        duration: ANIMATION_DURATION.STANDARD,
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

    // Create mocked renderer
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

    // Create facade with dependency injection (unit test style)
    facade = new SliderPhysics(testConfig, mockEngine, mockRenderer);
  });

  afterEach(() => {
    try {
      facade.destroy();
    } catch {
      // Ignore cleanup errors in tests
    }
    vi.restoreAllMocks();
  });

  describe('Facade API and Delegation', () => {
    it('should delegate getPhysicsConfig to engine', () => {
      const config = facade.getPhysicsConfig();

      expect(mockEngine.getConfig).toHaveBeenCalled();
      expect(config).toEqual(DEFAULT_PHYSICS_CONFIG);
    });

    it('should delegate setPhysicsConfig to engine', () => {
      const newConfig = {
        transitionDuration: 1.5,
        swipeThreshold: 60,
      };

      facade.setPhysicsConfig(newConfig);

      expect(mockEngine.setConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should delegate performance stats to renderer', () => {
      const stats = facade.getPerformanceStats();

      expect(mockRenderer.getPerformanceStats).toHaveBeenCalled();
      expect(stats).toEqual({
        activeTimelines: 0,
        activeTweens: 0,
        totalAnimations: 0,
      });
    });

    it('should delegate cleanup to renderer', () => {
      facade.cleanup();

      expect(mockRenderer.cleanup).toHaveBeenCalled();
    });

    it('should delegate killAllAnimations to renderer', () => {
      facade.killAllAnimations();

      expect(mockRenderer.killAllAnimations).toHaveBeenCalled();
    });
  });

  describe('Animation Coordination Logic', () => {
    it('should coordinate transition animation between engine and renderer', () => {
      const timeline = facade.animateTransition(0, 1, mockSprites);

      // Should delegate calculation to engine
      expect(mockEngine.calculateTransition).toHaveBeenCalledWith(0, 1, 3);

      // Should delegate rendering to renderer with engine result
      expect(mockRenderer.applyTransition).toHaveBeenCalledWith(
        mockSprites,
        expect.objectContaining({
          hideSprites: [0, 2],
          targetSprite: expect.objectContaining({
            index: 1,
          }),
        })
      );

      expect(timeline).toBeDefined();
    });

    it('should coordinate swipe animation between engine and renderer', () => {
      const sprite = mockSprites[0];
      const timeline = facade.animateSwipe(sprite, TEST_DIRECTIONS.right, TEST_INTENSITIES.medium);

      // Should delegate calculation to engine
      expect(mockEngine.calculateSwipe).toHaveBeenCalledWith(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );

      // Should delegate rendering to renderer with engine result
      expect(mockRenderer.applySwipe).toHaveBeenCalledWith(
        sprite,
        expect.objectContaining({
          initialPhase: expect.objectContaining({
            movement: 50,
            scale: 1.05,
          }),
        })
      );

      expect(timeline).toBeDefined();
    });

    it('should coordinate scale animation between engine and renderer', () => {
      const sprite = mockSprites[0];
      const timeline = facade.animateScale(sprite, 1.5);

      // Should delegate calculation to engine
      expect(mockEngine.calculateScale).toHaveBeenCalledWith(
        1.5,
        undefined
      );

      // Should delegate rendering to renderer with engine result
      expect(mockRenderer.applyScale).toHaveBeenCalledWith(
        sprite,
        expect.objectContaining({
          targetScale: 1.5,
          duration: ANIMATION_DURATION.STANDARD,
        })
      );

      expect(timeline).toBeDefined();
    });
  });

  describe('Sprite Management Logic', () => {
    it('should manage sprite array and delegate to renderer', () => {
      facade.markSpritesForGSAP(mockSprites);

      expect(mockRenderer.markSpritesForGSAP).toHaveBeenCalledWith(mockSprites);
    });

    it('should handle sprite addition for swipe animations', () => {
      const newSprite = createTestSprites(1)[0];
      
      // Should handle sprite not in managed array
      const timeline = facade.animateSwipe(newSprite, TEST_DIRECTIONS.right, TEST_INTENSITIES.medium);
      
      expect(timeline).toBeDefined();
      expect(mockRenderer.markSpritesForGSAP).toHaveBeenCalled();
    });

    it('should coordinate batch animations with renderer', () => {
      const animations = [
        { spriteIndex: 0, props: { alpha: 0.5 } },
        { spriteIndex: 1, props: { scale: 1.2 } },
      ];

      const timeline = facade.applyBatchAnimations(mockSprites, animations);

      expect(mockRenderer.applyBatchAnimations).toHaveBeenCalledWith(mockSprites, animations);
      expect(timeline).toBeDefined();
    });
  });

  describe('Advanced Delegation Methods', () => {
    it('should delegate shouldTriggerSlideChange to kinetic physics', () => {
      const result = facade.shouldTriggerSlideChange(100, 0.5);

      // This uses kinetics, not engine, but facade should handle the delegation
      expect(result).toBe(true);
    });

    it('should delegate calculateAdaptiveTiming to engine', () => {
      const result = facade.calculateAdaptiveTiming(500, 0.8);

      expect(mockEngine.calculateAdaptiveTiming).toHaveBeenCalledWith(500, 0.8);
      expect(result).toBe(0.8);
    });

    it('should handle momentum calculations through kinetic physics', () => {
      const momentum = facade.calculateMomentum(10, 100, 200);
      
      // Should return a momentum result
      expect(momentum).toBeDefined();
      expect(typeof momentum.velocity).toBe('number');
    });

    it('should handle spring calculations through spring physics', () => {
      const spring = facade.calculateSpring(50, 0, 5);
      
      // Should return a spring result  
      expect(spring).toBeDefined();
      expect(typeof spring.targetPosition).toBe('number');
    });
  });

  describe('Facade State Management', () => {
    it('should initialize with proper dependencies', () => {
      expect(facade).toBeDefined();
      expect(facade.getPhysicsConfig).toBeDefined();
      expect(facade.animateTransition).toBeDefined();
    });

    it('should handle configuration correctly during injection', () => {
      // Config should not be set on injected engine (unit test scenario)
      const configWithPhysics = {
        ...testConfig,
        physicsConfig: { transitionDuration: 2.0 }
      };
      
      const physicsWithConfig = new SliderPhysics(configWithPhysics, mockEngine, mockRenderer);
      
      // Should not call setConfig since engine was injected
      expect(mockEngine.setConfig).not.toHaveBeenCalled();
      
      physicsWithConfig.destroy();
    });

    it('should handle sprite management correctly', () => {
      const newSprites = createTestSprites(5);
      facade.setSprites(newSprites);
      
      // Should delegate marking to renderer
      expect(mockRenderer.markSpritesForGSAP).toHaveBeenCalledWith(newSprites);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle edge cases in transition animation', () => {
      const timeline1 = facade.animateTransition(-1, 10, mockSprites);
      const timeline2 = facade.animateTransition(0, 0, []);
      
      expect(timeline1).toBeDefined();
      expect(timeline2).toBeDefined();
      expect(mockEngine.calculateTransition).toHaveBeenCalledTimes(2);
    });

    it('should handle edge cases in swipe animation', () => {
      const sprite = mockSprites[0];
      const timeline1 = facade.animateSwipe(sprite, 999, TEST_INTENSITIES.zero);
      const timeline2 = facade.animateSwipe(sprite, TEST_DIRECTIONS.left, -5);
      
      expect(timeline1).toBeDefined();
      expect(timeline2).toBeDefined();
      expect(mockEngine.calculateSwipe).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple cleanup calls gracefully', () => {
      facade.cleanup();
      facade.cleanup();
      
      expect(mockRenderer.cleanup).toHaveBeenCalledTimes(2);
    });
  });
}); 