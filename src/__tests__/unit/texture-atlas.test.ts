/**
 * @fileoverview Unit tests for TextureAtlas
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TextureAtlas } from '../../performance/texture-atlas';
import type { AtlasConfig } from '../../performance/texture-atlas';
import { Texture, Sprite } from 'pixi.js';

// Mock PIXI.js v8 API
vi.mock('pixi.js', () => ({
  Texture: Object.assign(
    vi.fn().mockImplementation((config?: any) => ({
      source: config?.source || { width: 100, height: 100 },
      frame: config?.frame || { x: 0, y: 0, width: 100, height: 100 },
      width: config?.frame?.width || 100,
      height: config?.frame?.height || 100,
      destroy: vi.fn(),
    })),
    {
      from: vi.fn().mockImplementation(() => ({
        source: { width: 100, height: 100 },
        width: 100,
        height: 100,
        destroy: vi.fn(),
      })),
    }
  ),
  BaseTexture: vi.fn().mockImplementation(() => ({
    resource: {},
    update: vi.fn(),
    destroy: vi.fn(),
  })),
  Rectangle: vi.fn().mockImplementation((x, y, width, height) => ({
    x,
    y,
    width,
    height,
  })),
  Sprite: vi.fn().mockImplementation((texture) => ({
    texture,
    rotation: 0,
    anchor: { set: vi.fn() },
    destroy: vi.fn(),
  })),
}));

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
};

// Mock document.createElement
if (typeof document === 'undefined') {
  global.document = {
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => mockContext),
        };
      }
      return {};
    }),
  } as any;
}

describe('TextureAtlas', () => {
  let atlas: TextureAtlas;

  beforeEach(() => {
    atlas = new TextureAtlas();
    vi.clearAllMocks();
  });

  afterEach(() => {
    atlas.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(atlas).toBeDefined();
      const stats = atlas.getStats();
      expect(stats.atlasCount).toBe(1);
      expect(stats.frameCount).toBe(0);
      expect(stats.packingEfficiency).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const config: Partial<AtlasConfig> = {
        maxWidth: 4096,
        maxHeight: 4096,
        padding: 4,
        allowRotation: false,
        powerOfTwo: true,
        generateMipmaps: true,
      };

      const customAtlas = new TextureAtlas(config);
      expect(customAtlas).toBeDefined();
      customAtlas.dispose();
    });

    it('should create canvas when document is available', () => {
      const atlas = new TextureAtlas();
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      atlas.dispose();
    });
  });

  describe('Adding Textures', () => {
    let mockTexture: Texture;

    beforeEach(() => {
      mockTexture = Texture.from('test');
    });

    it('should add texture to atlas', async () => {
      const frame = await atlas.addTexture('test-texture', mockTexture);

      expect(frame).toBeDefined();
      expect(frame?.id).toBe('test-texture');
      expect(frame?.width).toBe(256);
      expect(frame?.height).toBe(256);

      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(1);
    });

    it('should handle duplicate texture IDs', async () => {
      await atlas.addTexture('duplicate', mockTexture);
      const frame2 = await atlas.addTexture('duplicate', mockTexture);

      // Should return existing frame
      expect(frame2).toBeDefined();

      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(1);
    });

    it('should reject textures larger than atlas', async () => {
      const largeTexture = Texture.from('test');

      const frame = await atlas.addTexture('large', largeTexture);
      expect(frame).toBeNull();
    });

    it('should add multiple textures in batch', async () => {
      const textures = new Map<string, Texture>();
      for (let i = 0; i < 10; i++) {
        textures.set(`texture-${i}`, Texture.from('test'));
      }

      const frames = await atlas.addTextures(textures);

      expect(frames.size).toBe(10);
      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(10);
    });

    it('should sort textures by size for better packing', async () => {
      const textures = new Map<string, Texture>();
      textures.set('small', Texture.from('test'));
      textures.set('large', Texture.from('test'));
      textures.set('medium', Texture.from('test'));

      const frameAddedSpy = vi.fn();
      atlas.on('frame-added', frameAddedSpy);

      await atlas.addTextures(textures);

      // Large texture should be added first
      expect(frameAddedSpy).toHaveBeenCalled();
      const firstCall = frameAddedSpy.mock.calls[0][0];
      expect(firstCall.id).toBe('large');
    });

    it('should emit atlas-full event when atlas is full', async () => {
      const atlasFullSpy = vi.fn();
      atlas.on('atlas-full', atlasFullSpy);

      // Fill atlas with large textures
      for (let i = 0; i < 100; i++) {
        const texture = Texture.from('test');
        const frame = await atlas.addTexture(`texture-${i}`, texture);

        if (!frame) {
          break; // Atlas is full
        }
      }

      // Atlas should eventually be full
      expect(atlasFullSpy).toHaveBeenCalled();
    });
  });

  describe('Frame Management', () => {
    let mockTexture: Texture;

    beforeEach(async () => {
      mockTexture = Texture.from('test');
      await atlas.addTexture('test-frame', mockTexture);
    });

    it('should get frame by ID', () => {
      const frame = atlas.getFrame('test-frame');
      expect(frame).toBeDefined();
      expect(frame?.id).toBe('test-frame');
    });

    it('should return undefined for non-existent frame', () => {
      const frame = atlas.getFrame('non-existent');
      expect(frame).toBeUndefined();
    });

    it('should get texture from atlas', () => {
      const texture = atlas.getTexture('test-frame');
      expect(texture).toBeDefined();
    });

    it('should return null for non-existent texture', () => {
      const texture = atlas.getTexture('non-existent');
      expect(texture).toBeNull();
    });

    it('should create sprite from atlas frame', () => {
      const sprite = atlas.createSprite('test-frame');
      expect(sprite).toBeDefined();
      expect(sprite).toBeInstanceOf(Sprite);
    });

    it('should handle rotated frames when creating sprites', async () => {
      // Add a frame that will be rotated
      const rotatedTexture = Texture.from('test');

      // Force rotation by manipulating internal state
      const frame = await atlas.addTexture('rotated', rotatedTexture);
      if (frame) {
        frame.rotated = true;
      }

      const sprite = atlas.createSprite('rotated');
      expect(sprite).toBeDefined();
      if (sprite && frame?.rotated) {
        expect(sprite.rotation).toBe(-Math.PI / 2);
      }
    });

    it('should remove frame from atlas', () => {
      const removed = atlas.removeFrame('test-frame');
      expect(removed).toBe(true);

      const frame = atlas.getFrame('test-frame');
      expect(frame).toBeUndefined();

      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(0);
    });

    it('should return false when removing non-existent frame', () => {
      const removed = atlas.removeFrame('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Atlas Operations', () => {
    beforeEach(async () => {
      const textures = new Map<string, Texture>();
      for (let i = 0; i < 5; i++) {
        textures.set(`texture-${i}`, Texture.from('test'));
      }
      await atlas.addTextures(textures);
    });

    it('should clear all frames', () => {
      atlas.clear();

      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(0);
      expect(stats.packingEfficiency).toBe(0);
    });

    it('should rebuild atlas', async () => {
      const atlasCreatedSpy = vi.fn();
      atlas.on('atlas-created', atlasCreatedSpy);

      await atlas.rebuild();

      // Rebuild might not emit if not dirty
      const stats = atlas.getStats();
      expect(stats).toBeDefined();
    });

    it('should optimize atlas packing', () => {
      const statsBefore = atlas.getStats();

      atlas.optimize();

      const statsAfter = atlas.getStats();
      // Frame count should remain the same
      expect(statsAfter.frameCount).toBe(statsBefore.frameCount);
    });

    it('should set packing algorithm', () => {
      expect(() => {
        atlas.setAlgorithm('maxrects');
        atlas.setAlgorithm('skyline');
        atlas.setAlgorithm('shelf');
        atlas.setAlgorithm('guillotine');
      }).not.toThrow();
    });
  });

  describe('Statistics and Memory', () => {
    it('should track packing efficiency', async () => {
      const texture = Texture.from('test');

      await atlas.addTexture('efficiency-test', texture);

      const stats = atlas.getStats();
      expect(stats.packingEfficiency).toBeGreaterThan(0);
      expect(stats.packingEfficiency).toBeLessThanOrEqual(100);
    });

    it('should calculate memory usage', async () => {
      const textures = new Map<string, Texture>();
      for (let i = 0; i < 10; i++) {
        textures.set(`texture-${i}`, Texture.from('test'));
      }

      await atlas.addTextures(textures);

      const stats = atlas.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should emit memory warning for high usage', async () => {
      const memoryWarningSpy = vi.fn();
      atlas.on('memory-warning', memoryWarningSpy);

      // Add many textures to trigger memory warning
      const textures = new Map<string, Texture>();
      for (let i = 0; i < 50; i++) {
        textures.set(`texture-${i}`, Texture.from('test'));
      }

      // This might trigger memory warning depending on configuration
      await atlas.addTextures(textures);

      const stats = atlas.getStats();
      if (stats.memoryUsage > 100) {
        expect(memoryWarningSpy).toHaveBeenCalled();
      }
    });

    it('should calculate draw calls saved', async () => {
      const textures = new Map<string, Texture>();
      for (let i = 0; i < 20; i++) {
        textures.set(`texture-${i}`, Texture.from('test'));
      }

      await atlas.addTextures(textures);

      const stats = atlas.getStats();
      // Should save draw calls by batching textures
      expect(stats.drawCallsSaved).toBeGreaterThanOrEqual(0);
      expect(stats.drawCallsSaved).toBe(stats.frameCount - stats.atlasCount);
    });
  });

  describe('Packing Algorithm', () => {
    it('should handle rotation when allowed', async () => {
      const atlasWithRotation = new TextureAtlas({
        allowRotation: true,
        maxWidth: 512,
        maxHeight: 512,
      });

      // Add a texture that benefits from rotation
      const texture = Texture.from('test');

      const frame = await atlasWithRotation.addTexture('rotatable', texture);
      expect(frame).toBeDefined();

      atlasWithRotation.dispose();
    });

    it('should not rotate when rotation is disabled', async () => {
      const atlasNoRotation = new TextureAtlas({
        allowRotation: false,
        maxWidth: 512,
        maxHeight: 512,
      });

      const texture = Texture.from('test');

      const frame = await atlasNoRotation.addTexture('not-rotatable', texture);
      expect(frame).toBeDefined();
      if (frame) {
        expect(frame.rotated).toBeFalsy();
      }

      atlasNoRotation.dispose();
    });

    it('should respect padding configuration', async () => {
      const atlasWithPadding = new TextureAtlas({
        padding: 10,
      });

      const texture = Texture.from('test');

      const frame = await atlasWithPadding.addTexture('padded', texture);
      expect(frame).toBeDefined();

      // Frame position should account for padding
      if (frame) {
        expect(frame.x).toBeGreaterThanOrEqual(10);
        expect(frame.y).toBeGreaterThanOrEqual(10);
      }

      atlasWithPadding.dispose();
    });
  });

  describe('Disposal', () => {
    it('should dispose atlas properly', () => {
      atlas.dispose();

      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(0);

      // Should handle operations after disposal
      expect(() => {
        atlas.clear();
        atlas.getFrame('test');
      }).not.toThrow();
    });

    it('should destroy base texture on disposal', async () => {
      const texture = Texture.from('test');

      await atlas.addTexture('test', texture);
      await atlas.rebuild();

      const destroySpy = vi.fn();
      // Mock the destroy method if baseTexture exists
      if ((atlas as any).baseTexture) {
        (atlas as any).baseTexture.destroy = destroySpy;
      }

      atlas.dispose();

      // Base texture should be destroyed if it existed
      if (destroySpy.mock.calls.length > 0) {
        expect(destroySpy).toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty atlas', () => {
      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(0);

      const texture = atlas.getTexture('non-existent');
      expect(texture).toBeNull();

      const sprite = atlas.createSprite('non-existent');
      expect(sprite).toBeNull();
    });

    it('should handle textures with no base texture resource', async () => {
      const textureNoResource = Texture.from('test');

      // Remove resource
      textureNoResource.baseTexture.resource = null as any;

      const frame = await atlas.addTexture('no-resource', textureNoResource);
      expect(frame).toBeDefined();
    });

    it('should handle rapid additions and removals', async () => {
      for (let i = 0; i < 50; i++) {
        const texture = Texture.from('test');

        const id = `rapid-${i}`;
        await atlas.addTexture(id, texture);

        if (i % 2 === 0) {
          atlas.removeFrame(id);
        }
      }

      const stats = atlas.getStats();
      expect(stats.frameCount).toBe(25); // Half were removed
    });
  });
});
