import { ColorGradientFilter as PixiColorGradientFilter, type ColorStop } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the ColorGradient filter
 *
 * @example
 * ```typescript
 * const config: ColorGradientFilterConfig = {
 *   type: 'colorGradient',
 *   alpha: 0.8,
 *   angle: 45,
 *   maxColors: 5,
 *   replace: false,
 *   stops: [
 *     { offset: 0, color: 0xff0000, alpha: 1 },
 *     { offset: 1, color: 0x0000ff, alpha: 1 }
 *   ],
 *   intensity: 5
 * };
 * ```
 */
export interface ColorGradientFilterConfig extends BaseFilterConfig {
  type: 'colorGradient';
  stops: ColorStop[];    // Collection of color stops (required, must be 2+)
  alpha?: number;        // The alpha value of the gradient (0-1)
  angle?: number;        // The angle of the gradient in degrees
  maxColors?: number;    // The maximum number of colors to render (0 = no limit)
  replace?: boolean;     // If true, the gradient will replace the existing color, otherwise it will be multiplied with it
  gradientType?: number; // The type of gradient (0 = LINEAR, 1 = RADIAL, 2 = CONIC)
}

/**
 * ColorGradient Filter Implementation
 *
 * Creates a colored gradient effect using PIXI.js ColorGradientFilter.
 * Renders a colored gradient that can either replace or multiply with existing colors.
 *
 * @example
 * ```typescript
 * const filter = new ColorGradientFilter({ 
 *   type: 'colorGradient', 
 *   stops: [
 *     { offset: 0, color: 0xff0000, alpha: 1 },
 *     { offset: 1, color: 0x0000ff, alpha: 1 }
 *   ],
 *   alpha: 0.8,
 *   angle: 90,
 *   replace: false
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class ColorGradientFilter extends BaseFilter<ColorGradientFilterConfig> {
  /** Linear gradient type constant */
  static readonly LINEAR = 0;
  /** Radial gradient type constant */
  static readonly RADIAL = 1;
  /** Conic gradient type constant */
  static readonly CONIC = 2;

  /**
   * Creates a new ColorGradientFilter instance
   *
   * @param config - The filter configuration
   *
   */
  constructor(config: ColorGradientFilterConfig) {
    const pixiFilter = new PixiColorGradientFilter({
      type: config.gradientType ?? ColorGradientFilter.LINEAR,
      stops: config.stops,
      alpha: config.alpha ?? 1,
      angle: config.angle ?? 90,
      maxColors: config.maxColors ?? 0,
      replace: config.replace ?? false
    });
    super(config, pixiFilter);
  }

  private get colorGradientFilter(): PixiColorGradientFilter {
    return this.pixiFilter as PixiColorGradientFilter;
  }

  protected initialize(): void {
    // Call parent initialize to handle intensity
    super.initialize();
  }

  /**
   * Updates the filter intensity
   *
   * Intensity affects the alpha value of the gradient, scaling from the configured alpha value
   * to full opacity (1.0) at maximum intensity.
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Get base alpha from configuration
    const baseAlpha = this.originalConfig.alpha ?? 1;
    
    // Scale alpha based on intensity (0-10 maps to baseAlpha-1.0)
    // Each intensity point increases alpha by 10% towards full opacity
    const scaledAlpha = Math.min(1, baseAlpha + (intensityValue * (1 - baseAlpha) * 0.1));
    
    this.colorGradientFilter.alpha = scaledAlpha;
  }

  /**
   * Resets the filter to its original configuration
   */
  reset(): void {
    // Reset to original configuration values
    this.colorGradientFilter.alpha = this.originalConfig.alpha ?? 1;
    this.colorGradientFilter.angle = this.originalConfig.angle ?? 90;
    this.colorGradientFilter.maxColors = this.originalConfig.maxColors ?? 0;
    this.colorGradientFilter.replace = this.originalConfig.replace ?? false;
    this.colorGradientFilter.type = this.originalConfig.gradientType ?? ColorGradientFilter.LINEAR;
    this.colorGradientFilter.stops = this.originalConfig.stops;
  }

  /**
   * Gets the current state of the filter
   *
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      ...super.getState(),
      alpha: this.colorGradientFilter.alpha,
      angle: this.colorGradientFilter.angle,
      maxColors: this.colorGradientFilter.maxColors,
      replace: this.colorGradientFilter.replace,
      gradientType: this.colorGradientFilter.type,
      stops: this.colorGradientFilter.stops,
      configuredAlpha: this.originalConfig.alpha,
      configuredAngle: this.originalConfig.angle,
      configuredStops: this.originalConfig.stops
    };
  }
}

/**
 * Factory function for backward compatibility
 *
 * @param config - The filter configuration
 *
 * @returns The filter instance with utility methods
 *
 */
export function createColorGradientFilter(config: ColorGradientFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new ColorGradientFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 