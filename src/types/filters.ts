/**
 * PIXI Filter Type System
 * 
 * Comprehensive type definitions for all PIXI filters with integration
 * to our existing architecture patterns and performance optimization.
 * 
 * @module Filters
 * @version 1.0.0
 */

import type { Filter, ColorSource, PointData, Texture } from 'pixi.js';
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
 * Displacement filter configuration
 * Core effect for the KineticSlider's signature look
 *
 * @example
 * const config: DisplacementFilterConfig = {
 *   type: 'displacement',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   displacementMap: 'path/to/texture.png',
 *   scale: { x: 20, y: 20 }
 * };
 */
export interface DisplacementFilterConfig extends BaseFilterConfig {
  type: 'displacement';
  /** Displacement texture or path */
  displacementMap: Texture | string;
  /** Scale of displacement effect */
  scale?: PointData;
  /** X-axis displacement scale */
  scaleX?: number;
  /** Y-axis displacement scale */
  scaleY?: number;
  primaryProperty?: 'scale' | 'scaleX' | 'scaleY';
}

/**
 * Blur filter configuration
 *
 * @example
 * const config: BlurFilterConfig = {
 *   type: 'blur',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   strength: 8,
 *   quality: 4
 * };
 */
export interface BlurFilterConfig extends BaseFilterConfig {
  type: 'blur';
  /** Overall blur strength */
  strength?: number;
  /** Blur quality (number of passes) */
  quality?: number;
  /** Blur kernel size */
  kernelSize?: number;
  /** Horizontal blur strength */
  strengthX?: number;
  /** Vertical blur strength */
  strengthY?: number;
  /** Whether to clamp edges */
  repeatEdgePixels?: boolean;
  primaryProperty?: 'strength' | 'strengthX' | 'strengthY';
}

/**
 * Glow filter configuration
 *
 * @example
 * const config: GlowFilterConfig = {
 *   type: 'glow',
 *   enabled: true,
 *   intensity: createFilterIntensity(8),
 *   distance: 10,
 *   outerStrength: 4
 * };
 */
export interface GlowFilterConfig extends BaseFilterConfig {
  type: 'glow';
  /** Distance of the glow */
  distance?: number;
  /** Inner glow strength */
  innerStrength?: number;
  /** Outer glow strength */
  outerStrength?: number;
  /** Glow quality */
  quality?: number;
  /** Glow color */
  color?: ColorSource;
  /** Glow alpha */
  alpha?: number;
  /** Only show glow, not texture */
  knockout?: boolean;
  primaryProperty?: 'innerStrength' | 'outerStrength' | 'distance';
}

/**
 * Glitch filter configuration
 *
 * @example
 * const config: GlitchFilterConfig = {
 *   type: 'glitch',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   slices: 5,
 *   offset: 100,
 *   animated: true
 * };
 */
export interface GlitchFilterConfig extends BaseFilterConfig {
  type: 'glitch';
  /** Number of glitch slices */
  slices?: number;
  /** Maximum offset of slices */
  offset?: number;
  /** Direction of glitch in degrees */
  direction?: number;
  /** Red channel offset */
  red?: PointData;
  /** Green channel offset */
  green?: PointData;
  /** Blue channel offset */
  blue?: PointData;
  /** Random seed */
  seed?: number;
  /** Whether to animate automatically */
  animated?: boolean;
  /** Animation refresh frequency */
  refreshFrequency?: number;
  primaryProperty?: 'slices' | 'offset' | 'direction';
}

/**
 * RGB Split filter configuration
 *
 * @example
 * const config: RGBSplitFilterConfig = {
 *   type: 'rgbSplit',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   red: { x: 5, y: 0 },
 *   green: { x: -5, y: 0 },
 *   blue: { x: 0, y: 5 }
 * };
 */
export interface RGBSplitFilterConfig extends BaseFilterConfig {
  type: 'rgbSplit';
  /** Red channel offset */
  red?: PointData;
  /** Green channel offset */
  green?: PointData;
  /** Blue channel offset */
  blue?: PointData;
  /** Red X offset */
  redX?: number;
  /** Red Y offset */
  redY?: number;
  /** Green X offset */
  greenX?: number;
  /** Green Y offset */
  greenY?: number;
  /** Blue X offset */
  blueX?: number;
  /** Blue Y offset */
  blueY?: number;
  primaryProperty?: 'red' | 'green' | 'blue';
}

/**
 * Color adjustment filter configuration
 *
 * @example
 * const config: AdjustmentFilterConfig = {
 *   type: 'adjustment',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   brightness: 1.2,
 *   contrast: 1.1,
 *   saturation: 1.3
 * };
 */
export interface AdjustmentFilterConfig extends BaseFilterConfig {
  type: 'adjustment';
  /** Gamma adjustment */
  gamma?: number;
  /** Contrast adjustment */
  contrast?: number;
  /** Saturation adjustment */
  saturation?: number;
  /** Brightness adjustment */
  brightness?: number;
  /** Red channel multiplier */
  red?: number;
  /** Green channel multiplier */
  green?: number;
  /** Blue channel multiplier */
  blue?: number;
  /** Alpha channel multiplier */
  alpha?: number;
  primaryProperty?: 'gamma' | 'contrast' | 'saturation' | 'brightness';
}

/**
 * Shockwave filter configuration
 *
 * @example
 * const config: ShockwaveFilterConfig = {
 *   type: 'shockwave',
 *   enabled: true,
 *   intensity: createFilterIntensity(8),
 *   center: { x: 0.5, y: 0.5 },
 *   amplitude: 30,
 *   wavelength: 160,
 *   animate: true
 * };
 */
export interface ShockwaveFilterConfig extends BaseFilterConfig {
  type: 'shockwave';
  /** Center point of shockwave */
  center?: PointData;
  /** X coordinate of center */
  centerX?: number;
  /** Y coordinate of center */
  centerY?: number;
  /** Amplitude of shockwave */
  amplitude?: number;
  /** Wavelength of shockwave */
  wavelength?: number;
  /** Speed of shockwave */
  speed?: number;
  /** Current time/radius */
  time?: number;
  /** Maximum radius */
  radius?: number;
  /** Brightness multiplier */
  brightness?: number;
  /** Whether to animate */
  animate?: boolean;
  /** Animation speed */
  animationSpeed?: number;
  primaryProperty?: 'amplitude' | 'wavelength' | 'speed';
}

/**
 * Bloom filter configuration
 *
 * @example
 * const config: BloomFilterConfig = {
 *   type: 'bloom',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   strength: 4,
 *   primaryProperty: 'strength'
 * };
 */
export interface BloomFilterConfig extends BaseFilterConfig {
  type: 'bloom';
  /** Overall bloom strength */
  strength?: number;
  /** Horizontal bloom strength */
  strengthX?: number;
  /** Vertical bloom strength */
  strengthY?: number;
  primaryProperty?: 'strength' | 'strengthX' | 'strengthY';
}

/**
 * Pixelate filter configuration
 *
 * @example
 * const config: PixelateFilterConfig = {
 *   type: 'pixelate',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   size: 10,
 *   primaryProperty: 'size'
 * };
 */
export interface PixelateFilterConfig extends BaseFilterConfig {
  type: 'pixelate';
  /** Overall pixelation size */
  size?: number;
  /** Horizontal pixelation size */
  sizeX?: number;
  /** Vertical pixelation size */
  sizeY?: number;
  primaryProperty?: 'size' | 'sizeX' | 'sizeY';
}

/**
 * Twist filter configuration
 *
 * @example
 * const config: TwistFilterConfig = {
 *   type: 'twist',
 *   enabled: true,
 *   intensity: createFilterIntensity(8),
 *   angle: 4,
 *   radius: 200,
 *   primaryProperty: 'angle'
 * };
 */
export interface TwistFilterConfig extends BaseFilterConfig {
  type: 'twist';
  /** Twist angle */
  angle?: number;
  /** Twist radius */
  radius?: number;
  /** X offset */
  offsetX?: number;
  /** Y offset */
  offsetY?: number;
  primaryProperty?: 'angle' | 'radius';
}

/**
 * Noise filter configuration
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
 * Color matrix filter configuration
 *
 * @example
 * const config: ColorMatrixFilterConfig = {
 *   type: 'colorMatrix',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
 *   primaryProperty: 'brightness'
 * };
 */
export interface ColorMatrixFilterConfig extends BaseFilterConfig {
  type: 'colorMatrix';
  /** Color matrix array */
  matrix?: number[];
  /** Alpha adjustment */
  alpha?: number;
  primaryProperty?: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'alpha';
}

/**
 * Outline filter configuration
 *
 * @example
 * const config: OutlineFilterConfig = {
 *   type: 'outline',
 *   enabled: true,
 *   intensity: createFilterIntensity(4),
 *   thickness: 2,
 *   color: 0xffffff,
 *   primaryProperty: 'thickness'
 * };
 */
export interface OutlineFilterConfig extends BaseFilterConfig {
  type: 'outline';
  /** Outline thickness */
  thickness?: number;
  /** Outline color */
  color?: ColorSource;
  /** Outline alpha */
  alpha?: number;
  /** Outline quality */
  quality?: number;
  /** Knockout mode */
  knockout?: boolean;
  primaryProperty?: 'thickness' | 'alpha';
}

/**
 * Bulge Pinch filter configuration
 *
 * @example
 * const config: BulgePinchFilterConfig = {
 *   type: 'bulgePinch',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   strength: 0.5,
 *   center: { x: 0.5, y: 0.5 },
 *   primaryProperty: 'strength'
 * };
 */
export interface BulgePinchFilterConfig extends BaseFilterConfig {
  type: 'bulgePinch';
  /** Effect strength */
  strength?: number;
  /** Center point */
  center?: PointData;
  /** X center coordinate */
  centerX?: number;
  /** Y center coordinate */
  centerY?: number;
  /** Effect radius */
  radius?: number;
  primaryProperty?: 'strength' | 'radius';
}

/**
 * Emboss filter configuration
 *
 * @example
 * const config: EmbossFilterConfig = {
 *   type: 'emboss',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   strength: 5,
 *   primaryProperty: 'strength'
 * };
 */
export interface EmbossFilterConfig extends BaseFilterConfig {
  type: 'emboss';
  /** Emboss strength */
  strength?: number;
  primaryProperty?: 'strength';
}

/**
 * Old Film filter configuration
 *
 * @example
 * const config: OldFilmFilterConfig = {
 *   type: 'oldFilm',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   sepia: 0.3,
 *   noise: 0.3,
 *   primaryProperty: 'sepia'
 * };
 */
export interface OldFilmFilterConfig extends BaseFilterConfig {
  type: 'oldFilm';
  /** Sepia amount */
  sepia?: number;
  /** Noise amount */
  noise?: number;
  /** Noise size */
  noiseSize?: number;
  /** Scratch density */
  scratch?: number;
  /** Scratch density (alternative name) */
  scratchDensity?: number;
  /** Scratch width */
  scratchWidth?: number;
  /** Vignette opacity */
  vignetting?: number;
  /** Vignette alpha */
  vignettingAlpha?: number;
  /** Vignette blur */
  vignettingBlur?: number;
  /** Random seed */
  seed?: number;
  primaryProperty?: 'sepia' | 'noise' | 'scratch' | 'vignetting';
}

/**
 * Union type of all filter configurations
 */
export type FilterConfig =
  | DisplacementFilterConfig
  | BlurFilterConfig
  | GlowFilterConfig
  | GlitchFilterConfig
  | RGBSplitFilterConfig
  | AdjustmentFilterConfig
  | ShockwaveFilterConfig
  | BloomFilterConfig
  | PixelateFilterConfig
  | TwistFilterConfig
  | NoiseFilterConfig
  | ColorMatrixFilterConfig
  | OutlineFilterConfig
  | BulgePinchFilterConfig
  | EmbossFilterConfig
  | OldFilmFilterConfig;

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
 * Filter factory options
 *
 * @example
 * const options: FilterFactoryOptions = {
 *   enableShaderPooling: true,
 *   enableDebug: false,
 *   maxCacheSize: 100
 * };
 */
export interface FilterFactoryOptions {
  /** Enable shader pooling */
  enableShaderPooling?: boolean;
  /** Enable debug mode */
  enableDebug?: boolean;
  /** Maximum cache size */
  maxCacheSize?: number;
  /** Enable lazy loading */
  enableLazyLoading?: boolean;
  /** Lazy loading timeout */
  lazyLoadTimeout?: number;
}

/**
 * Filter performance metrics
 *
 * @example
 * const metrics: FilterPerformanceMetrics = {
 *   activeFilters: 5,
 *   creationTimeMs: 12.5,
 *   averageUpdateTimeMs: 2.1,
 *   memoryUsageMB: 15.2,
 *   cacheHitRate: 0.85,
 *   shaderCompilations: 3
 * };
 */
export interface FilterPerformanceMetrics {
  /** Number of active filters */
  activeFilters: number;
  /** Total filter creation time */
  creationTimeMs: number;
  /** Average update time per filter */
  averageUpdateTimeMs: number;
  /** Memory usage in MB */
  memoryUsageMB: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Number of shader compilations */
  shaderCompilations: number;
}

/**
 * Filter animation state
 *
 * @example
 * const animState: FilterAnimationState = {
 *   isAnimating: true,
 *   startTime: Date.now(),
 *   duration: 1000,
 *   progress: 0.5,
 *   easing: (t) => t * t
 * };
 */
export interface FilterAnimationState {
  /** Whether filter is animating */
  isAnimating: boolean;
  /** Animation start time */
  startTime: number;
  /** Animation duration */
  duration: number;
  /** Animation progress (0-1) */
  progress: number;
  /** Animation easing function */
  easing?: (t: number) => number;
}

/**
 * Filter event types
 */
export type FilterEventType = 
  | 'created'
  | 'updated'
  | 'disposed'
  | 'error'
  | 'animation-start'
  | 'animation-end';

/**
 * Filter event interface
 *
 * @example
 * const event: FilterEvent = {
 *   type: 'created',
 *   filterId: createFilterId('filter-123'),
 *   timestamp: Date.now(),
 *   data: { intensity: 5 }
 * };
 */
export interface FilterEvent {
  /** Event type */
  type: FilterEventType;
  /** Filter ID */
  filterId: FilterId;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data?: Record<string, unknown>;
  /** Error information if applicable */
  error?: Error;
}

/**
 * Filter manager configuration
 *
 * @example
 * const config: FilterManagerConfig = {
 *   maxConcurrentFilters: 50,
 *   enablePerformanceMonitoring: true,
 *   enableCaching: true,
 *   cacheSize: 100,
 *   enableAutoCleanup: true,
 *   cleanupInterval: 30000
 * };
 */
export interface FilterManagerConfig {
  /** Maximum number of concurrent filters */
  maxConcurrentFilters?: number;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Enable filter caching */
  enableCaching?: boolean;
  /** Cache size limit */
  cacheSize?: number;
  /** Enable automatic cleanup */
  enableAutoCleanup?: boolean;
  /** Cleanup interval in ms */
  cleanupInterval?: number;
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
 * Type guards for filter configurations
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

/**
 * Type guard for bloom filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is BloomFilterConfig
 *
 */
export const isBloomFilter = (config: FilterConfig): config is BloomFilterConfig => {
  return config.type === 'bloom';
};

/**
 * Type guard for pixelate filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is PixelateFilterConfig
 *
 */
export const isPixelateFilter = (config: FilterConfig): config is PixelateFilterConfig => {
  return config.type === 'pixelate';
};

/**
 * Type guard for twist filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is TwistFilterConfig
 *
 */
export const isTwistFilter = (config: FilterConfig): config is TwistFilterConfig => {
  return config.type === 'twist';
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
 * Type guard for color matrix filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is ColorMatrixFilterConfig
 *
 */
export const isColorMatrixFilter = (config: FilterConfig): config is ColorMatrixFilterConfig => {
  return config.type === 'colorMatrix';
};

/**
 * Type guard for outline filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is OutlineFilterConfig
 *
 */
export const isOutlineFilter = (config: FilterConfig): config is OutlineFilterConfig => {
  return config.type === 'outline';
};

/**
 * Type guard for bulge pinch filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is BulgePinchFilterConfig
 *
 */
export const isBulgePinchFilter = (config: FilterConfig): config is BulgePinchFilterConfig => {
  return config.type === 'bulgePinch';
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
 * Type guard for old film filter configuration
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is OldFilmFilterConfig
 *
 */
export const isOldFilmFilter = (config: FilterConfig): config is OldFilmFilterConfig => {
  return config.type === 'oldFilm';
};

/**
 * Filter module entry for dynamic loading
 * 
 * @example
 * ```typescript
 * const moduleEntry: FilterModuleEntry = {
 *   state: 'loaded',
 *   lastUsed: Date.now(),
 *   useCount: 5,
 *   creator: (config) => createGlowFilter(config)
 * };
 * ```
 */
export interface FilterModuleEntry {
  /** Module loading state */
  state: 'unloaded' | 'loading' | 'loaded' | 'error';
  /** Module loading promise */
  loadPromise?: Promise<(config: FilterConfig) => FilterResult>;
  /** Last used timestamp */
  lastUsed: number;
  /** Usage count */
  useCount: number;
  /** Load time in milliseconds */
  loadTime?: number;
  /** Filter creator function */
  creator?: (config: FilterConfig) => FilterResult;
  /** Module load error if any */
  error?: Error;
}

/**
 * Filter instance tracking for FilterManager
 * 
 * @example
 * ```typescript
 * const filterInstance: FilterInstance = {
 *   id: createFilterId('filter_123'),
 *   filter: new GlowFilter(),
 *   config: { type: 'glow', enabled: true, intensity: createFilterIntensity(7) },
 *   createdAt: Date.now(),
 *   lastUsed: Date.now(),
 *   useCount: 3
 * };
 * ```
 */
export interface FilterInstance {
  /** Filter ID */
  id: FilterId;
  /** PIXI filter instance */
  filter: Filter;
  /** Filter configuration */
  config: FilterConfig;
  /** Creation timestamp */
  createdAt: number;
  /** Last used timestamp */
  lastUsed: number;
  /** Usage count */
  useCount: number;
} 