/**
 * PIXI Filter Type System
 * 
 * Comprehensive type definitions for all PIXI filters with integration
 * to our existing architecture patterns and performance optimization.
 * 
 * @module Filters
 * @version 1.0.0
 */

import type { Filter } from 'pixi.js';
import type { Brand } from './branded';

/**
 * Branded types for filter system
 */
export type FilterIntensity = Brand<number, 'FilterIntensity'>;
export type FilterId = Brand<string, 'FilterId'>;
export type FilterCacheKey = Brand<string, 'FilterCacheKey'>;

/**
 * All supported filter types
 */
export type FilterType =
  // Core visual effects
  | 'displacement'
  | 'blur'
  | 'glow'
  | 'glitch'
  | 'rgbSplit'
  | 'distortion'
  
  // Color manipulation
  | 'adjustment'
  | 'colorMatrix'
  | 'colorOverlay'
  | 'colorReplace'
  | 'colorGradient'
  | 'colorMap'
  | 'grayscale'
  | 'hsl'
  | 'multiColorReplace'
  
  // Blur effects
  | 'advancedBloom'
  | 'bloom'
  | 'kawaseBlur'
  | 'motionBlur'
  | 'radialBlur'
  | 'tiltShift'
  | 'zoomBlur'
  | 'backdropBlur'
  
  // Distortion effects
  | 'bulgePinch'
  | 'twist'
  | 'shockwave'
  | 'reflection'
  
  // Artistic effects
  | 'ascii'
  | 'crossHatch'
  | 'crt'
  | 'dot'
  | 'emboss'
  | 'oldFilm'
  | 'pixelate'
  | 'outline'
  
  // Lighting effects
  | 'godray'
  | 'simpleLightmap'
  | 'bevel'
  | 'dropShadow'
  
  // Noise effects
  | 'noise'
  | 'simplexNoise'
  
  // Utility filters
  | 'alpha'
  | 'convolution';

/**
 * Base filter configuration interface
 *
 * @example
 * const baseConfig: BaseFilterConfig = {
 *   type: 'glow',
 *   enabled: true,
 *   intensity: createFilterIntensity(5)
 * };
 */
export interface BaseFilterConfig {
  /** Filter type identifier */
  type: FilterType;
  /** Whether the filter is enabled */
  enabled: boolean;
  /** Filter intensity (0-10 range, mapped to filter-specific values) */
  intensity: FilterIntensity;
  /** Optional filter ID for tracking */
  id?: FilterId;
  /** Primary property controlled by intensity */
  primaryProperty?: string;
}

/**
 * Configuration for the Alpha filter
 *
 * @example
 * ```typescript
 * const config: AlphaFilterConfig = {
 *   type: 'alpha',
 *   enabled: true,
 *   alpha: 0.5,
 *   intensity: 7
 * };
 * ```
 */
export interface AlphaFilterConfig {
    type: 'alpha';
    enabled: boolean;
    intensity?: FilterIntensity;
    alpha?: number;
}

/**
 * Blur filter configuration
 *
 * @example
 * const config: BlurFilterConfig = {
 *   type: 'blur',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   strengthX: 10,
 *   strengthY: 10,
 *   quality: 4
 * };
 */
export interface BlurFilterConfig extends BaseFilterConfig {
  type: 'blur';
  /** Overall blur strength */
  strengthX?: number;
  /** Vertical blur strength */
  strengthY?: number;
  /** Blur quality (number of passes) */
  quality?: number;
  /** Blur kernel size */
  kernelSize?: number;
  /** Resolution */
  resolution?: number;
  /** Whether to clamp edges */
  repeatEdgePixels?: boolean;
  primaryProperty?: 'strengthX' | 'strengthY';
}

/**
 * Configuration for the DropShadow filter
 *
 * @example
 * ```typescript
 * const config: DropShadowFilterConfig = {
 *   type: 'dropShadow',
 *   enabled: true,
 *   color: 0x000000,
 *   alpha: 0.5,
 *   blur: 2,
 *   distance: 5,
 *   intensity: 6
 * };
 * ```
 */
export interface DropShadowFilterConfig {
    type: 'dropShadow';
    enabled: boolean;
    intensity?: FilterIntensity;
    alpha?: number;
    blur?: number;
    color?: number;
    offset?: { x: number; y: number } | number;
    offsetX?: number;
    offsetY?: number;
    pixelSize?: number;
    pixelSizeX?: number;
    pixelSizeY?: number;
    quality?: number;
    shadowOnly?: boolean;
}

/**
 * Configuration for the Emboss filter
 *
 * @example
 * ```typescript
 * const config: EmbossFilterConfig = {
 *   type: 'emboss',
 *   enabled: true,
 *   strength: 8,
 *   intensity: 6
 * };
 * ```
 */
export interface EmbossFilterConfig extends BaseFilterConfig {
  type: 'emboss';
  /** Emboss strength */
  strength?: number;
  primaryProperty?: 'strength';
}

/**
 * Configuration for the Grayscale filter
 *
 * @example
 * ```typescript
 * const config: GrayscaleFilterConfig = {
 *   type: 'grayscale',
 *   enabled: true,
 *   intensity: 8
 * };
 * ```
 */
export interface GrayscaleFilterConfig {
    type: 'grayscale';
    enabled: boolean;
    intensity?: FilterIntensity;
}

/**
 * Configuration for the Noise filter
 *
 * @example
 * const config: NoiseFilterConfig = {
 *   type: 'noise',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   noise: 0.5,
 *   primaryProperty: 'noise'
 * };
 */
export interface NoiseFilterConfig extends BaseFilterConfig {
  type: 'noise';
  /** Noise amount */
  noise?: number;
  /** Noise level (alternative name for noise) */
  noiseLevel?: number;
  /** Noise seed */
  seed?: number;
  /** Whether to generate new seed on update */
  generateNewSeedOnUpdate?: boolean;
  primaryProperty?: 'noise';
}

/**
 * Configuration for the Displacement filter
 *
 * @example
 * const config: DisplacementFilterConfig = {
 *   type: 'displacement',
 *   enabled: true,
 *   intensity: createFilterIntensity(7)
 * };
 */
export interface DisplacementFilterConfig extends BaseFilterConfig {
  type: 'displacement';
}

/**
 * Configuration for the Glow filter
 *
 * @example
 * const config: GlowFilterConfig = {
 *   type: 'glow',
 *   enabled: true,
 *   intensity: createFilterIntensity(8)
 * };
 */
export interface GlowFilterConfig extends BaseFilterConfig {
  type: 'glow';
}

/**
 * Configuration for the Glitch filter
 *
 * @example
 * const config: GlitchFilterConfig = {
 *   type: 'glitch',
 *   enabled: true,
 *   intensity: createFilterIntensity(6)
 * };
 */
export interface GlitchFilterConfig extends BaseFilterConfig {
  type: 'glitch';
}

/**
 * Configuration for the RGB Split filter
 *
 * @example
 * const config: RGBSplitFilterConfig = {
 *   type: 'rgbSplit',
 *   enabled: true,
 *   intensity: createFilterIntensity(5)
 * };
 */
export interface RGBSplitFilterConfig extends BaseFilterConfig {
  type: 'rgbSplit';
}

/**
 * Configuration for the Adjustment filter
 *
 * @example
 * const config: AdjustmentFilterConfig = {
 *   type: 'adjustment',
 *   enabled: true,
 *   intensity: createFilterIntensity(7)
 * };
 */
export interface AdjustmentFilterConfig extends BaseFilterConfig {
  type: 'adjustment';
}

/**
 * Configuration for the Shockwave filter
 *
 * @example
 * const config: ShockwaveFilterConfig = {
 *   type: 'shockwave',
 *   enabled: true,
 *   intensity: createFilterIntensity(6)
 * };
 */
export interface ShockwaveFilterConfig extends BaseFilterConfig {
  type: 'shockwave';
}

/**
 * Union type of all filter configurations
 */
export type FilterConfig =
  | AlphaFilterConfig
  | BlurFilterConfig
  | DropShadowFilterConfig
  | EmbossFilterConfig
  | GrayscaleFilterConfig
  | NoiseFilterConfig
  | DisplacementFilterConfig
  | GlowFilterConfig
  | GlitchFilterConfig
  | RGBSplitFilterConfig
  | AdjustmentFilterConfig
  | ShockwaveFilterConfig;

/**
 * Filter result interface
 *
 * @example
 * const result: FilterResult = {
 *   filter: pixiFilter,
 *   config: { type: 'glow', enabled: true },
 *   updateIntensity: updateFunction,
 *   reset: resetFunction,
 *   dispose: disposeFunction
 * };
 */
export interface FilterResult {
  /** The PIXI filter instance */
  filter: Filter;
  /** Filter configuration */
  config: FilterConfig;
  /** Update filter intensity */
  updateIntensity: (intensity: FilterIntensity) => void;
  /** Reset filter to default state */
  reset: () => void;
  /** Dispose of filter resources */
  dispose?: () => void;
  /** Get current filter state */
  getState?: () => Record<string, unknown>;
}

/**
 * Create a FilterIntensity branded type
 *
 * @param value - Intensity value (0-10)
 *
 * @returns FilterIntensity branded type
 *
 */
export function createFilterIntensity(value: number): FilterIntensity {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    throw new Error('FilterIntensity must be a finite number');
  }
  if (value < 0 || value > 10) {
    throw new Error('FilterIntensity must be between 0 and 10');
  }
  return value as FilterIntensity;
}

/**
 * Create a FilterId branded type
 *
 * @param value - ID string
 *
 * @returns FilterId branded type
 *
 */
export function createFilterId(value: string): FilterId {
  return value as FilterId;
}

/**
 * Create a FilterCacheKey branded type
 *
 * @param config - Filter configuration object
 *
 * @returns FilterCacheKey branded type
 *
 */
export const createFilterCacheKey = (config: FilterConfig): FilterCacheKey => {
  const key = `${config.type}-${config.intensity}-${JSON.stringify(config)}`;
  return key as FilterCacheKey;
};

/**
 * Type guard for Alpha filter config
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is AlphaFilterConfig
 *
 */
export const isAlphaFilter = (config: FilterConfig): config is AlphaFilterConfig => {
  return config.type === 'alpha';
};

/**
 * Type guard for blur filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is BlurFilterConfig
 *
 */
export const isBlurFilter = (config: FilterConfig): config is BlurFilterConfig => {
  return config.type === 'blur';
};

/**
 * Type guard for DropShadow filter config
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is DropShadowFilterConfig
 *
 */
export const isDropShadowFilter = (config: FilterConfig): config is DropShadowFilterConfig => {
  return config.type === 'dropShadow';
};

/**
 * Type guard for emboss filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is EmbossFilterConfig
 *
 */
export const isEmbossFilter = (config: FilterConfig): config is EmbossFilterConfig => {
  return config.type === 'emboss';
};

/**
 * Type guard for Grayscale filter config
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is GrayscaleFilterConfig
 *
 */
export const isGrayscaleFilter = (config: FilterConfig): config is GrayscaleFilterConfig => {
  return config.type === 'grayscale';
};

/**
 * Type guard for noise filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is NoiseFilterConfig
 *
 */
export const isNoiseFilter = (config: FilterConfig): config is NoiseFilterConfig => {
  return config.type === 'noise';
};

/**
 * Type guard for displacement filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is DisplacementFilterConfig
 *
 */
export const isDisplacementFilter = (config: FilterConfig): config is DisplacementFilterConfig => {
  return config.type === 'displacement';
};

/**
 * Type guard for glow filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is GlowFilterConfig
 *
 */
export const isGlowFilter = (config: FilterConfig): config is GlowFilterConfig => {
  return config.type === 'glow';
};

/**
 * Type guard for glitch filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is GlitchFilterConfig
 *
 */
export const isGlitchFilter = (config: FilterConfig): config is GlitchFilterConfig => {
  return config.type === 'glitch';
};

/**
 * Type guard for RGB split filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is RGBSplitFilterConfig
 *
 */
export const isRGBSplitFilter = (config: FilterConfig): config is RGBSplitFilterConfig => {
  return config.type === 'rgbSplit';
};

/**
 * Type guard for adjustment filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is AdjustmentFilterConfig
 *
 */
export const isAdjustmentFilter = (config: FilterConfig): config is AdjustmentFilterConfig => {
  return config.type === 'adjustment';
};

/**
 * Type guard for shockwave filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is ShockwaveFilterConfig
 *
 */
export const isShockwaveFilter = (config: FilterConfig): config is ShockwaveFilterConfig => {
  return config.type === 'shockwave';
}; 