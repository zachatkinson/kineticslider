import { RGBSplitFilter } from 'pixi-filters';
import type { RGBSplitFilterConfig, FilterResult } from '../types/filters';
import type { PointData } from 'pixi.js';

/**
 * Enhanced RGB Split Filter
 *
 * Extends the PIXI RGBSplitFilter with intensity control and configuration management.
 * Creates chromatic aberration effects by separating RGB channels.
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'rgbSplit',
 *   enabled: true,
 *   intensity: createFilterIntensity(5),
 *   redX: 10,
 *   redY: 0,
 *   greenX: 0,
 *   greenY: 0,
 *   blueX: -10,
 *   blueY: 0
 * });
 * ```
 */
class EnhancedRGBSplitFilter extends RGBSplitFilter {
  private baseRed: PointData;
  private baseGreen: PointData;
  private baseBlue: PointData;
  private config: RGBSplitFilterConfig;

  constructor(config: RGBSplitFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    // Handle red channel configuration
    if (config.red) {
      options.red = config.red;
    } else if (config.redX !== undefined || config.redY !== undefined) {
      options.red = {
        x: config.redX !== undefined ? config.redX : 0,
        y: config.redY !== undefined ? config.redY : 0
      };
    }
    
    // Handle green channel configuration
    if (config.green) {
      options.green = config.green;
    } else if (config.greenX !== undefined || config.greenY !== undefined) {
      options.green = {
        x: config.greenX !== undefined ? config.greenX : 0,
        y: config.greenY !== undefined ? config.greenY : 0
      };
    }
    
    // Handle blue channel configuration
    if (config.blue) {
      options.blue = config.blue;
    } else if (config.blueX !== undefined || config.blueY !== undefined) {
      options.blue = {
        x: config.blueX !== undefined ? config.blueX : 0,
        y: config.blueY !== undefined ? config.blueY : 0
      };
    }
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations
    // Use the actual filter values if they exist, otherwise use defaults that work with intensity
    this.baseRed = this.red ? { ...this.red } : { x: 10, y: 0 };
    this.baseGreen = this.green ? { ...this.green } : { x: 0, y: 10 };
    this.baseBlue = this.blue ? { ...this.blue } : { x: 0, y: 0 };
    
    // Only apply initial intensity if no specific channel values are provided
    const hasSpecificValues = config.red !== undefined || 
                             config.green !== undefined || 
                             config.blue !== undefined ||
                             config.redX !== undefined ||
                             config.redY !== undefined ||
                             config.greenX !== undefined ||
                             config.greenY !== undefined ||
                             config.blueX !== undefined ||
                             config.blueY !== undefined;
    
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
        case 'red':
          this.red = {
            x: normalizedIntensity,
            y: this.baseRed.y * (normalizedIntensity / 10)
          };
          break;
        case 'green':
          this.green = {
            x: normalizedIntensity,
            y: this.baseGreen.y * (normalizedIntensity / 10)
          };
          break;
        case 'blue':
          this.blue = {
            x: normalizedIntensity,
            y: this.baseBlue.y * (normalizedIntensity / 10)
          };
          break;
        default:
          // Default behavior - adjust red channel
          this.red = {
            x: normalizedIntensity,
            y: this.baseRed.y * (normalizedIntensity / 10)
          };
      }
    } else {
      // Default behavior - adjust all channels proportionally
      // For default case, intensity maps directly to the primary axis
      this.red = {
        x: normalizedIntensity,
        y: this.baseRed.y * (normalizedIntensity / 10)
      };
      this.green = {
        x: this.baseGreen.x * (normalizedIntensity / 10),
        y: normalizedIntensity
      };
      this.blue = {
        x: this.baseBlue.x * (normalizedIntensity / 10),
        y: this.baseBlue.y * (normalizedIntensity / 10)
      };
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    // Reset to configured values, not base values
    if (this.config.red) {
      this.red = { ...this.config.red };
    } else if (this.config.redX !== undefined || this.config.redY !== undefined) {
      this.red = {
        x: this.config.redX !== undefined ? this.config.redX : 0,
        y: this.config.redY !== undefined ? this.config.redY : 0
      };
    } else {
      this.red = { ...this.baseRed };
    }
    
    if (this.config.green) {
      this.green = { ...this.config.green };
    } else if (this.config.greenX !== undefined || this.config.greenY !== undefined) {
      this.green = {
        x: this.config.greenX !== undefined ? this.config.greenX : 0,
        y: this.config.greenY !== undefined ? this.config.greenY : 0
      };
    } else {
      this.green = { ...this.baseGreen };
    }
    
    if (this.config.blue) {
      this.blue = { ...this.config.blue };
    } else if (this.config.blueX !== undefined || this.config.blueY !== undefined) {
      this.blue = {
        x: this.config.blueX !== undefined ? this.config.blueX : 0,
        y: this.config.blueY !== undefined ? this.config.blueY : 0
      };
    } else {
      this.blue = { ...this.baseBlue };
    }
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all RGB channel offsets
   *
   */
  getState(): Record<string, unknown> {
    return {
      red: this.red,
      green: this.green,
      blue: this.blue,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create an RGB Split filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: RGBSplitFilterConfig): FilterResult {
  const filter = new EnhancedRGBSplitFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 