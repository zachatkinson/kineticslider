import { ColorReplaceFilter as PixiColorReplaceFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the ColorReplace filter
 *
 * @example
 * ```typescript
 * const config: ColorReplaceFilterConfig = {
 *   type: 'colorReplace',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   originalColor: 0xff0000,  // Red
 *   targetColor: 0x00ff00,    // Green  
 *   tolerance: 0.1
 * };
 * ```
 */
export interface ColorReplaceFilterConfig extends BaseFilterConfig {
  type: 'colorReplace';
  originalColor?: number;  // The color that will be changed (default: 0xff0000)
  targetColor?: number;    // The resulting color (default: 0x000000)
  tolerance?: number;      // Tolerance/sensitivity of color comparison (0-1, default: 0.4)
  primaryProperty?: 'tolerance' | 'originalColor' | 'targetColor'; // Property controlled by intensity
}

/**
 * Enhanced ColorReplace Filter Implementation
 *
 * Replaces all instances of one color with another color, with configurable
 * tolerance/sensitivity. Uses modern PIXI properties (originalColor, targetColor, tolerance)
 * instead of deprecated properties (epsilon, newColor).
 *
 * Features:
 * - Intensity control with smart tolerance scaling
 * - Configurable color replacement parameters
 * - State management and reset functionality
 * - Enhanced error handling
 *
 * @example
 * ```typescript
 * const filter = new ColorReplaceFilter({ 
 *   type: 'colorReplace', 
 *   originalColor: 0xff0000,  // Red
 *   targetColor: 0x00ff00,    // Green
 *   tolerance: 0.4,
 *   intensity: 5
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class ColorReplaceFilter extends BaseFilter<ColorReplaceFilterConfig> {
  /**
   * Creates a new ColorReplaceFilter instance
   *
   * @param config - The color replace filter configuration
   *
   */
  constructor(config: ColorReplaceFilterConfig) {
    // Create the PIXI ColorReplaceFilter with modern properties
    const pixiFilter = new PixiColorReplaceFilter({
      originalColor: config.originalColor ?? 0xff0000, // Default red
      targetColor: config.targetColor ?? 0x000000,     // Default black
      tolerance: config.tolerance ?? 0.4               // Default tolerance
    });
    super(config, pixiFilter);
  }

  private get colorReplaceFilter(): PixiColorReplaceFilter {
    return this.pixiFilter as PixiColorReplaceFilter;
  }

  protected initialize(): void {
    // Call parent initialize to handle intensity
    super.initialize();
  }

  /**
   * Updates the filter intensity
   *
   * Intensity affects the tolerance sensitivity. Higher intensity = more sensitive 
   * (lower tolerance), lower intensity = less sensitive (higher tolerance).
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Apply intensity to the primary property if defined, otherwise default to tolerance
    const primaryProperty = this.originalConfig.primaryProperty || 'tolerance';
    
    switch (primaryProperty) {
      case 'tolerance': {
        // Map intensity (0-10) to tolerance sensitivity
        // Higher intensity = more sensitive (lower tolerance)
        // Lower intensity = less sensitive (higher tolerance)
        const baseTolerance = this.originalConfig.tolerance ?? 0.4;
        const toleranceScale = 1 - (intensityValue / 10); // Invert for sensitivity
        this.colorReplaceFilter.tolerance = baseTolerance * (0.1 + toleranceScale * 0.9); // Keep minimum 10% tolerance
        break;
      }
      
      case 'originalColor':
      case 'targetColor': {
        // For color properties, we can't easily map intensity to color changes
        // So we'll fall back to tolerance adjustment
        const colorBaseTolerance = this.originalConfig.tolerance ?? 0.4;
        const colorToleranceScale = 1 - (intensityValue / 10);
        this.colorReplaceFilter.tolerance = colorBaseTolerance * (0.1 + colorToleranceScale * 0.9);
        break;
      }
    }
  }

  /**
   * Resets the filter to its original configuration
   */
  reset(): void {
    // Reset to configured values or defaults
    this.colorReplaceFilter.originalColor = this.originalConfig.originalColor ?? 0xff0000;
    this.colorReplaceFilter.targetColor = this.originalConfig.targetColor ?? 0x000000;
    this.colorReplaceFilter.tolerance = this.originalConfig.tolerance ?? 0.4;

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
      originalColor: this.colorReplaceFilter.originalColor,
      targetColor: this.colorReplaceFilter.targetColor,
      tolerance: this.colorReplaceFilter.tolerance,
      configuredOriginalColor: this.originalConfig.originalColor,
      configuredTargetColor: this.originalConfig.targetColor,
      configuredTolerance: this.originalConfig.tolerance
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
export function createColorReplaceFilter(config: ColorReplaceFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new ColorReplaceFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 