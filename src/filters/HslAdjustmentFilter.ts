import { HslAdjustmentFilter as PixiHslAdjustmentFilter } from 'pixi-filters';
import type { HslAdjustmentFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced HSL Adjustment Filter
 *
 * Extends the PIXI HslAdjustmentFilter with intensity control and configuration management.
 * Provides HSL (Hue, Saturation, Lightness) color adjustments with full PIXI compliance.
 * 
 * Based on official PIXI HslAdjustmentFilter documentation:
 * - alpha: number (default: 1) - The amount of alpha (0 to 1)
 * - colorize: boolean (default: false) - Whether to colorize the image
 * - hue: number (default: 0) - The amount of hue in degrees (-180 to 180)
 * - lightness: number (default: 0) - The amount of lightness (-1 to 1)
 * - saturation: number (default: 0) - The amount of saturation (-1 to 1)
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'hsl',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   hue: 45,          // Rotate hue by 45 degrees
 *   saturation: 0.2,  // Increase saturation by 20%
 *   lightness: -0.1,  // Decrease lightness by 10%
 *   colorize: true,   // Enable colorize mode
 *   alpha: 0.8        // 80% opacity
 * });
 * ```
 */
class EnhancedHslAdjustmentFilter extends PixiHslAdjustmentFilter {
  private config: HslAdjustmentFilterConfig;

  constructor(config: HslAdjustmentFilterConfig) {
    // Initialize with PIXI defaults or config values
    super({
      alpha: config.alpha ?? 1,
      colorize: config.colorize ?? false,
      hue: config.hue ?? 0,
      lightness: config.lightness ?? 0,
      saturation: config.saturation ?? 0
    });
    
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
   * Controls the primary property specified in config, or applies proportional scaling
   * to all HSL properties if no primary property is specified.
   *
   * @param intensity - Intensity value (0-10)
   *
   */
  updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    // Determine which property to adjust based on config
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'hue':
          // hue: Rotate hue around the color wheel (-180 to 180 degrees)
          const baseHue = this.config.hue ?? 0;
          this.hue = baseHue + (normalizedIntensity - 5) * 36; // 0-10 -> -180 to 180 centered on base
          break;
        case 'saturation':
          // saturation: Adjust color saturation (-1 to 1 range)
          const baseSaturation = this.config.saturation ?? 0;
          this.saturation = Math.max(-1, Math.min(1, baseSaturation + (normalizedIntensity / 5 - 1))); // 0-10 -> -1 to 1
          break;
        case 'lightness':
          // lightness: Adjust brightness (-1 to 1 range)
          const baseLightness = this.config.lightness ?? 0;
          this.lightness = Math.max(-1, Math.min(1, baseLightness + (normalizedIntensity / 5 - 1))); // 0-10 -> -1 to 1
          break;
        case 'alpha':
          // alpha: Control effect opacity (0-1 range)
          this.alpha = normalizedIntensity / 10; // 0-10 -> 0-1
          break;
        default:
          // Default behavior: adjust saturation
          const defaultSaturation = this.config.saturation ?? 0;
          this.saturation = Math.max(-1, Math.min(1, defaultSaturation + (normalizedIntensity / 5 - 1)));
      }
    } else {
      // Default behavior: scale all adjustments proportionally
      const baseHue = this.config.hue ?? 0;
      const baseSaturation = this.config.saturation ?? 0;
      const baseLightness = this.config.lightness ?? 0;
      const scale = normalizedIntensity / 10; // 0-10 -> 0-1

      this.hue = baseHue * scale;
      this.saturation = Math.max(-1, Math.min(1, baseSaturation * scale));
      this.lightness = Math.max(-1, Math.min(1, baseLightness * scale));
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    // Reset to configured values or PIXI defaults
    this.alpha = this.config.alpha ?? 1;
    this.colorize = this.config.colorize ?? false;
    this.hue = this.config.hue ?? 0;
    this.lightness = this.config.lightness ?? 0;
    this.saturation = this.config.saturation ?? 0;
    this.enabled = this.config.enabled;

    // Apply intensity if configured
    if (this.config.intensity !== undefined) {
      this.updateIntensity(this.config.intensity);
    }
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all HSL properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      alpha: this.alpha,
      colorize: this.colorize,
      hue: this.hue,
      lightness: this.lightness,
      saturation: this.saturation,
      // Config tracking
      configuredAlpha: this.config.alpha,
      configuredColorize: this.config.colorize,
      configuredHue: this.config.hue,
      configuredLightness: this.config.lightness,
      configuredSaturation: this.config.saturation,
      primaryProperty: this.config.primaryProperty,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create an HSL Adjustment filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: HslAdjustmentFilterConfig): FilterResult {
  const filter = new EnhancedHslAdjustmentFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 