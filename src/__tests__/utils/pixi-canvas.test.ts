/**
 * Tests for PIXI Canvas Utilities
 * 
 * Tests the Phase 2 canvas system implementation including dimension calculation,
 * aspect ratio management, and responsive behavior
 */

import { describe, it, expect } from "vitest";
import {
  calculatePixiCanvasDimensions,
  calculateSpriteScale,
  getCurrentPixiBreakpoint,
  hasPixiDimensionsChanged,
  createPixiCanvasConfig,
  validatePixiCanvasConfig,
  createPixiAppOptions,
  DEFAULT_PIXI_CANVAS_CONFIG,
  DEFAULT_PIXI_BREAKPOINTS,
  DEFAULT_PIXI_OPTIMIZATIONS,
} from "../../utils/pixi-canvas";
import type {
  CanvasConfig,
  CanvasDimensions,
  ResponsiveBreakpoint,
} from "../../types/pixi";

describe("PIXI Canvas Utilities", () => {
  describe("calculatePixiCanvasDimensions", () => {
    it("should calculate fixed mode dimensions correctly", () => {
      const config: CanvasConfig = {
        mode: "fixed",
        dimensions: { width: 800, height: 600, pixelRatio: 1 },
        aspectRatio: "cover",
      };

      const result = calculatePixiCanvasDimensions(config, 1200, 900);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.pixelRatio).toBe(1);
    });

    it("should calculate fullscreen mode dimensions correctly", () => {
      const config: CanvasConfig = {
        mode: "fullscreen",
        dimensions: { width: 800, height: 600, pixelRatio: 2 },
        aspectRatio: "cover",
      };

      const result = calculatePixiCanvasDimensions(config, 1200, 900);

      expect(result.width).toBe(1200);
      expect(result.height).toBe(900);
      expect(result.pixelRatio).toBe(2);
    });

    it("should calculate responsive mode dimensions correctly", () => {
      const breakpoints: ResponsiveBreakpoint[] = [
        {
          name: "mobile",
          minWidth: 0,
          dimensions: { width: 375, height: 667 },
          aspectRatio: "cover",
        },
        {
          name: "desktop",
          minWidth: 1024,
          dimensions: { width: 1200, height: 800 },
          aspectRatio: "cover",
        },
      ];

      const config: CanvasConfig = {
        mode: "responsive",
        dimensions: { width: 800, height: 600, pixelRatio: 1 },
        aspectRatio: "cover",
        breakpoints,
      };

      // Test mobile breakpoint
      const mobileResult = calculatePixiCanvasDimensions(config, 375, 667);
      expect(mobileResult.width).toBe(375);
      expect(mobileResult.height).toBe(667);

      // Test desktop breakpoint
      const desktopResult = calculatePixiCanvasDimensions(config, 1200, 800);
      expect(desktopResult.width).toBe(1200);
      expect(desktopResult.height).toBe(800);
    });

    it("should apply dimension constraints correctly", () => {
      const config: CanvasConfig = {
        mode: "fixed",
        dimensions: {
          width: 800,
          height: 600,
          pixelRatio: 1,
          minWidth: 400,
          maxWidth: 1000,
          minHeight: 300,
          maxHeight: 700,
        },
        aspectRatio: "cover",
      };

      const result = calculatePixiCanvasDimensions(config, 1500, 1000);

      expect(result.width).toBe(800); // Within constraints
      expect(result.height).toBe(600); // Within constraints
    });
  });

  describe("calculateSpriteScale", () => {
    it("should calculate cover scaling correctly", () => {
      const result = calculateSpriteScale(400, 300, 800, 600, "cover");
      
      // Should scale to cover the target area
      const expectedScale = Math.max(800 / 400, 600 / 300);
      expect(result.scaleX).toBe(expectedScale);
      expect(result.scaleY).toBe(expectedScale);
    });

    it("should calculate contain scaling correctly", () => {
      const result = calculateSpriteScale(400, 300, 800, 600, "contain");
      
      // Should scale to fit within the target area
      const expectedScale = Math.min(800 / 400, 600 / 300);
      expect(result.scaleX).toBe(expectedScale);
      expect(result.scaleY).toBe(expectedScale);
    });

    it("should calculate fill scaling correctly", () => {
      const result = calculateSpriteScale(400, 300, 800, 600, "fill");
      
      expect(result.scaleX).toBe(800 / 400);
      expect(result.scaleY).toBe(600 / 300);
    });

    it("should return no scaling for none mode", () => {
      const result = calculateSpriteScale(400, 300, 800, 600, "none");
      
      expect(result.scaleX).toBe(1);
      expect(result.scaleY).toBe(1);
    });
  });

  describe("getCurrentPixiBreakpoint", () => {
    const breakpoints: ResponsiveBreakpoint[] = [
      { name: "mobile", minWidth: 0, dimensions: { width: 375, height: 667 } },
      { name: "tablet", minWidth: 768, dimensions: { width: 768, height: 1024 } },
      { name: "desktop", minWidth: 1024, dimensions: { width: 1200, height: 800 } },
    ];

    it("should return mobile breakpoint for small widths", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 375);
      expect(result).toBe("mobile");
    });

    it("should return tablet breakpoint for medium widths", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 800);
      expect(result).toBe("tablet");
    });

    it("should return desktop breakpoint for large widths", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 1200);
      expect(result).toBe("desktop");
    });

    it("should return the largest applicable breakpoint", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 1500);
      expect(result).toBe("desktop");
    });
  });

  describe("hasPixiDimensionsChanged", () => {
    const baseDimensions: CanvasDimensions = {
      width: 800,
      height: 600,
      pixelRatio: 1,
    };

    it("should detect width changes", () => {
      const newDimensions: CanvasDimensions = {
        ...baseDimensions,
        width: 900,
      };

      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions)).toBe(true);
    });

    it("should detect height changes", () => {
      const newDimensions: CanvasDimensions = {
        ...baseDimensions,
        height: 700,
      };

      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions)).toBe(true);
    });

    it("should detect pixel ratio changes", () => {
      const newDimensions: CanvasDimensions = {
        ...baseDimensions,
        pixelRatio: 2,
      };

      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions)).toBe(true);
    });

    it("should not detect changes within threshold", () => {
      const newDimensions: CanvasDimensions = {
        ...baseDimensions,
        width: 800.5,
      };

      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions, 1)).toBe(false);
    });

    it("should respect custom threshold", () => {
      const newDimensions: CanvasDimensions = {
        ...baseDimensions,
        width: 805,
      };

      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions, 10)).toBe(false);
      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions, 1)).toBe(true);
    });
  });

  describe("createPixiCanvasConfig", () => {
    it("should create config with defaults", () => {
      const config = createPixiCanvasConfig();

      expect(config.mode).toBe("fixed");
      expect(config.dimensions.width).toBe(800);
      expect(config.dimensions.height).toBe(600);
      expect(config.aspectRatio).toBe("cover");
    });

    it("should merge overrides correctly", () => {
      const overrides = {
        mode: "responsive" as const,
        dimensions: { width: 1200, height: 900 },
        aspectRatio: "contain" as const,
      };

      const config = createPixiCanvasConfig(overrides);

      expect(config.mode).toBe("responsive");
      expect(config.dimensions.width).toBe(1200);
      expect(config.dimensions.height).toBe(900);
      expect(config.aspectRatio).toBe("contain");
      expect(config.dimensions.pixelRatio).toBeDefined(); // Should preserve default
    });
  });

  describe("validatePixiCanvasConfig", () => {
    it("should validate valid config", () => {
      const config = createPixiCanvasConfig();
      const errors = validatePixiCanvasConfig(config);

      expect(errors).toHaveLength(0);
    });

    it("should detect invalid width", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 0, height: 600 },
      });
      const errors = validatePixiCanvasConfig(config);

      expect(errors).toContain("Canvas width must be greater than 0");
    });

    it("should detect invalid height", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 800, height: -100 },
      });
      const errors = validatePixiCanvasConfig(config);

      expect(errors).toContain("Canvas height must be greater than 0");
    });

    it("should detect invalid width constraints", () => {
      const config = createPixiCanvasConfig({
        dimensions: {
          width: 800,
          height: 600,
          minWidth: 1000,
          maxWidth: 500,
        },
      });
      const errors = validatePixiCanvasConfig(config);

      expect(errors).toContain("minWidth cannot be greater than maxWidth");
    });

    it("should detect invalid height constraints", () => {
      const config = createPixiCanvasConfig({
        dimensions: {
          width: 800,
          height: 600,
          minHeight: 800,
          maxHeight: 400,
        },
      });
      const errors = validatePixiCanvasConfig(config);

      expect(errors).toContain("minHeight cannot be greater than maxHeight");
    });

    it("should validate responsive breakpoints", () => {
      const invalidBreakpoints: ResponsiveBreakpoint[] = [
        { name: "mobile", minWidth: 0, dimensions: { width: 375, height: 667 } },
        { name: "tablet", minWidth: 0, dimensions: { width: 768, height: 1024 } }, // Same minWidth
      ];

      const config = createPixiCanvasConfig({
        mode: "responsive",
        breakpoints: invalidBreakpoints,
      });
      const errors = validatePixiCanvasConfig(config);

      expect(errors.some(error => error.includes("minWidth must be greater than previous breakpoint"))).toBe(true);
    });
  });

  describe("createPixiAppOptions", () => {
    it("should create PIXI app options from config", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 1200, height: 800 },
        backgroundColor: 0x123456,
        transparent: true,
        antialias: false,
      });

      const options = createPixiAppOptions(config);

      expect(options.width).toBe(1200);
      expect(options.height).toBe(800);
      expect(options.backgroundColor).toBe(0x123456);
      expect(options.transparent).toBe(true);
      expect(options.antialias).toBe(false);
    });

    it("should apply PIXI optimizations", () => {
      const config = createPixiCanvasConfig();
      const pixiOptimizations = {
        resolution: 2,
        autoDensity: false,
        powerPreference: "low-power" as const,
      };

      const options = createPixiAppOptions(config, pixiOptimizations);

      expect(options.resolution).toBe(2);
      expect(options.autoDensity).toBe(false);
      expect(options.powerPreference).toBe("low-power");
    });

    it("should use defaults for missing values", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 800, height: 600 },
      });

      const options = createPixiAppOptions(config);

      expect(options.backgroundColor).toBe(0x000000);
      expect(options.transparent).toBe(false);
      expect(options.antialias).toBe(true);
      expect(options.resolution).toBeDefined();
      expect(options.autoDensity).toBe(true);
      expect(options.powerPreference).toBe("high-performance");
    });
  });

  describe("Default configurations", () => {
    it("should have valid default canvas config", () => {
      expect(DEFAULT_PIXI_CANVAS_CONFIG.mode).toBe("fixed");
      expect(DEFAULT_PIXI_CANVAS_CONFIG.dimensions.width).toBeGreaterThan(0);
      expect(DEFAULT_PIXI_CANVAS_CONFIG.dimensions.height).toBeGreaterThan(0);
      expect(DEFAULT_PIXI_CANVAS_CONFIG.aspectRatio).toBeDefined();
    });

    it("should have valid default breakpoints", () => {
      expect(DEFAULT_PIXI_BREAKPOINTS).toHaveLength(4);
      expect(DEFAULT_PIXI_BREAKPOINTS[0].name).toBe("mobile");
      expect(DEFAULT_PIXI_BREAKPOINTS[0].minWidth).toBe(0);
      
      // Breakpoints should be sorted by minWidth
      for (let i = 1; i < DEFAULT_PIXI_BREAKPOINTS.length; i++) {
        expect(DEFAULT_PIXI_BREAKPOINTS[i].minWidth).toBeGreaterThan(
          DEFAULT_PIXI_BREAKPOINTS[i - 1].minWidth
        );
      }
    });

    it("should have valid default optimizations", () => {
      expect(DEFAULT_PIXI_OPTIMIZATIONS.batchRendering).toBe(true);
      expect(DEFAULT_PIXI_OPTIMIZATIONS.textureGC).toBe(true);
      expect(DEFAULT_PIXI_OPTIMIZATIONS.spriteCulling).toBe(true);
      expect(DEFAULT_PIXI_OPTIMIZATIONS.maxTextureSize).toBeGreaterThan(0);
      expect(DEFAULT_PIXI_OPTIMIZATIONS.preferredRenderer).toBe("webgl");
    });
  });
}); 