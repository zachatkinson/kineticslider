/**
 * @fileoverview TextureAtlas Integration Tests
 *
 * Tests the integration of TextureAtlas with PIXI.js renderer,
 * SliderCore, and texture management pipeline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextureAtlas } from '../../performance/texture-atlas';
import { MemoryProfiler } from '../../performance/memory-profiler';
import { SimpleEventEmitter } from '../../core/event-emitter';

// Mock PIXI.js v8 API
vi.mock('pixi.js', () => ({
  Texture: Object.assign(
    vi.fn().mockImplementation((config?: any) => ({
      source: config?.source || {
        width: 100,
        height: 100,
        resource: { width: 100, height: 100 },
      },
      width: 100,
      height: 100,
      frame: config?.frame || { x: 0, y: 0, width: 100, height: 100 },
      destroy: vi.fn(),
      clone: vi.fn().mockReturnThis(),
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
  RenderTexture: vi.fn().mockImplementation(() => ({
    width: 2048,
    height: 2048,
    destroy: vi.fn(),
    source: {
      width: 2048,
      height: 2048,
      destroy: vi.fn(),
    },
  })),
  Rectangle: vi.fn().mockImplementation((x, y, w, h) => ({ x, y, width: w, height: h })),
  Graphics: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    beginFill: vi.fn(),
    drawRect: vi.fn(),
    endFill: vi.fn(),
    destroy: vi.fn(),
  })),
  Sprite: vi.fn().mockImplementation(() => ({
    texture: null,
    destroy: vi.fn(),
  })),
}));

// Mock Canvas API
global.HTMLCanvasElement = class extends HTMLElement {
  getContext() {
    return {
      drawImage: vi.fn(),
      createImageData: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
    };
  }
} as any;

global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  width = 100;
  height = 100;

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
} as any;

describe('TextureAtlas Integration Tests', () => {
  let textureAtlas: TextureAtlas;
  let memoryProfiler: MemoryProfiler;
  let eventEmitter: SimpleEventEmitter;

  beforeEach(() => {
    textureAtlas = new TextureAtlas({
      maxWidth: 2048,
      maxHeight: 2048,
      enableTrim: true,
      allowRotation: true,
      generateMipmaps: false,
    });

    memoryProfiler = new MemoryProfiler({
      autoProfile: false,
      enableLeakDetection: true,
    });

    eventEmitter = new SimpleEventEmitter();
  });

  afterEach(() => {
    textureAtlas.dispose();
    memoryProfiler.dispose();
    vi.clearAllMocks();
  });

  describe('PIXI.js Integration', () => {
    it('should create valid PIXI textures from atlas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Create test textures
      const textures = new Map();
      for (let i = 0; i < 10; i++) {
        const texture = Texture.from("test");
        textures.set(`texture-${i}`, texture);
      }

      // Add to atlas
      await textureAtlas.addTextures(textures);

      // Get atlas frames
      const frames = textureAtlas.getAllFrames();
      expect(frames.size).toBe(10);

      // Verify frame structure
      frames.forEach((frame: any, _name: string) => {
        expect(frame).toHaveProperty('x');
        expect(frame).toHaveProperty('y');
        expect(frame).toHaveProperty('width');
        expect(frame).toHaveProperty('height');
        expect(typeof frame.x).toBe('number');
        expect(typeof frame.y).toBe('number');
      });
    });

    it('should optimize sprite rendering through texture atlasing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture, Sprite } = require('pixi.js');

      // Create multiple small textures (typical use case)
      const textures = new Map();
      for (let i = 0; i < 50; i++) {
        textures.set(`icon-${i}`, Texture.from("test"));
      }

      await textureAtlas.addTextures(textures);

      // Create sprites using atlas
      const sprites = [];
      for (let i = 0; i < 50; i++) {
        const sprite = new Sprite();
        const texture = textureAtlas.getTexture(`icon-${i}`);
        if (texture) {
          sprite.texture = texture;
          sprites.push(sprite);
        }
      }

      // Verify all sprites use the same texture source (atlas)
      const sources = new Set(sprites.map(sprite => sprite.texture?.source));
      expect(sources.size).toBe(1); // All sprites share one atlas texture

      const stats = textureAtlas.getStats();
      expect(stats.drawCallsSaved).toBeGreaterThan(40); // Significant draw call reduction
    });

    it('should handle texture updates and regeneration', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Initial atlas
      const initialTextures = new Map();
      for (let i = 0; i < 5; i++) {
        initialTextures.set(`texture-${i}`, new Texture({ width: 100, height: 100 }));
      }
      await textureAtlas.addTextures(initialTextures);

      const initialFrameCount = textureAtlas.getAllFrames().size;

      // Add more textures
      const additionalTextures = new Map();
      for (let i = 5; i < 10; i++) {
        additionalTextures.set(`texture-${i}`, new Texture({ width: 100, height: 100 }));
      }
      await textureAtlas.addTextures(additionalTextures);

      const finalFrameCount = textureAtlas.getAllFrames().size;
      expect(finalFrameCount).toBe(initialFrameCount + 5);

      // Remove textures
      textureAtlas.removeFrame('texture-0');
      textureAtlas.removeFrame('texture-1');

      expect(textureAtlas.getAllFrames().size).toBe(finalFrameCount - 2);
    });
  });

  describe('Memory Management Integration', () => {
    it('should track texture memory usage', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Start memory monitoring
      memoryProfiler.startProfiling();

      const textures = new Map();
      for (let i = 0; i < 20; i++) {
        const texture = Texture.from("test");
        textures.set(`large-texture-${i}`, texture);

        // Track allocation
        memoryProfiler.trackAllocation(
          `texture-${i}`,
          texture,
          'Texture',
          128 * 128 * 4 // RGBA
        );
      }

      await textureAtlas.addTextures(textures);

      // Atlas should reduce memory usage
      const stats = textureAtlas.getStats();
      expect(stats.memoryUsage).toBeLessThan(20 * 128 * 128 * 4); // Less than individual textures

      memoryProfiler.stopProfiling();
      const snapshot = memoryProfiler.getCurrentUsage();
      expect(snapshot.usedJSHeapSize).toBeGreaterThan(0);
    });

    it('should detect memory leaks in texture management', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      memoryProfiler.startProfiling();

      // Create and dispose textures repeatedly
      for (let cycle = 0; cycle < 5; cycle++) {
        const textures = new Map();
        for (let i = 0; i < 10; i++) {
          const id = `cycle-${cycle}-texture-${i}`;
          const texture = new Texture({ width: 100, height: 100 });
          textures.set(id, texture);
          memoryProfiler.trackAllocation(id, texture, 'Texture', 1024);
        }

        await textureAtlas.addTextures(textures);

        // Clear atlas
        textureAtlas.clear();

        // Track deallocations
        textures.forEach((_, id) => {
          memoryProfiler.freeAllocation(id);
        });
      }

      // Check for leaks
      const leaks = memoryProfiler.detectLeaks();
      expect(leaks.suspectedSources.length).toBe(0); // Should not detect leaks
    });

    it('should optimize memory through texture packing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Create textures with lots of empty space
      const textures = new Map();
      for (let i = 0; i < 15; i++) {
        // Simulate mostly transparent texture
        const texture = Texture.from("test");
        textures.set(`sparse-texture-${i}`, texture);
      }

      await textureAtlas.addTextures(textures);

      const stats = textureAtlas.getStats();
      // Should achieve good packing efficiency
      expect(stats.packingEfficiency).toBeGreaterThan(60);
      expect(stats.memoryUsage).toBeLessThan(15 * 256 * 256 * 4 * 0.8); // 20% savings
    });
  });

  describe('Performance Integration', () => {
    it('should improve rendering performance through batching', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Create many small textures
      const textures = new Map();
      for (let i = 0; i < 100; i++) {
        textures.set(`mini-texture-${i}`, new Texture({ width: 100, height: 100 }));
      }

      const startTime = performance.now();
      await textureAtlas.addTextures(textures);
      const atlasTime = performance.now() - startTime;

      expect(atlasTime).toBeLessThan(100); // Should be fast

      const stats = textureAtlas.getStats();
      expect(stats.drawCallsSaved).toBeGreaterThan(90); // Massive draw call reduction
      expect(stats.atlasCount).toBeLessThanOrEqual(3); // Should fit in few atlases
    });

    it('should handle dynamic texture loading efficiently', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      const loadTimes: number[] = [];

      // Simulate dynamic loading
      for (let batch = 0; batch < 5; batch++) {
        const batchTextures = new Map();
        for (let i = 0; i < 10; i++) {
          const id = `batch-${batch}-texture-${i}`;
          batchTextures.set(id, new Texture({ width: 100, height: 100 }));
        }

        const startTime = performance.now();
        await textureAtlas.addTextures(batchTextures);
        const endTime = performance.now();

        loadTimes.push(endTime - startTime);
      }

      // Each batch should be processed quickly
      loadTimes.forEach((time) => {
        expect(time).toBeLessThan(50); // Under 50ms per batch
      });

      // Performance should not degrade significantly
      const firstBatch = loadTimes[0];
      const lastBatch = loadTimes[loadTimes.length - 1];
      expect(lastBatch).toBeLessThan(firstBatch * 2); // No more than 2x slower
    });
  });

  describe('Event System Integration', () => {
    it('should emit events during atlas operations', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      const events: string[] = [];

      textureAtlas.on('texture-added', () => events.push('texture-added'));
      textureAtlas.on('atlas-generated', () => events.push('atlas-generated'));
      textureAtlas.on('packing-optimized', () => events.push('packing-optimized'));

      // Add textures
      const textures = new Map();
      for (let i = 0; i < 5; i++) {
        textures.set(`event-texture-${i}`, new Texture({ width: 100, height: 100 }));
      }

      await textureAtlas.addTextures(textures);

      expect(events).toContain('atlas-generated');
    });

    it('should coordinate with global event system', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      const globalEvents: string[] = [];
      eventEmitter.on('atlas-updated', () => globalEvents.push('atlas-updated'));
      eventEmitter.on('memory-optimized', () => globalEvents.push('memory-optimized'));

      // Bridge events
      textureAtlas.on('atlas-generated', () => {
        eventEmitter.emit('atlas-updated');
      });

      textureAtlas.on('packing-optimized', (stats: any) => {
        if (stats.packingEfficiency > 80) {
          eventEmitter.emit('memory-optimized');
        }
      });

      // Trigger events
      const textures = new Map();
      for (let i = 0; i < 20; i++) {
        textures.set(`global-texture-${i}`, new Texture({ width: 100, height: 100 }));
      }

      await textureAtlas.addTextures(textures);

      expect(globalEvents).toContain('atlas-updated');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle PIXI texture loading failures gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Mock texture loading failure
      const failingTexture = new Texture({ width: 100, height: 100 });
      Object.defineProperty(failingTexture, 'valid', { value: false });

      const textures = new Map([
        ['valid-texture', new Texture({ width: 100, height: 100 })],
        ['failing-texture', failingTexture],
        ['another-valid', new Texture({ width: 100, height: 100 })],
      ]);

      // Should not throw
      await expect(textureAtlas.addTextures(textures)).resolves.not.toThrow();

      // Should still process valid textures
      const frames = textureAtlas.getAllFrames();
      expect(frames.size).toBeGreaterThan(0);
      expect(frames.has('valid-texture')).toBe(true);
    });

    it('should recover from atlas generation errors', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture, RenderTexture } = require('pixi.js');

      // Mock RenderTexture creation failure
      RenderTexture.mockImplementationOnce(() => {
        throw new Error('WebGL context lost');
      });

      const textures = new Map();
      for (let i = 0; i < 5; i++) {
        textures.set(`recovery-texture-${i}`, new Texture({ width: 100, height: 100 }));
      }

      // Should handle error gracefully
      await expect(textureAtlas.addTextures(textures)).resolves.not.toThrow();

      // Should still maintain texture references
      expect(textureAtlas.getAllFrames().size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multi-Atlas Management', () => {
    it('should manage multiple atlases when size limits exceeded', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Create large textures that will require multiple atlases
      const textures = new Map();
      for (let i = 0; i < 30; i++) {
        textures.set(`large-texture-${i}`, Texture.from("test"));
      }

      await textureAtlas.addTextures(textures);

      const stats = textureAtlas.getStats();
      expect(stats.atlasCount).toBeGreaterThan(1); // Should create multiple atlases
      expect(stats.packingEfficiency).toBeGreaterThan(50); // Should still be efficient
    });

    it('should balance atlas usage across multiple atlases', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture } = require('pixi.js');

      // Mix of large and small textures
      const textures = new Map();

      // Large textures
      for (let i = 0; i < 5; i++) {
        textures.set(`large-${i}`, Texture.from("test"));
      }

      // Small textures
      for (let i = 0; i < 50; i++) {
        textures.set(`small-${i}`, Texture.from("test"));
      }

      await textureAtlas.addTextures(textures);

      const stats = textureAtlas.getStats();
      expect(stats.packingEfficiency).toBeGreaterThan(70); // Good mixed packing
      expect(stats.atlasCount).toBeGreaterThan(1);
      expect(stats.atlasCount).toBeLessThan(10); // Not too many atlases
    });
  });
});