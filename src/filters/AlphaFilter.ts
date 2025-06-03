import { AlphaFilter as PixiAlphaFilter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the Alpha filter
 *
 * @example
 * ```typescript
 * const config: AlphaFilterConfig = {
 *   type: 'alpha',
 *   alpha: 0.5,
 *   intensity: 7
 * };
 * ```
 */
export interface AlphaFilterConfig extends BaseFilterConfig {
  type: 'alpha';
  alpha?: number;
}

/**
 * Alpha Filter Implementation
 *
 * Controls the transparency of the display object.
 *
 * @example
 * ```typescript
 * const filter = new AlphaFilter({ type: 'alpha', alpha: 0.8 });
 * filter.updateIntensity(5);
 * filter.reset();
 * ```
 */
export class AlphaFilter extends BaseFilter<AlphaFilterConfig> {
  /**
   *
   */
  constructor(config: AlphaFilterConfig) {
    const pixiFilter = new PixiAlphaFilter();
    super(config, pixiFilter);
  }

  private get alphaFilter(): PixiAlphaFilter {
    return this.pixiFilter as PixiAlphaFilter;
  }

  protected initialize(): void {
    // Set initial alpha value
    const configuredAlpha = this.originalConfig.alpha ?? 1.0;
    this.alphaFilter.alpha = configuredAlpha;
    
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
    const configuredAlpha = this.originalConfig.alpha ?? 1.0;
    
    // Scale the configured alpha by the intensity ratio
    this.alphaFilter.alpha = Math.min(1.0, Math.max(0.0, configuredAlpha * (intensityValue / 10)));
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Apply intensity only if both intensity AND alpha are explicitly configured
    if (this.originalConfig.intensity !== undefined && this.originalConfig.alpha !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    } else {
      // Reset to configured value or default when no intensity should be applied
      const configuredAlpha = this.originalConfig.alpha ?? 1.0;
      this.alphaFilter.alpha = configuredAlpha;
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
      alpha: this.alphaFilter.alpha,
      configuredAlpha: this.originalConfig.alpha
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
export function createAlphaFilter(config: AlphaFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new AlphaFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 