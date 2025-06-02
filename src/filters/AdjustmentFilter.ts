import { AdjustmentFilter } from 'pixi-filters';
import type { AdjustmentFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Adjustment Filter
 *
 * Extends the PIXI AdjustmentFilter with intensity control.
 * Provides color adjustment capabilities including gamma, saturation, contrast, brightness.
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'adjustment',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   gamma: 1.2,
 *   saturation: 1.5,
 *   contrast: 1.1,
 *   brightness: 1.0
 * });
 * ```
 */
class EnhancedAdjustmentFilter extends AdjustmentFilter {
  private baseGamma: number;
  private baseSaturation: number;
  private baseContrast: number;
  private baseBrightness: number;
  private baseRed: number;
  private baseGreen: number;
  private baseBlue: number;
  private baseAlpha: number;
  private config: AdjustmentFilterConfig;

  constructor(config: AdjustmentFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    if (config.gamma !== undefined) options.gamma = config.gamma;
    if (config.saturation !== undefined) options.saturation = config.saturation;
    if (config.contrast !== undefined) options.contrast = config.contrast;
    if (config.brightness !== undefined) options.brightness = config.brightness;
    if (config.red !== undefined) options.red = config.red;
    if (config.green !== undefined) options.green = config.green;
    if (config.blue !== undefined) options.blue = config.blue;
    if (config.alpha !== undefined) options.alpha = config.alpha;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations
    this.baseGamma = this.gamma || 1;
    this.baseSaturation = this.saturation || 1;
    this.baseContrast = this.contrast || 1;
    this.baseBrightness = this.brightness || 1;
    this.baseRed = this.red || 1;
    this.baseGreen = this.green || 1;
    this.baseBlue = this.blue || 1;
    this.baseAlpha = this.alpha || 1;
    
    // Only apply initial intensity if no specific values are provided
    const hasSpecificValues = config.gamma !== undefined || 
                             config.saturation !== undefined || 
                             config.contrast !== undefined ||
                             config.brightness !== undefined ||
                             config.red !== undefined ||
                             config.green !== undefined ||
                             config.blue !== undefined ||
                             config.alpha !== undefined;
    
    if (!hasSpecificValues) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Update filter intensity
   *
   * @param intensity - Intensity value (0-10)
   *
   */
  updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'gamma':
          // Map intensity to gamma range (0.5-1.5)
          this.gamma = 0.5 + (normalizedIntensity / 10);
          break;
        case 'saturation':
          // Map intensity to saturation range (0.5-1.5)
          this.saturation = 0.5 + (normalizedIntensity / 10);
          break;
        case 'contrast':
          // Map intensity to contrast range (0.5-1.5)
          this.contrast = 0.5 + (normalizedIntensity / 10);
          break;
        case 'brightness':
          // Map intensity to brightness range (0.5-1.5)
          this.brightness = 0.5 + (normalizedIntensity / 10);
          break;
        default:
          // Default behavior - adjust brightness
          this.brightness = 0.5 + (normalizedIntensity / 10);
      }
    } else {
      // Default behavior - adjust brightness and contrast
      this.brightness = 0.5 + (normalizedIntensity / 10);
      this.contrast = 0.5 + (normalizedIntensity / 10);
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    this.gamma = this.config.gamma || this.baseGamma;
    this.saturation = this.config.saturation || this.baseSaturation;
    this.contrast = this.config.contrast || this.baseContrast;
    this.brightness = this.config.brightness || this.baseBrightness;
    this.red = this.config.red || this.baseRed;
    this.green = this.config.green || this.baseGreen;
    this.blue = this.config.blue || this.baseBlue;
    this.alpha = this.config.alpha || this.baseAlpha;
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all adjustment properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      gamma: this.gamma,
      saturation: this.saturation,
      contrast: this.contrast,
      brightness: this.brightness,
      red: this.red,
      green: this.green,
      blue: this.blue,
      alpha: this.alpha,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create an Adjustment filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: AdjustmentFilterConfig): FilterResult {
  const filter = new EnhancedAdjustmentFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 