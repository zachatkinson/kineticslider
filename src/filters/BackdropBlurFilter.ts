import { Filter } from 'pixi.js';
import { BackdropBlurFilter as PixiBackdropBlurFilter } from 'pixi-filters';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the Backdrop Blur filter
 *
 * @example
 * ```typescript
 * const config: BackdropBlurFilterConfig = {
 *   type: 'backdropBlur',
 *   strengthX: 15,
 *   strengthY: 15,
 *   intensity: 5
 * };
 * ```
 */
export interface BackdropBlurFilterConfig extends BaseFilterConfig {
  type: 'backdropBlur';
  strength?: number;           // Overall blur strength (0 - 10)
  quality?: number;            // Quality of the blur (number of passes)
  kernelSize?: number;         // Size of blur kernel (5, 7, 9, 11, 13, 15)
  resolution?: number;         // Resolution of the blur filter
  strengthX?: number;          // Strength of horizontal blur
  strengthY?: number;          // Strength of vertical blur
  repeatEdgePixels?: boolean;  // Whether to clamp the edge of the target
}

/**
 * Enhanced Backdrop Blur Filter Implementation
 *
 * The BackdropBlurFilter applies a Gaussian blur to everything behind an object, 
 * and then draws the object on top of it. This creates a "frosted glass" effect.
 *
 * Features:
 * - Intensity control with smart scaling
 * - Configurable blur parameters
 * - State management and reset functionality
 * - Enhanced error handling
 *
 * @example
 * ```typescript
 * const filter = new BackdropBlurFilter({ 
 *   type: 'backdropBlur', 
 *   strengthX: 15, 
 *   strengthY: 15,
 *   intensity: 5
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class BackdropBlurFilter extends BaseFilter<BackdropBlurFilterConfig> {
  private configuredStrengthX: number;
  private configuredStrengthY: number;

  /**
   * Creates a new BackdropBlurFilter instance
   *
   * @param config - The backdrop blur filter configuration
   *
   */
  constructor(config: BackdropBlurFilterConfig) {
    // Use PIXI.js BackdropBlurFilter from pixi-filters package
    const backdropBlurFilter = new PixiBackdropBlurFilter({
      strengthX: config.strengthX,
      strengthY: config.strengthY,
      quality: config.quality ?? 4,
      kernelSize: config.kernelSize ?? 5,
      resolution: config.resolution ?? 1
    });
    super(config, backdropBlurFilter);

    // Store configured strength values for intensity calculations
    this.configuredStrengthX = config.strengthX ?? 8;
    this.configuredStrengthY = config.strengthY ?? 8;
  }

  private get backdropBlurFilter(): PixiBackdropBlurFilter {
    return this.pixiFilter as PixiBackdropBlurFilter;
  }

  protected initialize(): void {
    // Set additional properties if provided
    if (this.originalConfig.repeatEdgePixels !== undefined) {
      this.backdropBlurFilter.repeatEdgePixels = this.originalConfig.repeatEdgePixels;
    }
    
    // Call parent initialize to handle intensity
    super.initialize();
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Calculate blur values based on configuration
    if (this.originalConfig.strengthX !== undefined || this.originalConfig.strengthY !== undefined) {
      // Individual axis configuration
      const baseStrengthX = this.originalConfig.strengthX ?? 8;
      const baseStrengthY = this.originalConfig.strengthY ?? 8;
      
      // Apply intensity scaling (each point of intensity adds 50% of the base strength)
      this.backdropBlurFilter.strengthX = baseStrengthX + (intensityValue * (baseStrengthX * 0.5));
      this.backdropBlurFilter.strengthY = baseStrengthY + (intensityValue * (baseStrengthY * 0.5));
    } else {
      // Default overall strength calculation
      const baseStrength = 8;
      this.backdropBlurFilter.strength = baseStrength + (intensityValue * 9.2); // Scale to reach 100 at intensity 10
    }
  }

  /**
   * Resets the filter to its original configuration
   */
  reset(): void {
    // Apply intensity only if strength properties are configured
    const hasStrengthConfig = this.originalConfig.strengthX !== undefined || 
                             this.originalConfig.strengthY !== undefined;

    if (this.originalConfig.intensity !== undefined && hasStrengthConfig) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    } else {
      // Reset to defaults
      this.backdropBlurFilter.strength = 8;
      this.backdropBlurFilter.strengthX = 8;
      this.backdropBlurFilter.strengthY = 8;
    }
  }

  /**
   * Gets the current state of the filter
   *
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    // Note: We avoid accessing .strength directly because BlurFilter throws an error
    // when strengthX and strengthY are different
    const safeStrength = this.backdropBlurFilter.strengthX === this.backdropBlurFilter.strengthY 
      ? this.backdropBlurFilter.strengthX 
      : Math.max(this.backdropBlurFilter.strengthX, this.backdropBlurFilter.strengthY);

    return {
      ...super.getState(),
      strength: safeStrength,
      strengthX: this.backdropBlurFilter.strengthX,
      strengthY: this.backdropBlurFilter.strengthY,
      quality: this.backdropBlurFilter.quality,
      configuredStrengthX: this.configuredStrengthX,
      configuredStrengthY: this.configuredStrengthY
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
export function createBackdropBlurFilter(config: BackdropBlurFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new BackdropBlurFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 