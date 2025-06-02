import { ShockwaveFilter } from 'pixi-filters';
import type { ShockwaveFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Shockwave Filter
 *
 * Extends the PIXI ShockwaveFilter with intensity control and animation support.
 * Creates ripple/wave distortion effects.
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'shockwave',
 *   enabled: true,
 *   intensity: createFilterIntensity(7),
 *   center: { x: 0.5, y: 0.5 },
 *   amplitude: 30,
 *   wavelength: 160,
 *   animate: true
 * });
 * ```
 */
class EnhancedShockwaveFilter extends ShockwaveFilter {
  private baseAmplitude: number;
  private baseWavelength: number;
  private baseRadius: number;
  private baseBrightness: number;
  private baseSpeed: number;
  private baseCenter: [number, number];
  private config: ShockwaveFilterConfig;
  private animationInterval?: NodeJS.Timeout;

  constructor(config: ShockwaveFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    // Handle center configuration - convert to array format
    let centerArray: [number, number];
    if (config.center) {
      centerArray = [config.center.x, config.center.y];
      options.center = centerArray;
    } else if (config.centerX !== undefined || config.centerY !== undefined) {
      centerArray = [
        config.centerX !== undefined ? config.centerX : 0.5,
        config.centerY !== undefined ? config.centerY : 0.5
      ];
      options.center = centerArray;
    } else {
      centerArray = [0.5, 0.5];
      options.center = centerArray;
    }
    
    if (config.amplitude !== undefined) options.amplitude = config.amplitude;
    if (config.wavelength !== undefined) options.wavelength = config.wavelength;
    if (config.radius !== undefined) options.radius = config.radius;
    if (config.brightness !== undefined) options.brightness = config.brightness;
    if (config.speed !== undefined) options.speed = config.speed;
    if (config.time !== undefined) options.time = config.time;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations
    this.baseAmplitude = this.amplitude || 30;
    this.baseWavelength = this.wavelength || 160;
    this.baseRadius = this.radius || -1;
    this.baseBrightness = this.brightness || 1;
    this.baseSpeed = this.speed || 500;
    this.baseCenter = centerArray;
    
    // Start animation if configured
    if (config.animate) {
      // Use 16ms for 60fps
      const frequency = 16;
      this.startAnimation(frequency);
    }
    
    // Only apply initial intensity if no specific values are provided
    const hasSpecificValues = config.amplitude !== undefined || 
                             config.wavelength !== undefined || 
                             config.radius !== undefined ||
                             config.brightness !== undefined ||
                             config.speed !== undefined ||
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
        case 'amplitude':
          this.amplitude = this.baseAmplitude * (normalizedIntensity / 10);
          break;
        case 'wavelength':
          this.wavelength = this.baseWavelength * (normalizedIntensity / 10);
          break;
        case 'speed':
          this.speed = this.baseSpeed * (normalizedIntensity / 10);
          break;
        default:
          this.amplitude = this.baseAmplitude * (normalizedIntensity / 10);
      }
    } else {
      // Default behavior - adjust amplitude and brightness
      this.amplitude = this.baseAmplitude * (normalizedIntensity / 10);
      this.brightness = this.baseBrightness * (0.8 + (normalizedIntensity / 50));
    }
  }

  /**
   * Start animation
   *
   * @param frequency - Animation frequency in milliseconds
   *
   */
  private startAnimation(frequency: number): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    this.animationInterval = setInterval(() => {
      this.time += 0.1;
    }, frequency);
  }

  /**
   * Stop animation
   */
  private stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    // Reset to configured values, not base values
    this.amplitude = this.config.amplitude || this.baseAmplitude;
    this.wavelength = this.config.wavelength || this.baseWavelength;
    this.radius = this.config.radius || this.baseRadius;
    this.brightness = this.config.brightness || this.baseBrightness;
    // Reset center by setting it as an array
    (this.center as unknown) = [this.baseCenter[0], this.baseCenter[1]];
    this.time = this.config.time || 0;
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all shockwave properties
   *
   */
  getState(): Record<string, unknown> {
    const centerArray = this.center as unknown as [number, number];
    return {
      center: [centerArray[0], centerArray[1]],
      amplitude: this.amplitude,
      wavelength: this.wavelength,
      radius: this.radius,
      brightness: this.brightness,
      speed: this.speed,
      time: this.time,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }

  /**
   * Dispose of the filter and stop animations
   */
  destroy(): void {
    this.stopAnimation();
    super.destroy();
  }
}

/**
 * Create a Shockwave filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: ShockwaveFilterConfig): FilterResult {
  const filter = new EnhancedShockwaveFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 