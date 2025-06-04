import { GodrayFilter } from 'pixi-filters';
import type { GodrayFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Godray Filter
 *
 * Extends the PIXI GodrayFilter with intensity control and configuration management.
 * Creates atmospheric light beam effects with configurable density and animation.
 * 
 * Based on official PIXI GodrayFilter documentation:
 * - alpha: number (default: 1) - The alpha (opacity) of the rays
 * - angle: number (default: 30) - The angle/light-source of the rays in degrees
 * - center: PointData (default: {x:0,y:0}) - Focal point for non-parallel rays
 * - centerX: number (default: 0) - Focal point x axis
 * - centerY: number (default: 0) - Focal point y axis
 * - gain: number (default: 0.5) - General intensity of the effect
 * - lacunarity: number (default: 2.5) - The density of the fractal noise
 * - parallel: boolean (default: true) - true if light rays are parallel
 * - time: number (default: 0) - The current time position
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'godray',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   alpha: 1,
 *   angle: 45,
 *   gain: 0.7,
 *   lacunarity: 3,
 *   parallel: true,
 *   time: 0
 * });
 * ```
 */
class EnhancedGodrayFilter extends GodrayFilter {
  private baseAlpha: number;
  private baseAngle: number;
  private baseCenter: { x: number; y: number };
  private baseCenterX: number;
  private baseCenterY: number;
  private baseGain: number;
  private baseLacunarity: number;
  private baseParallel: boolean;
  private baseTime: number;
  private config: GodrayFilterConfig;

  constructor(config: GodrayFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.angle !== undefined) options.angle = config.angle;
    if (config.center !== undefined) options.center = config.center;
    if (config.gain !== undefined) options.gain = config.gain;
    if (config.lacunarity !== undefined) options.lacunarity = config.lacunarity;
    if (config.parallel !== undefined) options.parallel = config.parallel;
    if (config.time !== undefined) options.time = config.time;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations (using PIXI defaults)
    this.baseAlpha = this.alpha !== undefined ? this.alpha : 1;
    this.baseAngle = this.angle !== undefined ? this.angle : 30;
    this.baseCenter = this.center ? { x: this.center.x, y: this.center.y } : { x: 0, y: 0 };
    this.baseCenterX = this.centerX !== undefined ? this.centerX : 0;
    this.baseCenterY = this.centerY !== undefined ? this.centerY : 0;
    this.baseGain = this.gain !== undefined ? this.gain : 0.5;
    this.baseLacunarity = this.lacunarity !== undefined ? this.lacunarity : 2.5;
    this.baseParallel = this.parallel !== undefined ? this.parallel : true;
    this.baseTime = this.time !== undefined ? this.time : 0;
    
    // Apply individual center coordinates if specified
    if (config.centerX !== undefined || config.centerY !== undefined) {
      this.center = {
        x: config.centerX ?? 0,
        y: config.centerY ?? 0
      };
      this.baseCenter = { x: this.center.x, y: this.center.y };
    }
    
    // Only apply initial intensity if no specific values are provided
    const hasSpecificValues = config.alpha !== undefined ||
                             config.angle !== undefined ||
                             config.center !== undefined ||
                             config.centerX !== undefined ||
                             config.centerY !== undefined ||
                             config.gain !== undefined ||
                             config.lacunarity !== undefined ||
                             config.parallel !== undefined ||
                             config.time !== undefined;
    
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
        case 'alpha':
          this.alpha = this.baseAlpha * (normalizedIntensity / 10);
          break;
        case 'angle':
          // Rotate the light source (0-360 degrees)
          this.angle = (normalizedIntensity / 10) * 360;
          break;
        case 'gain':
          // General intensity of the effect (0-1 range)
          this.gain = this.baseGain * (normalizedIntensity / 10);
          break;
        case 'lacunarity':
          // Density of fractal noise (typically 1-5 range)
          this.lacunarity = this.baseLacunarity * (normalizedIntensity / 10);
          break;
        case 'time':
          // Animate over time
          this.time = normalizedIntensity / 10;
          break;
        default:
          // Default behavior - adjust gain
          this.gain = this.baseGain * (normalizedIntensity / 10);
      }
    } else {
      // Default behavior - adjust gain and alpha proportionally
      this.gain = this.baseGain * (normalizedIntensity / 10);
      this.alpha = this.baseAlpha * (normalizedIntensity / 10);
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    this.alpha = this.config.alpha !== undefined ? this.config.alpha : this.baseAlpha;
    this.angle = this.config.angle !== undefined ? this.config.angle : this.baseAngle;
    this.center = this.config.center !== undefined ? this.config.center : this.baseCenter;
    this.gain = this.config.gain !== undefined ? this.config.gain : this.baseGain;
    this.lacunarity = this.config.lacunarity !== undefined ? this.config.lacunarity : this.baseLacunarity;
    this.parallel = this.config.parallel !== undefined ? this.config.parallel : this.baseParallel;
    this.time = this.config.time !== undefined ? this.config.time : this.baseTime;

    // Apply individual center coordinates if specified
    if (this.config.centerX !== undefined || this.config.centerY !== undefined) {
      this.center = {
        x: this.config.centerX !== undefined ? this.config.centerX : this.baseCenterX,
        y: this.config.centerY !== undefined ? this.config.centerY : this.baseCenterY
      };
    }
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all godray properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      alpha: this.alpha,
      angle: this.angle,
      center: this.center,
      centerX: this.center ? this.center.x : this.baseCenterX,
      centerY: this.center ? this.center.y : this.baseCenterY,
      gain: this.gain,
      lacunarity: this.lacunarity,
      parallel: this.parallel,
      time: this.time,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create a Godray filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: GodrayFilterConfig): FilterResult {
  const filter = new EnhancedGodrayFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 