/**
 * PIXI Filter Type System
 * 
 * Comprehensive type definitions for all PIXI filters with integration
 * to our existing architecture patterns and performance optimization.
 * 
 * @module Filters
 * @version 1.0.0
 */

import type { Filter, Texture } from 'pixi.js';
import type { Brand } from './branded';
import type { PointData, ColorSource } from 'pixi.js';

// Import filter configs from their respective files
import type { BloomFilterConfig } from '../filters/BloomFilter';
import type { BackdropBlurFilterConfig } from '../filters/BackdropBlurFilter';
import type { ColorGradientFilterConfig } from '../filters/ColorGradientFilter';
import type { ColorReplaceFilterConfig } from '../filters/ColorReplaceFilter';

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
export interface AlphaFilterConfig extends BaseFilterConfig {
    type: 'alpha';
}

/**
 * Configuration for the Blur filter
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
  strength?: number;     // Overall blur strength (0 - 10)
  quality?: number;      // Quality of the blur (number of passes)
  resolution?: number;   // Resolution of the blur filter
  strengthX?: number;    // Strength of horizontal blur
  strengthY?: number;    // Strength of vertical blur
  repeatEdgePixels?: boolean; // Whether to clamp the edge of the target
}

/**
 * Configuration for the Bloom filter
 * 
 * Imported from BloomFilter.ts
 */
export type { BloomFilterConfig };

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
export interface DropShadowFilterConfig extends BaseFilterConfig {
    type: 'dropShadow';
    alpha?: number;         // Alpha of the shadow (default: 1)
    blur?: number;          // Blur strength of the shadow (default: 2)
    color?: ColorSource;    // Shadow color (default: 0x000000)
    offset?: PointData;     // Shadow offset [x,y] (default: [4,4])
    offsetX?: number;       // X offset of shadow (default: 4)
    offsetY?: number;       // Y offset of shadow (default: 4)
    pixelSize?: PointData;  // Pixel size for Kawase blur (default: [1,1])
    pixelSizeX?: number;    // X pixel size (default: 1)
    pixelSizeY?: number;    // Y pixel size (default: 1)
    quality?: number;       // Blur quality (default: 4)
    shadowOnly?: boolean;   // Only show shadow, not the object (default: false)
    primaryProperty?: 'alpha' | 'blur' | 'offsetX' | 'offsetY'; // Property controlled by intensity
}

/**
 * Configuration for the Emboss filter
 *
 * Creates a relief-like effect making the display object appear carved or embossed.
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
  strength?: number;        // Strength of the emboss effect (default: 5)
  primaryProperty?: 'strength'; // Property controlled by intensity
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
export interface GrayscaleFilterConfig extends BaseFilterConfig {
    type: 'grayscale';
}

/**
 * Configuration for the Noise filter
 * A Noise effect filter. Adds random noise/grain effect.
 *
 * @see https://pixijs.download/release/docs/filters.NoiseFilter.html
 *
 * @example
 * ```typescript
 * const config: NoiseFilterConfig = {
 *   type: 'noise',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   noise: 0.3,       // PIXI property: amount of noise (0, 1]
 *   seed: 42,         // PIXI property: seed for random generation
 *   generateNewSeedOnUpdate: true
 * };
 * ```
 */
export interface NoiseFilterConfig extends BaseFilterConfig {
  type: 'noise';
  
  // PIXI Properties (matches official documentation)
  noise?: number;                       // The amount of noise to apply (0, 1] (default: 0.5)
  seed?: number;                        // A seed value to apply to the random noise generation
  
  // Custom enhancements
  generateNewSeedOnUpdate?: boolean;    // Whether to generate a new seed when intensity changes
  primaryProperty?: 'noise';           // Property controlled by intensity
}

/**
 * Configuration for the Displacement filter
 *
 * Uses the pixel values from a displacement map texture to perform a displacement effect.
 * The DisplacementFilter uses core PIXI.js DisplacementFilter.
 * The red channel is used for X displacement and green channel for Y displacement.
 *
 * Based on PIXI.js DisplacementFilter documentation:
 *
 * @see https://pixijs.download/release/docs/filters.DisplacementFilter.html
 *
 * @example
 * ```typescript
 * const config: DisplacementFilterConfig = {
 *   type: 'displacement',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   displacementMap: myTexture,
 *   scale: { x: 20, y: 20 }
 * };
 * ```
 */
export interface DisplacementFilterConfig extends BaseFilterConfig {
  type: 'displacement';
  
  // Core PIXI.js DisplacementFilter Properties
  displacementMap: Texture | string;   // The texture used for displacement map (required)
  scale?: PointData;                   // Scale of the displacement as {x, y} point (default: depends on impl)
  
  // Custom enhancements for our implementation
  primaryProperty?: 'scale'; // Property controlled by intensity
}

/**
 * Configuration for the Glow filter
 *
 * Creates a glow effect around display objects with configurable inner and outer strength,
 * color, distance, and quality settings.
 *
 * @example
 * ```typescript
 * const config: GlowFilterConfig = {
 *   type: 'glow',
 *   enabled: true,
 *   outerStrength: 2,
 *   innerStrength: 0,
 *   color: 0x00ff00,
 *   distance: 10,
 *   quality: 0.3,
 *   knockout: false,
 *   alpha: 1,
 *   intensity: 6
 * };
 * ```
 */
export interface GlowFilterConfig extends BaseFilterConfig {
  type: 'glow';
  alpha?: number;          // The alpha of the glow (default: 1)
  color?: ColorSource;     // The color of the glow (default: 0xFFFFFF)
  distance?: number;       // The distance of the glow (no official default documented)
  innerStrength?: number;  // The strength of the glow inward from the edge of the sprite (default: 0)
  knockout?: boolean;      // Only draw the glow, not the texture itself (default: false)
  outerStrength?: number;  // The strength of the glow outward from the edge of the sprite (default: 4)
  quality?: number;        // A number between 0 and 1 that describes the quality of the glow, higher = less performant (default: 0.1)
  primaryProperty?: 'innerStrength' | 'outerStrength' | 'distance' | 'quality' | 'alpha'; // Property controlled by intensity
}

/**
 * Configuration for the Glitch filter
 *
 * @example
 * const config: GlitchFilterConfig = {
 *   type: 'glitch',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   slices: 5,
 *   offset: 100,
 *   direction: 0
 * };
 */
export interface GlitchFilterConfig extends BaseFilterConfig {
  type: 'glitch';
  average?: boolean;       // If true, divides bands equally; false makes it more random (default: false)
  direction?: number;      // Angle in degrees of the offset slices (default: 0)
  red?: PointData;         // Red channel offset {x, y} coordinates (default: {x:0,y:0})
  green?: PointData;       // Green channel offset {x, y} coordinates (default: {x:0,y:0})
  blue?: PointData;        // Blue channel offset {x, y} coordinates (default: {x:0,y:0})
  slices?: number;         // Number of slices/bands (default: 5)
  offset?: number;         // Maximum offset amount of slices (default: 100)
  minSize?: number;        // Minimum size of slices as portion of sampleSize (default: 8)
  sampleSize?: number;     // Height of the displacement map canvas (default: 512)
  seed?: number;           // Seed value for randomizing the effect (default: 0)
  fillMode?: number;       // Fill mode for displaced areas (0=transparent, default: 0)
  offsets?: Array<number> | Float32Array; // Manually set custom slices offset of displacement bitmap
  sizes?: Array<number> | Float32Array;   // Manually custom slices size (height) of displacement bitmap
  animated?: boolean;      // Whether the effect should automatically animate (custom enhancement)
  refreshFrequency?: number; // How often to apply a new random offset (for animation, custom enhancement)
  primaryProperty?: 'slices' | 'offset' | 'direction' | 'red' | 'blue'; // Property controlled by intensity
}

/**
 * Configuration for the RGB Split filter
 * An RGB Split Filter that creates chromatic aberration effects by separating RGB channels
 *
 * @see https://pixijs.io/filters/docs/RGBSplitFilter.html
 *
 * @example
 * const config: RGBSplitFilterConfig = {
 *   type: 'rgbSplit',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   red: { x: -10, y: 0 },   // PIXI default values
 *   green: { x: 0, y: 10 },  // PIXI default values  
 *   blue: { x: 0, y: 0 }     // PIXI default values
 * };
 */
export interface RGBSplitFilterConfig extends BaseFilterConfig {
  type: 'rgbSplit';
  /** Red channel offset as {x, y} point (default: {x:-10,y:0}) */
  red?: PointData;
  /** Green channel offset as {x, y} point (default: {x:0,y:10}) */
  green?: PointData;
  /** Blue channel offset as {x, y} point (default: {x:0,y:0}) */
  blue?: PointData;
  /** Red channel x-offset - alternative to point (default: -10) */
  redX?: number;
  /** Red channel y-offset - alternative to point (default: 0) */
  redY?: number;
  /** Green channel x-offset - alternative to point (default: 0) */
  greenX?: number;
  /** Green channel y-offset - alternative to point (default: 10) */
  greenY?: number;
  /** Blue channel x-offset - alternative to point (default: 0) */
  blueX?: number;
  /** Blue channel y-offset - alternative to point (default: 0) */
  blueY?: number;
  /** Property controlled by intensity (default: 'red') */
  primaryProperty?: 'red' | 'green' | 'blue';
  /** Direction of red channel offset - custom enhancement */
  redDirection?: 'horizontal' | 'vertical' | 'diagonal';
  /** Direction of green channel offset - custom enhancement */
  greenDirection?: 'horizontal' | 'vertical' | 'diagonal';
  /** Direction of blue channel offset - custom enhancement */
  blueDirection?: 'horizontal' | 'vertical' | 'diagonal';
}

/**
 * Configuration for the Adjustment filter
 *
 * @example
 * const config: AdjustmentFilterConfig = {
 *   type: 'adjustment',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   gamma: 1.2,
 *   contrast: 1.1,
 *   saturation: 1.3
 * };
 */
export interface AdjustmentFilterConfig extends BaseFilterConfig {
  type: 'adjustment';
  gamma?: number;         // Amount of luminance (0-2 range, 1 is neutral)
  contrast?: number;      // Amount of contrast (0-2 range, 1 is neutral)
  saturation?: number;    // Amount of color saturation (0-2 range, 1 is neutral)
  brightness?: number;    // Overall brightness (0-2 range, 1 is neutral)
  red?: number;           // Multiplier for red channel (0-2 range, 1 is neutral)
  green?: number;         // Multiplier for green channel (0-2 range, 1 is neutral)
  blue?: number;          // Multiplier for blue channel (0-2 range, 1 is neutral)
  alpha?: number;         // Overall alpha channel (0-1 range, 1 is fully opaque)
  primaryProperty?: 'gamma' | 'contrast' | 'saturation' | 'brightness' | 'red' | 'green' | 'blue' | 'alpha';
}

/**
 * Configuration for the ColorMatrix filter
 *
 * @example
 * ```typescript
 * const config: ColorMatrixFilterConfig = {
 *   type: 'colorMatrix',
 *   enabled: true,
 *   alpha: 1.0,
 *   brightness: 1.2,
 *   contrast: 1.1,
 *   saturation: 1.3,
 *   intensity: 6
 * };
 * ```
 */
export interface ColorMatrixFilterConfig extends BaseFilterConfig {
  type: 'colorMatrix';
  alpha?: number;           // Opacity value for mixing original and result colors (0-1, default: 1)
  brightness?: number;      // Brightness adjustment (0-2, default: 1)
  contrast?: number;        // Contrast adjustment (0-2+, default: 1)
  saturation?: number;      // Saturation adjustment (0-2+, default: 1)
  hue?: number;            // Hue rotation in degrees (default: 0)
  matrix?: number[];        // Custom 5x4 color matrix (20 values, overrides other properties)
  sepia?: boolean;         // Apply sepia effect (default: false)
  greyscale?: boolean;     // Apply greyscale effect (default: false)
  negative?: boolean;      // Apply negative effect (default: false)
  primaryProperty?: 'alpha' | 'brightness' | 'contrast' | 'saturation' | 'hue'; // Property controlled by intensity
}

/**
 * Configuration for the ColorOverlay filter
 *
 * @example
 * ```typescript
 * const config: ColorOverlayFilterConfig = {
 *   type: 'colorOverlay',
 *   enabled: true,
 *   color: 0xff0000,
 *   alpha: 0.5,
 *   intensity: 5
 * };
 * ```
 */
export interface ColorOverlayFilterConfig extends BaseFilterConfig {
  type: 'colorOverlay';
  color?: number;           // The color of the overlay (hex format, default: 0x000000)
  alpha?: number;           // The alpha (opacity) of the overlay (0-1, default: 1)
  primaryProperty?: 'alpha' | 'color';  // Property controlled by intensity
}

/**
 * Configuration for the Convolution filter
 *
 * @example
 * ```typescript
 * const config: ConvolutionFilterConfig = {
 *   type: 'convolution',
 *   enabled: true,
 *   preset: 'sharpen',
 *   width: 200,
 *   height: 200,
 *   intensity: 7
 * };
 * ```
 */
export interface ConvolutionFilterConfig extends BaseFilterConfig {
  type: 'convolution';
  matrix?: number[];        // Array of 9 values for 3x3 convolution matrix
  width?: number;           // Width of the object being transformed (default: 200)
  height?: number;          // Height of the object being transformed (default: 200)
  preset?: 'normal' | 'gaussianBlur' | 'boxBlur' | 'sharpen' | 'edgeDetection' | 'emboss' | 'topSobel' | 'rightSobel'; // Preset effect
  primaryProperty?: 'matrix' | 'width' | 'height'; // Property controlled by intensity
}

/**
 * Configuration for the HSL Adjustment filter
 * 
 * HSL (Hue, Saturation, Lightness) filter for color adjustments.
 * All PIXI properties with their documented defaults.
 *
 * @example
 * ```typescript
 * const config: HslAdjustmentFilterConfig = {
 *   type: 'hsl',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   hue: 45,          // Rotate hue by 45 degrees
 *   saturation: 0.2,  // Increase saturation by 20%
 *   lightness: -0.1,  // Decrease lightness by 10%
 *   colorize: true,   // Enable colorize mode
 *   alpha: 0.8        // 80% opacity
 * };
 * ```
 */
export interface HslAdjustmentFilterConfig extends BaseFilterConfig {
  type: 'hsl';
  alpha?: number;           // The amount of alpha (0 to 1, default: 1)
  colorize?: boolean;       // Whether to colorize the image (default: false)
  hue?: number;            // The amount of hue in degrees (-180 to 180, default: 0)
  lightness?: number;      // The amount of lightness (-1 to 1, default: 0)
  saturation?: number;     // The amount of saturation (-1 to 1, default: 0)
  primaryProperty?: 'hue' | 'saturation' | 'lightness' | 'alpha'; // Property controlled by intensity
}

/**
 * Configuration for the Kawase Blur filter
 * 
 * A much faster blur than Gaussian blur, but more complicated to use.
 * All PIXI properties with their documented defaults.
 *
 * @example
 * ```typescript
 * const config: KawaseBlurFilterConfig = {
 *   type: 'kawaseBlur',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   strength: 8,        // Amount of blur
 *   quality: 4,         // Number of passes  
 *   clamp: true,        // Clamp filter edges
 *   pixelSize: {x: 2, y: 2},  // Pixel size for blur
 *   pixelSizeX: 2,      // Alternative X pixel size
 *   pixelSizeY: 2       // Alternative Y pixel size
 * };
 * ```
 */
export interface KawaseBlurFilterConfig extends BaseFilterConfig {
  type: 'kawaseBlur';
  clamp?: boolean;         // Get the if the filter is clamped (default: false)
  kernels?: number[];      // The kernel size of the blur filter, for advanced usage (default: [0])
  pixelSize?: PointData;   // The size of the pixels. Large size is blurrier. For advanced usage. (default: {x:1,y:1})
  pixelSizeX?: number;     // The size of the pixels on the `x` axis. Large size is blurrier. For advanced usage. (default: 1)
  pixelSizeY?: number;     // The size of the pixels on the `y` axis. Large size is blurrier. For advanced usage. (default: 1)
  quality?: number;        // The quality of the filter, integer greater than `1`. (default: 3)
  strength?: number;       // The amount of blur, value greater than `0`. (default: 4)
  primaryProperty?: 'strength' | 'quality' | 'pixelSizeX' | 'pixelSizeY'; // Property controlled by intensity
}

/**
 * Configuration for the Motion Blur filter
 * 
 * The MotionBlurFilter applies a Motion blur to an object.
 * All PIXI properties with their documented defaults.
 *
 * @example
 * ```typescript
 * const config: MotionBlurFilterConfig = {
 *   type: 'motionBlur',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   velocity: {x: 15, y: 5},  // Motion velocity
 *   velocityX: 15,            // Alternative X velocity  
 *   velocityY: 5,             // Alternative Y velocity
 *   kernelSize: 7,            // Blur kernel size (odd, >= 5)
 *   offset: 2                 // Blur offset
 * };
 * ```
 */
export interface MotionBlurFilterConfig extends BaseFilterConfig {
  type: 'motionBlur';
  kernelSize?: number;      // The kernelSize of the blur filter. Must be odd number >= 5 (default: 5)
  offset?: number;          // The offset of the blur filter (default: 0)
  velocity?: PointData;     // Sets the velocity of the motion for blur effect This should be a size 2 array or an object containing `x` and `y` values, you cannot change types once defined in the constructor (default: {x:0,y:0})
  velocityX?: number;       // Sets the velocity of the motion for blur effect on the `x` axis (default: 0)
  velocityY?: number;       // Sets the velocity of the motion for blur effect on the `y` axis (default: 0)
  direction?: number;       // Direction in degrees (0-360) - helper property for easier velocity setting (custom enhancement)
  primaryProperty?: 'velocity' | 'velocityX' | 'velocityY' | 'kernelSize' | 'offset'; // Property controlled by intensity
}

/**
 * Configuration for the Bulge Pinch filter
 *
 * @example
 * ```typescript
 * const config: BulgePinchFilterConfig = {
 *   type: 'bulgePinch',
 *   enabled: true,
 *   strength: 0.5,
 *   radius: 100,
 *   center: { x: 0.5, y: 0.5 },
 *   intensity: 6
 * };
 * ```
 */
export interface BulgePinchFilterConfig extends BaseFilterConfig {
  type: 'bulgePinch';
  center?: PointData;       // Center of the effect in normalized screen coords (default: {x:0.5, y:0.5})
  centerX?: number;         // X coordinate of center (0-1, default: 0.5 when center.x is used)
  centerY?: number;         // Y coordinate of center (0-1, default: 0.5 when center.y is used)
  radius?: number;          // Radius of the circle of effect (default: 100)
  strength?: number;        // Strength value between -1 and 1 (-1=pinch, 0=no effect, 1=bulge) (default: 1)
  primaryProperty?: 'strength' | 'radius' | 'centerX' | 'centerY'; // Property controlled by intensity
}

/**
 * Configuration for the Shockwave filter
 *
 * @example
 * ```typescript
 * const config: ShockwaveFilterConfig = {
 *   type: 'shockwave',
 *   enabled: true,
 *   amplitude: 30,
 *   center: { x: 0, y: 0 },
 *   intensity: 7
 * };
 * ```
 */
export interface ShockwaveFilterConfig extends BaseFilterConfig {
  type: 'shockwave';
  amplitude?: number;       // The amplitude of the shockwave (default: 30)
  brightness?: number;      // The brightness of the shockwave (default: 1)
  center?: PointData;       // Center coordinates {x,y} of the effect (default: {x:0,y:0})
  centerX?: number;         // X coordinate of center (default: 0)
  centerY?: number;         // Y coordinate of center (default: 0)
  radius?: number;          // Max radius of shockwave (default: -1, infinite distance)
  speed?: number;           // Speed of the ripple effect in pixels/second (default: 500)
  wavelength?: number;      // Wavelength of the shockwave (default: 160)
  time?: number;            // Elapsed time of the shockwave, controls current size
  primaryProperty?: 'amplitude' | 'wavelength' | 'radius' | 'brightness' | 'speed'; // Property controlled by intensity
  animate?: boolean;        // Whether to animate the waves over time
  animationSpeed?: number;  // Speed of animation (time increment per second)
  pulse?: boolean;          // Whether to create a pulsing effect
  pulseIntensity?: number;  // Intensity of the pulse effect (0-1)
  pulseDuration?: number;   // Duration of one pulse cycle in seconds
}

/**
 * Configuration for the CRT filter
 *
 * Simulates a CRT (Cathode Ray Tube) display with scan lines, screen curvature,
 * vignetting, and noise effects for retro gaming aesthetics.
 *
 * @example
 * ```typescript
 * const config: CRTFilterConfig = {
 *   type: 'crt',
 *   enabled: true,
 *   curvature: 1.0,
 *   lineWidth: 1.0,
 *   noise: 0.3,
 *   intensity: 6
 * };
 * ```
 */
export interface CRTFilterConfig extends BaseFilterConfig {
  type: 'crt';
  curvature?: number;       // Bend of interlaced lines, higher value means more bend (default: 1)
  lineContrast?: number;    // Contrast of interlaced lines (default: 0.25)
  lineWidth?: number;       // Width of interlaced lines (default: 1)
  noise?: number;           // Opacity/intensity of the noise effect between 0 and 1 (default: 0.3)
  noiseSize?: number;       // The size of the noise particles (default: 0)
  seed?: number;            // A seed value to apply to the random noise generation (default: 0)
  time?: number;            // For animating interlaced lines (default: 0)
  verticalLine?: boolean;   // true for vertical lines, false for horizontal (default: false)
  vignetting?: number;      // The radius of the vignette effect, smaller values produces a smaller vignette (default: 0.3)
  vignettingAlpha?: number; // Amount of opacity of vignette (default: 1)
  vignettingBlur?: number;  // Blur intensity of the vignette (default: 0.3)
  primaryProperty?: 'curvature' | 'noise' | 'lineContrast' | 'vignetting'; // Property controlled by intensity
}

/**
 * Configuration for the Godray filter
 *
 * Creates atmospheric light beam effects with configurable density and animation.
 * Based on Alain Galvan's original filter implementation.
 *
 * @example
 * ```typescript
 * const config: GodrayFilterConfig = {
 *   type: 'godray',
 *   enabled: true,
 *   alpha: 1,
 *   angle: 30,
 *   center: { x: 0, y: 0 },
 *   centerX: 0,
 *   centerY: 0,
 *   gain: 0.5,
 *   lacunarity: 2.5,
 *   parallel: true,
 *   time: 0,
 *   intensity: 6
 * };
 * ```
 */
export interface GodrayFilterConfig extends BaseFilterConfig {
  type: 'godray';
  alpha?: number;          // The alpha (opacity) of the rays. 0 is fully transparent, 1 is fully opaque (default: 1)
  angle?: number;          // The angle/light-source of the rays in degrees. 0 is vertical rays, values of 90 or -90 produce horizontal rays (default: 30)
  center?: PointData;      // Focal point for non-parallel rays, to use this `parallel` must be set to `false` (default: {x:0,y:0})
  centerX?: number;        // Focal point for non-parallel rays on the x axis, to use this `parallel` must be set to `false` (default: 0)
  centerY?: number;        // Focal point for non-parallel rays on the y axis, to use this `parallel` must be set to `false` (default: 0)
  gain?: number;           // General intensity of the effect. A value closer to 1 will produce a more intense effect, where a value closer to 0 will produce a subtler effect (default: 0.5)
  lacunarity?: number;     // The density of the fractal noise. A higher amount produces more rays and a smaller amount produces fewer waves (default: 2.5)
  parallel?: boolean;      // `true` if light rays are parallel (uses angle), `false` to use the focal `center` point (default: true)
  time?: number;           // The current time position (default: 0)
  primaryProperty?: 'alpha' | 'angle' | 'gain' | 'lacunarity' | 'time'; // Property controlled by intensity
}

/**
 * Configuration for the MultiColorReplace filter
 * Replaces multiple colors in an image with corresponding target colors
 *
 * @see https://pixijs.io/filters/docs/MultiColorReplaceFilter.html
 *
 * @example
 * ```typescript
 * const config: MultiColorReplaceFilterConfig = {
 *   type: 'multiColorReplace',
 *   replacements: [[0xff0000, 0x00ff00], [0x0000ff, 0xffff00]],
 *   tolerance: 0.1,
 *   intensity: 5
 * };
 * ```
 */
export interface MultiColorReplaceFilterConfig extends BaseFilterConfig {
  type: 'multiColorReplace';
  
  // PIXI Properties (matches official documentation)
  replacements?: Array<[ColorSource, ColorSource]>;  // Array of [originalColor, targetColor] pairs
  tolerance?: number;                                 // Color comparison tolerance (default: 0.05)
  maxColors?: number;                                 // Maximum replacements (constructor-only)
  
  // Custom enhancements
  primaryProperty?: 'tolerance';                      // Property controlled by intensity
}

/**
 * Configuration for the OldFilm filter
 * Creates an old film effect with sepia tone, noise, scratches, and vignetting
 *
 * @see https://pixijs.io/filters/docs/OldFilmFilter.html
 *
 * @example
 * ```typescript
 * const config: OldFilmFilterConfig = {
 *   type: 'oldFilm',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   sepia: 0.4,           // More sepia tone
 *   noise: 0.3,           // Noise intensity
 *   scratch: 0.7,         // More scratches
 *   vignetting: 0.2,      // Subtle vignette
 *   seed: 42              // Consistent randomization
 * };
 * ```
 */
export interface OldFilmFilterConfig extends BaseFilterConfig {
  type: 'oldFilm';
  
  // PIXI Properties (matches official documentation)
  noise?: number;               // Opacity/intensity of the noise effect between 0 and 1 (default: 0.3)
  noiseSize?: number;           // The size of the noise particles (default: 1)
  scratch?: number;             // How often scratches appear (default: 0.5)
  scratchDensity?: number;      // The density of the number of scratches (default: 0.3)
  scratchWidth?: number;        // The width of the scratches (default: 1)
  seed?: number;                // A seed value to apply to the random noise generation (default: 0)
  sepia?: number;               // The amount of saturation of sepia effect (default: 0.3)
  vignetting?: number;          // The radius of the vignette effect (default: 0.3)
  vignettingAlpha?: number;     // Amount of opacity on the vignette (default: 1)
  vignettingBlur?: number;      // Blur intensity of the vignette (default: 1)
  
  // Custom enhancements
  primaryProperty?: 'sepia' | 'noise' | 'scratch' | 'vignetting'; // Property controlled by intensity
}

/**
 * Configuration for the Outline filter
 *
 * @example
 * ```typescript
 * const config: OutlineFilterConfig = {
 *   type: 'outline',
 *   enabled: true,
 *   color: 0x000000,
 *   knockout: true,
 *   quality: 0.1,
 *   thickness: 1,
 *   alpha: 1
 * };
 * ```
 */
export interface OutlineFilterConfig extends BaseFilterConfig {
  type: 'outline';
  /** The color value of the outline (default: 0x000000) */
  color?: ColorSource;
  /** Whether to only render outline, not the contents (default: false) */
  knockout?: boolean;
  /** The quality of the outline from 0 to 1 (default: 0.1) */
  quality?: number;
  /** The thickness of the outline (default: 1) */
  thickness?: number;
  /** Coefficient for alpha multiplication (default: 1) */
  alpha?: number;
  /** Property to be controlled by intensity (default: 'thickness') */
  primaryProperty?: 'thickness' | 'alpha';
}

/**
 * Configuration for the Pixelate filter
 * Applies a pixelate effect making display objects appear 'blocky'
 *
 * @see https://pixijs.io/filters/docs/PixelateFilter.html
 *
 * @example
 * ```typescript
 * const config: PixelateFilterConfig = {
 *   type: 'pixelate',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   size: 15,           // Square pixels of size 15x15
 *   sizeX: 20,          // Alternative: separate X size
 *   sizeY: 10           // Alternative: separate Y size
 * };
 * ```
 */
export interface PixelateFilterConfig extends BaseFilterConfig {
  type: 'pixelate';
  
  // PIXI Properties (matches official documentation)
  size?: PointData;                    // The size of the pixels as {x, y} point (default: {x:10, y:10})
  sizeX?: number;                      // Horizontal size of pixels (default: 10)
  sizeY?: number;                      // Vertical size of pixels (default: 10)
  
  // Custom enhancements
  primaryProperty?: 'size' | 'sizeX' | 'sizeY'; // Property controlled by intensity
}

/**
 * Union type for all filter configurations
 * 
 * This type represents all possible filter configurations in the system.
 * Used by the FilterManager and other systems that work with multiple filter types.
 */
export type FilterConfig = 
  | AlphaFilterConfig
  | BlurFilterConfig
  | DisplacementFilterConfig  
  | DropShadowFilterConfig
  | EmbossFilterConfig
  | GlowFilterConfig
  | GlitchFilterConfig
  | GrayscaleFilterConfig
  | NoiseFilterConfig
  | RGBSplitFilterConfig
  | AdjustmentFilterConfig
  | ColorMatrixFilterConfig
  | ColorOverlayFilterConfig
  | ColorReplaceFilterConfig
  | ConvolutionFilterConfig
  | HslAdjustmentFilterConfig
  | KawaseBlurFilterConfig
  | MotionBlurFilterConfig
  | BulgePinchFilterConfig
  | ShockwaveFilterConfig
  | CRTFilterConfig
  | GodrayFilterConfig
  | MultiColorReplaceFilterConfig
  | OldFilmFilterConfig
  | OutlineFilterConfig
  | PixelateFilterConfig
  | BackdropBlurFilterConfig
  | ColorGradientFilterConfig;

/**
 * Standard result interface returned by all filter creation functions
 * 
 * Provides a consistent API for controlling filters across the system.
 * All filter implementations should return this interface.
 *
 * @example
 * ```typescript
 * const result: FilterResult = createSomeFilter(config);
 * result.updateIntensity(8);
 * result.reset();
 * result.dispose();
 * ```
 */
export interface FilterResult {
  /** The actual PIXI filter instance */
  filter: Filter;
  /** Configuration used to create this filter */
  config: FilterConfig;
  /** Update the filter's intensity (0-10 scale) */
  updateIntensity: (intensity: FilterIntensity) => void;
  /** Reset the filter to initial state */
  reset: () => void;
  /** Clean up resources and destroy the filter */
  dispose: () => void;
  /** Get current filter state (optional) */
  getState?: () => Record<string, unknown>;
}

/**
 * Creates a branded FilterIntensity value
 * 
 * @param value - Numeric intensity value (0-10 range)
 *
 * @returns Branded FilterIntensity value
 *
 * @throws Error if value is outside valid range
 */
export function createFilterIntensity(value: number): FilterIntensity {
  if (!Number.isFinite(value)) {
    throw new Error('FilterIntensity must be a finite number');
  }
  if (value < 0 || value > 10) {
    throw new Error(`FilterIntensity must be between 0 and 10, got ${value}`);
  }
  return value as FilterIntensity;
}

/**
 * Creates a branded FilterId value
 * 
 * @param value - String identifier for the filter
 *
 * @returns Branded FilterId value
 *
 */
export function createFilterId(value: string): FilterId {
  return value as FilterId;
}

/**
 * Creates a branded FilterCacheKey value from configuration
 * 
 * @param config - Filter configuration
 *
 * @returns Branded FilterCacheKey value
 *
 */
export function createFilterCacheKey(config: FilterConfig): FilterCacheKey {
  // Create a simple hash-like key based on config properties
  const key = `${config.type}_${config.enabled ? 'on' : 'off'}_${config.intensity}`;
  return key as FilterCacheKey;
}

// Type guard functions for filter configurations
/**
 * Type guard to check if config is a DisplacementFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is DisplacementFilterConfig
 *
 */
export function isDisplacementFilter(config: FilterConfig): config is DisplacementFilterConfig {
  return config.type === 'displacement';
}

/**
 * Type guard to check if config is a BlurFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is BlurFilterConfig
 *
 */
export function isBlurFilter(config: FilterConfig): config is BlurFilterConfig {
  return config.type === 'blur';
}

/**
 * Type guard to check if config is a GlowFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is GlowFilterConfig
 *
 */
export function isGlowFilter(config: FilterConfig): config is GlowFilterConfig {
  return config.type === 'glow';
}

/**
 * Type guard to check if config is a GlitchFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is GlitchFilterConfig
 *
 */
export function isGlitchFilter(config: FilterConfig): config is GlitchFilterConfig {
  return config.type === 'glitch';
}

/**
 * Type guard to check if config is a RGBSplitFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is RGBSplitFilterConfig
 *
 */
export function isRGBSplitFilter(config: FilterConfig): config is RGBSplitFilterConfig {
  return config.type === 'rgbSplit';
}

/**
 * Type guard to check if config is an AdjustmentFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is AdjustmentFilterConfig
 *
 */
export function isAdjustmentFilter(config: FilterConfig): config is AdjustmentFilterConfig {
  return config.type === 'adjustment';
}

/**
 * Type guard to check if config is a ShockwaveFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is ShockwaveFilterConfig
 *
 */
export function isShockwaveFilter(config: FilterConfig): config is ShockwaveFilterConfig {
  return config.type === 'shockwave';
}

/**
 * Type guard to check if config is an AlphaFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is AlphaFilterConfig
 *
 */
export function isAlphaFilter(config: FilterConfig): config is AlphaFilterConfig {
  return config.type === 'alpha';
}

/**
 * Type guard to check if config is a CRTFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is CRTFilterConfig
 *
 */
export function isCRTFilter(config: FilterConfig): config is CRTFilterConfig {
  return config.type === 'crt';
}

/**
 * Type guard to check if config is a ColorReplaceFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is ColorReplaceFilterConfig
 *
 */
export function isColorReplaceFilter(config: FilterConfig): config is ColorReplaceFilterConfig {
  return config.type === 'colorReplace';
}

/**
 * Type guard to check if config is a ConvolutionFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is ConvolutionFilterConfig
 *
 */
export function isConvolutionFilter(config: FilterConfig): config is ConvolutionFilterConfig {
  return config.type === 'convolution';
}

/**
 * Type guard to check if config is a DropShadowFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is DropShadowFilterConfig
 *
 */
export function isDropShadowFilter(config: FilterConfig): config is DropShadowFilterConfig {
  return config.type === 'dropShadow';
}

/**
 * Type guard to check if config is a GrayscaleFilterConfig
 *
 * @param config - Filter configuration to check
 *
 * @returns True if config is GrayscaleFilterConfig
 *
 */
export function isGrayscaleFilter(config: FilterConfig): config is GrayscaleFilterConfig {
  return config.type === 'grayscale';
}

/**
 * Filter factory options interface
 * 
 * @example Basic filter factory configuration
 * ```ts
 * const options: FilterFactoryOptions = {
 *   enableProfiling: true,
 *   cacheSize: 100,
 *   defaultQuality: 4
 * };
 * ```
 */
export interface FilterFactoryOptions {
  /** Whether to enable performance monitoring */
  enableProfiling?: boolean;
  /** Maximum number of cached filters */
  cacheSize?: number;
  /** Default filter quality setting */
  defaultQuality?: number;
}

/**
 * Filter performance metrics interface
 * 
 * @example Performance metrics data structure
 * ```ts
 * const metrics: FilterPerformanceMetrics = {
 *   renderTime: 16.67,
 *   memoryUsage: 1024000,
 *   drawCalls: 12,
 *   gpuUtilization: 65.5
 * };
 * ```
 */
export interface FilterPerformanceMetrics {
  /** Render time in milliseconds */
  renderTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Number of draw calls */
  drawCalls: number;
  /** GPU utilization percentage */
  gpuUtilization: number;
}

/**
 * Filter animation state interface
 * 
 * @example Animation state tracking
 * ```ts
 * const state: FilterAnimationState = {
 *   isAnimating: true,
 *   startTime: Date.now(),
 *   duration: 1000,
 *   progress: 0.5
 * };
 * ```
 */
export interface FilterAnimationState {
  /** Whether the filter is currently animating */
  isAnimating: boolean;
  /** Animation start time */
  startTime: number;
  /** Animation duration in milliseconds */
  duration: number;
  /** Current animation progress (0-1) */
  progress: number;
}

/**
 * Filter event types
 */
export type FilterEventType = 
  | 'created'
  | 'updated'
  | 'destroyed'
  | 'enabled'
  | 'disabled'
  | 'error';

/**
 * Filter event interface
 * 
 * @example Filter system event
 * ```ts
 * const event: FilterEvent = {
 *   type: 'created',
 *   filterId: createFilterId('blur-001'),
 *   timestamp: Date.now(),
 *   data: { intensity: 5 }
 * };
 * ```
 */
export interface FilterEvent {
  /** Event type */
  type: FilterEventType;
  /** Filter ID that triggered the event */
  filterId: FilterId;
  /** Event timestamp */
  timestamp: number;
  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Filter manager configuration interface
 * 
 * @example Filter manager setup
 * ```ts
 * const config: FilterManagerConfig = {
 *   maxFilters: 50,
 *   autoCleanup: true,
 *   performance: {
 *     enabled: true,
 *     sampleInterval: 1000
 *   }
 * };
 * ```
 */
export interface FilterManagerConfig {
  /** Maximum number of active filters */
  maxFilters?: number;
  /** Whether to enable automatic cleanup */
  autoCleanup?: boolean;
  /** Performance monitoring settings */
  performance?: {
    enabled: boolean;
    sampleInterval: number;
  };
}

/**
 * Filter module entry interface
 * 
 * @example Filter module registration
 * ```ts
 * const entry: FilterModuleEntry = {
 *   type: 'blur',
 *   factory: createBlurFilter,
 *   defaultConfig: { type: 'blur', enabled: true, intensity: 5 },
 *   supportsAnimation: true
 * };
 * ```
 */
export interface FilterModuleEntry {
  /** Filter type */
  type: FilterType;
  /** Filter constructor or factory function */
  factory: (config: FilterConfig) => FilterResult;
  /** Default configuration */
  defaultConfig: Partial<FilterConfig>;
  /** Whether the filter supports animation */
  supportsAnimation?: boolean;
}

/**
 * Filter instance interface
 * 
 * @example Active filter instance
 * ```ts
 * const instance: FilterInstance = {
 *   id: createFilterId('blur-001'),
 *   type: 'blur',
 *   config: { type: 'blur', enabled: true, intensity: 5 },
 *   result: filterResult,
 *   createdAt: Date.now(),
 *   updatedAt: Date.now()
 * };
 * ```
 */
export interface FilterInstance {
  /** Unique instance ID */
  id: FilterId;
  /** Filter type */
  type: FilterType;
  /** Current configuration */
  config: FilterConfig;
  /** Filter result object */
  result: FilterResult;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}