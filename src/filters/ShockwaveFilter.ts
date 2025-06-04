import { ShockwaveFilter as PixiShockwaveFilter } from 'pixi-filters';
import type { ShockwaveFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced ShockwaveFilter with intensity control
 * 
 * Creates a visual wrinkle effect like a pond or blast wave.
 * The ShockwaveFilter applies motion effects with configurable amplitude and wavelength.
 * 
 * @example
 * ```typescript
 * const shockwaveFilter = new ShockwaveFilter({
 *   type: 'shockwave',
 *   enabled: true,
 *   intensity: 7,
 *   amplitude: 30,
 *   wavelength: 160,
 *   center: { x: 0, y: 0 },
 *   primaryProperty: 'amplitude'
 * });
 * ```
 */
export class ShockwaveFilter extends PixiShockwaveFilter {
  public declare config: ShockwaveFilterConfig;
  private baseAmplitude: number;
  private baseWavelength: number;
  private baseRadius: number;
  private baseBrightness: number;
  private baseSpeed: number;
  private animationInterval?: NodeJS.Timeout;

  /**
   *
   */
  constructor(config: ShockwaveFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    const options: Record<string, unknown> = {};
    
    // Handle center configuration (PIXI default: [0,0])
    if (config.center) {
      options.center = [config.center.x, config.center.y];
    } else if (config.centerX !== undefined || config.centerY !== undefined) {
      options.center = [
        config.centerX ?? 0, // PIXI default: 0
        config.centerY ?? 0  // PIXI default: 0
      ];
    } else {
      options.center = [0, 0]; // PIXI defaults
    }
    
    if (config.amplitude !== undefined) options.amplitude = config.amplitude;
    if (config.brightness !== undefined) options.brightness = config.brightness;
    if (config.radius !== undefined) options.radius = config.radius;
    if (config.speed !== undefined) options.speed = config.speed;
    if (config.wavelength !== undefined) options.wavelength = config.wavelength;
    if (config.time !== undefined) options.time = config.time;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations (using PIXI defaults)
    this.baseAmplitude = this.amplitude ?? 30;     // PIXI default: 30
    this.baseBrightness = this.brightness ?? 1;    // PIXI default: 1
    this.baseRadius = this.radius ?? -1;           // PIXI default: -1
    this.baseSpeed = this.speed ?? 500;            // PIXI default: 500
    this.baseWavelength = this.wavelength ?? 160;  // PIXI default: 160
    
    // Start animation if configured
    if (config.animate) {
      this.startAnimation(config.animationSpeed || 16); // Default 60fps
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
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'amplitude':
          this.amplitude = this.baseAmplitude * (normalizedIntensity / 10);
          break;
        case 'wavelength':
          this.wavelength = this.baseWavelength * (normalizedIntensity / 10);
          break;
        case 'radius':
          // Handle radius specially since default is -1 (infinite)
          if (this.baseRadius > 0) {
            this.radius = this.baseRadius * (normalizedIntensity / 10);
          } else {
            this.radius = 100 * (normalizedIntensity / 10); // Use 100 as base for infinite radius
          }
          break;
        case 'brightness':
          this.brightness = this.baseBrightness * (normalizedIntensity / 10);
          break;
        case 'speed':
          this.speed = this.baseSpeed * (normalizedIntensity / 10);
          break;
        default:
          // Default behavior - adjust amplitude
          this.amplitude = this.baseAmplitude * (normalizedIntensity / 10);
      }
    } else {
      // Default behavior - adjust amplitude and brightness proportionally
      this.amplitude = this.baseAmplitude * (normalizedIntensity / 10);
      this.brightness = this.baseBrightness * (0.8 + (normalizedIntensity / 50));
    }
  }

  /**
   * Start animation for time-based effects
   * 
   * @param frequency - Animation frequency in milliseconds
   *
   */
  private startAnimation(frequency: number): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    this.animationInterval = setInterval(() => {
      this.time = (this.time || 0) + 0.1;
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
   * Reset the filter to initial configuration values or PIXI defaults
   */
  public reset(): void {
    // Reset to configured values or PIXI defaults
    this.amplitude = this.config.amplitude ?? 30;        // PIXI default: 30
    this.brightness = this.config.brightness ?? 1;       // PIXI default: 1
    this.radius = this.config.radius ?? -1;              // PIXI default: -1
    this.speed = this.config.speed ?? 500;               // PIXI default: 500
    this.wavelength = this.config.wavelength ?? 160;     // PIXI default: 160
    this.time = this.config.time ?? 0;                   // No PIXI default, use 0
    
    // Reset center (PIXI default: [0,0])
    if (this.config.center) {
      this.center = [this.config.center.x, this.config.center.y];
    } else if (this.config.centerX !== undefined || this.config.centerY !== undefined) {
      this.center = [
        this.config.centerX ?? 0,
        this.config.centerY ?? 0
      ];
    } else {
      this.center = [0, 0]; // PIXI defaults
    }

    // Update base values for intensity calculations
    this.baseAmplitude = this.amplitude;
    this.baseBrightness = this.brightness;
    this.baseRadius = this.radius;
    this.baseSpeed = this.speed;
    this.baseWavelength = this.wavelength;

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
    const centerArray = this.center as unknown as [number, number];
    return {
      amplitude: this.amplitude,
      brightness: this.brightness,
      center: [centerArray[0], centerArray[1]],
      centerX: centerArray[0],
      centerY: centerArray[1],
      radius: this.radius,
      speed: this.speed,
      time: this.time,
      wavelength: this.wavelength,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }

  /**
   * Dispose of the filter and stop animations
   */
  public destroy(): void {
    this.stopAnimation();
    super.destroy();
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
 * @deprecated Use new ShockwaveFilter() instead
 */
export function createFilter(config: ShockwaveFilterConfig): FilterResult {
  const filter = new ShockwaveFilter(config);
  return filter.getFilterResult();
} 