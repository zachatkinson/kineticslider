import { OldFilmFilter as PixiOldFilmFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { 
  createFilterIntensity, 
  type FilterIntensity,
  type OldFilmFilterConfig,
  isOldFilmFilter 
} from '../types/filters';

/**
 * OldFilm Filter Implementation
 * 
 * Creates an old film effect with sepia tone, noise, scratches, and vignetting.
 * Uses the centralized interface system for type safety.
 * 
 * **PIXI Properties:**
 * - noise: number (default: 0.3) - Opacity/intensity of the noise effect between 0 and 1
 * - noiseSize: number (default: 1) - The size of the noise particles
 * - scratch: number (default: 0.5) - How often scratches appear
 * - scratchDensity: number (default: 0.3) - The density of the number of scratches
 * - scratchWidth: number (default: 1) - The width of the scratches
 * - seed: number (default: 0) - A seed value to apply to the random noise generation
 * - sepia: number (default: 0.3) - The amount of saturation of sepia effect
 * - vignetting: number (default: 0.3) - The radius of the vignette effect
 * - vignettingAlpha: number (default: 1) - Amount of opacity on the vignette
 * - vignettingBlur: number (default: 1) - Blur intensity of the vignette
 * 
 * @see https://pixijs.io/filters/docs/OldFilmFilter.html
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const filter = new OldFilmFilter({ 
 *   type: 'oldFilm',
 *   sepia: 0.4,
 *   noise: 0.2,
 *   scratch: 0.6,
 *   intensity: 6
 * });
 * 
 * // Update sepia based on intensity
 * filter.updateIntensity(8);
 * 
 * // Reset to original values
 * filter.reset();
 * ```
 */
export class OldFilmFilter extends PixiOldFilmFilter {
  private originalConfig: OldFilmFilterConfig;

  /**
   *
   */
  constructor(config: OldFilmFilterConfig) {
    if (!isOldFilmFilter(config)) {
      throw new Error('Invalid OldFilmFilter configuration');
    }

    // Call PIXI constructor (no constructor parameters for OldFilmFilter)
    super();

    this.originalConfig = { ...config };

    // Apply PIXI properties with their documented defaults
    this.noise = config.noise ?? 0.3;                      // PIXI default
    this.noiseSize = config.noiseSize ?? 1;                // PIXI default
    this.scratch = config.scratch ?? 0.5;                  // PIXI default
    this.scratchDensity = config.scratchDensity ?? 0.3;    // PIXI default
    this.scratchWidth = config.scratchWidth ?? 1;          // PIXI default
    this.seed = config.seed ?? 0;                          // PIXI default
    this.sepia = config.sepia ?? 0.3;                      // PIXI default
    this.vignetting = config.vignetting ?? 0.3;            // PIXI default
    this.vignettingAlpha = config.vignettingAlpha ?? 1;    // PIXI default
    this.vignettingBlur = config.vignettingBlur ?? 1;      // PIXI default (corrected from 0.3)

    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Updates the filter intensity by modifying the primary property
   * 
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    const normalizedIntensity = intensityValue / 10; // 0-10 → 0-1

    // Determine which property to adjust based on config
    if (this.originalConfig.primaryProperty === 'sepia') {
      // Map intensity (0-10) to sepia (0-1)
      this.sepia = normalizedIntensity;
    } else if (this.originalConfig.primaryProperty === 'noise') {
      // Map intensity (0-10) to noise (0-1)
      this.noise = normalizedIntensity;
    } else if (this.originalConfig.primaryProperty === 'scratch') {
      // Map intensity (0-10) to scratch (0-1)
      this.scratch = normalizedIntensity;
    } else if (this.originalConfig.primaryProperty === 'vignetting') {
      // Map intensity (0-10) to vignetting (0-1)
      this.vignetting = normalizedIntensity;
    } else {
      // Default: adjust all effects proportionally
      const baseSepia = this.originalConfig.sepia ?? 0.3;
      const baseNoise = this.originalConfig.noise ?? 0.3;
      const baseScratch = this.originalConfig.scratch ?? 0.5;
      const baseVignetting = this.originalConfig.vignetting ?? 0.3;
      
      this.sepia = baseSepia * (intensityValue / 5);          // Scale from base
      this.noise = baseNoise * (intensityValue / 5);          // Scale from base
      this.scratch = baseScratch * (intensityValue / 5);      // Scale from base
      this.vignetting = baseVignetting * (intensityValue / 5); // Scale from base
    }
  }

  /**
   * Resets the filter to its original configuration
   */
  reset(): void {
    // Reset to original values or PIXI defaults
    this.noise = this.originalConfig.noise ?? 0.3;
    this.noiseSize = this.originalConfig.noiseSize ?? 1;
    this.scratch = this.originalConfig.scratch ?? 0.5;
    this.scratchDensity = this.originalConfig.scratchDensity ?? 0.3;
    this.scratchWidth = this.originalConfig.scratchWidth ?? 1;
    this.seed = this.originalConfig.seed ?? 0;
    this.sepia = this.originalConfig.sepia ?? 0.3;
    this.vignetting = this.originalConfig.vignetting ?? 0.3;
    this.vignettingAlpha = this.originalConfig.vignettingAlpha ?? 1;
    this.vignettingBlur = this.originalConfig.vignettingBlur ?? 1;

    // Reapply original intensity if configured
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(this.originalConfig.intensity);
    }
  }

  /**
   * Gets the current filter state for debugging
   * 
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      type: 'oldFilm',
      noise: this.noise,
      noiseSize: this.noiseSize,
      scratch: this.scratch,
      scratchDensity: this.scratchDensity,
      scratchWidth: this.scratchWidth,
      seed: this.seed,
      sepia: this.sepia,
      vignetting: this.vignetting,
      vignettingAlpha: this.vignettingAlpha,
      vignettingBlur: this.vignettingBlur,
      originalConfig: this.originalConfig
    };
  }

  /**
   * Disposes of the filter and cleans up resources
   */
  dispose(): void {
    super.destroy();
  }
}

/**
 * Factory function for backward compatibility
 * 
 * @param config - The filter configuration
 *
 * @returns Filter instance with utility methods
 *
 */
export function createOldFilmFilter(config: OldFilmFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new OldFilmFilter(config);
  
  return {
    filter: filterInstance,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 