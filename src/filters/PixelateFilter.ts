import { PixelateFilter as PixiPixelateFilter } from 'pixi-filters';
import type { PixelateFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced PixelateFilter with intensity control
 * 
 * The PixelateFilter applies a pixelate effect making display objects appear 'blocky'.
 * The size parameter controls the size of the pixels, with larger values creating more pixelation.
 * 
 * @example
 * ```typescript
 * const pixelateFilter = new PixelateFilter({
 *   type: 'pixelate',
 *   enabled: true,
 *   intensity: 7,
 *   size: 10,
 *   primaryProperty: 'size'
 * });
 * ```
 */
export class PixelateFilter extends PixiPixelateFilter {
  public declare config: PixelateFilterConfig;

  /**
   * Creates a new PixelateFilter instance
   *
   * @param config - Filter configuration
   *
   */
  constructor(config: PixelateFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    let size: number | [number, number] = 10; // Start with default

    // Handle config.size which could be a PointData or number
    if (config.size !== undefined) {
      if (typeof config.size === 'number') {
        size = config.size;
      } else {
        // It's a PointData
        size = [config.size.x, config.size.y];
      }
    }

    // If sizeX and sizeY are specified, use them instead
    if (config.sizeX !== undefined || config.sizeY !== undefined) {
      const x = config.sizeX ?? 10; // PIXI default: 10
      const y = config.sizeY ?? 10; // PIXI default: 10
      size = [x, y];
    }

    super(size);

    this.config = config;

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
    // Normalize intensity to a 0-10 scale
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));

    // Map intensity (0-10) to pixel size (1-30)
    // At intensity 0, we want minimal pixelation (pixel size of 1)
    // At intensity 10, we want maximum pixelation (pixel size of 30)
    const pixelSize = 1 + (normalizedIntensity * 2.9); // Maps 0-10 to 1-30

    // Determine which property to adjust based on config
    if (this.config.primaryProperty === 'sizeX') {
      // Apply to sizeX only when primaryProperty is sizeX
      this.sizeX = pixelSize;
    } else if (this.config.primaryProperty === 'sizeY') {
      // Only adjust Y dimension, keep X at its configured value
      this.sizeY = pixelSize;
    } else {
      // Default: adjust both dimensions equally
      this.size = pixelSize;
    }
  }

  /**
   * Reset the filter to initial configuration values or defaults
   */
  public reset(): void {
    // Check if any size configuration was provided
    const hasSizeConfig = this.config.sizeX !== undefined || 
                         this.config.sizeY !== undefined || 
                         this.config.size !== undefined;

    if (hasSizeConfig) {
      // Reset to configured values
      if (this.config.sizeX !== undefined || this.config.sizeY !== undefined) {
        this.sizeX = this.config.sizeX ?? 10; // PIXI default: 10
        this.sizeY = this.config.sizeY ?? 10; // PIXI default: 10
      } else if (this.config.size !== undefined) {
        // Handle PointData type
        if (typeof this.config.size === 'number') {
          this.size = this.config.size;
        } else {
          // Extract number from PointData object
          this.sizeX = this.config.size.x;
          this.sizeY = this.config.size.y;
        }
      }
      
      // Apply intensity when size config was provided
      if (this.config.intensity !== undefined) {
        this.updateIntensity(this.config.intensity);
      }
    } else {
      // No size config provided - reset to PIXI defaults WITHOUT applying intensity
      this.size = 10; // PIXI default: 10
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
      size: this.size,
      sizeX: this.sizeX,
      sizeY: this.sizeY,
      type: this.config.type,
      enabled: this.config.enabled,
      intensity: this.config.intensity,
      configuredSize: this.config.size,
      configuredSizeX: this.config.sizeX,
      configuredSizeY: this.config.sizeY
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
 * @deprecated Use new PixelateFilter() instead
 */
export function createPixelateFilter(config: PixelateFilterConfig): FilterResult {
  const filter = new PixelateFilter(config);
  return filter.getFilterResult();
} 