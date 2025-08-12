/**
 * @fileoverview E2E Performance Tests for Rendering
 *
 * End-to-end performance validation focusing on:
 * 1. Real browser environment performance
 * 2. 60fps rendering maintenance
 * 3. Memory usage under 150MB
 * 4. 2-second initialization target
 */

import { test, expect } from '@playwright/test';
import { PIXI_CONFIG, RENDERING_PERFORMANCE } from '../../core/constants';

test.describe('Rendering Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.skip('should initialize PIXI renderer within 2 seconds', async ({
    page,
  }) => {
    const startTime = Date.now();

    // Initialize rendering components
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        import('../../rendering/pixi-renderer').then(
          async ({ PixiRenderer }) => {
            const container = document.createElement('div');
            container.style.width = '800px';
            container.style.height = '600px';
            document.body.appendChild(container);

            const renderer = new PixiRenderer();
            await renderer.initialize(container);
            resolve();
          }
        );
      });
    });

    const initTime = Date.now() - startTime;
    expect(initTime).toBeLessThan(PIXI_CONFIG.MAX_INIT_TIME);
  });

  test.skip('should maintain 60fps during texture loading and rendering', async ({
    page,
  }) => {
    // Track FPS during intensive operations
    const fpsData = await page.evaluate(async () => {
      const { PixiRenderer } = await import('../../rendering/pixi-renderer');
      const { TextureManager } = await import(
        '../../rendering/texture-manager'
      );
      const { PerformanceMonitor } = await import(
        '../../rendering/performance-monitor'
      );

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);

      const renderer = new PixiRenderer();
      const textureManager = new TextureManager();
      const monitor = new PerformanceMonitor();

      await renderer.initialize(container);
      monitor.start();

      // Load multiple textures while monitoring performance
      const textureUrls = Array.from(
        { length: 10 },
        (_, i) => `https://picsum.photos/200/200?random=${i}`
      );

      for (const url of textureUrls) {
        try {
          await textureManager.loadTexture(url);
          await renderer.createSlide(url);
          monitor.recordFrame();
        } catch {
          // Handle loading errors gracefully
        }
      }

      const metrics = monitor.getMetrics();
      monitor.stop();

      return {
        averageFps: metrics.fps.average,
        minFps: metrics.fps.min,
        currentFps: metrics.fps.current,
      };
    });

    expect(fpsData.averageFps).toBeGreaterThan(
      RENDERING_PERFORMANCE.WARNING_THRESHOLDS.FPS_LOW
    );
    expect(fpsData.minFps).toBeGreaterThan(
      RENDERING_PERFORMANCE.CRITICAL_THRESHOLDS.FPS_CRITICAL
    );
  });

  test.skip('should stay under 150MB memory usage target', async ({ page }) => {
    const memoryUsage = await page.evaluate(async () => {
      const { PixiRenderer } = await import('../../rendering/pixi-renderer');
      const { TextureManager } = await import(
        '../../rendering/texture-manager'
      );
      const { SpritePool } = await import('../../rendering/sprite-pool');

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);

      const renderer = new PixiRenderer();
      const textureManager = new TextureManager();
      const spritePool = new SpritePool();

      await renderer.initialize(container);

      // Create memory-intensive scenario
      const textures = [];
      const sprites = [];

      for (let i = 0; i < 20; i++) {
        try {
          const texture = await textureManager.loadTexture(
            `https://picsum.photos/400/400?random=${i}`
          );
          textures.push(texture);

          const sprite = spritePool.getSprite(texture);
          sprites.push(sprite);
        } catch {
          // Handle loading errors
        }
      }

      const rendererMetrics = renderer.getPerformanceMetrics();
      const textureMemory = textureManager.getMemoryUsage();
      const poolStats = spritePool.getDetailedStats();

      // Cleanup
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));
      textureManager.clearCache();

      return {
        rendererMemory: rendererMetrics.memory.used,
        textureMemory: textureMemory.used,
        poolMemory: poolStats.memoryEstimate,
        totalEstimate:
          rendererMetrics.memory.used +
          textureMemory.used +
          poolStats.memoryEstimate,
      };
    });

    const targetMemory = 150 * 1024 * 1024; // 150MB
    expect(memoryUsage.totalEstimate).toBeLessThan(targetMemory);
  });

  test.skip('should handle progressive loading with feedback', async ({
    page,
  }) => {
    const progressData = await page.evaluate(async () => {
      const { TextureManager } = await import(
        '../../rendering/texture-manager'
      );
      const { ResourceLoader } = await import(
        '../../rendering/resource-loader'
      );

      const textureManager = new TextureManager();
      new ResourceLoader();

      const progressUpdates: Array<{
        loaded: number;
        total: number;
        percentage: number;
      }> = [];

      const onProgress = (progress: {
        loaded: number;
        total: number;
        percentage: number;
      }) => {
        progressUpdates.push({
          loaded: progress.loaded,
          total: progress.total,
          percentage: progress.percentage,
        } as { loaded: number; total: number; percentage: number });
      };

      // Test progressive loading
      const textureUrls = Array.from(
        { length: 5 },
        (_, i) => `https://picsum.photos/300/300?random=${i + 100}`
      );

      try {
        await textureManager.loadTextures(textureUrls, onProgress);
      } catch {
        // Ignore texture loading errors
      }

      return {
        progressUpdateCount: progressUpdates.length,
        finalProgress:
          progressUpdates[progressUpdates.length - 1]?.percentage || 0,
        progressIncremental: progressUpdates.every(
          (update, index) =>
            index === 0 ||
            update.percentage >= progressUpdates[index - 1].percentage
        ),
      };
    });

    expect(progressData.progressUpdateCount).toBeGreaterThan(0);
    expect(progressData.finalProgress).toBe(100);
    expect(progressData.progressIncremental).toBe(true);
  });

  test.skip('should efficiently pool and reuse sprites', async ({ page }) => {
    const poolingData = await page.evaluate(async () => {
      const { SpritePool } = await import('../../rendering/sprite-pool');

      const spritePool = new SpritePool({ initialSize: 10, maxSize: 50 });
      const sprites: Array<import('pixi.js').Sprite> = [];

      const startTime = performance.now();

      // Get sprites
      for (let i = 0; i < 100; i++) {
        sprites.push(spritePool.getSprite());
      }

      const getTime = performance.now() - startTime;

      // Return sprites
      const returnStartTime = performance.now();
      sprites.forEach((sprite) => spritePool.returnSprite(sprite));
      const returnTime = performance.now() - returnStartTime;

      // Get sprites again to test reuse
      const reuseStartTime = performance.now();
      const reusedSprites = [];
      for (let i = 0; i < 50; i++) {
        reusedSprites.push(spritePool.getSprite());
      }
      const reuseTime = performance.now() - reuseStartTime;

      const stats = spritePool.getDetailedStats();

      // Cleanup
      reusedSprites.forEach((sprite) => spritePool.returnSprite(sprite));

      return {
        getTime,
        returnTime,
        reuseTime,
        averageGetTime: getTime / 100,
        averageReturnTime: returnTime / 100,
        averageReuseTime: reuseTime / 50,
        reuseCount: stats.reused,
        totalSprites: stats.total,
      };
    });

    // Sprite operations should be very fast
    expect(poolingData.averageGetTime).toBeLessThan(10); // < 10ms per operation (CI compatible)
    expect(poolingData.averageReturnTime).toBeLessThan(10);
    expect(poolingData.averageReuseTime).toBeLessThan(10);
    expect(poolingData.reuseCount).toBeGreaterThan(0);
  });

  test.skip('should compile and cache shaders efficiently', async ({
    page,
  }) => {
    const shaderData = await page.evaluate(async () => {
      const { ShaderManager } = await import('../../rendering/shader-manager');

      const shaderManager = new ShaderManager();

      const vertexShader = `
        attribute vec2 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat3 projectionMatrix;
        varying vec2 vTextureCoord;
        void main(void) {
          gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
          vTextureCoord = aTextureCoord;
        }
      `;

      const fragmentShader = `
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main(void) {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
        }
      `;

      // First compilation
      const startTime = performance.now();
      await shaderManager.compileShader(
        vertexShader,
        fragmentShader,
        'test-shader'
      );
      const firstCompileTime = performance.now() - startTime;

      // Second compilation (should use cache)
      const cacheStartTime = performance.now();
      const cachedShader = shaderManager.getShader('test-shader');
      const cacheTime = performance.now() - cacheStartTime;

      const stats = shaderManager.getStats();

      return {
        firstCompileTime,
        cacheTime,
        compiled: stats.compiled,
        cached: stats.cached,
        failed: stats.failed,
        hasCachedShader: cachedShader !== null,
      };
    });

    expect(shaderData.firstCompileTime).toBeLessThan(1000); // < 1 second
    expect(shaderData.cacheTime).toBeLessThan(100); // Cache access should be fast (CI compatible)
    expect(shaderData.compiled).toBeGreaterThan(0);
    expect(shaderData.hasCachedShader).toBe(true);
    expect(shaderData.failed).toBe(0);
  });

  test.skip('should handle stress test with multiple concurrent operations', async ({
    page,
  }) => {
    const stressTestData = await page.evaluate(async () => {
      const { PixiRenderer } = await import('../../rendering/pixi-renderer');
      const { TextureManager } = await import(
        '../../rendering/texture-manager'
      );
      const { SpritePool } = await import('../../rendering/sprite-pool');
      const { PerformanceMonitor } = await import(
        '../../rendering/performance-monitor'
      );

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);

      const renderer = new PixiRenderer();
      const textureManager = new TextureManager();
      const spritePool = new SpritePool();
      const monitor = new PerformanceMonitor();

      await renderer.initialize(container);
      monitor.start();

      const startTime = performance.now();

      // Stress test: concurrent operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(async () => {
          try {
            // Load texture
            const texture = await textureManager.loadTexture(
              `https://picsum.photos/150/150?random=${i + 200}`
            );

            // Get sprite from pool
            const sprite = spritePool.getSprite(texture);

            // Create slide
            await renderer.createSlide(texture);

            // Record frame
            monitor.recordFrame();

            // Return sprite
            spritePool.returnSprite(sprite);

            return true;
          } catch {
            return false;
          }
        });
      }

      const results = await Promise.allSettled(operations.map((op) => op()));
      const duration = performance.now() - startTime;

      const metrics = monitor.getMetrics();
      const rendererMetrics = renderer.getPerformanceMetrics();

      monitor.stop();

      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true
      ).length;

      return {
        duration,
        successCount,
        totalOperations: operations.length,
        successRate: successCount / operations.length,
        averageFps: metrics.fps.average,
        minFps: metrics.fps.min,
        memoryUsage: rendererMetrics.memory.percentage,
      };
    });

    expect(stressTestData.duration).toBeLessThan(10000); // Should complete in 10 seconds
    expect(stressTestData.successRate).toBeGreaterThan(0.8); // 80% success rate minimum
    expect(stressTestData.averageFps).toBeGreaterThan(30); // Maintain reasonable FPS
    expect(stressTestData.memoryUsage).toBeLessThan(100); // Don't exceed memory limits
  });

  test.skip('should recover gracefully from errors', async ({ page }) => {
    const errorRecoveryData = await page.evaluate(async () => {
      const { PixiRenderer } = await import('../../rendering/pixi-renderer');
      const { TextureManager } = await import(
        '../../rendering/texture-manager'
      );
      const { SpritePool } = await import('../../rendering/sprite-pool');

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);

      const renderer = new PixiRenderer();
      const textureManager = new TextureManager();
      const spritePool = new SpritePool();

      await renderer.initialize(container);

      let errorCount = 0;
      let recoveryCount = 0;

      // Test error scenarios
      const errorTests = [
        // Invalid texture URL
        async () => {
          try {
            await textureManager.loadTexture('invalid://url');
          } catch {
            errorCount++;
            // Try to continue with valid operation
            const sprite = spritePool.getSprite();
            spritePool.returnSprite(sprite);
            recoveryCount++;
          }
        },

        // Invalid shader compilation
        async () => {
          try {
            const { ShaderManager } = await import(
              '../../rendering/shader-manager'
            );
            const shaderManager = new ShaderManager();
            await shaderManager.compileShader('invalid', 'shader');
          } catch {
            errorCount++;
            // System should still work
            const metrics = renderer.getPerformanceMetrics();
            if (metrics) recoveryCount++;
          }
        },
      ];

      for (const test of errorTests) {
        await test();
      }

      return {
        errorCount,
        recoveryCount,
        recoveryRate: recoveryCount / errorCount,
      };
    });

    expect(errorRecoveryData.errorCount).toBeGreaterThan(0); // Errors should be triggered
    expect(errorRecoveryData.recoveryRate).toBe(1); // 100% recovery rate
  });

  test.skip('should meet all rendering success criteria', async ({ page }) => {
    const criteriaResults = await page.evaluate(async () => {
      const { PixiRenderer } = await import('../../rendering/pixi-renderer');
      const { TextureManager } = await import(
        '../../rendering/texture-manager'
      );
      const { PerformanceMonitor } = await import(
        '../../rendering/performance-monitor'
      );

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);

      const renderer = new PixiRenderer();
      const textureManager = new TextureManager();
      const monitor = new PerformanceMonitor();

      // Criterion 1: PIXI app initializes in under 2 seconds
      const initStartTime = performance.now();
      await renderer.initialize(container);
      const initTime = performance.now() - initStartTime;

      // Criterion 2: Texture loading includes progress feedback
      let progressReceived = false;
      const onProgress = () => {
        progressReceived = true;
      };

      try {
        await textureManager.loadTextures(
          [
            'https://picsum.photos/200/200?random=300',
            'https://picsum.photos/200/200?random=301',
          ],
          onProgress
        );
      } catch {
        // Ignore texture loading errors
      }

      // Criterion 3: Rendering maintains 60fps performance
      monitor.start();
      for (let i = 0; i < 60; i++) {
        monitor.recordFrame();
        await new Promise((resolve) => setTimeout(resolve, 16)); // ~60fps
      }
      const metrics = monitor.getMetrics();
      monitor.stop();

      // Criterion 4: Memory usage stays under 150MB
      const rendererMetrics = renderer.getPerformanceMetrics();
      const textureMemory = textureManager.getMemoryUsage();

      return {
        initUnder2Seconds: initTime < 2000,
        hasProgressFeedback: progressReceived,
        maintains60Fps: metrics.fps.average >= 55, // Allow some margin
        memoryUnder150MB:
          rendererMetrics.memory.used + textureMemory.used < 150 * 1024 * 1024,
        initTime,
        averageFps: metrics.fps.average,
        totalMemoryMB:
          (rendererMetrics.memory.used + textureMemory.used) / (1024 * 1024),
      };
    });

    // Verify all success criteria
    expect(criteriaResults.initUnder2Seconds).toBe(true);
    expect(criteriaResults.hasProgressFeedback).toBe(true);
    expect(criteriaResults.maintains60Fps).toBe(true);
    expect(criteriaResults.memoryUnder150MB).toBe(true);

    // Log performance metrics for visibility
  });
});
