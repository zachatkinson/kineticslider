import { NoiseFilter } from 'pixi.js';
import type { FilterResult, NoiseFilterConfig } from '../types/filters';

/**
 * Enhanced NoiseFilter with intensity control
 * 
 * The NoiseFilter applies random noise to the display object.
 * Uses PIXI's built-in NoiseFilter which is optimized for performance.
 * 
 * @param config - Configuration for the Noise filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const noiseFilter = createNoiseFilter({
 *   type: 'noise',
 *   enabled: true,
 *   intensity: 6,
 *   noiseLevel: 0.5,
 *   seed: 123
 * });
 * ```
 */
export function createNoiseFilter(config: NoiseFilterConfig): FilterResult {
    // Set default values
    const noiseLevel = config.noiseLevel ?? 0.5;
    const seed = config.seed ?? Math.random();

    // Create the filter with initial configuration
    const filter = new NoiseFilter();
    filter.noise = noiseLevel;
    filter.seed = seed;

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Map intensity (0-10) to noise level (0-1)
        const mappedNoiseLevel = normalizedIntensity / 10;

        // Apply the noise level
        filter.noise = mappedNoiseLevel;

        // If configured to generate new seed on update, do so
        if (config.generateNewSeedOnUpdate) {
            filter.seed = Math.random();
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.noise = config.noiseLevel ?? 0.5;
        filter.seed = config.seed ?? Math.random();

        // If intensity was provided in config, apply that
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        filter.destroy();
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    return { filter, updateIntensity, reset, dispose, config };
} 