/**
 * @fileoverview SliderRenderer Unit Tests - Unified Renderer Testing
 *
 * Tests for the unified PIXI.js SliderRenderer that implements ISliderRenderer.
 * Tests business logic and API contracts with proper PIXI mocking.
 *
 * TESTING STRATEGY:
 * - ✅ Configuration management and validation
 * - ✅ Business logic (positioning, scaling, sprite management)
 * - ✅ API contracts and error handling
 * - ✅ Resource management and cleanup
 * - ✅ PIXI integration without DOM dependencies
 *
 * @version 1.0.0 - Unified SliderRenderer Testing
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { SliderRenderer } from '../../rendering'; // Use unified renderer
import type { RenderConfig } from '../../core/types';
import { RENDERING, VIEWPORT } from '../../core';

// =============================================================================
// 🎯 Default Configuration for Testing
// =============================================================================

const DEFAULT_TEST_RENDER_CONFIG: RenderConfig = {
  width: VIEWPORT.DESKTOP.width,
  height: VIEWPORT.DESKTOP.height,
  backgroundColor: RENDERING.BACKGROUND_COLOR,
  antialias: RENDERING.ANTIALIAS,
  resolution: RENDERING.RESOLUTION,
};

// =============================================================================
// 🎯 PIXI.js Complete Mock
// =============================================================================

vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    canvas: {
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      clientWidth: 800,
      clientHeight: 600,
      width: 800,
      height: 600,
    },
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn(),
      removeChildren: vi.fn(),
      children: [],
    },
    renderer: {
      resize: vi.fn(),
      render: vi.fn(),
      destroy: vi.fn(),
    },
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    render: vi.fn(),
    view: { canvas: { style: {} } },
    screen: { width: 800, height: 600 },
    resizeTo: vi.fn(),
    resize: vi.fn(),
    stop: vi.fn(),
    start: vi.fn(),
  })),
  Sprite: vi.fn(() => ({
    texture: { width: 100, height: 100 },
    anchor: { set: vi.fn() },
    scale: { set: vi.fn(), x: 1, y: 1 },
    position: { set: vi.fn(), x: 0, y: 0 },
    x: 0,
    y: 0,
    visible: true,
    eventMode: 'auto',
    cursor: 'default',
    filters: [],
    destroy: vi.fn(),
  })),
  Assets: {
    init: vi.fn(),
    load: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  },
  Filter: vi.fn(() => ({
    enabled: true,
    uniforms: {},
  })),
  Texture: vi.fn(() => ({ width: 100, height: 100 })),
}));

// =============================================================================
// 🧪 Test Suite - Unified SliderRenderer
// =============================================================================

describe('SliderRenderer - Unified Implementation Tests', () => {
  let renderer: SliderRenderer;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Create mock container
    mockContainer = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      contains: vi.fn().mockReturnValue(true),
      clientWidth: 800,
      clientHeight: 600,
    } as unknown as HTMLElement;

    // Create renderer instance
    renderer = new SliderRenderer();
  });

  afterEach(() => {
    if (renderer) {
      renderer.destroy();
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await expect(
        renderer.initialize(mockContainer, DEFAULT_TEST_RENDER_CONFIG)
      ).resolves.not.toThrow();
    });

    it('should handle initialization with custom container', async () => {
      const customConfig: RenderConfig = {
        ...DEFAULT_TEST_RENDER_CONFIG,
        width: 1024,
        height: 768,
      };

      await expect(
        renderer.initialize(mockContainer, customConfig)
      ).resolves.not.toThrow();
    });
  });

  describe('Sprite Management', () => {
    beforeEach(async () => {
      await renderer.initialize(mockContainer, DEFAULT_TEST_RENDER_CONFIG);
    });

    it('should create sprites from image URLs', async () => {
      const imageUrl = 'test-image.jpg';
      const sprite = await renderer.createSprite(imageUrl, 0);

      expect(sprite).toBeDefined();
      expect(sprite.texture).toBeDefined();
    });

    it('should handle multiple sprite creation', async () => {
      const urls = ['image1.jpg', 'image2.jpg', 'image3.jpg'];

      for (let i = 0; i < urls.length; i++) {
        const sprite = await renderer.createSprite(urls[i], i);
        expect(sprite).toBeDefined();
      }
    });
  });

  describe('Animation Methods', () => {
    beforeEach(async () => {
      await renderer.initialize(mockContainer, DEFAULT_TEST_RENDER_CONFIG);
    });

    it('should apply transition animations', () => {
      const mockSequence = {
        targetSprite: {
          index: 0,
          duration: 0.5,
          ease: 'power2.out',
          initialState: { visible: true, alpha: 0, scale: 1 },
          finalState: { visible: true, alpha: 1, scale: 1 },
        },
        hideSprites: [] as number[],
      };

      expect(() => renderer.applyTransition([], mockSequence)).not.toThrow();
    });

    it('should apply swipe animations', () => {
      const mockSwipe = {
        initialPhase: {
          duration: 0.3,
          movement: 100,
          scale: 1,
        },
        springPhase: {
          duration: 0.3,
          movement: -50,
          scale: 1,
          ease: 'back.out(1.7)',
        },
      };

      const mockSprite = {
        x: 0,
        scale: { x: 1, y: 1 },
      } as unknown as import('pixi.js').Sprite;
      expect(() => renderer.applySwipe(mockSprite, mockSwipe)).not.toThrow();
    });

    it('should handle scale animations', () => {
      const mockScale = {
        targetScale: 1.5,
        duration: 0.5,
        ease: 'power2.out',
      };

      const mockSprite = {
        scale: { x: 1, y: 1 },
      } as unknown as import('pixi.js').Sprite;
      expect(() => renderer.applyScale(mockSprite, mockScale)).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    beforeEach(async () => {
      await renderer.initialize(mockContainer, DEFAULT_TEST_RENDER_CONFIG);
    });

    it('should kill all animations', () => {
      expect(() => renderer.killAllAnimations()).not.toThrow();
    });

    it('should provide performance stats', () => {
      const stats = renderer.getPerformanceStats();

      expect(stats).toHaveProperty('activeTimelines');
      expect(stats).toHaveProperty('activeTweens');
      expect(stats).toHaveProperty('totalAnimations');
      expect(typeof stats.activeTimelines).toBe('number');
      expect(typeof stats.activeTweens).toBe('number');
      expect(typeof stats.totalAnimations).toBe('number');
    });

    it('should cleanup resources properly', () => {
      expect(() => renderer.cleanup()).not.toThrow();
    });

    it('should destroy resources properly', () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const invalidConfig = {} as RenderConfig;

      // Should handle invalid config gracefully
      await expect(
        renderer.initialize(mockContainer, invalidConfig)
      ).resolves.not.toThrow();
    });

    it('should handle missing container gracefully', async () => {
      // Should throw an error for null container (proper error handling)
      await expect(
        renderer.initialize(
          null as unknown as HTMLElement,
          DEFAULT_TEST_RENDER_CONFIG
        )
      ).rejects.toThrow();
    });
  });
});
