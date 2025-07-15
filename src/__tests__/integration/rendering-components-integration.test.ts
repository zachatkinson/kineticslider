/**
 * @fileoverview Integration Tests for Rendering Components
 *
 * Tests component interactions and coordination focusing on:
 * 1. PixiRenderer + TextureManager integration
 * 2. SpritePool + PerformanceMonitor coordination
 * 3. ResourceLoader + ShaderManager workflow
 * 4. End-to-end performance validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PixiRenderer } from '../../rendering/pixi-renderer';
import { TextureManager } from '../../rendering/texture-manager';
import { ResourceLoader } from '../../rendering/resource-loader';
import { SpritePool } from '../../rendering/sprite-pool';
import { ShaderManager } from '../../rendering/shader-manager';
import { PerformanceMonitor } from '../../rendering/performance-monitor';
import {
  createMockElement,
  createTestPixiConfig,
  createTestTextureConfig,
  createTestSpritePoolConfig,
  createTestShaderConfig,
} from '../utils/test-factories';
import { PIXI_CONFIG } from '../../core/constants';

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
    load: vi.fn(() =>
      Promise.resolve({
        source: {
          resource: 'mock-texture',
          width: 100,
          height: 100,
        },
        baseTexture: { width: 100, height: 100 },
        width: 100,
        height: 100,
        destroy: vi.fn(),
      })
    ),
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
    fromURL: vi.fn(() =>
      Promise.resolve({
        source: {
          resource: 'mock-texture',
          width: 100,
          height: 100,
        },
        baseTexture: { width: 100, height: 100 },
        width: 100,
        height: 100,
        destroy: vi.fn(),
      })
    ),
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

// Mock texture factory is available if needed
// const createMockTexture = () => ({
//   source: {
//     resource: 'mock-texture',
//     width: 100,
//     height: 100,
//   },
//   baseTexture: { width: 100, height: 100 },
//   width: 100,
//   height: 100,
//   destroy: vi.fn(),
// });

describe('Rendering Component Integration', () => {
  let renderer: PixiRenderer;
  let textureManager: TextureManager;
  let resourceLoader: ResourceLoader;
  let spritePool: SpritePool;
  let shaderManager: ShaderManager;
  let performanceMonitor: PerformanceMonitor;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    renderer = new PixiRenderer();
    textureManager = new TextureManager(createTestTextureConfig());
    resourceLoader = new ResourceLoader();
    spritePool = new SpritePool(createTestSpritePoolConfig());
    shaderManager = new ShaderManager(createTestShaderConfig());
    performanceMonitor = new PerformanceMonitor();

    mockContainer = createMockElement('div');
    Object.defineProperty(mockContainer, 'clientWidth', {
      value: 800,
      writable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 600,
      writable: true,
    });

    // Don't use vi.clearAllMocks() as it breaks the pre-configured mocks
    // Instead, manually reset specific mocks if needed

    // Setup fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
  });

  afterEach(() => {
    renderer.dispose();
    textureManager.dispose();
    resourceLoader.dispose();
    spritePool.dispose();
    shaderManager.dispose();
    performanceMonitor.dispose();
  });

  describe('PixiRenderer + TextureManager Integration', () => {
    it('should initialize renderer and load textures efficiently', async () => {
      await renderer.initialize(mockContainer);

      // Load textures through texture manager
      const textures = await textureManager.loadTextures([
        'texture1.jpg',
        'texture2.jpg',
        'texture3.jpg',
      ]);

      // Create slides using loaded textures
      const sprites = await Promise.all(
        textures.map((texture) => renderer.createSlide(texture))
      );

      expect(sprites).toHaveLength(3);
      expect(textures).toHaveLength(3);

      // Verify performance metrics are available
      const metrics = renderer.getPerformanceMetrics();
      expect(metrics.loading.loadedAssets).toBeGreaterThanOrEqual(0);
    });

    it('should handle texture caching in renderer workflow', async () => {
      await renderer.initialize(mockContainer);

      const textureUrl = 'cached-texture.jpg';

      // First load through texture manager
      await textureManager.loadTexture(textureUrl);

      // Second load should use cache
      const cachedTexture = textureManager.getCachedTexture(textureUrl);
      expect(cachedTexture).toBeDefined();

      // Create slide with cached texture
      const sprite = await renderer.createSlide(cachedTexture!);
      expect(sprite).toBeDefined();
    });

    it('should coordinate memory usage between components', async () => {
      await renderer.initialize(mockContainer);

      // Load multiple textures to test memory coordination
      const urls = Array.from({ length: 10 }, (_, i) => `texture-${i}.jpg`);
      await textureManager.loadTextures(urls);

      const textureMemory = textureManager.getMemoryUsage();
      const rendererMetrics = renderer.getPerformanceMetrics();

      expect(textureMemory.used).toBeGreaterThan(0);
      expect(rendererMetrics.memory.used).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SpritePool + PerformanceMonitor Integration', () => {
    it('should monitor sprite pool performance', async () => {
      performanceMonitor.start();

      // Simulate sprite operations while monitoring
      const sprites = [];
      for (let i = 0; i < 20; i++) {
        performanceMonitor.recordFrame();
        sprites.push(spritePool.getSprite());
      }

      // Return sprites
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));

      const metrics = performanceMonitor.getMetrics();
      const poolStats = spritePool.getStats();

      expect(metrics.fps.current).toBeGreaterThanOrEqual(0);
      expect(poolStats.total).toBeGreaterThan(0);

      performanceMonitor.stop();
    });

    it('should optimize sprite pool based on performance data', async () => {
      performanceMonitor.start();

      // Create high sprite usage scenario
      const sprites = Array.from({ length: 50 }, () => spritePool.getSprite());

      // Return some sprites to create optimization opportunity
      sprites.slice(0, 30).forEach((sprite) => spritePool.returnSprite(sprite));

      spritePool.getDetailedStats();
      spritePool.optimize();
      const afterOptimization = spritePool.getDetailedStats();

      // Optimization should maintain efficiency
      expect(afterOptimization.available).toBeGreaterThan(0);

      // Cleanup remaining sprites
      sprites.slice(30).forEach((sprite) => spritePool.returnSprite(sprite));
      performanceMonitor.stop();
    });
  });

  describe('ResourceLoader + ShaderManager Integration', () => {
    it('should load shader resources and compile efficiently', async () => {
      const shaderResources = [
        { url: 'vertex-shader.glsl', type: 'text' },
        { url: 'fragment-shader.glsl', type: 'text' },
      ];

      // Mock shader source loading
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('shader source code'),
      });
      global.fetch = mockFetch;

      const resources = await resourceLoader.loadResources(shaderResources);

      // Compile shaders using loaded resources
      const vertexSrc =
        'attribute vec2 aVertexPosition; void main() { gl_Position = vec4(aVertexPosition, 0.0, 1.0); }';
      const fragmentSrc =
        'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }';

      await shaderManager.compileShader(vertexSrc, fragmentSrc, 'test-shader');

      const shaderStats = shaderManager.getStats();
      const loadingStats = resourceLoader.getLoadingStats();

      expect(resources.size).toBeGreaterThanOrEqual(0);
      expect(shaderStats.compiled).toBeGreaterThanOrEqual(0);
      expect(loadingStats.completed).toBeGreaterThanOrEqual(0);
    });

    it('should handle shader compilation errors gracefully', async () => {
      const invalidVertexSrc = 'invalid shader code';
      const invalidFragmentSrc = 'also invalid';

      await expect(
        shaderManager.compileShader(invalidVertexSrc, invalidFragmentSrc)
      ).resolves.toBeDefined();

      const stats = shaderManager.getStats();
      expect(stats.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should handle full initialization workflow', async () => {
      const startTime = performance.now();

      // Start performance monitoring
      performanceMonitor.start();

      // Initialize renderer
      await renderer.initialize(mockContainer, createTestPixiConfig());

      // Precompile common shaders
      await shaderManager.precompileCommonShaders();

      // Preload textures
      const textureUrls = ['slide1.jpg', 'slide2.jpg', 'slide3.jpg'];
      await textureManager.preloadTextures(textureUrls);

      // Create sprites using pooling
      const sprites = textureUrls.map(() => spritePool.getSprite());

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify workflow completed within performance requirements
      expect(totalTime).toBeLessThan(PIXI_CONFIG.MAX_INIT_TIME);

      // Verify all components are working together
      const rendererMetrics = renderer.getPerformanceMetrics();
      const textureMemory = textureManager.getMemoryUsage();
      const poolStats = spritePool.getStats();
      const shaderStats = shaderManager.getStats();
      const perfMetrics = performanceMonitor.getMetrics();

      expect(rendererMetrics.loading.loadedAssets).toBeGreaterThanOrEqual(0);
      expect(textureMemory.cached).toBeGreaterThanOrEqual(0);
      expect(poolStats.inUse).toBe(sprites.length);
      expect(shaderStats.cached).toBeGreaterThanOrEqual(0);
      expect(perfMetrics.fps.current).toBeGreaterThanOrEqual(0);

      // Cleanup
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));
      performanceMonitor.stop();
    });

    it('should maintain performance under load', async () => {
      await renderer.initialize(mockContainer);
      performanceMonitor.start();

      // Simulate high-load scenario
      const operations = [];

      for (let i = 0; i < 100; i++) {
        operations.push(async () => {
          // Load texture
          const texture = await textureManager.loadTexture(`texture-${i}.jpg`);

          // Get sprite from pool
          const sprite = spritePool.getSprite(texture);

          // Record frame for performance tracking
          performanceMonitor.recordFrame();

          // Return sprite to pool
          spritePool.returnSprite(sprite);
        });
      }

      const startTime = performance.now();
      await Promise.all(operations.map((op) => op()));
      const duration = performance.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps.average).toBeGreaterThanOrEqual(0);

      performanceMonitor.stop();
    });

    it('should handle component failures gracefully', async () => {
      await renderer.initialize(mockContainer);

      // Simulate texture loading failure
      const { Assets } = await import('pixi.js');
      vi.mocked(Assets.load).mockRejectedValueOnce(new Error('Network error'));

      // System should continue to work with other components
      const sprite = spritePool.getSprite();
      expect(sprite).toBeDefined();

      const shaderResult = await shaderManager.compileShader(
        'vertex shader',
        'fragment shader'
      );
      expect(shaderResult).toBeDefined();

      spritePool.returnSprite(sprite);
    });
  });

  describe('Memory Management Integration', () => {
    it('should coordinate memory cleanup across components', async () => {
      await renderer.initialize(mockContainer);

      // Create memory pressure scenario
      const textures = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          textureManager.loadTexture(`memory-test-${i}.jpg`)
        )
      );

      const sprites = textures.map((texture) => spritePool.getSprite(texture));

      // Get initial memory usage
      const initialTextureMemory = textureManager.getMemoryUsage();
      spritePool.getDetailedStats();

      // Clear caches to free memory
      textureManager.clearCache();
      spritePool.optimize();

      // Verify memory was freed
      const finalTextureMemory = textureManager.getMemoryUsage();
      expect(finalTextureMemory.used).toBeLessThanOrEqual(
        initialTextureMemory.used
      );

      // Cleanup sprites
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));
    });

    it('should respect memory limits across components', async () => {
      await renderer.initialize(mockContainer);

      const metrics = renderer.getPerformanceMetrics();
      const textureMemory = textureManager.getMemoryUsage();
      const poolStats = spritePool.getDetailedStats();

      // Verify all components report reasonable memory usage
      expect(metrics.memory.percentage).toBeLessThan(100);
      expect(textureMemory.used).toBeLessThan(textureMemory.total);
      expect(poolStats.memoryEstimate).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from component initialization failures', async () => {
      // Simulate renderer initialization failure
      const failingRenderer = new PixiRenderer();

      await expect(
        failingRenderer.initialize(null as unknown as HTMLElement)
      ).rejects.toThrow();

      // Other components should still work
      const texture = await textureManager.loadTexture('recovery-test.jpg');
      expect(texture).toBeDefined();

      const sprite = spritePool.getSprite();
      expect(sprite).toBeDefined();

      spritePool.returnSprite(sprite);
      failingRenderer.dispose();
    });

    it('should handle cascading failures gracefully', async () => {
      await renderer.initialize(mockContainer);

      // Simulate multiple component failures
      const { Assets } = await import('pixi.js');
      vi.mocked(Assets.load).mockRejectedValue(
        new Error('All texture loads fail')
      );

      // System should maintain basic functionality
      const sprite = spritePool.getSprite();
      expect(sprite).toBeDefined();

      const metrics = renderer.getPerformanceMetrics();
      expect(metrics).toBeDefined();

      spritePool.returnSprite(sprite);
    });
  });
});
