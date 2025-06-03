import { BlurFilter as PixiBlurFilter, Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the Blur filter
 *
 * @example
 * ```typescript
 * const config: BlurFilterConfig = {
 *   type: 'blur',
 *   strengthX: 10,
 *   strengthY: 8,
 *   intensity: 5
 * };
 * ```
 */
export interface BlurFilterConfig extends BaseFilterConfig {
  type: 'blur';
  strengthX?: number;
  strengthY?: number;
  quality?: number;
  kernelSize?: number;
  resolution?: number;
  repeatEdgePixels?: boolean;
}

/**
 * Blur Filter Implementation
 *
 * Creates a blur effect using PIXI.js BlurFilter.
 *
 * @example
 * ```typescript
 * const filter = new BlurFilter({ 
 *   type: 'blur', 
 *   strengthX: 15, 
 *   strengthY: 10 
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class BlurFilter extends BaseFilter<BlurFilterConfig> {
  /**
   *
   */
  constructor(config: BlurFilterConfig) {
    const pixiFilter = new PixiBlurFilter({
      strengthX: config.strengthX,
      strengthY: config.strengthY,
      quality: config.quality ?? 4,
      kernelSize: config.kernelSize ?? 5,
      resolution: config.resolution ?? 1
    });
    super(config, pixiFilter);
  }

  private get blurFilter(): PixiBlurFilter {
    return this.pixiFilter as PixiBlurFilter;
  }

  protected initialize(): void {
    // Set additional properties if provided
    if (this.originalConfig.repeatEdgePixels !== undefined) {
      this.blurFilter.repeatEdgePixels = this.originalConfig.repeatEdgePixels;
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
      this.blurFilter.strengthX = baseStrengthX + (intensityValue * (baseStrengthX * 0.5));
      this.blurFilter.strengthY = baseStrengthY + (intensityValue * (baseStrengthY * 0.5));
    } else {
      // Default overall strength calculation
      const baseStrength = 8;
      this.blurFilter.strength = baseStrength + (intensityValue * 9.2); // Scale to reach 100 at intensity 10
    }
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Apply intensity only if strength properties are configured
    const hasStrengthConfig = this.originalConfig.strengthX !== undefined || 
                             this.originalConfig.strengthY !== undefined;

    if (this.originalConfig.intensity !== undefined && hasStrengthConfig) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    } else {
      // Reset to defaults
      this.blurFilter.strength = 8;
      this.blurFilter.strengthX = 8;
      this.blurFilter.strengthY = 8;
    }
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
      strength: this.blurFilter.strength,
      strengthX: this.blurFilter.strengthX,
      strengthY: this.blurFilter.strengthY,
      quality: this.blurFilter.quality,
      configuredStrengthX: this.originalConfig.strengthX,
      configuredStrengthY: this.originalConfig.strengthY
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
export function createBlurFilter(config: BlurFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new BlurFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 