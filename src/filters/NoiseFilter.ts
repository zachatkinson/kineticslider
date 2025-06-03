import { NoiseFilter as PixiNoiseFilter } from 'pixi.js';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

/**
 * Configuration for the Noise filter
 *
 * @example
 * ```typescript
 * const config: NoiseFilterConfig = {
 *   type: 'noise',
 *   noise: 0.3,
 *   seed: 0.5,
 *   intensity: 7
 * };
 * ```
 */
export interface NoiseFilterConfig extends BaseFilterConfig {
  type: 'noise';
  noise?: number;
  seed?: number;
  generateNewSeedOnUpdate?: boolean;
  noiseLevel?: number;
}

/**
 * Noise Filter Implementation
 *
 * Adds random noise/grain effect to the display object using PIXI.js NoiseFilter.
 *
 * @example
 * ```typescript
 * const filter = new NoiseFilter({ 
 *   type: 'noise', 
 *   noise: 0.4,
 *   generateNewSeedOnUpdate: true 
 * });
 * filter.updateIntensity(6);
 * filter.reset();
 * ```
 */
export class NoiseFilter extends BaseFilter<NoiseFilterConfig> {
  /**
   *
   */
  constructor(config: NoiseFilterConfig) {
    const pixiFilter = new PixiNoiseFilter();
    super(config, pixiFilter);
  }

  private get noiseFilter(): PixiNoiseFilter {
    return this.pixiFilter as PixiNoiseFilter;
  }

  protected initialize(): void {
    // Set initial noise value - tests use noiseLevel as alternative name for noise
    const configuredNoise = this.originalConfig.noise ?? this.originalConfig.noiseLevel ?? 0.5;
    this.noiseFilter.noise = configuredNoise;
    
    // Set seed - use configured value or generate random one
    if (this.originalConfig.seed !== undefined) {
      this.noiseFilter.seed = this.originalConfig.seed;
    } else {
      this.noiseFilter.seed = Math.random();
    }
    
    // Call parent initialize to handle intensity
    super.initialize();
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Convert intensity to noise level (tests expect direct mapping)
    this.noiseFilter.noise = intensityValue / 10;
    
    // Generate new seed if configured
    if (this.originalConfig.generateNewSeedOnUpdate) {
      this.noiseFilter.seed = Math.random();
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
    const configuredNoise = this.originalConfig.noise ?? this.originalConfig.noiseLevel ?? 0.5;
    const configuredSeed = this.originalConfig.seed ?? Math.random();
    
    this.noiseFilter.noise = configuredNoise;
    this.noiseFilter.seed = configuredSeed;
    
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
      noise: this.noiseFilter.noise,
      seed: this.noiseFilter.seed,
      configuredNoise: this.originalConfig.noise,
      configuredNoiseLevel: this.originalConfig.noiseLevel,
      configuredSeed: this.originalConfig.seed,
      generateNewSeedOnUpdate: this.originalConfig.generateNewSeedOnUpdate
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
export function createNoiseFilter(config: NoiseFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new NoiseFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => {
      // Handle edge cases for invalid intensity values
      try {
        filterInstance.updateIntensity(createFilterIntensity(intensity));
      } catch {
        // For invalid inputs, clamp to valid range and call directly
        const clampedValue = Math.max(0, Math.min(10, Number(intensity) || 0));
        filterInstance.updateIntensity(createFilterIntensity(clampedValue));
      }
    },
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 