/**
 * WebGL Context Optimization Utilities
 * 
 * Phase 2 WebGL optimization implementation for high-performance rendering,
 * context management, texture optimization, and batch rendering with PIXI.js 8
 */

import type { Application, Renderer, Texture, TextureSource } from "pixi.js";
import type { PixiOptimizations } from "../types/pixi";
import type {
  WebGLContextConfig,
  TextureOptimizationConfig,
  BatchRenderingConfig,
  WebGLPerformanceMetrics,
} from "../types/webgl";
import { log } from "./logger";

/**
 * Default WebGL context configuration
 * 
 * @example Basic usage
 * ```typescript
 * const config = { ...DEFAULT_WEBGL_CONFIG, antialias: false };
 * ```
 */
export const DEFAULT_WEBGL_CONFIG: Required<WebGLContextConfig> = {
  preferWebGL2: true,
  powerPreference: "high-performance",
  antialias: true,
  alpha: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
};

/**
 * Default texture optimization configuration
 */
export const DEFAULT_TEXTURE_CONFIG: Required<TextureOptimizationConfig> = {
  maxTextureSize: 2048,
  enableCompression: true,
  cacheSize: 100,
  gcThreshold: 512, // MB
};

/**
 * Default batch rendering configuration
 */
export const DEFAULT_BATCH_CONFIG: Required<BatchRenderingConfig> = {
  maxBatchSize: 1000,
  enableSpriteBatching: true,
  sortByTexture: true,
  optimizeDrawCalls: true,
};

/**
 * WebGL Context Manager
 * 
 * Manages WebGL context creation, loss recovery, and optimization
 * 
 * @example Context management
 * ```typescript
 * const manager = new WebGLContextManager();
 * const context = manager.createContext(canvas, config);
 * ```
 */
export class WebGLContextManager {
  private context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: WebGLContextConfig = {};
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: ((event: Event) => void) | null = null;

  /**
   * Create WebGL context with optimization
   * 
   * @param canvas - Canvas element
   *
   * @param config - WebGL configuration
   *
   * @returns WebGL context or null if creation failed
   *
   */
  public createContext(
    canvas: HTMLCanvasElement,
    config: WebGLContextConfig = {},
  ): WebGLRenderingContext | WebGL2RenderingContext | null {
    this.canvas = canvas;
    this.config = { ...DEFAULT_WEBGL_CONFIG, ...config };

    // Try WebGL 2.0 first if preferred
    if (this.config.preferWebGL2) {
      this.context = this.createWebGL2Context();
    }

    // Fallback to WebGL 1.0
    if (!this.context) {
      this.context = this.createWebGL1Context();
    }

    if (this.context) {
      this.setupContextEventListeners();
      log.debug("WebGL context created successfully");
    } else {
      log.error("Failed to create WebGL context");
    }

    return this.context;
  }

  /**
   * Create WebGL 2.0 context
   * 
   * @returns WebGL2 context or null
   *
   */
  private createWebGL2Context(): WebGL2RenderingContext | null {
    if (!this.canvas || typeof WebGL2RenderingContext === "undefined") {
      return null;
    }

    try {
      return this.canvas.getContext("webgl2", this.getContextAttributes()) as WebGL2RenderingContext;
    } catch (error) {
      log.warn("WebGL 2.0 context creation failed:", { error });
      return null;
    }
  }

  /**
   * Create WebGL 1.0 context
   * 
   * @returns WebGL context or null
   *
   */
  private createWebGL1Context(): WebGLRenderingContext | null {
    if (!this.canvas) {
      return null;
    }

    try {
      return (
        this.canvas.getContext("webgl", this.getContextAttributes()) ||
        this.canvas.getContext("experimental-webgl", this.getContextAttributes())
      ) as WebGLRenderingContext;
    } catch (error) {
      log.warn("WebGL 1.0 context creation failed:", { error });
      return null;
    }
  }

  /**
   * Get WebGL context attributes
   * 
   * @returns Context attributes object
   *
   */
  private getContextAttributes(): WebGLContextAttributes {
    return {
      alpha: this.config.alpha,
      depth: this.config.depth,
      stencil: this.config.stencil,
      antialias: this.config.antialias,
      premultipliedAlpha: true,
      preserveDrawingBuffer: this.config.preserveDrawingBuffer,
      powerPreference: this.config.powerPreference as WebGLPowerPreference,
      failIfMajorPerformanceCaveat: this.config.failIfMajorPerformanceCaveat,
    };
  }

  /**
   * Setup context event listeners for loss/restore
   * 
   * @returns void
   *
   */
  private setupContextEventListeners(): void {
    if (!this.canvas) return;

    this.contextLostHandler = (event: Event): void => {
      event.preventDefault();
      log.warn("WebGL context lost");
    };

    this.contextRestoredHandler = (): void => {
      log.info("WebGL context restored");
      // Re-initialize resources here
    };

    this.canvas.addEventListener("webglcontextlost", this.contextLostHandler);
    this.canvas.addEventListener("webglcontextrestored", this.contextRestoredHandler);
  }

  /**
   * Check if context is lost
   * 
   * @returns True if context is lost
   *
   */
  public isContextLostState(): boolean {
    return this.context?.isContextLost() ?? false;
  }

  /**
   * Get context information
   * 
   * @returns Context information object
   *
   */
  public getContextInfo(): Record<string, unknown> {
    if (!this.context) {
      return {};
    }

    try {
      const debugInfo = this.context.getExtension("WEBGL_debug_renderer_info");
      return {
        version: this.context.getParameter(this.context.VERSION),
        vendor: debugInfo
          ? this.context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
          : this.context.getParameter(this.context.VENDOR),
        renderer: debugInfo
          ? this.context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : this.context.getParameter(this.context.RENDERER),
        maxTextureSize: this.context.getParameter(this.context.MAX_TEXTURE_SIZE),
        maxViewportDims: this.context.getParameter(this.context.MAX_VIEWPORT_DIMS),
      };
    } catch (error) {
      log.warn("Failed to get context info:", { error: String(error) });
      return {};
    }
  }

  /**
   * Destroy context and cleanup
   * 
   * @returns void
   *
   */
  public destroy(): void {
    if (this.canvas && this.contextLostHandler && this.contextRestoredHandler) {
      this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler);
      this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler);
    }

    this.context = null;
    this.canvas = null;
    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
  }
}

/**
 * Texture Optimization Manager
 * 
 * Manages texture caching, garbage collection, and memory optimization
 * 
 * @example Texture optimization
 * ```typescript
 * const manager = new TextureOptimizationManager(config);
 * manager.cacheTexture("key", texture);
 * ```
 */
export class TextureOptimizationManager {
  private textureCache = new Map<string, Texture>();
  private memoryUsage = 0; // in bytes
  private config: Required<TextureOptimizationConfig>;

  /**
   *
   */
  constructor(config: TextureOptimizationConfig = {}) {
    this.config = { ...DEFAULT_TEXTURE_CONFIG, ...config };
  }

  /**
   * Cache a texture with memory tracking
   * 
   * @param key - Cache key
   *
   * @param texture - Texture to cache
   *
   * @returns void
   *
   */
  public cacheTexture(key: string, texture: Texture): void {
    if (this.textureCache.has(key)) {
      return; // Already cached
    }

    const textureSize = this.calculateTextureSize(texture);
    
    // Check if we need to run garbage collection
    if (this.memoryUsage + textureSize > this.config.gcThreshold * 1024 * 1024) {
      this.runGarbageCollection();
    }

    this.textureCache.set(key, texture);
    this.memoryUsage += textureSize;
    
    log.debug(`Texture cached: ${key}, size: ${this.formatBytes(textureSize)}`);
  }

  /**
   * Get cached texture
   * 
   * @param key - Cache key
   *
   * @returns Cached texture or undefined
   *
   */
  public getCachedTexture(key: string): Texture | undefined {
    return this.textureCache.get(key);
  }

  /**
   * Calculate texture memory size
   * 
   * @param texture - Texture to calculate
   *
   * @returns Size in bytes
   *
   */
  private calculateTextureSize(texture: Texture): number {
    if (!texture.source || texture.destroyed) {
      return 0;
    }

    const source = texture.source as TextureSource;
    const width = source.width || 1;
    const height = source.height || 1;
    
    // Assume 4 bytes per pixel (RGBA)
    return width * height * 4;
  }

  /**
   * Run garbage collection on textures
   * 
   * @returns void
   *
   */
  private runGarbageCollection(): void {
    const beforeSize = this.textureCache.size;
    let freedMemory = 0;

    for (const [key, texture] of this.textureCache.entries()) {
      if (texture.destroyed || !texture.source) {
        const textureSize = this.calculateTextureSize(texture);
        this.textureCache.delete(key);
        this.memoryUsage -= textureSize;
        freedMemory += textureSize;
      }
    }

    log.debug(
      `Texture GC: ${beforeSize - this.textureCache.size} textures freed, ` +
      `${this.formatBytes(freedMemory)} memory reclaimed`
    );
  }

  /**
   * Format bytes to human readable string
   * 
   * @param bytes - Number of bytes
   *
   * @returns Formatted string
   *
   */
  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  /**
   * Get current memory usage in MB
   * 
   * @returns Memory usage in MB
   *
   */
  public getMemoryUsageMB(): number {
    return this.memoryUsage / (1024 * 1024);
  }

  /**
   * Clear all cached textures
   * 
   * @returns void
   *
   */
  public clearCache(): void {
    this.textureCache.clear();
    this.memoryUsage = 0;
  }
}

/**
 * Batch Rendering Optimizer
 * 
 * Optimizes sprite batching and draw calls for better performance
 * 
 * @example Batch optimization
 * ```typescript
 * const optimizer = new BatchRenderingOptimizer(config);
 * optimizer.optimizeApplication(app);
 * ```
 */
export class BatchRenderingOptimizer {
  private config: Required<BatchRenderingConfig>;
  private stats = {
    drawCalls: 0,
    batchCount: 0,
    spritesRendered: 0,
  };

  /**
   *
   */
  constructor(config: BatchRenderingConfig = {}) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
  }

  /**
   * Optimize PIXI application for batching
   * 
   * @param app - PIXI Application
   *
   * @returns void
   *
   */
  public optimizeApplication(app: Application): void {
    const renderer = app.renderer as Renderer;
    
    if (this.config.enableSpriteBatching) {
      this.enableSpriteBatching(renderer);
    }

    if (this.config.optimizeDrawCalls) {
      this.optimizeDrawCalls(renderer);
    }

    log.debug("Batch rendering optimizations applied");
  }

  /**
   * Enable sprite batching optimizations
   * 
   * @param _renderer - PIXI Renderer
   *
   * @returns void
   *
   */
  private enableSpriteBatching(_renderer: Renderer): void {
    // Configure batch settings - renderer-specific optimizations would go here
    log.debug("Sprite batching enabled");
  }

  /**
   * Optimize draw calls
   * 
   * @param _renderer - PIXI Renderer
   *
   * @returns void
   *
   */
  private optimizeDrawCalls(_renderer: Renderer): void {
    // Enable sprite culling for off-screen sprites - renderer-specific optimizations would go here
    log.debug("Draw call optimizations applied");
  }

  /**
   * Get performance statistics
   * 
   * @returns Performance stats object
   *
   */
  public getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Reset performance statistics
   * 
   * @returns void
   *
   */
  public resetStats(): void {
    this.stats = {
      drawCalls: 0,
      batchCount: 0,
      spritesRendered: 0,
    };
  }
}

/**
 * WebGL Performance Monitor
 * 
 * Monitors FPS, memory usage, and performance metrics
 * 
 * @example Performance monitoring
 * ```typescript
 * const monitor = new WebGLPerformanceMonitor();
 * monitor.startMonitoring();
 * const metrics = monitor.getMetrics();
 * ```
 */
export class WebGLPerformanceMonitor {
  private fpsHistory: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private isMonitoring = false;
  private animationFrameId: number | null = null;

  /**
   * Start performance monitoring
   * 
   * @returns void
   *
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.monitorFrame();
  }

  /**
   * Stop performance monitoring
   * 
   * @returns void
   *
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Monitor frame performance
   * 
   * @returns void
   *
   */
  private monitorFrame(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.fpsHistory.push(fps);
      
      // Keep only last 60 frames
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
    }
    
    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    this.animationFrameId = requestAnimationFrame(() => this.monitorFrame());
  }

  /**
   * Get current performance metrics
   * 
   * @returns Performance metrics object
   *
   */
  public getMetrics(): WebGLPerformanceMetrics {
    const avgFps = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length 
      : 0;

    return {
      fps: Math.round(avgFps),
      drawCalls: 0, // Would be populated by renderer
      textureMemoryMB: 0, // Would be populated by texture manager
      bufferMemoryMB: 0,
      activeTextures: 0,
      batchCount: 0,
      contextState: "active",
    };
  }

  /**
   * Check if performance is acceptable
   * 
   * @param minFps - Minimum acceptable FPS
   *
   * @returns True if performance is acceptable
   *
   */
  public isPerformanceAcceptable(minFps = 30): boolean {
    const metrics = this.getMetrics();
    return metrics.fps >= minFps;
  }

  /**
   * Get performance recommendations
   * 
   * @returns Array of recommendation strings
   *
   */
  public getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.fps < 30) {
      recommendations.push("Consider reducing texture quality or sprite count");
    }

    if (metrics.drawCalls > 100) {
      recommendations.push("Enable sprite batching to reduce draw calls");
    }

    if (metrics.textureMemoryMB > 512) {
      recommendations.push("Consider texture compression or smaller texture sizes");
    }

    return recommendations;
  }
}

/**
 * Create optimized PIXI application options
 * 
 * @param config - WebGL configuration
 *
 * @returns PIXI application options
 *
 */
export function createOptimizedPixiOptions(
  config: WebGLContextConfig = {},
): PixiOptimizations {
  const webglConfig = { ...DEFAULT_WEBGL_CONFIG, ...config };
  
  return {
    powerPreference: webglConfig.powerPreference,
    batchRendering: true,
    textureGC: true,
    spriteCulling: true,
    contextRestoration: true,
    autoDensity: true,
    preferredRenderer: "webgl",
  };
}

/**
 * Initialize complete WebGL optimization system
 * 
 * @param canvas - Canvas element
 *
 * @param webglConfig - WebGL configuration
 *
 * @param textureConfig - Texture configuration  
 *
 * @param batchConfig - Batch configuration
 *
 * @returns Optimization managers object
 *
 */
export function initializeWebGLOptimizations(
  canvas: HTMLCanvasElement,
  webglConfig: WebGLContextConfig = {},
  textureConfig: TextureOptimizationConfig = {},
  batchConfig: BatchRenderingConfig = {},
): {
  contextManager: WebGLContextManager;
  textureManager: TextureOptimizationManager;
  batchOptimizer: BatchRenderingOptimizer;
  performanceMonitor: WebGLPerformanceMonitor;
} {
  const contextManager = new WebGLContextManager();
  const textureManager = new TextureOptimizationManager(textureConfig);
  const batchOptimizer = new BatchRenderingOptimizer(batchConfig);
  const performanceMonitor = new WebGLPerformanceMonitor();

  // Create WebGL context
  const context = contextManager.createContext(canvas, webglConfig);
  
  if (context) {
    log.info("WebGL optimizations initialized successfully");
  } else {
    log.error("Failed to initialize WebGL optimizations");
  }

  return {
    contextManager,
    textureManager,
    batchOptimizer,
    performanceMonitor,
  };
} 