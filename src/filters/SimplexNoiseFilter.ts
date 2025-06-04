import { SimplexNoiseFilter as PixiSimplexNoiseFilter } from 'pixi-filters';
import type { SimplexNoiseFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced SimplexNoiseFilter with intensity control
 * 
 * The SimplexNoiseFilter multiplies simplex noise with the current texture data.
 * Creates various noise and distortion effects using the simplex noise algorithm.
 * 
 * @example
 * ```typescript
 * const simplexNoiseFilter = new SimplexNoiseFilter({
 *   type: 'simplexNoise',
 *   enabled: true,
 *   intensity: 6,
 *   noiseScale: 15,
 *   strength: 0.8,
 *   step: 2,
 *   primaryProperty: 'strength'
 * });
 * ```
 */
export class SimplexNoiseFilter extends PixiSimplexNoiseFilter {
  public declare config: SimplexNoiseFilterConfig;
  private baseNoiseScale: number;
  private baseOffsetX: number;
  private baseOffsetY: number;
  private baseOffsetZ: number;
  private baseStep: number;
  private baseStrength: number;

  /**
   *
   */
  constructor(config: SimplexNoiseFilterConfig) {
    // Set PIXI defaults for properties not specified in config
    const options: Record<string, unknown> = {};
    
    if (config.noiseScale !== undefined) options.noiseScale = config.noiseScale;
    if (config.offsetX !== undefined) options.offsetX = config.offsetX;
    if (config.offsetY !== undefined) options.offsetY = config.offsetY;
    if (config.offsetZ !== undefined) options.offsetZ = config.offsetZ;
    if (config.step !== undefined) options.step = config.step;
    if (config.strength !== undefined) options.strength = config.strength;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations (using PIXI defaults)
    this.baseNoiseScale = this.noiseScale ?? 10;   // PIXI default: 10
    this.baseOffsetX = this.offsetX ?? 0;          // PIXI default: 0
    this.baseOffsetY = this.offsetY ?? 0;          // PIXI default: 0
    this.baseOffsetZ = this.offsetZ ?? 0;          // PIXI default: 0
    this.baseStep = this.step ?? -1;               // PIXI default: -1
    this.baseStrength = this.strength ?? 0.5;     // PIXI default: 0.5
    
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
        case 'noiseScale':
          // Scale of the noise pattern (1-50 range for good effect)
          this.noiseScale = this.baseNoiseScale + (normalizedIntensity * 4);
          break;
        case 'strength':
          // Intensity of the noise effect (0-2 range)
          this.strength = this.baseStrength * (normalizedIntensity / 5); // More controlled scaling
          break;
        case 'step':
          // Threshold for blocky effect (-1 to 10 range, -1 = smooth)
          this.step = this.baseStep + (normalizedIntensity * 1.1);
          break;
        case 'offsetX':
          // Horizontal offset (0-100 range)
          this.offsetX = this.baseOffsetX + (normalizedIntensity * 10);
          break;
        case 'offsetY':
          // Vertical offset (0-100 range)
          this.offsetY = this.baseOffsetY + (normalizedIntensity * 10);
          break;
        case 'offsetZ':
          // Depth offset (0-100 range)
          this.offsetZ = this.baseOffsetZ + (normalizedIntensity * 10);
          break;
        default:
          // Default behavior - adjust strength
          this.strength = this.baseStrength * (normalizedIntensity / 5);
      }
    } else {
      // Default behavior - adjust strength and noiseScale proportionally
      this.strength = this.baseStrength * (normalizedIntensity / 5);
      this.noiseScale = this.baseNoiseScale + (normalizedIntensity * 2);
    }
  }

  /**
   * Reset the filter to initial configuration values or PIXI defaults
   */
  public reset(): void {
    // Reset to configured values or PIXI defaults
    this.noiseScale = this.config.noiseScale ?? 10;    // PIXI default: 10
    this.offsetX = this.config.offsetX ?? 0;           // PIXI default: 0
    this.offsetY = this.config.offsetY ?? 0;           // PIXI default: 0
    this.offsetZ = this.config.offsetZ ?? 0;           // PIXI default: 0
    this.step = this.config.step ?? -1;                // PIXI default: -1
    this.strength = this.config.strength ?? 0.5;       // PIXI default: 0.5

    // Update base values for intensity calculations
    this.baseNoiseScale = this.noiseScale;
    this.baseOffsetX = this.offsetX;
    this.baseOffsetY = this.offsetY;
    this.baseOffsetZ = this.offsetZ;
    this.baseStep = this.step;
    this.baseStrength = this.strength;

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
      noiseScale: this.noiseScale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      offsetZ: this.offsetZ,
      step: this.step,
      strength: this.strength,
      enabled: this.enabled,
      intensity: this.config.intensity,
      configuredNoiseScale: this.config.noiseScale,
      configuredStrength: this.config.strength,
      configuredStep: this.config.step
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
 * @deprecated Use new SimplexNoiseFilter() instead
 */
export function createSimplexNoiseFilter(config: SimplexNoiseFilterConfig): FilterResult {
  const filter = new SimplexNoiseFilter(config);
  return filter.getFilterResult();
} 