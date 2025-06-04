import { ColorOverlayFilter as PixiColorOverlayFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity, type ColorOverlayFilterConfig } from '../types/filters';
import { BaseFilter } from './BaseFilter';

/**
 * ColorOverlay Filter Implementation
 *
 * Creates a simple color overlay effect that can either replace or blend with existing colors.
 *
 * @example
 * ```typescript
 * const filter = new ColorOverlayFilter({ 
 *   type: 'colorOverlay', 
 *   color: 0x00ff00, 
 *   alpha: 0.3 
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class ColorOverlayFilter extends BaseFilter<ColorOverlayFilterConfig> {
  /**
   *
   */
  constructor(config: ColorOverlayFilterConfig) {
    const pixiFilter = new PixiColorOverlayFilter(
      config.color ?? 0x000000,
      config.alpha ?? 1
    );
    super(config, pixiFilter);
  }

  private get colorOverlayFilter(): PixiColorOverlayFilter {
    return this.pixiFilter as PixiColorOverlayFilter;
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Determine which property to adjust based on config
    if (this.originalConfig.primaryProperty) {
      switch (this.originalConfig.primaryProperty) {
        case 'alpha':
          // alpha: Control overlay opacity (0-1 range)
          this.colorOverlayFilter.alpha = intensityValue / 10; // 0-10 -> 0-1
          break;
        case 'color':
          // color: For color adjustment, we could interpolate between colors
          // For now, we'll just adjust the alpha as a fallback
          this.colorOverlayFilter.alpha = intensityValue / 10;
          break;
        default:
          // Default behavior: adjust alpha
          this.colorOverlayFilter.alpha = intensityValue / 10;
      }
    } else {
      // Default behavior: adjust alpha
      const baseAlpha = this.originalConfig.alpha ?? 1;
      this.colorOverlayFilter.alpha = (intensityValue / 10) * baseAlpha; // Scale by base alpha
    }
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Reset to configured values or defaults
    this.colorOverlayFilter.color = this.originalConfig.color ?? 0x000000;
    this.colorOverlayFilter.alpha = this.originalConfig.alpha ?? 1;

    // Apply intensity if configured
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
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
      color: this.colorOverlayFilter.color,
      alpha: this.colorOverlayFilter.alpha,
      configuredColor: this.originalConfig.color,
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
export function createColorOverlayFilter(config: ColorOverlayFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new ColorOverlayFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 