/**
 * Tests for WebGL optimization utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  WebGLContextManager,
  TextureOptimizationManager,
  BatchRenderingOptimizer,
  WebGLPerformanceMonitor,
  createOptimizedPixiOptions,
  initializeWebGLOptimizations,
  DEFAULT_WEBGL_CONFIG,
  DEFAULT_TEXTURE_CONFIG,
  DEFAULT_BATCH_CONFIG,
} from "../../utils/webgl-optimization";

// Mock logger
vi.mock("../../utils/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("WebGL Optimization Utilities", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockWebGLContext: WebGLRenderingContext;
  let _mockWebGL2Context: WebGL2RenderingContext;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = {
      getContext: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;

    // Create mock WebGL contexts
    mockWebGLContext = {
      isContextLost: vi.fn().mockReturnValue(false),
      getParameter: vi.fn(),
      getExtension: vi.fn(),
    } as unknown as WebGLRenderingContext;

    _mockWebGL2Context = {
      isContextLost: vi.fn().mockReturnValue(false),
      getParameter: vi.fn(),
      getExtension: vi.fn(),
    } as unknown as WebGL2RenderingContext;

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("WebGLContextManager", () => {
    let manager: WebGLContextManager;

    beforeEach(() => {
      manager = new WebGLContextManager();
    });

    it("should create WebGL context when WebGL2 unavailable", () => {
      // Mock WebGL2 unavailable, WebGL1 available
      vi.mocked(mockCanvas.getContext)
        .mockReturnValueOnce(null) // webgl2 fails
        .mockReturnValueOnce(mockWebGLContext); // webgl succeeds

      const context = manager.createContext(mockCanvas, { preferWebGL2: true });
      
      expect(context).toBe(mockWebGLContext);
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl", expect.any(Object));
    });

    it("should fallback to WebGL 1.0 when WebGL 2.0 unavailable", () => {
      // Mock WebGL2 unavailable, WebGL1 available
      vi.mocked(mockCanvas.getContext)
        .mockReturnValueOnce(null) // webgl2 fails
        .mockReturnValueOnce(mockWebGLContext); // webgl succeeds
      
      const context = manager.createContext(mockCanvas, { preferWebGL2: true });
      
      expect(context).toBe(mockWebGLContext);
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl", expect.any(Object));
    });

    it("should return null when no WebGL context available", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(null);
      
      const context = manager.createContext(mockCanvas);
      
      expect(context).toBeNull();
    });

    it("should setup context event listeners", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(mockWebGLContext);
      
      manager.createContext(mockCanvas);
      
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith("webglcontextlost", expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith("webglcontextrestored", expect.any(Function));
    });

    it("should check context lost state", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(mockWebGLContext);
      vi.mocked(mockWebGLContext.isContextLost).mockReturnValue(true);
      
      manager.createContext(mockCanvas);
      const isLost = manager.isContextLostState();
      
      expect(isLost).toBe(true);
    });

    it("should get context information", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(mockWebGLContext);
      vi.mocked(mockWebGLContext.getParameter).mockImplementation((param: number) => {
        switch (param) {
          case mockWebGLContext.VERSION: return "WebGL 1.0";
          case mockWebGLContext.VENDOR: return "Test Vendor";
          case mockWebGLContext.RENDERER: return "Test Renderer";
          case mockWebGLContext.MAX_TEXTURE_SIZE: return 2048;
          case mockWebGLContext.MAX_VIEWPORT_DIMS: return [2048, 2048];
          default: return null;
        }
      });
      
      manager.createContext(mockCanvas);
      const info = manager.getContextInfo();
      
      expect(info).toHaveProperty("version");
      expect(info).toHaveProperty("vendor");
      expect(info).toHaveProperty("renderer");
    });

    it("should destroy properly", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(mockWebGLContext);
      
      manager.createContext(mockCanvas);
      manager.destroy();
      
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith("webglcontextlost", expect.any(Function));
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith("webglcontextrestored", expect.any(Function));
    });

    it("should handle context creation errors gracefully", () => {
      vi.mocked(mockCanvas.getContext).mockImplementation(() => {
        throw new Error("Context creation failed");
      });
      
      const context = manager.createContext(mockCanvas);
      
      expect(context).toBeNull();
    });

    it("should use custom WebGL configuration", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(mockWebGLContext);
      
      const customConfig = {
        antialias: false,
        powerPreference: "low-power" as const,
      };
      
      manager.createContext(mockCanvas, customConfig);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl", expect.objectContaining({
        antialias: false,
        powerPreference: "low-power",
      }));
    });
  });

  describe("TextureOptimizationManager", () => {
    let manager: TextureOptimizationManager;
    let mockTexture: any;

    beforeEach(() => {
      manager = new TextureOptimizationManager();
      mockTexture = {
        source: {
          width: 512,
          height: 512,
        },
        destroyed: false,
      };
    });

    it("should cache texture successfully", () => {
      manager.cacheTexture("test-texture", mockTexture);
      
      const cached = manager.getCachedTexture("test-texture");
      expect(cached).toBe(mockTexture);
    });

    it("should return cached texture if available", () => {
      // First cache
      manager.cacheTexture("test-texture", mockTexture);
      
      // Second call should return cached version
      const cached = manager.getCachedTexture("test-texture");
      expect(cached).toBe(mockTexture);
    });

    it("should not cache duplicate textures", () => {
      manager.cacheTexture("test-texture", mockTexture);
      manager.cacheTexture("test-texture", mockTexture); // Should not duplicate
      
      const cached = manager.getCachedTexture("test-texture");
      expect(cached).toBe(mockTexture);
    });

    it("should track memory usage", () => {
      manager.cacheTexture("test-texture", mockTexture);
      
      const memoryUsage = manager.getMemoryUsageMB();
      expect(memoryUsage).toBeGreaterThan(0);
    });

    it("should handle destroyed textures in GC", () => {
      const destroyedTexture = {
        ...mockTexture,
        destroyed: true,
      };
      
      manager.cacheTexture("destroyed-texture", destroyedTexture);
      
      // Force GC by adding many textures
      for (let i = 0; i < 300; i++) {
        const texture = { ...mockTexture };
        manager.cacheTexture(`texture-${i}`, texture);
      }
      
      // Should not throw
      expect(() => manager.getMemoryUsageMB()).not.toThrow();
    });

    it("should clear cache", () => {
      manager.cacheTexture("test-texture", mockTexture);
      
      manager.clearCache();
      
      const cached = manager.getCachedTexture("test-texture");
      expect(cached).toBeUndefined();
      expect(manager.getMemoryUsageMB()).toBe(0);
    });

    it("should handle textures without source", () => {
      const textureWithoutSource = {
        source: null,
        destroyed: false,
      } as any; // Use any for simplified mock
      
      expect(() => {
        manager.cacheTexture("no-source", textureWithoutSource);
      }).not.toThrow();
    });

    it("should handle custom configuration", () => {
      const customManager = new TextureOptimizationManager({
        maxTextureSize: 1024,
        cacheSize: 50,
      });
      
      expect(() => {
        customManager.cacheTexture("test", mockTexture);
      }).not.toThrow();
    });
  });

  describe("BatchRenderingOptimizer", () => {
    let optimizer: BatchRenderingOptimizer;
    let mockApp: any;

    beforeEach(() => {
      optimizer = new BatchRenderingOptimizer();
      mockApp = {
        renderer: {
          // Mock renderer properties
        },
      };
    });

    it("should optimize application", () => {
      expect(() => {
        optimizer.optimizeApplication(mockApp);
      }).not.toThrow();
    });

    it("should get initial statistics", () => {
      const stats = optimizer.getStats();
      
      expect(stats).toHaveProperty("drawCalls");
      expect(stats).toHaveProperty("batchCount");
      expect(stats).toHaveProperty("spritesRendered");
      expect(stats.drawCalls).toBe(0);
      expect(stats.batchCount).toBe(0);
      expect(stats.spritesRendered).toBe(0);
    });

    it("should reset statistics", () => {
      optimizer.resetStats();
      
      const stats = optimizer.getStats();
      expect(stats.drawCalls).toBe(0);
      expect(stats.batchCount).toBe(0);
      expect(stats.spritesRendered).toBe(0);
    });

    it("should handle custom configuration", () => {
      const customOptimizer = new BatchRenderingOptimizer({
        maxBatchSize: 500,
        enableSpriteBatching: false,
      });
      
      expect(() => {
        customOptimizer.optimizeApplication(mockApp);
      }).not.toThrow();
    });

    it("should not modify stats object reference", () => {
      const stats1 = optimizer.getStats();
      const stats2 = optimizer.getStats();
      
      expect(stats1).not.toBe(stats2); // Should be different objects
      expect(stats1).toEqual(stats2); // But with same values
    });
  });

  describe("WebGLPerformanceMonitor", () => {
    let monitor: WebGLPerformanceMonitor;

    beforeEach(() => {
      monitor = new WebGLPerformanceMonitor();
      
      // Mock performance.now
      vi.spyOn(performance, "now").mockReturnValue(1000);
      
      // Mock requestAnimationFrame
      global.requestAnimationFrame = vi.fn().mockImplementation((callback: FrameRequestCallback) => {
        setTimeout(callback, 16); // ~60fps
        return 1;
      });
      
      global.cancelAnimationFrame = vi.fn();
    });

    it("should start and stop monitoring", () => {
      monitor.startMonitoring();
      monitor.stopMonitoring();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it("should get initial metrics", () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics).toHaveProperty("fps");
      expect(metrics).toHaveProperty("drawCalls");
      expect(metrics).toHaveProperty("textureMemoryMB");
      expect(metrics).toHaveProperty("contextState");
    });

    it("should check performance acceptability", () => {
      const isAcceptable = monitor.isPerformanceAcceptable();
      
      expect(typeof isAcceptable).toBe("boolean");
    });

    it("should provide performance recommendations", () => {
      const recommendations = monitor.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should not start monitoring twice", () => {
      monitor.startMonitoring();
      monitor.startMonitoring(); // Should not start again
      
      // Should only call requestAnimationFrame once initially
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe("Utility Functions", () => {
    it("should create optimized PIXI options", () => {
      const options = createOptimizedPixiOptions();
      
      expect(options).toHaveProperty("autoDensity");
      expect(options).toHaveProperty("powerPreference");
      expect(options).toHaveProperty("batchRendering");
      expect(options).toHaveProperty("textureGC");
    });

    it("should create optimized PIXI options with custom config", () => {
      const webglConfig = {
        powerPreference: "low-power" as const,
        antialias: false,
      };
      
      const options = createOptimizedPixiOptions(webglConfig);
      
      expect(options.powerPreference).toBe("low-power");
    });

    it("should initialize WebGL optimizations", () => {
      vi.mocked(mockCanvas.getContext).mockReturnValue(mockWebGLContext);
      
      const optimizations = initializeWebGLOptimizations(mockCanvas);
      
      expect(optimizations).toHaveProperty("contextManager");
      expect(optimizations).toHaveProperty("textureManager");
      expect(optimizations).toHaveProperty("batchOptimizer");
      expect(optimizations).toHaveProperty("performanceMonitor");
    });
  });

  describe("Default Configurations", () => {
    it("should have valid default WebGL config", () => {
      expect(DEFAULT_WEBGL_CONFIG.preferWebGL2).toBe(true);
      expect(DEFAULT_WEBGL_CONFIG.powerPreference).toBe("high-performance");
      expect(DEFAULT_WEBGL_CONFIG.antialias).toBe(true);
    });

    it("should have valid default texture config", () => {
      expect(DEFAULT_TEXTURE_CONFIG.maxTextureSize).toBe(2048);
      expect(DEFAULT_TEXTURE_CONFIG.enableCompression).toBe(true);
      expect(DEFAULT_TEXTURE_CONFIG.cacheSize).toBe(100);
    });

    it("should have valid default batch config", () => {
      expect(DEFAULT_BATCH_CONFIG.maxBatchSize).toBe(1000);
      expect(DEFAULT_BATCH_CONFIG.enableSpriteBatching).toBe(true);
      expect(DEFAULT_BATCH_CONFIG.sortByTexture).toBe(true);
    });
  });
}); 