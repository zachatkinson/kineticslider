import { GrayscaleFilter as PixiGrayscaleFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the Grayscale filter
 *
 * @example
 * ```typescript
 * const config: GrayscaleFilterConfig = {
 *   type: 'grayscale',
 *   enabled: false,
 *   intensity: 6
 * };
 * ```
 */
export interface GrayscaleFilterConfig extends BaseFilterConfig {
  type: 'grayscale';
  enabled?: boolean;
}

/**
 * Grayscale Filter Implementation
 *
 * Converts display object to grayscale using PIXI filters.
 *
 * @example
 * ```typescript
 * const filter = new GrayscaleFilter({ 
 *   type: 'grayscale', 
 *   enabled: true 
 * });
 * filter.updateIntensity(8);
 * filter.reset();
 * ```
 */
export class GrayscaleFilter extends BaseFilter<GrayscaleFilterConfig> {
  /**
   *
   */
  constructor(config: GrayscaleFilterConfig) {
    const pixiFilter = new PixiGrayscaleFilter();
    super(config, pixiFilter);
  }

  private get grayscaleFilter(): PixiGrayscaleFilter {
    return this.pixiFilter as PixiGrayscaleFilter;
  }

  protected initialize(): void {
    // Set initial enabled state
    const enabled = this.originalConfig.enabled ?? true;
    this.grayscaleFilter.enabled = enabled;
    
    // Set initial alpha (intensity control)
    this.grayscaleFilter.alpha = 1.0;
    
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
    
    // Map intensity to alpha (0-1 range)
    const alpha = intensityValue / 10;
    this.grayscaleFilter.alpha = alpha;
    
    // Enable/disable filter based on intensity
    this.grayscaleFilter.enabled = intensityValue > 0;
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Apply intensity if configured - this will override any base settings
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    } else {
      // Otherwise use configured values
      const enabled = this.originalConfig.enabled ?? true;
      this.grayscaleFilter.enabled = enabled;
      this.grayscaleFilter.alpha = 1.0;
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
      alpha: this.grayscaleFilter.alpha,
      enabled: this.grayscaleFilter.enabled,
      configuredEnabled: this.originalConfig.enabled
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
export function createGrayscaleFilter(config: GrayscaleFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new GrayscaleFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 