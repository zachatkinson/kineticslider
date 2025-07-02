/**
 * @fileoverview Unified SliderRenderer Integration Tests
 *
 * Integration tests for the unified PIXI.js SliderRenderer that coordinates
 * real animation capabilities with GSAP integration. Tests actual renderer behavior.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SliderRenderer } from '../../rendering';
import { createTestSprites, createTestRenderer, cleanupRenderer } from '../utils/test-factories';
import type { AnimationSequence, SwipeAnimation, ScaleAnimation } from '../../physics/engine';
import { EASING } from '../../core/constants';
import type { Sprite } from 'pixi.js';

describe('SliderRenderer Integration', () => {
  let renderer: SliderRenderer;
  let mockSprites: Sprite[];

  beforeEach(async () => {
    mockSprites = createTestSprites(5);
    renderer = createTestRenderer();
  });

  afterEach(() => {
    cleanupRenderer(renderer);
  });

  describe('Transition Animation Application', () => {
    it('should apply transition sequence to real sprites', async () => {
      const sequence: AnimationSequence = {
        hideSprites: [0, 2, 3, 4],
        targetSprite: {
          index: 1,
          initialState: {
            visible: true,
            alpha: 0,
            scale: 1,
          },
          finalState: {
            alpha: 1,
            scale: 1,
          },
          duration: 0.8,
          ease: EASING.EASE_OUT,
        },
      };

      const timeline = renderer.applyTransition(mockSprites, sequence);
      expect(timeline).toBeDefined();
      expect(timeline.duration()).toBeGreaterThan(0);
    });

    it('should handle source sprite exit animation', () => {
      const sequence: AnimationSequence = {
        hideSprites: [0, 1, 3, 4],
        targetSprite: {
          index: 2,
          initialState: {
            visible: true,
            alpha: 0,
            scale: 1,
          },
          finalState: {
            alpha: 1,
            scale: 1,
          },
          duration: 0.8,
          ease: EASING.EASE_OUT,
        },
        sourceSprite: {
          index: 0,
          finalState: {
            alpha: 0,
            scale: 0.9,
            visible: false,
          },
          duration: 0.8,
          ease: EASING.EASE_IN,
        },
      };

      const timeline = renderer.applyTransition(mockSprites, sequence);
      expect(timeline).toBeDefined();
    });

    it('should apply target sprite animation correctly', () => {
      const sequence: AnimationSequence = {
        hideSprites: [0, 1, 2, 4],
        targetSprite: {
          index: 3,
          initialState: {
            visible: true,
            alpha: 0,
            scale: 1,
          },
          finalState: {
            alpha: 1,
            scale: 1,
          },
          duration: 0.8,
          ease: EASING.EASE_OUT,
        },
      };

      const timeline = renderer.applyTransition(mockSprites, sequence);
      expect(timeline.duration()).toBeGreaterThan(0);
    });
  });

  describe('Animation Integration', () => {
    it('should handle swipe animations', () => {
      const swipeAnim: SwipeAnimation = {
        initialPhase: {
          movement: 50,
          scale: 1.1,
          duration: 0.2,
        },
        springPhase: {
          movement: -42.5,
          scale: 1.0,
          duration: 0.8,
          ease: EASING.ELASTIC,
        },
      };

      const timeline = renderer.applySwipe(mockSprites[0], swipeAnim);
      expect(timeline).toBeDefined();
    });

    it('should handle scale animations', () => {
      const scaleAnim: ScaleAnimation = {
        targetScale: 1.2,
        duration: 0.6,
        ease: EASING.EASE_OUT,
      };

      const timeline = renderer.applyScale(mockSprites[0], scaleAnim);
      expect(timeline).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should provide performance stats', () => {
      const stats = renderer.getPerformanceStats();
      expect(stats).toHaveProperty('activeTimelines');
      expect(stats).toHaveProperty('activeTweens');
      expect(stats).toHaveProperty('totalAnimations');
    });

    it('should cleanup animations', () => {
      // Create some animations first
      renderer.applySwipe(mockSprites[0], {
        initialPhase: {
          movement: 50,
          scale: 1.1,
          duration: 0.2,
        },
        springPhase: {
          movement: -42.5,
          scale: 1.0,
          duration: 0.8,
          ease: EASING.ELASTIC,
        },
      });

      // Kill all animations
      renderer.killAllAnimations();

      const stats = renderer.getPerformanceStats();
      expect(stats.activeTimelines).toBe(0);
      expect(stats.activeTweens).toBe(0);
    });
  });
});
