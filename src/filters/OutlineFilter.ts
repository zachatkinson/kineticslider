import { OutlineFilter as PixiOutlineFilter } from 'pixi-filters';
import type { FilterResult, OutlineFilterConfig } from '../types/filters';

/**
 * Enhanced OutlineFilter with intensity control
 * 
 * The OutlineFilter draws an outline around the edges of the display object.
 * The thickness parameter controls the width of the outline.
 * 
 * @example
 * ```typescript
 * const outlineFilter = new OutlineFilter({
 *   type: 'outline',
 *   enabled: true,
 *   intensity: 7,
 *   thickness: 2,
 *   color: 0xff0000,
 *   primaryProperty: 'thickness'
 * });
 * ```
 */
export class OutlineFilter extends PixiOutlineFilter {
  public declare config: OutlineFilterConfig;

  /**
   * Creates a new OutlineFilter instance
   *
   * @param config - Filter configuration
   *
   */
  constructor(config: OutlineFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    const thickness = config.thickness ?? 1; // PIXI default: 1
    const color = config.color ?? 0x000000; // PIXI default: 0x000000
    const quality = config.quality ?? 0.1; // PIXI default: 0.1
    const alpha = config.alpha ?? 1; // PIXI default: 1
    const knockout = config.knockout ?? false; // PIXI default: false

    super({
      thickness,
      color,
      quality,
      alpha,
      knockout
    });

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

    // Determine which property to adjust based on config
    if (this.config.primaryProperty === 'thickness') {
      // Map intensity (0-10) to thickness (0-10)
      this.thickness = normalizedIntensity;
    } else if (this.config.primaryProperty === 'alpha') {
      // Map intensity (0-10) to alpha (0-1)
      this.alpha = normalizedIntensity / 10;
    } else {
      // Default: adjust thickness
      this.thickness = normalizedIntensity;
    }
  }

  /**
   * Reset the filter to initial configuration values or defaults
   */
  public reset(): void {
    // Reset to configured values or PIXI defaults
    this.thickness = this.config.thickness ?? 1;
    this.color = this.config.color ?? 0x000000;
    this.quality = this.config.quality ?? 0.1;
    this.alpha = this.config.alpha ?? 1;
    this.knockout = this.config.knockout ?? false;

    // If intensity was provided in config, apply that
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
}

/**
 * Create an Outline filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: OutlineFilterConfig): FilterResult {
  const filter = new OutlineFilter(config);
  return filter.getFilterResult();
}

/**
 * Factory function for backwards compatibility
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 * @deprecated Use new OutlineFilter() instead
 */
export function createOutlineFilter(config: OutlineFilterConfig): FilterResult {
  const filter = new OutlineFilter(config);
  return filter.getFilterResult();
} 