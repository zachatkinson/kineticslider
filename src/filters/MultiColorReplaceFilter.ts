import { MultiColorReplaceFilter as PixiMultiColorReplaceFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { 
  createFilterIntensity, 
  type FilterIntensity,
  type MultiColorReplaceFilterConfig
} from '../types/filters';

/**
 * MultiColorReplace Filter Implementation
 * 
 * Replaces multiple colors in an image with corresponding target colors.
 * Uses the centralized interface system for type safety.
 * 
 * **PIXI Properties:**
 * - replacements: Array<[ColorSource, ColorSource]> - Collection of [original, target] color pairs
 * - tolerance: number (default: 0.05) - Color comparison tolerance (0-1)
 * - maxColors: number (readonly) - Maximum number of replacements (constructor-only)
 * 
 * @see https://pixijs.io/filters/docs/MultiColorReplaceFilter.html
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const filter = new MultiColorReplaceFilter({ 
 *   type: 'multiColorReplace',
 *   replacements: [[0xff0000, 0x00ff00], [0x0000ff, 0xffff00]],
 *   tolerance: 0.1,
 *   intensity: 5
 * });
 * 
 * // Update tolerance based on intensity
 * filter.updateIntensity(8);
 * 
 * // Reset to original values
 * filter.reset();
 * ```
 */
export class MultiColorReplaceFilter extends PixiMultiColorReplaceFilter {
  private originalConfig: MultiColorReplaceFilterConfig;

  /**
   * Constructor for MultiColorReplaceFilter
   */
  constructor(config: MultiColorReplaceFilterConfig) {
    // PIXI constructor parameters
    const replacements = config.replacements ?? [];
    const tolerance = config.tolerance ?? 0.05;
    const maxColors = config.maxColors; // Optional constructor parameter
    
    // Call PIXI constructor with proper parameters
    if (maxColors !== undefined) {
      super(replacements as Array<[number, number]>, tolerance, maxColors);
    } else {
      super(replacements as Array<[number, number]>, tolerance);
    }

    this.originalConfig = { ...config };

    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Updates the filter intensity by modifying the tolerance property
   * 
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    if (this.originalConfig.primaryProperty === 'tolerance') {
      // Direct tolerance control (0-10 maps to 0-1)
      this.tolerance = Math.max(0, Math.min(1, intensityValue / 10));
    } else {
      // Default: Scale from base tolerance
      const baseTolerance = this.originalConfig.tolerance ?? 0.05;
      this.tolerance = baseTolerance * (intensityValue / 5);
    }
  }

  /**
   * Resets the filter to its original configuration
   */
  reset(): void {
    // Reset tolerance to original value
    this.tolerance = this.originalConfig.tolerance ?? 0.05;

    // Reapply original intensity if configured
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(this.originalConfig.intensity);
    }
  }

  /**
   * Refreshes the filter after changing replacements
   * This is required by PIXI when modifying the replacements array
   */
  refresh(): void {
    // PIXI method for refreshing after replacement changes
    super.refresh();
  }

  /**
   * Gets the current filter state for debugging
   * 
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      type: 'multiColorReplace',
      tolerance: this.tolerance,
      maxColors: this.maxColors,
      replacements: this.replacements,
      originalConfig: this.originalConfig
    };
  }

  /**
   * Disposes of the filter and cleans up resources
   */
  dispose(): void {
    super.destroy();
  }
}

/**
 * Factory function for backward compatibility
 * 
 * @param config - The filter configuration
 *
 * @returns Filter instance with utility methods
 *
 */
export function createMultiColorReplaceFilter(config: MultiColorReplaceFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new MultiColorReplaceFilter(config);
  
  return {
    filter: filterInstance,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 