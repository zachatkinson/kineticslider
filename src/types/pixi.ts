/**
 * Types related to Pixi.js components and functionality
 */

import type { Application, Container, Sprite, Texture } from "pixi.js";

/**
 * Canvas rendering modes for different use cases
 */
export type CanvasMode = 
  | "fullscreen"    // Fill entire viewport
  | "fixed"         // Fixed dimensions
  | "responsive";   // Responsive with constraints

/**
 * Aspect ratio management strategies
 */
export type AspectRatioMode = 
  | "cover"         // Scale to cover, may crop
  | "contain"       // Scale to fit, may letterbox
  | "fill"          // Stretch to fill
  | "none";         // No scaling

/**
 * Canvas dimension configuration
 *
 * @example
 * ```typescript
 * const dimensions: CanvasDimensions = {
 *   width: 800,
 *   height: 600,
 *   pixelRatio: window.devicePixelRatio
 * };
 * ```
 */
export interface CanvasDimensions {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Device pixel ratio override */
  pixelRatio?: number;
  /** Minimum width constraint */
  minWidth?: number;
  /** Maximum width constraint */
  maxWidth?: number;
  /** Minimum height constraint */
  minHeight?: number;
  /** Maximum height constraint */
  maxHeight?: number;
}

/**
 * Responsive breakpoint configuration
 *
 * @example
 * ```typescript
 * const breakpoint: ResponsiveBreakpoint = {
 *   name: "tablet",
 *   minWidth: 768,
 *   dimensions: { width: 768, height: 1024 },
 *   aspectRatio: "cover"
 * };
 * ```
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: string;
  /** Minimum width for this breakpoint */
  minWidth: number;
  /** Canvas dimensions for this breakpoint */
  dimensions: CanvasDimensions;
  /** Aspect ratio mode for this breakpoint */
  aspectRatio?: AspectRatioMode;
}

/**
 * Canvas configuration options
 *
 * @example
 * ```typescript
 * const config: CanvasConfig = {
 *   mode: "responsive",
 *   dimensions: { width: 800, height: 600 },
 *   aspectRatio: "cover"
 * };
 * ```
 */
export interface CanvasConfig {
  mode: CanvasMode;
  dimensions: CanvasDimensions;
  aspectRatio: AspectRatioMode;
  /** Responsive breakpoints (for responsive mode) */
  breakpoints?: ResponsiveBreakpoint[];
  /** Enable high DPI support */
  highDPI?: boolean;
  /** Enable PIXI optimizations */
  pixiOptimizations?: boolean;
  /** Background color */
  backgroundColor?: number;
  /** Enable transparency */
  transparent?: boolean;
  /** Enable antialiasing */
  antialias?: boolean;
}

/**
 * PIXI.js rendering optimization settings
 * PIXI handles WebGL internally, these are PIXI-specific optimizations
 *
 * @example
 * ```typescript
 * const optimizations: PixiOptimizations = {
 *   batchRendering: true,
 *   textureGC: true,
 *   preferredRenderer: "webgl"
 * };
 * ```
 */
export interface PixiOptimizations {
  /** Enable PIXI's batch rendering system */
  batchRendering?: boolean;
  /** Enable PIXI's texture garbage collection */
  textureGC?: boolean;
  /** Enable PIXI's sprite culling */
  spriteCulling?: boolean;
  /** Maximum texture size for PIXI */
  maxTextureSize?: number;
  /** PIXI texture cache size limit */
  textureCacheLimit?: number;
  /** Enable PIXI's context restoration handling */
  contextRestoration?: boolean;
  /** PIXI renderer resolution */
  resolution?: number;
  /** Enable PIXI's auto-density feature */
  autoDensity?: boolean;
  /** PIXI's preferred renderer type */
  preferredRenderer?: "webgl" | "canvas";
  /** Enable PIXI's power preference */
  powerPreference?: "default" | "high-performance" | "low-power";
}

/**
 * Performance monitoring configuration
 *
 * @example
 * ```typescript
 * const perfConfig: PerformanceConfig = {
 *   enableFPSMonitoring: true,
 *   updateInterval: 1000,
 *   thresholds: { minFPS: 30 }
 * };
 * ```
 */
export interface PerformanceConfig {
  /** Enable FPS monitoring */
  enableFPSMonitoring?: boolean;
  /** Enable memory monitoring */
  enableMemoryMonitoring?: boolean;
  /** Enable render time monitoring */
  enableRenderTimeMonitoring?: boolean;
  /** Performance update interval (ms) */
  updateInterval?: number;
  /** Performance thresholds */
  thresholds?: {
    minFPS?: number;
    maxMemoryMB?: number;
    maxRenderTimeMS?: number;
  };
}

/**
 * Represents the data for a slide
 *
 * @example Example usage
 */
export interface SlideData {
  /** Unique identifier for the slide */
  id: string;
  /** URL or path to the slide image */
  image: string;
  /** Accessible description of the slide */
  alt: string;
  /** Optional aspect ratio override for this slide */
  aspectRatio?: AspectRatioMode;
  /** Optional loading priority */
  priority?: "high" | "normal" | "low";
}

/**
 * Enhanced props for the PixiApp component
 *
 * @example Example usage
 */
export interface PixiAppProps {
  /** Canvas configuration */
  canvas?: CanvasConfig;
  /** Legacy width prop (deprecated, use canvas.dimensions.width) */
  width?: number;
  /** Legacy height prop (deprecated, use canvas.dimensions.height) */
  height?: number;
  /** Legacy background color prop (deprecated, use canvas.backgroundColor) */
  backgroundColor?: number;
  /** PIXI.js optimization settings */
  pixiOptimizations?: PixiOptimizations;
  /** Performance monitoring configuration */
  performance?: PerformanceConfig;
  /** Child components */
  children?: React.ReactNode;
  /** Array of slides to display */
  slides: Array<SlideData>;
  /** Callback when the current slide changes */
  onSlideChange?: (_index: number) => void;
  /** Callback when an _error occurs */
  onError?: (_error: Error) => void;
  /** Callback for performance metrics */
  onPerformanceUpdate?: (_metrics: PerformanceMetrics) => void;
  /** Callback for canvas resize events */
  onCanvasResize?: (_dimensions: CanvasDimensions) => void;
}

/**
 * Performance metrics data
 *
 * @example
 * ```typescript
 * const metrics: PerformanceMetrics = {
 *   fps: 60,
 *   memoryMB: 128,
 *   renderTimeMS: 16.7,
 *   drawCalls: 5,
 *   spriteCount: 10,
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  /** Memory usage in MB */
  memoryMB: number;
  /** Render time in milliseconds */
  renderTimeMS: number;
  /** Number of draw calls */
  drawCalls: number;
  /** Number of sprites rendered */
  spriteCount: number;
  /** Timestamp of measurement */
  timestamp: number;
}

/**
 * Represents a slide in the Pixi.js context
 *
 * @example Example usage
 */
export interface PixiSlide {
  /** Unique identifier for the slide */
  id?: string;
  /** The Pixi.js sprite instance */
  sprite: Sprite;
  /** The container holding the sprite */
  container: Container;
  /** The Pixi.js application instance (optional) */
  app?: Application;
  /** The texture used by the sprite */
  texture: Texture;
  /** Slide metadata */
  metadata?: SlideData;
  /** Loading state */
  isLoaded?: boolean;
  /** Error state */
  hasError?: boolean;
}
