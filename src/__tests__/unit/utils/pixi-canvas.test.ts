/**
 * Unit tests for PIXI Canvas utilities
 * Tests canvas dimension calculations, configuration management, and legacy prop handling
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePixiCanvasDimensions,
  calculateSpriteScale,
  getCurrentPixiBreakpoint,
  hasPixiDimensionsChanged,
  createPixiCanvasConfig,
  validatePixiCanvasConfig,
  createPixiAppOptions,
  getDefaultResponsiveCanvasConfig,
  DEFAULT_PIXI_CANVAS_CONFIG,
  DEFAULT_PIXI_BREAKPOINTS,
  DEFAULT_PIXI_OPTIMIZATIONS,
} from "../../../utils/pixi-canvas";
import type { CanvasConfig, CanvasDimensions, ResponsiveBreakpoint } from "../../../types/pixi";

describe("PIXI Canvas Utilities", () => {
  describe("calculatePixiCanvasDimensions", () => {
    it("should calculate fullscreen dimensions correctly", () => {
      const config: CanvasConfig = {
        mode: "fullscreen",
        dimensions: { width: 800, height: 600 },
        aspectRatio: "cover",
      };

      const result = calculatePixiCanvasDimensions(config, 1200, 900);

      expect(result).toEqual({
        width: 1200,
        height: 900,
        pixelRatio: expect.any(Number),
      });
    });

    it("should calculate fixed dimensions with constraints", () => {
      const config: CanvasConfig = {
        mode: "fixed",
        dimensions: {
          width: 800,
          height: 600,
          minWidth: 400,
          maxWidth: 1000,
          minHeight: 300,
          maxHeight: 800,
        },
        aspectRatio: "cover",
      };

      const result = calculatePixiCanvasDimensions(config, 1200, 900);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it("should calculate responsive dimensions based on breakpoints", () => {
      const breakpoints: ResponsiveBreakpoint[] = [
        {
          name: "mobile",
          minWidth: 0,
          dimensions: { width: 375, height: 667 },
        },
        {
          name: "desktop",
          minWidth: 1024,
          dimensions: { width: 1200, height: 800 },
        },
      ];

      const config: CanvasConfig = {
        mode: "responsive",
        dimensions: { width: 800, height: 600 },
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
          width: 2000, // Exceeds container
          height: 1500, // Exceeds container
          maxWidth: 1000,
          maxHeight: 800,
        },
        aspectRatio: "cover",
      };

      const result = calculatePixiCanvasDimensions(config, 1200, 900);

      expect(result.width).toBeLessThanOrEqual(1000);
      expect(result.height).toBeLessThanOrEqual(800);
    });
  });

  describe("calculateSpriteScale", () => {
    it("should calculate cover scaling correctly", () => {
      const result = calculateSpriteScale(800, 600, 1200, 900, "cover");
      const expectedScale = Math.max(1200 / 800, 900 / 600);
      
      expect(result.scaleX).toBe(expectedScale);
      expect(result.scaleY).toBe(expectedScale);
    });

    it("should calculate contain scaling correctly", () => {
      const result = calculateSpriteScale(800, 600, 1200, 900, "contain");
      const expectedScale = Math.min(1200 / 800, 900 / 600);
      
      expect(result.scaleX).toBe(expectedScale);
      expect(result.scaleY).toBe(expectedScale);
    });

    it("should calculate fill scaling correctly", () => {
      const result = calculateSpriteScale(800, 600, 1200, 900, "fill");
      
      expect(result.scaleX).toBe(1200 / 800);
      expect(result.scaleY).toBe(900 / 600);
    });

    it("should return no scaling for none mode", () => {
      const result = calculateSpriteScale(800, 600, 1200, 900, "none");
      
      expect(result.scaleX).toBe(1);
      expect(result.scaleY).toBe(1);
    });
  });

  describe("getCurrentPixiBreakpoint", () => {
    const breakpoints = DEFAULT_PIXI_BREAKPOINTS;

    it("should return correct breakpoint for mobile width", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 375);
      expect(result).toBe("mobile");
    });

    it("should return correct breakpoint for tablet width", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 800);
      expect(result).toBe("tablet");
    });

    it("should return correct breakpoint for desktop width", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 1200);
      expect(result).toBe("desktop");
    });

    it("should return correct breakpoint for large width", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 1500);
      expect(result).toBe("large");
    });

    it("should return first breakpoint for width below minimum", () => {
      const result = getCurrentPixiBreakpoint(breakpoints, 100);
      expect(result).toBe("mobile");
    });
  });

  describe("hasPixiDimensionsChanged", () => {
    const baseDimensions: CanvasDimensions = {
      width: 800,
      height: 600,
      pixelRatio: 1,
    };

    it("should detect width changes", () => {
      const newDimensions = { ...baseDimensions, width: 900 };
      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions)).toBe(true);
    });

    it("should detect height changes", () => {
      const newDimensions = { ...baseDimensions, height: 700 };
      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions)).toBe(true);
    });

    it("should detect pixel ratio changes", () => {
      const newDimensions = { ...baseDimensions, pixelRatio: 2 };
      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions)).toBe(true);
    });

    it("should not detect changes within threshold", () => {
      const newDimensions = { ...baseDimensions, width: 800.5 };
      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions, 1)).toBe(false);
    });

    it("should detect changes beyond threshold", () => {
      const newDimensions = { ...baseDimensions, width: 802 };
      expect(hasPixiDimensionsChanged(baseDimensions, newDimensions, 1)).toBe(true);
    });
  });

  describe("createPixiCanvasConfig", () => {
    it("should create config with defaults", () => {
      const config = createPixiCanvasConfig();
      
      expect(config).toEqual(expect.objectContaining({
        mode: "fixed",
        aspectRatio: "cover",
        highDPI: true,
        pixiOptimizations: true,
      }));
    });

    it("should merge overrides correctly", () => {
      const overrides = {
        mode: "responsive" as const,
        dimensions: { width: 1000, height: 800 },
      };
      
      const config = createPixiCanvasConfig(overrides);
      
      expect(config.mode).toBe("responsive");
      expect(config.dimensions.width).toBe(1000);
      expect(config.dimensions.height).toBe(800);
    });

    it("should include default breakpoints for responsive mode", () => {
      const config = createPixiCanvasConfig({ mode: "responsive" });
      
      expect(config.breakpoints).toEqual(DEFAULT_PIXI_BREAKPOINTS);
    });
  });

  describe("validatePixiCanvasConfig", () => {
    it("should validate valid configuration", () => {
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
        {
          name: "mobile",
          minWidth: 768,
          dimensions: { width: 375, height: 667 },
        },
        {
          name: "tablet",
          minWidth: 768, // Same as previous
          dimensions: { width: 768, height: 1024 },
        },
      ];

      const config = createPixiCanvasConfig({
        mode: "responsive",
        breakpoints: invalidBreakpoints,
      });
      const errors = validatePixiCanvasConfig(config);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("minWidth must be greater than previous breakpoint");
    });
  });

  describe("createPixiAppOptions", () => {
    it("should create PIXI app options from canvas config", () => {
      const config = createPixiCanvasConfig({
        dimensions: { width: 1000, height: 800 },
        backgroundColor: 0x123456,
        transparent: true,
        antialias: false,
      });

      const options = createPixiAppOptions(config);

      expect(options).toEqual({
        width: 1000,
        height: 800,
        backgroundColor: 0x123456,
        transparent: true,
        antialias: false,
        resolution: expect.any(Number),
        autoDensity: expect.any(Boolean),
        powerPreference: expect.any(String),
      });
    });

    it("should apply PIXI optimizations", () => {
      const config = createPixiCanvasConfig();
      const optimizations = {
        resolution: 2,
        autoDensity: false,
        powerPreference: "low-power" as const,
      };

      const options = createPixiAppOptions(config, optimizations);

      expect(options.resolution).toBe(2);
      expect(options.autoDensity).toBe(false);
      expect(options.powerPreference).toBe("low-power");
    });
  });

  describe("getDefaultResponsiveCanvasConfig", () => {
    it("should return responsive configuration", () => {
      const config = getDefaultResponsiveCanvasConfig();

      expect(config.mode).toBe("responsive");
      expect(config.aspectRatio).toBe("cover");
      expect(config.highDPI).toBe(true);
      expect(config.pixiOptimizations).toBe(true);
      expect(config.breakpoints).toEqual(DEFAULT_PIXI_BREAKPOINTS);
    });

    it("should include proper default dimensions", () => {
      const config = getDefaultResponsiveCanvasConfig();

      expect(config.dimensions.width).toBe(800);
      expect(config.dimensions.height).toBe(600);
      expect(config.dimensions.pixelRatio).toBeGreaterThan(0);
    });
  });

  describe("Default configurations", () => {
    it("should export valid default canvas config", () => {
      expect(DEFAULT_PIXI_CANVAS_CONFIG).toEqual({
        mode: "fixed",
        dimensions: expect.objectContaining({
          width: 800,
          height: 600,
          pixelRatio: expect.any(Number),
        }),
        aspectRatio: "cover",
        highDPI: true,
        pixiOptimizations: true,
        backgroundColor: 0x000000,
        transparent: false,
        antialias: true,
      });
    });

    it("should export valid default breakpoints", () => {
      expect(DEFAULT_PIXI_BREAKPOINTS).toHaveLength(4);
      expect(DEFAULT_PIXI_BREAKPOINTS[0].name).toBe("mobile");
      expect(DEFAULT_PIXI_BREAKPOINTS[1].name).toBe("tablet");
      expect(DEFAULT_PIXI_BREAKPOINTS[2].name).toBe("desktop");
      expect(DEFAULT_PIXI_BREAKPOINTS[3].name).toBe("large");
    });

    it("should export valid default optimizations", () => {
      expect(DEFAULT_PIXI_OPTIMIZATIONS).toEqual({
        batchRendering: true,
        textureGC: true,
        spriteCulling: true,
        maxTextureSize: 2048,
        textureCacheLimit: 100,
        contextRestoration: true,
        resolution: expect.any(Number),
        autoDensity: true,
        preferredRenderer: "webgl",
        powerPreference: "high-performance",
      });
    });
  });
}); 