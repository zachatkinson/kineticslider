import { RGBSplitFilter as PixiRGBSplitFilter } from 'pixi-filters';
import type { RGBSplitFilterConfig, FilterResult } from '../types/filters';
import type { PointData } from 'pixi.js';

/**
 * Enhanced RGBSplitFilter with intensity control
 *
 * Creates chromatic aberration effects by separating RGB channels.
 * An RGB Split Filter that offsets red, green, and blue channels independently.
 *
 * @example
 * ```typescript
 * const rgbSplitFilter = new RGBSplitFilter({
 *   type: 'rgbSplit',
 *   enabled: true,
 *   intensity: 5,
 *   red: { x: -10, y: 0 },
 *   green: { x: 0, y: 10 },
 *   blue: { x: 0, y: 0 }
 * });
 * ```
 */
export class RGBSplitFilter extends PixiRGBSplitFilter {
  public declare config: RGBSplitFilterConfig;
  private baseRed: PointData;
  private baseGreen: PointData;
  private baseBlue: PointData;

  /**
   *
   */
  constructor(config: RGBSplitFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    const options: Record<string, unknown> = {};
    
    // Handle red channel configuration (PIXI default: {x:-10,y:0})
    if (config.red) {
      options.red = config.red;
    } else if (config.redX !== undefined || config.redY !== undefined) {
      options.red = {
        x: config.redX ?? -10, // PIXI default: -10
        y: config.redY ?? 0    // PIXI default: 0
      };
    } else {
      options.red = { x: -10, y: 0 }; // PIXI defaults
    }
    
    // Handle green channel configuration (PIXI default: {x:0,y:10})
    if (config.green) {
      options.green = config.green;
    } else if (config.greenX !== undefined || config.greenY !== undefined) {
      options.green = {
        x: config.greenX ?? 0,  // PIXI default: 0
        y: config.greenY ?? 10  // PIXI default: 10
      };
    } else {
      options.green = { x: 0, y: 10 }; // PIXI defaults
    }
    
    // Handle blue channel configuration (PIXI default: {x:0,y:0})
    if (config.blue) {
      options.blue = config.blue;
    } else if (config.blueX !== undefined || config.blueY !== undefined) {
      options.blue = {
        x: config.blueX ?? 0,   // PIXI default: 0
        y: config.blueY ?? 0    // PIXI default: 0
      };
    } else {
      options.blue = { x: 0, y: 0 }; // PIXI defaults
    }
    
    super(options);
    
    this.config = config;
    
    // Store base values for intensity calculations
    this.baseRed = { ...this.red };
    this.baseGreen = { ...this.green };
    this.baseBlue = { ...this.blue };
    
    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Update the filter's intensity based on the configuration
   * 
   * @param intensity - New intensity value (0-10 scale)
   *
   */
  public updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'red':
          this.red = {
            x: this.baseRed.x * (normalizedIntensity / 10),
            y: this.baseRed.y * (normalizedIntensity / 10)
          };
          break;
        case 'green':
          this.green = {
            x: this.baseGreen.x * (normalizedIntensity / 10),
            y: this.baseGreen.y * (normalizedIntensity / 10)
          };
          break;
        case 'blue':
          this.blue = {
            x: this.baseBlue.x * (normalizedIntensity / 10),
            y: this.baseBlue.y * (normalizedIntensity / 10)
          };
          break;
        default:
          // Default behavior - adjust red channel
          this.red = {
            x: this.baseRed.x * (normalizedIntensity / 10),
            y: this.baseRed.y * (normalizedIntensity / 10)
          };
      }
    } else {
      // Default behavior - adjust all channels proportionally
      this.red = {
        x: this.baseRed.x * (normalizedIntensity / 10),
        y: this.baseRed.y * (normalizedIntensity / 10)
      };
      this.green = {
        x: this.baseGreen.x * (normalizedIntensity / 10),
        y: this.baseGreen.y * (normalizedIntensity / 10)
      };
      this.blue = {
        x: this.baseBlue.x * (normalizedIntensity / 10),
        y: this.baseBlue.y * (normalizedIntensity / 10)
      };
    }
  }

  /**
   * Reset the filter to initial configuration values or defaults
   */
  public reset(): void {
    // Reset to configured values or PIXI defaults
    if (this.config.red) {
      this.red = { ...this.config.red };
    } else if (this.config.redX !== undefined || this.config.redY !== undefined) {
      this.red = {
        x: this.config.redX ?? -10,
        y: this.config.redY ?? 0
      };
    } else {
      this.red = { x: -10, y: 0 }; // PIXI defaults
    }
    
    if (this.config.green) {
      this.green = { ...this.config.green };
    } else if (this.config.greenX !== undefined || this.config.greenY !== undefined) {
      this.green = {
        x: this.config.greenX ?? 0,
        y: this.config.greenY ?? 10
      };
    } else {
      this.green = { x: 0, y: 10 }; // PIXI defaults
    }
    
    if (this.config.blue) {
      this.blue = { ...this.config.blue };
    } else if (this.config.blueX !== undefined || this.config.blueY !== undefined) {
      this.blue = {
        x: this.config.blueX ?? 0,
        y: this.config.blueY ?? 0
      };
    } else {
      this.blue = { x: 0, y: 0 }; // PIXI defaults
    }

    // Update base values for intensity calculations
    this.baseRed = { ...this.red };
    this.baseGreen = { ...this.green };
    this.baseBlue = { ...this.blue };

    // Apply intensity if configured
    if (this.config.intensity !== undefined) {
      this.updateIntensity(this.config.intensity);
    }
  }

  /**
   * Get the filter result with control functions
   *
   * @returns FilterResult with filter instance and control functions
   *
   */
  public getFilterResult(): FilterResult {
    return {
      filter: this,
      updateIntensity: this.updateIntensity.bind(this),
      reset: this.reset.bind(this),
      dispose: this.destroy.bind(this),
      config: this.config
    };
  }

  /**
   * Get current filter state
   *
   * @returns Record containing current filter properties and state
   *
   */
  public getState(): Record<string, unknown> {
    return {
      red: this.red,
      green: this.green,
      blue: this.blue,
      type: this.config.type,
      enabled: this.config.enabled,
      intensity: this.config.intensity,
      configuredRed: this.config.red,
      configuredGreen: this.config.green,
      configuredBlue: this.config.blue,
      primaryProperty: this.config.primaryProperty
    };
  }
}

/**
 * Factory function for backwards compatibility
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 * @deprecated Use new RGBSplitFilter() instead
 */
export function createFilter(config: RGBSplitFilterConfig): FilterResult {
  const filter = new RGBSplitFilter(config);
  return filter.getFilterResult();
} 