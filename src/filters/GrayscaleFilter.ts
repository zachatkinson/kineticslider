import { GrayscaleFilter } from 'pixi-filters';
import type { GrayscaleFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Grayscale Filter
 *
 * Extends the PIXI GrayscaleFilter with intensity control and configuration management.
 * Applies a grayscale effect to display objects.
 * 
 * Based on official PIXI GrayscaleFilter documentation:
 * - Simple grayscale effect with no configurable properties
 * - Converts colors to grayscale
 * 
 * Since PIXI GrayscaleFilter has no configurable properties, our enhancement
 * controls intensity through enabled state only (on/off).
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'grayscale',
 *   enabled: true,
 *   intensity: createFilterIntensity(6)
 * });
 * ```
 */
class EnhancedGrayscaleFilter extends GrayscaleFilter {
  private config: GrayscaleFilterConfig;
  private currentIntensity: number = 0;

  constructor(config: GrayscaleFilterConfig) {
    // PIXI GrayscaleFilter has no constructor options
    super();
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Update filter intensity
   *
   * Since PIXI GrayscaleFilter has no configurable properties,
   * we control intensity by enabling/disabling the filter.
   * Intensity > 0 enables the filter, intensity = 0 disables it.
   *
   * @param intensity - Intensity value (0-10)
   *
   */
  updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    this.currentIntensity = normalizedIntensity;
    
    // Enable/disable filter based on intensity
    // For GrayscaleFilter, it's either on or off
    this.enabled = normalizedIntensity > 0;
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    // Reset to enabled state from config
    this.enabled = this.config.enabled;
    
    // Apply intensity if configured
    if (this.config.intensity !== undefined) {
      this.updateIntensity(this.config.intensity);
    } else {
      // Default behavior
      this.currentIntensity = this.enabled ? 10 : 0;
    }
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all grayscale properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      intensity: this.currentIntensity,
      configuredIntensity: this.config.intensity
    };
  }
}

/**
 * Create a Grayscale filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: GrayscaleFilterConfig): FilterResult {
  const filter = new EnhancedGrayscaleFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 