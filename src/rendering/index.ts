/**
 * @fileoverview Rendering Module Index - PIXI.js Renderer Integration
 *
 * Core PIXI.js rendering system for high-performance graphics.
 * Provides GPU-accelerated sprite rendering with GSAP timeline integration.
 * Components for optimized PIXI.js integration.
 *
 * @version 1.0.0
 */

// Export unified PIXI renderer implementation
export { SliderRenderer } from './renderer';

// Keep backward compatibility alias
export { SliderRenderer as PixiSliderRenderer } from './renderer';

// PIXI.js Integration Components
export { PixiRenderer } from './pixi-renderer';
export { TextureManager } from './texture-manager';
export { ResourceLoader } from './resource-loader';
export { SpritePool } from './sprite-pool';
export { ShaderManager } from './shader-manager';
export { PerformanceMonitor } from './performance-monitor';

// Phase 3.2: GSAP + PIXI Integration Components
export { GSAPPixiAdapter } from './gsap-pixi-adapter';
export { FilterAnimator } from './filter-animator';
export { TransformAnimator } from './transform-animator';
export { CameraController } from './camera-controller';
export { ResponsiveHandler } from './responsive-handler';

// Export types for Phase 3.2 components
export type {
  SpriteAnimationConfig,
  ContainerAnimationConfig,
  FilterAnimationConfig as GSAPFilterAnimationConfig,
  AnimationPerformanceMetrics,
} from './gsap-pixi-adapter';

export type {
  FilterAnimationConfig,
  FilterChainConfig,
  QualityConfig,
  FilterPerformanceMetrics,
} from './filter-animator';

export type {
  TransformAnimationConfig,
  TransformChainConfig,
  TransformPerformanceConfig,
  TransformPerformanceMetrics,
} from './transform-animator';

export type {
  CameraViewport,
  CameraAnimationConfig,
  CameraConstraints,
  ResponsiveCameraConfig,
  CameraPerformanceMetrics,
} from './camera-controller';

export type {
  ResponsiveBreakpoint,
  OrientationConfig,
  ResponsiveConfig,
  ResponsiveState,
  ResponsivePerformanceMetrics,
} from './responsive-handler';
