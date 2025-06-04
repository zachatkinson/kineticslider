import { RadialBlurFilter as PixiRadialBlurFilter } from 'pixi-filters';
import type { RadialBlurFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced RadialBlurFilter with intensity control
 * 
 * The RadialBlurFilter applies a Motion blur to an object with radial effect.
 * Creates a radial blur effect emanating from a center point.
 * 
 * @example
 * ```typescript
 * const radialBlurFilter = new RadialBlurFilter({
 *   type: 'radialBlur',
 *   enabled: true,
 *   intensity: 6,
 *   angle: 15,
 *   center: { x: 0.5, y: 0.5 },
 *   kernelSize: 7,
 *   radius: 100
 * });
 * ```
 */
export class RadialBlurFilter extends PixiRadialBlurFilter {
  public declare config: RadialBlurFilterConfig;

  /**
   *
   */
  constructor(config: RadialBlurFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    const angle = config.angle ?? 0;           // PIXI default: 0
    const center = config.center ?? { x: 0, y: 0 }; // PIXI default: {x:0,y:0}
    const kernelSize = config.kernelSize ?? 5; // PIXI default: 5
    const radius = config.radius ?? -1;        // PIXI default: -1

    super({
      angle,
      center,
      kernelSize,
      radius
    });

    this.config = config;

    // Set center from individual components if provided
    if (config.centerX !== undefined || config.centerY !== undefined) {
      this.center = {
        x: config.centerX ?? 0,
        y: config.centerY ?? 0
      };
    }

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
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'angle':
          // angle: Radial blur angle (0-360 degrees for full rotation)
          this.angle = (normalizedIntensity / 10) * 360; // 0-10 -> 0-360
          break;
        case 'radius':
          // radius: Maximum blur radius (-1 for infinity, or 0-500 for controlled blur)
          if (this.config.radius !== undefined && this.config.radius !== -1) {
            const baseRadius = this.config.radius;
            this.radius = baseRadius * (normalizedIntensity / 5); // Scale from base
          } else {
            // If infinite radius, create a controlled range
            this.radius = normalizedIntensity * 50; // 0-10 -> 0-500
          }
          break;
        case 'kernelSize':
          // kernelSize: Must be odd number >= 3
          const newKernelSize = Math.max(3, Math.round(3 + normalizedIntensity));
          // Ensure odd number
          this.kernelSize = newKernelSize % 2 === 0 ? newKernelSize + 1 : newKernelSize;
          break;
        case 'centerX':
          // centerX: Move the center point horizontally (0-1 range)
          this.center = {
            x: normalizedIntensity / 10, // 0-10 -> 0-1
            y: this.center.y
          };
          break;
        case 'centerY':
          // centerY: Move the center point vertically (0-1 range)
          this.center = {
            x: this.center.x,
            y: normalizedIntensity / 10 // 0-10 -> 0-1
          };
          break;
        default:
          // Default behavior: adjust angle
          this.angle = (normalizedIntensity / 10) * 360;
      }
    } else {
      // Default behavior: adjust angle proportionally
      const baseAngle = this.config.angle ?? 0;
      this.angle = baseAngle + (normalizedIntensity * 18); // Add up to 180 degrees
    }
  }

  /**
   * Reset the filter to initial configuration values or defaults
   */
  public reset(): void {
    // Reset to configured values or PIXI defaults
    this.angle = this.config.angle ?? 0;
    this.center = this.config.center ?? { x: 0, y: 0 };
    this.kernelSize = this.config.kernelSize ?? 5;
    this.radius = this.config.radius ?? -1;

    // Apply individual center components if specified
    if (this.config.centerX !== undefined || this.config.centerY !== undefined) {
      this.center = {
        x: this.config.centerX ?? 0,
        y: this.config.centerY ?? 0
      };
    }

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
}

/**
 * Factory function for backwards compatibility
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 * @deprecated Use new RadialBlurFilter() instead
 */
export function createRadialBlurFilter(config: RadialBlurFilterConfig): FilterResult {
  const filter = new RadialBlurFilter(config);
  return filter.getFilterResult();
} 