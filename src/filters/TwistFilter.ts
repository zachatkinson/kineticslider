import { TwistFilter as PixiTwistFilter } from 'pixi-filters';
import type { TwistFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced TwistFilter with intensity control
 * 
 * This filter applies a twist effect making display objects appear twisted in the given direction.
 * The angle parameter controls the intensity of the twist effect around a center point.
 * 
 * @example
 * ```typescript
 * const twistFilter = new TwistFilter({
 *   type: 'twist',
 *   enabled: true,
 *   intensity: 6,
 *   angle: 4,
 *   radius: 200,
 *   offset: { x: 0, y: 0 },
 *   primaryProperty: 'angle'
 * });
 * ```
 */
export class TwistFilter extends PixiTwistFilter {
  public declare config: TwistFilterConfig;
  private baseAngle: number;
  private baseRadius: number;
  private baseOffsetX: number;
  private baseOffsetY: number;

  /**
   *
   */
  constructor(config: TwistFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    const options: Record<string, unknown> = {};
    
    // Handle offset configuration
    if (config.offset) {
      options.offset = config.offset;
    } else if (config.offsetX !== undefined || config.offsetY !== undefined) {
      options.offset = {
        x: config.offsetX ?? 0, // PIXI default: 0
        y: config.offsetY ?? 0  // PIXI default: 0
      };
    } else {
      options.offset = { x: 0, y: 0 }; // PIXI defaults
    }
    
    if (config.angle !== undefined) options.angle = config.angle;
    if (config.radius !== undefined) options.radius = config.radius;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations (using PIXI defaults)
    this.baseAngle = this.angle ?? 4;          // PIXI default: 4
    this.baseRadius = this.radius ?? 200;      // PIXI default: 200
    this.baseOffsetX = this.offsetX ?? 0;      // PIXI default: 0
    this.baseOffsetY = this.offsetY ?? 0;      // PIXI default: 0
    
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
        case 'angle':
          // Map intensity (0-10) to angle effect (0 to 2x base angle)
          this.angle = this.baseAngle * (normalizedIntensity / 5); // More controlled scaling
          break;
        case 'radius':
          // Map intensity (0-10) to radius (50-500 range)
          this.radius = 50 + (normalizedIntensity * 45); // Creates range from 50 to 500
          break;
        case 'offsetX':
          // Map intensity to horizontal offset
          this.offsetX = this.baseOffsetX + (normalizedIntensity * 10);
          break;
        case 'offsetY':
          // Map intensity to vertical offset  
          this.offsetY = this.baseOffsetY + (normalizedIntensity * 10);
          break;
        default:
          // Default behavior - adjust angle
          this.angle = this.baseAngle * (normalizedIntensity / 5);
      }
    } else {
      // Default behavior - adjust angle proportionally
      this.angle = this.baseAngle * (normalizedIntensity / 5);
    }
  }

  /**
   * Reset the filter to initial configuration values or PIXI defaults
   */
  public reset(): void {
    // Reset to configured values or PIXI defaults
    this.angle = this.config.angle ?? 4;          // PIXI default: 4
    this.radius = this.config.radius ?? 200;      // PIXI default: 200
    
    // Reset offset (PIXI default: 0)
    if (this.config.offset) {
      this.offset = { ...this.config.offset };
    } else if (this.config.offsetX !== undefined || this.config.offsetY !== undefined) {
      this.offset = {
        x: this.config.offsetX ?? 0,
        y: this.config.offsetY ?? 0
      };
    } else {
      this.offset = { x: 0, y: 0 }; // PIXI defaults
    }

    // Update base values for intensity calculations
    this.baseAngle = this.angle;
    this.baseRadius = this.radius;
    this.baseOffsetX = this.offsetX;
    this.baseOffsetY = this.offsetY;

    // Apply intensity if configured
    if (this.config.intensity !== undefined) {
      this.updateIntensity(this.config.intensity);
    }
  }

  /**
   * Get current filter state
   *
   * @returns Record containing current filter properties and state
   *
   */
  public getState(): Record<string, unknown> {
    return {
      angle: this.angle,
      radius: this.radius,
      offset: { x: this.offsetX, y: this.offsetY },
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
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
      config: this.config,
      getState: this.getState.bind(this)
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
 * @deprecated Use new TwistFilter() instead
 */
export function createTwistFilter(config: TwistFilterConfig): FilterResult {
  const filter = new TwistFilter(config);
  return filter.getFilterResult();
} 