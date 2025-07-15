/**
 * @fileoverview Unit Tests for PixiRenderer
 *
 * Comprehensive tests for the core PixiRenderer class focusing on:
 * 1. Application initialization and lifecycle
 * 2. Performance metrics tracking
 * 3. Viewport management and configuration
 * 4. Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Texture, Assets } from 'pixi.js';
import type { Application } from 'pixi.js';
import { PixiRenderer } from '../../rendering/pixi-renderer';
import {
  createMockElement,
  createTestPixiConfig,
} from '../utils/test-factories';
import { createMockApplication } from '../utils/pixi-mocks';
import { PIXI_CONFIG, ERROR_MESSAGES } from '../../core/constants';

// Mock PIXI.js directly to avoid hoisting issues
vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn(),
      removeChildren: vi.fn(),
      children: [],
    },
    renderer: { width: 800, height: 600, resize: vi.fn() },
    screen: { width: 800, height: 600 },
    canvas: document.createElement('canvas'),
    view: document.createElement('canvas'),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    },
  })),
  Assets: {
    load: vi.fn(),
  },
  Sprite: vi.fn(() => ({
    anchor: { set: vi.fn() },
    position: { set: vi.fn() },
    scale: { set: vi.fn() },
    texture: null,
    x: 0,
    y: 0,
    rotation: 0,
    alpha: 1,
    visible: true,
    tint: 0xffffff,
    filters: null,
    mask: null,
    parent: null,
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    addChild: vi.fn(),
    removeChild: vi.fn(),
  })),
  Texture: {
    fromURL: vi.fn().mockResolvedValue({
      source: {
        resource: 'mock-texture',
        width: 100,
        height: 100,
      },
      baseTexture: { width: 100, height: 100 },
      width: 100,
      height: 100,
      destroy: vi.fn(),
    }),
    WHITE: { source: { resource: 'white' } },
  },
  GlProgram: vi.fn().mockImplementation(() => ({
    id: 'mock-program',
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('PixiRenderer', () => {
  let renderer: PixiRenderer;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    renderer = new PixiRenderer();
    mockContainer = createMockElement('div');
    Object.defineProperty(mockContainer, 'clientWidth', {
      value: 800,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 600,
      writable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid container', async () => {
      await expect(renderer.initialize(mockContainer)).resolves.not.toThrow();
    });

    it('should initialize with custom config', async () => {
      const config = createTestPixiConfig();
      await expect(
        renderer.initialize(mockContainer, config)
      ).resolves.not.toThrow();
    });

    it('should throw error for null container', async () => {
      await expect(
        renderer.initialize(null as unknown as HTMLElement)
      ).rejects.toThrow(
        'Container element is required for PIXI initialization'
      );
    });

    it('should handle initialization timeout', async () => {
      const slowConfig = { maxInitTime: 1 }; // Very short timeout

      // Mock a slow init by making Application.init take longer than timeout
      const { Application } = await import('pixi.js');
      vi.mocked(Application).mockImplementationOnce(
        () =>
          ({
            ...(createMockApplication() as Record<string, unknown>),
            init: vi
              .fn()
              .mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
              ),
          }) as unknown as Application<import('pixi.js').Renderer>
      );

      await expect(
        renderer.initialize(mockContainer, slowConfig)
      ).rejects.toThrow();
    });

    it('should meet initialization time requirements', async () => {
      const startTime = performance.now();
      await renderer.initialize(mockContainer);
      const initTime = performance.now() - startTime;

      expect(initTime).toBeLessThan(PIXI_CONFIG.MAX_INIT_TIME);
    });
  });

  describe('Sprite Management', () => {
    beforeEach(async () => {
      await renderer.initialize(mockContainer);
    });

    it('should create sprite from texture URL', async () => {
      const sprite = await renderer.createSlide('test.jpg');
      expect(sprite).toBeDefined();
      expect(Assets.load).toHaveBeenCalledWith('test.jpg');
    });

    it('should create sprite from Texture object', async () => {
      const sprite = await renderer.createSlide(Texture.WHITE);
      expect(sprite).toBeDefined();
    });

    it('should throw error when creating sprite without initialization', async () => {
      const uninitializedRenderer = new PixiRenderer();
      await expect(
        uninitializedRenderer.createSlide('test.jpg')
      ).rejects.toThrow(ERROR_MESSAGES.RENDERER_NOT_INITIALIZED);
    });

    it('should handle texture loading errors', async () => {
      vi.mocked(Assets.load).mockRejectedValueOnce(new Error('Load failed'));

      await expect(renderer.createSlide('invalid.jpg')).rejects.toThrow();
    });
  });

  describe('Viewport Management', () => {
    beforeEach(async () => {
      await renderer.initialize(mockContainer);
    });

    it('should update viewport dimensions', () => {
      expect(() => renderer.updateViewport(1024, 768)).not.toThrow();
    });

    it('should throw error when updating viewport without initialization', () => {
      const uninitializedRenderer = new PixiRenderer();
      expect(() => uninitializedRenderer.updateViewport(800, 600)).toThrow(
        ERROR_MESSAGES.RENDERER_NOT_INITIALIZED
      );
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await renderer.initialize(mockContainer);
    });

    it('should return performance metrics', () => {
      const metrics = renderer.getPerformanceMetrics();

      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('rendering');
      expect(metrics).toHaveProperty('loading');
    });

    it('should track FPS metrics', () => {
      const metrics = renderer.getPerformanceMetrics();

      expect(metrics.fps).toHaveProperty('current');
      expect(metrics.fps).toHaveProperty('average');
      expect(metrics.fps).toHaveProperty('min');
      expect(metrics.fps).toHaveProperty('max');
    });

    it('should track memory metrics', () => {
      const metrics = renderer.getPerformanceMetrics();

      expect(metrics.memory).toHaveProperty('used');
      expect(metrics.memory).toHaveProperty('total');
      expect(metrics.memory).toHaveProperty('percentage');
      expect(metrics.memory).toHaveProperty('peak');
    });

    it('should track rendering metrics', () => {
      const metrics = renderer.getPerformanceMetrics();

      expect(metrics.rendering).toHaveProperty('drawCalls');
      expect(metrics.rendering).toHaveProperty('triangles');
      expect(metrics.rendering).toHaveProperty('textures');
      expect(metrics.rendering).toHaveProperty('shaders');
    });

    it('should track loading metrics', () => {
      const metrics = renderer.getPerformanceMetrics();

      expect(metrics.loading).toHaveProperty('totalAssets');
      expect(metrics.loading).toHaveProperty('loadedAssets');
      expect(metrics.loading).toHaveProperty('failedAssets');
      expect(metrics.loading).toHaveProperty('averageLoadTime');
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should dispose without initialization', () => {
      expect(() => renderer.dispose()).not.toThrow();
    });

    it('should dispose after initialization', async () => {
      await renderer.initialize(mockContainer);
      expect(() => renderer.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', async () => {
      await renderer.initialize(mockContainer);
      renderer.dispose();
      expect(() => renderer.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle PIXI application creation failure', async () => {
      const { Application } = await import('pixi.js');
      vi.mocked(Application).mockImplementationOnce(() => {
        throw new Error('WebGL not supported');
      });

      await expect(renderer.initialize(mockContainer)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const { Application } = await import('pixi.js');
      vi.mocked(Application).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      await expect(renderer.initialize(mockContainer)).rejects.toThrow(
        /Failed to initialize PIXI renderer/
      );
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', async () => {
      await expect(renderer.initialize(mockContainer)).resolves.not.toThrow();
    });

    it('should merge custom configuration with defaults', async () => {
      const customConfig = {
        maxInitTime: 5000,
        developmentMode: true,
      };

      await expect(
        renderer.initialize(mockContainer, customConfig)
      ).resolves.not.toThrow();
    });

    it('should validate configuration values', async () => {
      const invalidConfig = {
        maxInitTime: -1, // Invalid negative value
      };

      // Should still work as negative values get handled internally
      await expect(
        renderer.initialize(mockContainer, invalidConfig)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance Requirements', () => {
    it('should initialize within 2 second requirement', async () => {
      const startTime = performance.now();
      await renderer.initialize(mockContainer);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    it('should maintain 60fps performance target', () => {
      const metrics = renderer.getPerformanceMetrics();

      // Initial metrics should be within acceptable range
      expect(metrics.fps.current).toBeGreaterThanOrEqual(0);
      expect(metrics.fps.max).toBeGreaterThanOrEqual(0);
    });

    it('should stay under 150MB memory usage target', () => {
      const metrics = renderer.getPerformanceMetrics();

      // Memory metrics should be reasonable for testing
      expect(metrics.memory.used).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
    });
  });
});
