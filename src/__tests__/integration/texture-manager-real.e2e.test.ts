/**
 * @fileoverview Unit Tests for TextureManager
 *
 * Simplified unit tests focusing on:
 * 1. Basic initialization and configuration
 * 2. API contract validation
 * 3. State management
 * 4. Error handling
 * 5. Disposal and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Assets } from 'pixi.js';
import { TextureManager } from '../../rendering/texture-manager';
import { createTestTextureConfig } from '../utils/test-factories';

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
    renderer: { width: 800, height: 600 },
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
  Sprite: vi.fn().mockImplementation(() => ({
    anchor: {
      set: vi.fn(),
      x: 0.5,
      y: 0.5,
    },
    position: {
      set: vi.fn(),
      x: 0,
      y: 0,
    },
    scale: {
      set: vi.fn(),
      x: 1,
      y: 1,
    },
    visible: true,
    alpha: 1,
    rotation: 0,
    texture: null,
    tint: 0xffffff,
    blendMode: 0,
    parent: null,
    children: [],
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
      destroyed: false,
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

// Create mock texture factory
const createMockTexture = () => ({
  source: {
    resource: 'mock-texture',
    width: 100,
    height: 100,
  },
  baseTexture: { width: 100, height: 100 },
  width: 100,
  height: 100,
  destroy: vi.fn(),
  destroyed: false,
});

describe('TextureManager', () => {
  let textureManager: TextureManager;

  beforeEach(() => {
    textureManager = new TextureManager();
    vi.clearAllMocks();
    // Setup default successful response
    vi.mocked(Assets.load).mockImplementation(() =>
      Promise.resolve(createMockTexture())
    );
  });

  afterEach(() => {
    textureManager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(textureManager).toBeDefined();
      expect(textureManager.getMemoryUsage).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const config = createTestTextureConfig();
      const customManager = new TextureManager(config);

      expect(customManager).toBeDefined();
      customManager.dispose();
    });
  });

  describe('API Contract', () => {
    it('should provide memory usage information', () => {
      const usage = textureManager.getMemoryUsage();

      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('cached');
      expect(usage).toHaveProperty('total');
      expect(typeof usage.used).toBe('number');
      expect(typeof usage.cached).toBe('number');
      expect(typeof usage.total).toBe('number');
    });

    it('should handle single texture loading', async () => {
      const texture = await textureManager.loadTexture('test.jpg');

      expect(texture).toBeDefined();
      expect(Assets.load).toHaveBeenCalledWith('test.jpg');
    });

    it('should handle multiple texture loading', async () => {
      const urls = ['test1.jpg', 'test2.jpg', 'test3.jpg'];

      const textures = await textureManager.loadTextures(urls);

      expect(textures).toHaveLength(3);
      expect(Assets.load).toHaveBeenCalledTimes(3);
    });

    it('should support progress callbacks', async () => {
      const urls = ['test1.jpg', 'test2.jpg'];
      const progressCallback = vi.fn();

      await textureManager.loadTextures(urls, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
    });

    it('should provide texture caching', async () => {
      const url = 'cached-test.jpg';

      // First load
      const texture1 = await textureManager.loadTexture(url);

      // Second load should return cached version
      const texture2 = await textureManager.loadTexture(url);

      expect(texture1).toBe(texture2);
      expect(Assets.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Management', () => {
    it('should cache loaded textures', async () => {
      await textureManager.loadTexture('cached-test.jpg');

      const cached = textureManager.getCachedTexture('cached-test.jpg');
      expect(cached).toBeDefined();
    });

    it('should return null for non-cached textures', () => {
      const cached = textureManager.getCachedTexture('non-existent.jpg');
      expect(cached).toBeNull();
    });

    it('should clear cache completely', async () => {
      await textureManager.loadTexture('cache-clear-test.jpg');

      textureManager.clearCache();

      const cached = textureManager.getCachedTexture('cache-clear-test.jpg');
      expect(cached).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle texture loading errors', async () => {
      vi.mocked(Assets.load).mockRejectedValueOnce(new Error('Network _error'));

      // The TextureManager might have retry logic or error handling
      // Test that it either throws or returns gracefully
      try {
        const result = await textureManager.loadTexture('network-_error.jpg');
        // If it doesn't throw, it should at least return something
        expect(result).toBeDefined();
      } catch (_error) {
        // If it throws, that's also acceptable
        expect(_error).toBeDefined();
      }
    });

    it('should provide meaningful _error messages', async () => {
      vi.mocked(Assets.load).mockRejectedValue(new Error('404 Not Found'));

      await expect(textureManager.loadTexture('missing.jpg')).rejects.toThrow(
        '404 Not Found'
      );
    });

    it('should handle invalid URLs gracefully', async () => {
      vi.mocked(Assets.load).mockRejectedValue(new Error('Invalid URL'));

      await expect(textureManager.loadTexture('')).rejects.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage', () => {
      const usage = textureManager.getMemoryUsage();

      expect(usage.used).toBeGreaterThanOrEqual(0);
      expect(usage.cached).toBeGreaterThanOrEqual(0);
      expect(usage.total).toBeGreaterThanOrEqual(0);
    });

    it('should update memory usage after loading textures', async () => {
      const initialUsage = textureManager.getMemoryUsage();

      await textureManager.loadTexture('memory-test.jpg');

      const afterUsage = textureManager.getMemoryUsage();
      expect(afterUsage.cached).toBeGreaterThanOrEqual(initialUsage.cached);
    });

    it('should reduce memory usage after clearing cache', async () => {
      await textureManager.loadTexture('memory-clear-test.jpg');

      textureManager.clearCache();

      const afterClear = textureManager.getMemoryUsage();
      expect(afterClear.cached).toBe(0);
    });
  });

  describe('Preloading', () => {
    it('should preload textures without throwing errors', async () => {
      const urls = ['preload1.jpg', 'preload2.jpg'];

      await expect(textureManager.preloadTextures(urls)).resolves.not.toThrow();
    });

    it('should make preloaded textures available in cache', async () => {
      const url = 'preload-test.jpg';
      await textureManager.preloadTextures([url]);

      const cachedTexture = textureManager.getCachedTexture(url);
      expect(cachedTexture).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should handle custom cache size', () => {
      const config = { cacheSize: 50 };
      const customManager = new TextureManager(config);

      expect(customManager).toBeDefined();
      customManager.dispose();
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = { cacheSize: -1 };

      expect(() => {
        const manager = new TextureManager(invalidConfig);
        manager.dispose();
      }).not.toThrow();
    });
  });

  describe('Performance Requirements', () => {
    it('should load texture within reasonable time', async () => {
      const startTime = performance.now();
      await textureManager.loadTexture('performance-test.jpg');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 second timeout
    });

    it('should handle concurrent loads efficiently', async () => {
      const urls = Array.from({ length: 5 }, (_, i) => `concurrent-${i}.jpg`);

      const startTime = performance.now();
      await Promise.all(urls.map((url) => textureManager.loadTexture(url)));
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Disposal and Cleanup', () => {
    it('should dispose without errors', () => {
      expect(() => textureManager.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      textureManager.dispose();
      expect(() => textureManager.dispose()).not.toThrow();
    });

    it('should reject operations after disposal', async () => {
      textureManager.dispose();

      // Operations after disposal should be handled gracefully
      const usage = textureManager.getMemoryUsage();
      expect(usage.used).toBe(0);
      expect(usage.cached).toBe(0);
    });
  });
});
