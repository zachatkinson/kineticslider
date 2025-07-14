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
