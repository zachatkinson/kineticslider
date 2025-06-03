import { EmbossFilter as PixiEmbossFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the Emboss filter
 *
 * @example
 * ```typescript
 * const config: EmbossFilterConfig = {
 *   type: 'emboss',
 *   strength: 8,
 *   intensity: 6
 * };
 * ```
 */
export interface EmbossFilterConfig extends BaseFilterConfig {
  type: 'emboss';
  strength?: number;
}

/**
 * Emboss Filter Implementation
 *
 * Creates a relief-like effect making the display object appear carved or embossed.
 *
 * @example
 * ```typescript
 * const filter = new EmbossFilter({ 
 *   type: 'emboss', 
 *   strength: 10 
 * });
 * filter.updateIntensity(5);
 * filter.reset();
 * ```
 */
export class EmbossFilter extends BaseFilter<EmbossFilterConfig> {
  /**
   *
   */
  constructor(config: EmbossFilterConfig) {
    const pixiFilter = new PixiEmbossFilter(config.strength ?? 5);
    super(config, pixiFilter);
  }

  private get embossFilter(): PixiEmbossFilter {
    return this.pixiFilter as PixiEmbossFilter;
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Scale strength based on intensity (matches test expectations)
    this.embossFilter.strength = intensityValue * 2;
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Apply intensity if configured
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    } else {
      // Reset to configured strength or default
      const configuredStrength = this.originalConfig.strength ?? 5;
      this.embossFilter.strength = configuredStrength;
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
      strength: this.embossFilter.strength,
      configuredStrength: this.originalConfig.strength
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
export function createEmbossFilter(config: EmbossFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new EmbossFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 