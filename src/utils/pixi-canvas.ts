/**
 * PIXI.js Canvas Management Utilities
 * 
 * Phase 2 canvas system implementation for flexible canvas dimensions,
 * aspect ratio management, and responsive behavior with PIXI.js
 */

import type {
  CanvasDimensions,
  AspectRatioMode,
  ResponsiveBreakpoint,
  CanvasConfig,
  PixiOptimizations,
} from "../types/pixi";

/**
 * Default canvas configuration for PIXI applications
 */
export const DEFAULT_PIXI_CANVAS_CONFIG: CanvasConfig = {
  mode: "fixed",
  dimensions: {
    width: 800,
    height: 600,
    pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  },
  aspectRatio: "cover",
  highDPI: true,
  pixiOptimizations: true,
  backgroundColor: 0x000000,
  transparent: false,
  antialias: true,
};

/**
 * Default responsive breakpoints for PIXI canvas
 */
export const DEFAULT_PIXI_BREAKPOINTS: ResponsiveBreakpoint[] = [
  {
    name: "mobile",
    minWidth: 0,
    dimensions: { width: 375, height: 667 },
    aspectRatio: "cover",
  },
  {
    name: "tablet",
    minWidth: 768,
    dimensions: { width: 768, height: 1024 },
    aspectRatio: "cover",
  },
  {
    name: "desktop",
    minWidth: 1024,
    dimensions: { width: 1200, height: 800 },
    aspectRatio: "cover",
  },
  {
    name: "large",
    minWidth: 1440,
    dimensions: { width: 1440, height: 900 },
    aspectRatio: "cover",
  },
];

/**
 * Default PIXI optimization settings
 */
export const DEFAULT_PIXI_OPTIMIZATIONS: PixiOptimizations = {
  batchRendering: true,
  textureGC: true,
  spriteCulling: true,
  maxTextureSize: 2048,
  textureCacheLimit: 100,
  contextRestoration: true,
  resolution: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  autoDensity: true,
  preferredRenderer: "webgl",
  powerPreference: "high-performance",
};

/**
 * Calculate canvas dimensions based on mode and constraints
 *
 * @param config - Canvas configuration
 *
 * @param containerWidth - Container width in pixels
 *
 * @param containerHeight - Container height in pixels
 *
 * @returns Calculated canvas dimensions
 *
 */
export function calculatePixiCanvasDimensions(
  config: CanvasConfig,
  containerWidth: number,
  containerHeight: number,
): CanvasDimensions {
  const { mode, dimensions, breakpoints } = config;

  switch (mode) {
    case "fullscreen":
      return calculateFullscreenDimensions(dimensions, containerWidth, containerHeight);
    
    case "responsive":
      return calculateResponsiveDimensions(
        breakpoints || DEFAULT_PIXI_BREAKPOINTS,
        containerWidth,
        containerHeight,
      );
    
    case "fixed":
    default:
      return applyDimensionConstraints(dimensions, containerWidth, containerHeight);
  }
}

/**
 * Calculate fullscreen canvas dimensions
 *
 * @param baseDimensions - Base dimensions configuration
 *
 * @param containerWidth - Container width in pixels
 *
 * @param containerHeight - Container height in pixels
 *
 * @returns Fullscreen canvas dimensions
 *
 */
function calculateFullscreenDimensions(
  baseDimensions: CanvasDimensions,
  containerWidth: number,
  containerHeight: number,
): CanvasDimensions {
  return {
    ...baseDimensions,
    width: containerWidth,
    height: containerHeight,
    pixelRatio: baseDimensions.pixelRatio || (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
  };
}

/**
 * Calculate responsive canvas dimensions based on breakpoints
 *
 * @param breakpoints - Array of responsive breakpoints
 *
 * @param containerWidth - Container width in pixels
 *
 * @param containerHeight - Container height in pixels
 *
 * @returns Responsive canvas dimensions
 *
 */
function calculateResponsiveDimensions(
  breakpoints: ResponsiveBreakpoint[],
  containerWidth: number,
  containerHeight: number,
): CanvasDimensions {
  // Sort breakpoints by minWidth (ascending)
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);
  
  // Find the appropriate breakpoint
  const activeBreakpoint = sortedBreakpoints
    .reverse()
    .find(bp => containerWidth >= bp.minWidth) || sortedBreakpoints[0];

  return applyDimensionConstraints(activeBreakpoint.dimensions, containerWidth, containerHeight);
}

/**
 * Apply dimension constraints
 *
 * @param dimensions - Base dimensions to constrain
 *
 * @param containerWidth - Container width in pixels
 *
 * @param containerHeight - Container height in pixels
 *
 * @returns Constrained canvas dimensions
 *
 */
function applyDimensionConstraints(
  dimensions: CanvasDimensions,
  containerWidth: number,
  containerHeight: number,
): CanvasDimensions {
  let { width, height } = dimensions;
  const {
    minWidth = 0,
    maxWidth = Infinity,
    minHeight = 0,
    maxHeight = Infinity,
    pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  } = dimensions;

  // Apply width constraints
  width = Math.max(minWidth, Math.min(maxWidth, width));
  
  // Apply height constraints
  height = Math.max(minHeight, Math.min(maxHeight, height));

  // Ensure dimensions don't exceed container
  width = Math.min(width, containerWidth);
  height = Math.min(height, containerHeight);

  return {
    ...dimensions,
    width,
    height,
    pixelRatio,
  };
}

/**
 * Calculate sprite scaling for aspect ratio management
 *
 * @param spriteWidth - Original sprite width
 *
 * @param spriteHeight - Original sprite height
 *
 * @param targetWidth - Target width
 *
 * @param targetHeight - Target height
 *
 * @param aspectRatioMode - Aspect ratio mode
 *
 * @returns Scale factors for X and Y axes
 *
 */
export function calculateSpriteScale(
  spriteWidth: number,
  spriteHeight: number,
  targetWidth: number,
  targetHeight: number,
  aspectRatioMode: AspectRatioMode,
): { scaleX: number; scaleY: number } {
  switch (aspectRatioMode) {
    case "cover": {
      const scale = Math.max(targetWidth / spriteWidth, targetHeight / spriteHeight);
      return { scaleX: scale, scaleY: scale };
    }
    
    case "contain": {
      const scale = Math.min(targetWidth / spriteWidth, targetHeight / spriteHeight);
      return { scaleX: scale, scaleY: scale };
    }
    
    case "fill":
      return {
        scaleX: targetWidth / spriteWidth,
        scaleY: targetHeight / spriteHeight,
      };
    
    case "none":
    default:
      return { scaleX: 1, scaleY: 1 };
  }
}

/**
 * Get the current breakpoint name based on container width
 *
 * @param breakpoints - Array of responsive breakpoints
 *
 * @param containerWidth - Current container width
 *
 * @returns Name of the active breakpoint
 *
 */
export function getCurrentPixiBreakpoint(
  breakpoints: ResponsiveBreakpoint[],
  containerWidth: number,
): string {
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);
  
  const activeBreakpoint = sortedBreakpoints
    .reverse()
    .find(bp => containerWidth >= bp.minWidth) || sortedBreakpoints[0];

  return activeBreakpoint.name;
}

/**
 * Check if canvas dimensions have changed significantly
 *
 * @param oldDimensions - Previous dimensions
 *
 * @param newDimensions - New dimensions
 *
 * @param threshold - Change threshold in pixels (default: 1)
 *
 * @returns True if dimensions have changed beyond threshold
 *
 */
export function hasPixiDimensionsChanged(
  oldDimensions: CanvasDimensions,
  newDimensions: CanvasDimensions,
  threshold: number = 1,
): boolean {
  return (
    Math.abs(oldDimensions.width - newDimensions.width) > threshold ||
    Math.abs(oldDimensions.height - newDimensions.height) > threshold ||
    oldDimensions.pixelRatio !== newDimensions.pixelRatio
  );
}

/**
 * Create a canvas configuration with defaults
 *
 * @param overrides - Configuration overrides
 *
 * @returns Complete canvas configuration
 *
 */
export function createPixiCanvasConfig(
  overrides: Partial<CanvasConfig> = {},
): CanvasConfig {
  return {
    ...DEFAULT_PIXI_CANVAS_CONFIG,
    ...overrides,
    dimensions: {
      ...DEFAULT_PIXI_CANVAS_CONFIG.dimensions,
      ...overrides.dimensions,
    },
    breakpoints: overrides.breakpoints || DEFAULT_PIXI_BREAKPOINTS,
  };
}

/**
 * Validate a canvas configuration
 *
 * @param config - Configuration to validate
 *
 * @returns Array of validation error messages (empty if valid)
 *
 */
export function validatePixiCanvasConfig(config: CanvasConfig): string[] {
  const errors: string[] = [];

  // Validate dimensions
  if (config.dimensions.width <= 0) {
    errors.push("Canvas width must be greater than 0");
  }
  
  if (config.dimensions.height <= 0) {
    errors.push("Canvas height must be greater than 0");
  }

  // Validate constraints
  const { minWidth, maxWidth, minHeight, maxHeight } = config.dimensions;
  
  if (minWidth && maxWidth && minWidth > maxWidth) {
    errors.push("minWidth cannot be greater than maxWidth");
  }
  
  if (minHeight && maxHeight && minHeight > maxHeight) {
    errors.push("minHeight cannot be greater than maxHeight");
  }

  // Validate breakpoints for responsive mode
  if (config.mode === "responsive" && config.breakpoints) {
    const sortedBreakpoints = [...config.breakpoints].sort((a, b) => a.minWidth - b.minWidth);
    
    for (let i = 1; i < sortedBreakpoints.length; i++) {
      if (sortedBreakpoints[i].minWidth <= sortedBreakpoints[i - 1].minWidth) {
        errors.push(`Breakpoint '${sortedBreakpoints[i].name}' minWidth must be greater than previous breakpoint`);
      }
    }
  }

  return errors;
}

/**
 * Create PIXI Application options from canvas configuration
 *
 * @param config - Canvas configuration
 *
 * @param pixiOptimizations - Optional PIXI optimizations
 *
 * @returns PIXI Application options object
 *
 */
export function createPixiAppOptions(
  config: CanvasConfig,
  pixiOptimizations?: PixiOptimizations,
): {
  width: number;
  height: number;
  backgroundColor: number;
  transparent: boolean;
  antialias: boolean;
  resolution: number;
  autoDensity: boolean;
  powerPreference: "default" | "high-performance" | "low-power";
} {
  const optimizations = { ...DEFAULT_PIXI_OPTIMIZATIONS, ...pixiOptimizations };
  
  return {
    width: config.dimensions.width,
    height: config.dimensions.height,
    backgroundColor: config.backgroundColor || 0x000000,
    transparent: config.transparent || false,
    antialias: config.antialias !== false,
    resolution: optimizations.resolution || 1,
    autoDensity: optimizations.autoDensity !== false,
    powerPreference: optimizations.powerPreference || "high-performance",
  };
} 