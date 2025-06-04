import { BevelFilter as PixiBevelFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';
import type { ColorSource } from 'pixi.js';

/**
 * Configuration for the Bevel filter
 *
 * @example
 * ```typescript
 * const config: BevelFilterConfig = {
 *   type: 'bevel',
 *   thickness: 3,
 *   rotation: 45,
 *   lightColor: 0xffffff,
 *   shadowColor: 0x000000,
 *   intensity: 5
 * };
 * ```
 */
export interface BevelFilterConfig extends BaseFilterConfig {
  type: 'bevel';
  rotation?: number;         // The angle of the light in degrees (default: 45)
  thickness?: number;        // The thickness of the bevel (default: 2)
  lightColor?: ColorSource;  // The color value of the left & top bevel (default: 0xffffff)
  lightAlpha?: number;       // The alpha value of the left & top bevel (default: 0.7)
  shadowColor?: ColorSource; // The color value of the right & bottom bevel (default: 0x000000)
  shadowAlpha?: number;      // The alpha value of the right & bottom bevel (default: 0.7)
  primaryProperty?: 'thickness' | 'lightAlpha' | 'shadowAlpha' | 'rotation'; // Property controlled by intensity
}

/**
 * Bevel Filter Implementation
 *
 * Creates a 3D-like appearance by applying a bevel effect with configurable
 * light and shadow colors, thickness, and rotation.
 *
 * @example
 * ```typescript
 * const filter = new BevelFilter({ 
 *   type: 'bevel', 
 *   thickness: 4, 
 *   rotation: 30 
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class BevelFilter extends BaseFilter<BevelFilterConfig> {
  /**
   *
   */
  constructor(config: BevelFilterConfig) {
    const pixiFilter = new PixiBevelFilter({
      rotation: config.rotation ?? 45,
      thickness: config.thickness ?? 2,
      lightColor: config.lightColor ?? 0xffffff,
      lightAlpha: config.lightAlpha ?? 0.7,
      shadowColor: config.shadowColor ?? 0x000000,
      shadowAlpha: config.shadowAlpha ?? 0.7
    });
    super(config, pixiFilter);
  }

  private get bevelFilter(): PixiBevelFilter {
    return this.pixiFilter as PixiBevelFilter;
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Determine which property to adjust based on config
    if (this.originalConfig.primaryProperty) {
      switch (this.originalConfig.primaryProperty) {
        case 'thickness':
          // thickness: Scale from base thickness (0-10 maps to 0-20 for dramatic effect)
          const baseThickness = this.originalConfig.thickness ?? 2;
          this.bevelFilter.thickness = baseThickness + (intensityValue * 1.8); // 0-10 -> 0-18 additional
          break;
        case 'lightAlpha':
          // lightAlpha: Control light intensity (0-1 range)
          this.bevelFilter.lightAlpha = intensityValue / 10; // 0-10 -> 0-1
          break;
        case 'shadowAlpha':
          // shadowAlpha: Control shadow intensity (0-1 range)
          this.bevelFilter.shadowAlpha = intensityValue / 10; // 0-10 -> 0-1
          break;
        case 'rotation':
          // rotation: Rotate light angle (0-360 degrees based on intensity)
          this.bevelFilter.rotation = (intensityValue / 10) * 360; // 0-10 -> 0-360
          break;
        default:
          // Default behavior: adjust thickness
          const defaultThickness = this.originalConfig.thickness ?? 2;
          this.bevelFilter.thickness = defaultThickness + (intensityValue * 1.8);
      }
    } else {
      // Default behavior: adjust thickness and alpha proportionally
      const baseThickness = this.originalConfig.thickness ?? 2;
      this.bevelFilter.thickness = baseThickness + (intensityValue * 1.8);
      
      // Also adjust alpha values for more dramatic effect
      const baseLightAlpha = this.originalConfig.lightAlpha ?? 0.7;
      const baseShadowAlpha = this.originalConfig.shadowAlpha ?? 0.7;
      this.bevelFilter.lightAlpha = Math.min(1, baseLightAlpha + (intensityValue * 0.03));
      this.bevelFilter.shadowAlpha = Math.min(1, baseShadowAlpha + (intensityValue * 0.03));
    }
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Reset to configured values or defaults
    this.bevelFilter.rotation = this.originalConfig.rotation ?? 45;
    this.bevelFilter.thickness = this.originalConfig.thickness ?? 2;
    this.bevelFilter.lightColor = this.originalConfig.lightColor ?? 0xffffff;
    this.bevelFilter.lightAlpha = this.originalConfig.lightAlpha ?? 0.7;
    this.bevelFilter.shadowColor = this.originalConfig.shadowColor ?? 0x000000;
    this.bevelFilter.shadowAlpha = this.originalConfig.shadowAlpha ?? 0.7;

    // Apply intensity if configured
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    }
  }

  /**
   * Gets the current state of the filter
   *
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      ...super.getState(),
      rotation: this.bevelFilter.rotation,
      thickness: this.bevelFilter.thickness,
      lightColor: this.bevelFilter.lightColor,
      lightAlpha: this.bevelFilter.lightAlpha,
      shadowColor: this.bevelFilter.shadowColor,
      shadowAlpha: this.bevelFilter.shadowAlpha,
      configuredRotation: this.originalConfig.rotation,
      configuredThickness: this.originalConfig.thickness,
      configuredLightColor: this.originalConfig.lightColor,
      configuredShadowColor: this.originalConfig.shadowColor
    };
  }
}

/**
 * Factory function for backward compatibility
 *
 * @param config - The filter configuration
 *
 * @returns The filter instance with utility methods
 *
 */
export function createBevelFilter(config: BevelFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new BevelFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 