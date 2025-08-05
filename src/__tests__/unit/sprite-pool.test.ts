/**
 * @fileoverview Unit Tests for SpritePool
 *
 * Comprehensive tests for the SpritePool class focusing on:
 * 1. Object pooling and sprite reuse
 * 2. Memory optimization and performance
 * 3. Pool size management and statistics
 * 4. Sprite lifecycle and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import { SpritePool } from '../../rendering/sprite-pool';
import { createTestSpritePoolConfig } from '../utils/test-factories';
import { SPRITE_POOL_CONSTANTS } from '../../core/constants';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
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
  })),
  Texture: {
    WHITE: {},
  },
}));

describe('SpritePool', () => {
  let spritePool: SpritePool;

  beforeEach(() => {
    spritePool = new SpritePool();
    vi.clearAllMocks();
  });

  afterEach(() => {
    spritePool.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const stats = spritePool.getStats();

      expect(stats.available).toBe(SPRITE_POOL_CONSTANTS.INITIAL_SIZE);
      expect(stats.inUse).toBe(0);
      expect(stats.total).toBe(SPRITE_POOL_CONSTANTS.INITIAL_SIZE);
    });

    it('should initialize with custom configuration', () => {
      const config = createTestSpritePoolConfig();
      const customPool = new SpritePool(config);

      const stats = customPool.getStats();
      expect(stats.available).toBe(config.initialSize);

      customPool.dispose();
    });

    it('should pre-populate pool with initial sprites', () => {
      const stats = spritePool.getStats();
      expect(stats.available).toBe(SPRITE_POOL_CONSTANTS.INITIAL_SIZE);
      expect(stats.total).toBe(SPRITE_POOL_CONSTANTS.INITIAL_SIZE);
    });
  });

  describe('Sprite Acquisition', () => {
    it('should return sprite from pool', () => {
      const sprite = spritePool.getSprite();

      expect(sprite).toBeDefined();
      expect(sprite).toBeInstanceOf(Object); // Mock sprite
    });

    it('should return sprite with texture when provided', () => {
      const texture = Texture.WHITE;
      const sprite = spritePool.getSprite(texture);

      expect(sprite).toBeDefined();
      expect(sprite.texture).toBe(texture);
    });

    it('should reduce available count when sprite is acquired', () => {
      const initialStats = spritePool.getStats();

      spritePool.getSprite();

      const afterStats = spritePool.getStats();
      expect(afterStats.available).toBe(initialStats.available - 1);
      expect(afterStats.inUse).toBe(initialStats.inUse + 1);
    });

    it('should create new sprite when pool is empty', () => {
      const config = { initialSize: 1, maxSize: 10 };
      const smallPool = new SpritePool(config);

      // Get the only sprite
      smallPool.getSprite();

      // This should create a new sprite
      const sprite2 = smallPool.getSprite();
      expect(sprite2).toBeDefined();

      smallPool.dispose();
    });

    it('should reuse returned sprites', () => {
      const sprite1 = spritePool.getSprite();
      spritePool.returnSprite(sprite1);

      const sprite2 = spritePool.getSprite();
      expect(sprite2).toBe(sprite1); // Should be the same reused sprite
    });
  });

  describe('Sprite Return', () => {
    it('should accept sprite back to pool', () => {
      const sprite = spritePool.getSprite();
      const beforeReturn = spritePool.getStats();

      spritePool.returnSprite(sprite);

      const afterReturn = spritePool.getStats();
      expect(afterReturn.available).toBe(beforeReturn.available + 1);
      expect(afterReturn.inUse).toBe(beforeReturn.inUse - 1);
    });

    it('should reset sprite properties when returned', () => {
      const sprite = spritePool.getSprite();

      // Modify sprite properties
      sprite.x = 100;
      sprite.y = 200;
      sprite.alpha = 0.5;
      sprite.visible = false;

      spritePool.returnSprite(sprite);

      // Properties should be reset
      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);
      expect(sprite.alpha).toBe(1);
      expect(sprite.visible).toBe(true);
    });

    it('should handle return of non-pool sprite gracefully', () => {
      const externalSprite = new Sprite();

      // Should not throw error
      expect(() => spritePool.returnSprite(externalSprite)).not.toThrow();
    });

    it('should dispose sprite when pool is at capacity', () => {
      const config = { initialSize: 1, maxSize: 1 };
      const smallPool = new SpritePool(config);

      // Fill the available pool to capacity first
      const sprite1 = smallPool.getSprite();
      smallPool.returnSprite(sprite1); // Now available = 1 (at maxSize)

      // Get sprite again and create a new one
      const sprite2 = smallPool.getSprite();
      smallPool.getSprite();

      // Return sprite2 - should be disposed since available pool is already at maxSize (1)
      smallPool.returnSprite(sprite2);

      // Pool should still be at capacity, sprite2 was disposed
      const stats = smallPool.getStats();
      expect(stats.available).toBe(1); // Available pool is at capacity
      expect(stats.inUse).toBe(1); // one sprite is still in use

      smallPool.dispose();
    });
  });

  describe('Pool Management', () => {
    it('should clear all sprites from pool', () => {
      spritePool.getSprite(); // Get one sprite

      spritePool.clear();

      const stats = spritePool.getStats();
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(0);
      expect(stats.total).toBe(0);
    });

    it('should resize pool capacity', () => {
      const newSize = 20;
      spritePool.resize(newSize);

      expect(() => spritePool.resize(newSize)).not.toThrow();
    });

    it('should throw error for invalid pool size', () => {
      expect(() => spritePool.resize(0)).toThrow(
        'Pool size must be at least 1'
      );
      expect(() => spritePool.resize(-1)).toThrow(
        'Pool size must be at least 1'
      );
    });

    it('should dispose excess sprites when reducing size', () => {
      const initialStats = spritePool.getStats();
      const smallerSize = Math.floor(initialStats.available / 2);

      spritePool.resize(smallerSize);

      const afterResize = spritePool.getStats();
      expect(afterResize.available).toBeLessThanOrEqual(smallerSize);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide basic statistics', () => {
      const stats = spritePool.getStats();

      expect(stats).toHaveProperty('available');
      expect(stats).toHaveProperty('inUse');
      expect(stats).toHaveProperty('total');
      expect(typeof stats.available).toBe('number');
      expect(typeof stats.inUse).toBe('number');
      expect(typeof stats.total).toBe('number');
    });

    it('should provide detailed statistics', () => {
      const detailedStats = spritePool.getDetailedStats();

      expect(detailedStats).toHaveProperty('available');
      expect(detailedStats).toHaveProperty('inUse');
      expect(detailedStats).toHaveProperty('total');
      expect(detailedStats).toHaveProperty('created');
      expect(detailedStats).toHaveProperty('reused');
      expect(detailedStats).toHaveProperty('peakUsage');
      expect(detailedStats).toHaveProperty('memoryEstimate');
    });

    it('should track peak usage correctly', () => {
      const sprites = [];

      // Get multiple sprites to increase usage
      for (let i = 0; i < 5; i++) {
        sprites.push(spritePool.getSprite());
      }

      const peakStats = spritePool.getDetailedStats();

      // Return all sprites
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));

      const finalStats = spritePool.getDetailedStats();
      expect(finalStats.peakUsage).toBe(peakStats.inUse);
    });

    it('should track created vs reused sprites', () => {
      const sprite1 = spritePool.getSprite();
      spritePool.returnSprite(sprite1);

      spritePool.getSprite(); // Should be reused

      const stats = spritePool.getDetailedStats();
      expect(stats.reused).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize pool by removing old sprites', () => {
      // Get and return some sprites to create metadata
      const sprites = [];
      for (let i = 0; i < 3; i++) {
        const sprite = spritePool.getSprite();
        sprites.push(sprite);
      }
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));

      const beforeOptimize = spritePool.getStats();
      spritePool.optimize();
      const afterOptimize = spritePool.getStats();

      // Optimization might reduce available sprites
      expect(afterOptimize.available).toBeLessThanOrEqual(
        beforeOptimize.available
      );
    });

    it('should maintain minimum pool size during optimization', () => {
      const config = { initialSize: 5, maxSize: 20, shrinkThreshold: 0.1 };
      const optimizedPool = new SpritePool(config);

      optimizedPool.optimize();

      const stats = optimizedPool.getStats();
      expect(stats.available).toBeGreaterThanOrEqual(config.initialSize);

      optimizedPool.dispose();
    });
  });

  describe('Memory Management', () => {
    it('should estimate memory usage', () => {
      const stats = spritePool.getDetailedStats();

      expect(stats.memoryEstimate).toBeGreaterThan(0);
      expect(typeof stats.memoryEstimate).toBe('number');
    });

    it('should track memory usage as pool grows', () => {
      const initialStats = spritePool.getDetailedStats();

      // Force pool to grow by getting more sprites than available
      const sprites = [];
      for (let i = 0; i < initialStats.available + 5; i++) {
        sprites.push(spritePool.getSprite());
      }

      const grownStats = spritePool.getDetailedStats();
      expect(grownStats.memoryEstimate).toBeGreaterThan(
        initialStats.memoryEstimate
      );

      // Cleanup
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));
    });
  });

  describe('Error Handling', () => {
    it('should handle sprite disposal errors gracefully', () => {
      const sprite = spritePool.getSprite();

      // Mock sprite destroy to throw error
      sprite.destroy = vi.fn(() => {
        throw new Error('Dispose error');
      });

      // Should not throw when clearing
      expect(() => spritePool.clear()).not.toThrow();
    });

    it('should handle invalid sprite returns', () => {
      const invalidSprite = {} as import('pixi.js').Sprite;

      expect(() => spritePool.returnSprite(invalidSprite)).not.toThrow();
    });
  });

  describe('Disposal and Cleanup', () => {
    it('should dispose without errors', () => {
      expect(() => spritePool.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      spritePool.dispose();
      expect(() => spritePool.dispose()).not.toThrow();
    });

    it('should clear all resources on disposal', () => {
      spritePool.getSprite(); // Create some usage

      spritePool.dispose();

      const stats = spritePool.getStats();
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(0);
      expect(stats.total).toBe(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should provide sprites quickly', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const sprite = spritePool.getSprite();
        spritePool.returnSprite(sprite);
      }

      const duration = performance.now() - startTime;
      const averageTime = duration / iterations;

      // Should be very fast (less than 1ms per operation)
      expect(averageTime).toBeLessThan(1);
    });

    it('should handle high concurrency efficiently', () => {
      const sprites: Array<import('pixi.js').Sprite> = [];
      const startTime = performance.now();

      // Get many sprites quickly
      for (let i = 0; i < 50; i++) {
        sprites.push(spritePool.getSprite());
      }

      // Return them all
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));

      const duration = performance.now() - startTime;

      // Should complete quickly even with many operations
      expect(duration).toBeLessThan(100);
    });

    it('should maintain consistent performance as pool grows', () => {
      const measurements: number[] = [];

      // Measure performance at different pool sizes
      for (let poolSize = 10; poolSize <= 100; poolSize += 10) {
        spritePool.resize(poolSize);

        const startTime = performance.now();
        const sprite = spritePool.getSprite();
        spritePool.returnSprite(sprite);
        const duration = performance.now() - startTime;

        measurements.push(duration);
      }

      // Performance should not degrade significantly with size
      const maxTime = Math.max(...measurements);
      const minTime = Math.min(...measurements);
      const ratio = maxTime / minTime;

      // More lenient threshold for CI environments where performance can vary
      const threshold = process.env.CI ? 20 : 10;
      expect(ratio).toBeLessThan(threshold);
    });
  });
});
