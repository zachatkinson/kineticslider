import { NoiseFilter as PixiNoiseFilter } from 'pixi.js';
import { Filter } from 'pixi.js';
import { 
  createFilterIntensity, 
  type FilterIntensity,
  type NoiseFilterConfig,
  isNoiseFilter 
} from '../types/filters';

/**
 * Noise Filter Implementation
 * 
 * A Noise effect filter that adds random noise/grain effect to display objects.
 * Uses the centralized interface system for type safety.
 * 
 * **PIXI Properties:**
 * - noise: number (default: 0.5) - The amount of noise to apply (0, 1]
 * - seed: number - A seed value to apply to the random noise generation
 * 
 * @see https://pixijs.download/release/docs/filters.NoiseFilter.html
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const filter = new NoiseFilter({ 
 *   type: 'noise',
 *   noise: 0.3,
 *   seed: 42,
 *   intensity: 7
 * });
 * 
 * // Update noise based on intensity
 * filter.updateIntensity(8);
 * 
 * // Reset to original values
 * filter.reset();
 * ```
 */
export class NoiseFilter extends PixiNoiseFilter {
  private originalConfig: NoiseFilterConfig;

  /**
   *
   */
  constructor(config: NoiseFilterConfig) {
    if (!isNoiseFilter(config)) {
      throw new Error('Invalid NoiseFilter configuration');
    }

    // Call PIXI constructor (no constructor parameters for NoiseFilter)
    super();

    this.originalConfig = { ...config };

    // Apply PIXI properties with their defaults
    this.noise = config.noise ?? 0.5;  // PIXI default
    this.seed = config.seed ?? Math.random();  // Random seed if not provided

    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Updates the filter intensity by modifying the noise property
   * 
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    if (this.originalConfig.primaryProperty === 'noise') {
      // Direct noise control (0-10 maps to 0-1, respecting PIXI range)
      this.noise = Math.max(0.001, Math.min(1, intensityValue / 10));  // Avoid 0 per PIXI range (0, 1]
    } else {
      // Default: Scale from base noise value
      const baseNoise = this.originalConfig.noise ?? 0.5;
      this.noise = Math.max(0.001, Math.min(1, baseNoise * (intensityValue / 5)));
    }

    // Generate new seed if configured
    if (this.originalConfig.generateNewSeedOnUpdate) {
      this.seed = Math.random();
    }
  }

  /**
   * Resets the filter to its original configuration
   */
  reset(): void {
    // Reset to original values or PIXI defaults
    this.noise = this.originalConfig.noise ?? 0.5;
    this.seed = this.originalConfig.seed ?? Math.random();

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
      type: 'noise',
      noise: this.noise,
      seed: this.seed,
      generateNewSeedOnUpdate: this.originalConfig.generateNewSeedOnUpdate,
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
export function createNoiseFilter(config: NoiseFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new NoiseFilter(config);
  
  return {
    filter: filterInstance,
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