/**
 * @fileoverview Rendering Module Index - PIXI.js Renderer Integration
 *
 * Core PIXI.js rendering system for high-performance graphics.
 * Provides GPU-accelerated sprite rendering with GSAP timeline integration,
 * comprehensive filter system, and advanced visual effects.
 *
 * @version 1.0.0
 */

// Core renderer
export { SliderRenderer } from './renderer';

// Filter system
export {
  FilterChain,
  EffectPresets,
  AdvancedFilterPresets,
  DisplacementEffects,
  DisplacementTextureLoader,
  FilterValidator,
  setupFilterSystem,
} from './filters';

// Texture management
export { TextureManager } from './texture-manager';

// Re-export types for convenience
export type {
  FilterConfig,
  FilterChainOptions,
  ChainExecutionResult,
  PresetOptions,
  EffectPresetResult,
  DisplacementTextureConfig,
  ValidationResults,
} from './filters';
