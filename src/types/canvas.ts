/**
 * Canvas system type definitions
 *
 * This module contains type definitions for the flexible canvas dimension system,
 * including canvas modes, dimension configurations, and responsive constraints.
 *
 * @module Canvas
 * @group Types
 * @version 1.0.0
 */

import type { Brand } from "./branded";

/**
 * Canvas rendering modes
 *
 * @enum CanvasMode
 */
export enum CanvasMode {
  /** Fixed dimensions - canvas maintains exact width/height */
  FIXED = 'fixed',
  /** Responsive - canvas adapts to container while maintaining constraints */
  RESPONSIVE = 'responsive',
  /** Fullscreen - canvas fills entire viewport */
  FULLSCREEN = 'fullscreen'
}

/**
 * Aspect ratio type for type safety
 */
export type AspectRatio = Brand<number, "AspectRatio">;

/**
 * Canvas width type for type safety
 */
export type CanvasWidth = Brand<number, "CanvasWidth">;

/**
 * Canvas height type for type safety
 */
export type CanvasHeight = Brand<number, "CanvasHeight">;

/**
 * Breakpoint name type for responsive design
 */
export type BreakpointName = Brand<string, "BreakpointName">;

/**
 * Canvas dimension configuration
 *
 * @interface CanvasDimensions
 * @example
 * ```typescript
 * // Fixed mode canvas
 * const fixedCanvas: CanvasDimensions = {
 *   mode: CanvasMode.FIXED,
 *   width: createCanvasWidth(800),
 *   height: createCanvasHeight(600)
 * };
 * 
 * // Responsive mode canvas
 * const responsiveCanvas: CanvasDimensions = {
 *   mode: CanvasMode.RESPONSIVE,
 *   aspectRatio: createAspectRatio(16/9),
 *   minWidth: createCanvasWidth(320),
 *   maxWidth: createCanvasWidth(1920)
 * };
 * ```
 */
export interface CanvasDimensions {
  /** Canvas rendering mode */
  mode: CanvasMode;
  /** Fixed width (required for FIXED mode) */
  width?: CanvasWidth;
  /** Fixed height (required for FIXED mode) */
  height?: CanvasHeight;
  /** Preferred aspect ratio */
  aspectRatio?: AspectRatio;
  /** Minimum width constraint */
  minWidth?: CanvasWidth;
  /** Maximum width constraint */
  maxWidth?: CanvasWidth;
  /** Minimum height constraint */
  minHeight?: CanvasHeight;
  /** Maximum height constraint */
  maxHeight?: CanvasHeight;
}

/**
 * Responsive breakpoint configuration
 *
 * @interface ResponsiveBreakpoint
 * @example
 * ```typescript
 * const mobileBreakpoint: ResponsiveBreakpoint = {
 *   name: createBreakpointName("mobile"),
 *   minWidth: 0,
 *   canvas: {
 *     width: createCanvasWidth(320),
 *     height: createCanvasHeight(240),
 *     aspectRatio: createAspectRatio(4/3)
 *   }
 * };
 * ```
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: BreakpointName;
  /** Minimum viewport width for this breakpoint */
  minWidth: number;
  /** Canvas dimensions for this breakpoint */
  canvas: {
    width: CanvasWidth;
    height: CanvasHeight;
    aspectRatio?: AspectRatio;
  };
}

/**
 * Responsive constraints configuration
 *
 * @interface ResponsiveConstraints
 * @example
 * ```typescript
 * const constraints: ResponsiveConstraints = {
 *   breakpoints: [
 *     {
 *       name: createBreakpointName("mobile"),
 *       minWidth: 0,
 *       canvas: { width: createCanvasWidth(320), height: createCanvasHeight(240) }
 *     },
 *     {
 *       name: createBreakpointName("desktop"),
 *       minWidth: 1024,
 *       canvas: { width: createCanvasWidth(1024), height: createCanvasHeight(768) }
 *     }
 *   ],
 *   defaultSize: {
 *     width: createCanvasWidth(800),
 *     height: createCanvasHeight(600)
 *   }
 * };
 * ```
 */
export interface ResponsiveConstraints {
  /** Responsive breakpoints */
  breakpoints: ResponsiveBreakpoint[];
  /** Default canvas size when no breakpoint matches */
  defaultSize: {
    width: CanvasWidth;
    height: CanvasHeight;
    aspectRatio?: AspectRatio;
  };
  /** Enable smooth transitions between breakpoints */
  smoothTransitions?: boolean;
  /** Transition duration in milliseconds */
  transitionDuration?: number;
}

/**
 * Canvas size calculation result
 *
 * @interface CanvasSize
 * @example
 * ```typescript
 * const canvasSize: CanvasSize = {
 *   width: createCanvasWidth(800),
 *   height: createCanvasHeight(600),
 *   aspectRatio: createAspectRatio(4/3),
 *   scale: 1,
 *   letterboxed: false,
 *   activeBreakpoint: createBreakpointName("desktop")
 * };
 * ```
 */
export interface CanvasSize {
  /** Calculated width */
  width: CanvasWidth;
  /** Calculated height */
  height: CanvasHeight;
  /** Actual aspect ratio */
  aspectRatio: AspectRatio;
  /** Scale factor applied */
  scale: number;
  /** Whether letterboxing is applied */
  letterboxed: boolean;
  /** Active breakpoint (for responsive mode) */
  activeBreakpoint?: BreakpointName;
}

/**
 * Canvas resize event data
 *
 * @interface CanvasResizeEvent
 * @example
 * ```typescript
 * const resizeEvent: CanvasResizeEvent = {
 *   previousSize: {
 *     width: createCanvasWidth(800),
 *     height: createCanvasHeight(600),
 *     aspectRatio: createAspectRatio(4/3),
 *     scale: 1,
 *     letterboxed: false
 *   },
 *   newSize: {
 *     width: createCanvasWidth(1024),
 *     height: createCanvasHeight(768),
 *     aspectRatio: createAspectRatio(4/3),
 *     scale: 1,
 *     letterboxed: false
 *   },
 *   trigger: 'viewport',
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface CanvasResizeEvent {
  /** Previous canvas size */
  previousSize: CanvasSize;
  /** New canvas size */
  newSize: CanvasSize;
  /** Resize trigger */
  trigger: 'viewport' | 'container' | 'manual';
  /** Timestamp of resize event */
  timestamp: number;
}

/**
 * Canvas dimension validation result
 *
 * @interface CanvasDimensionValidation
 * @example
 * ```typescript
 * const validation: CanvasDimensionValidation = {
 *   isValid: false,
 *   errors: ["Width is required for FIXED canvas mode"],
 *   warnings: ["Consider specifying an aspect ratio"],
 *   suggestions: ["Add width and height for fixed mode"]
 * };
 * ```
 */
export interface CanvasDimensionValidation {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Suggested fixes */
  suggestions: string[];
} 