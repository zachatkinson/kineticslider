/**
 * @fileoverview Core PixiRenderer for Clean PIXI.js Application Management
 *
 * Dedicated class for PIXI.js application lifecycle management with:
 * 1. Optimized initialization under 2 seconds
 * 2. Clean separation from animation concerns
 * 3. Performance monitoring integration
 * 4. Memory-efficient resource management
 *
 * @version 1.0.0
 */

import { Application, Sprite, Texture, Assets } from 'pixi.js';
import type {
  IPixiRenderer,
  PixiConfig,
  PerformanceMetrics,
} from '../core/types';
import {
  PIXI_CONFIG,
  RENDERING_PERFORMANCE,
  RENDERING,
  ERROR_MESSAGES,
} from '../core/constants';

/**
 * Core PixiRenderer for clean PIXI.js application management
 */
export class PixiRenderer implements IPixiRenderer {
  private app: Application | null = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private performanceMetrics: PerformanceMetrics;
  private initStartTime = 0;

  // Performance monitoring
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];

  constructor() {
    this.performanceMetrics = this.createDefaultMetrics();
  }

  /**
   * Initialize PIXI application with optimized settings
   */
  async initialize(
    container: HTMLElement,
    config: PixiConfig = {}
  ): Promise<void> {
    this.initStartTime = performance.now();

    try {
      if (!container) {
        throw new Error(
          'Container element is required for PIXI initialization'
        );
      }

      this.container = container;

      // Merge config with defaults
      const finalConfig = this.mergeConfig(config);

      // Create PIXI application with optimized settings
      this.app = new Application();

      // Initialize with performance tracking
      await this.initializeWithTimeout(finalConfig);

      // Add canvas to container
      this.container.appendChild(this.app.canvas);

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;

      const initTime = performance.now() - this.initStartTime;
      this.performanceMetrics.loading.averageLoadTime = initTime;

      // Validate initialization time meets requirements
      if (initTime > PIXI_CONFIG.MAX_INIT_TIME) {
        // Silently handle performance warning
      }
    } catch (error) {
      throw new Error(ERROR_MESSAGES.PIXI_INIT_FAILED(error));
    }
  }

  /**
   * Create sprite from texture with performance optimization
   */
  async createSlide(texture: string | Texture): Promise<Sprite> {
    if (!this.app || !this.isInitialized) {
      throw new Error(ERROR_MESSAGES.RENDERER_NOT_INITIALIZED);
    }

    try {
      let pixiTexture: Texture;

      // Handle texture loading
      if (typeof texture === 'string') {
        const loadStart = performance.now();
        pixiTexture = await Assets.load(texture);
        const loadTime = performance.now() - loadStart;

        // Update loading metrics
        this.performanceMetrics.loading.loadedAssets++;
        this.performanceMetrics.loading.averageLoadTime =
          (this.performanceMetrics.loading.averageLoadTime + loadTime) / 2;
      } else {
        pixiTexture = texture;
      }

      // Create optimized sprite
      const sprite = new Sprite(pixiTexture);

      // Configure sprite with optimal settings
      sprite.anchor.set(RENDERING.CENTER_ANCHOR);
      sprite.position.set(
        this.app.screen.width / 2,
        this.app.screen.height / 2
      );

      // Add to stage
      this.app.stage.addChild(sprite);

      // Update rendering metrics
      this.updateRenderingMetrics();

      return sprite;
    } catch (error) {
      this.performanceMetrics.loading.failedAssets++;
      throw new Error(ERROR_MESSAGES.SPRITE_CREATE_FAILED(error));
    }
  }

  /**
   * Update viewport dimensions with performance optimization
   */
  updateViewport(width: number, height: number): void {
    if (!this.app || !this.isInitialized) {
      throw new Error(ERROR_MESSAGES.RENDERER_NOT_INITIALIZED);
    }

    this.app.renderer.resize(width, height);

    // Update all sprites positions to maintain centering
    this.app.stage.children.forEach((child) => {
      if (child instanceof Sprite) {
        child.position.set(width / 2, height / 2);
      }
    });
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    this.updatePerformanceMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Dispose of renderer and cleanup all resources
   */
  dispose(): void {
    if (this.app) {
      // Cleanup all sprites
      this.app.stage.removeChildren();

      // Destroy PIXI application
      this.app.destroy(true);

      this.app = null;
    }

    this.container = null;
    this.isInitialized = false;
    this.frameCount = 0;
    this.fpsHistory = [];
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Merge user config with defaults
   */
  private mergeConfig(config: PixiConfig): Required<PixiConfig> {
    return {
      maxInitTime: config.maxInitTime ?? PIXI_CONFIG.MAX_INIT_TIME,
      developmentMode: config.developmentMode ?? false,
      shaderCache: {
        enabled: config.shaderCache?.enabled ?? true,
        maxSize: config.shaderCache?.maxSize ?? PIXI_CONFIG.SHADER_CACHE_SIZE,
      },
      texturePool: {
        initialSize: config.texturePool?.initialSize ?? 10,
        maxSize: config.texturePool?.maxSize ?? PIXI_CONFIG.TEXTURE_POOL_SIZE,
      },
    };
  }

  /**
   * Initialize PIXI with timeout protection
   */
  private async initializeWithTimeout(
    config: Required<PixiConfig>
  ): Promise<void> {
    const initPromise = this.app!.init({
      width: this.container!.clientWidth || RENDERING.RESOLUTION,
      height: this.container!.clientHeight || RENDERING.RESOLUTION,
      backgroundColor: RENDERING.BACKGROUND_COLOR,
      antialias: RENDERING.ANTIALIAS,
      resolution: RENDERING.RESOLUTION,
      powerPreference: RENDERING.POWER_PREFERENCE,
    });

    // Race against timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`PIXI initialization timeout after ${config.maxInitTime}ms`)
        );
      }, config.maxInitTime);
    });

    await Promise.race([initPromise, timeoutPromise]);
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.app) return;

    // Monitor FPS using PIXI ticker
    this.app.ticker.add(() => {
      this.frameCount++;
      const currentTime = performance.now();

      if (this.lastFrameTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        const fps = 1000 / deltaTime;

        // Update FPS history
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > RENDERING_PERFORMANCE.SAMPLE_SIZE) {
          this.fpsHistory.shift();
        }

        // Update current FPS
        this.performanceMetrics.fps.current = fps;
      }

      this.lastFrameTime = currentTime;
    });
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    if (this.fpsHistory.length > 0) {
      this.performanceMetrics.fps.average =
        this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
        this.fpsHistory.length;
      this.performanceMetrics.fps.min = Math.min(...this.fpsHistory);
      this.performanceMetrics.fps.max = Math.max(...this.fpsHistory);
    }

    // Update memory metrics (if available)
    if (
      'memory' in performance &&
      (
        performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
        }
      ).memory
    ) {
      const memory = (
        performance as Performance & {
          memory: { usedJSHeapSize: number; totalJSHeapSize: number };
        }
      ).memory;
      this.performanceMetrics.memory.used = memory.usedJSHeapSize;
      this.performanceMetrics.memory.total = memory.totalJSHeapSize;
      this.performanceMetrics.memory.percentage =
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

      if (memory.usedJSHeapSize > this.performanceMetrics.memory.peak) {
        this.performanceMetrics.memory.peak = memory.usedJSHeapSize;
      }
    }
  }

  /**
   * Update rendering metrics
   */
  private updateRenderingMetrics(): void {
    if (!this.app) return;

    this.performanceMetrics.rendering.textures = this.app.stage.children.length;
    this.performanceMetrics.loading.totalAssets++;
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): PerformanceMetrics {
    return {
      fps: {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
        peak: 0,
      },
      rendering: {
        drawCalls: 0,
        triangles: 0,
        textures: 0,
        shaders: 0,
      },
      loading: {
        totalAssets: 0,
        loadedAssets: 0,
        failedAssets: 0,
        averageLoadTime: 0,
      },
    };
  }
}
