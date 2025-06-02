import { OldFilmFilter } from 'pixi-filters';
import type { OldFilmFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced OldFilmFilter with intensity control
 * 
 * The OldFilmFilter creates an old film effect with sepia tone, noise, scratches, and vignetting.
 * This creates a vintage film look with configurable parameters.
 * 
 * @param config - Configuration for the OldFilm filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const oldFilmFilter = createOldFilmFilter({
 *   type: 'oldFilm',
 *   enabled: true,
 *   intensity: 6,
 *   sepia: 0.3,
 *   noise: 0.3,
 *   scratch: 0.5,
 *   primaryProperty: 'sepia'
 * });
 * ```
 */
export function createOldFilmFilter(config: OldFilmFilterConfig): FilterResult {
    // Set default values
    const sepia = config.sepia ?? 0.3;
    const noise = config.noise ?? 0.3;
    const noiseSize = config.noiseSize ?? 1.0;
    const scratch = config.scratch ?? 0.5;
    const scratchDensity = config.scratchDensity ?? 0.3;
    const scratchWidth = config.scratchWidth ?? 1.0;
    const vignetting = config.vignetting ?? 0.3;
    const vignettingAlpha = config.vignettingAlpha ?? 1.0;
    const vignettingBlur = config.vignettingBlur ?? 0.3;
    const seed = config.seed ?? Math.random();

    // Create the filter with initial configuration
    const filter = new OldFilmFilter();

    // Apply initial configuration
    filter.sepia = sepia;
    filter.noise = noise;
    filter.noiseSize = noiseSize;
    filter.scratch = scratch;
    filter.scratchDensity = scratchDensity;
    filter.scratchWidth = scratchWidth;
    filter.vignetting = vignetting;
    filter.vignettingAlpha = vignettingAlpha;
    filter.vignettingBlur = vignettingBlur;
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

        // Determine which property to adjust based on config
        if (config.primaryProperty === 'sepia') {
            // Map intensity (0-10) to sepia (0-1)
            filter.sepia = normalizedIntensity / 10;
        }
        else if (config.primaryProperty === 'noise') {
            // Map intensity (0-10) to noise (0-1)
            filter.noise = normalizedIntensity / 10;
        }
        else if (config.primaryProperty === 'scratch') {
            // Map intensity (0-10) to scratch (0-1)
            filter.scratch = normalizedIntensity / 10;
        }
        else if (config.primaryProperty === 'vignetting') {
            // Map intensity (0-10) to vignetting (0-1)
            filter.vignetting = normalizedIntensity / 10;
        }
        else {
            // Default: adjust all effects proportionally
            const effectIntensity = normalizedIntensity / 10;
            filter.sepia = effectIntensity * 0.3;
            filter.noise = effectIntensity * 0.3;
            filter.scratch = effectIntensity * 0.5;
            filter.vignetting = effectIntensity * 0.3;
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.sepia = config.sepia ?? 0.3;
        filter.noise = config.noise ?? 0.3;
        filter.noiseSize = config.noiseSize ?? 1.0;
        filter.scratch = config.scratch ?? 0.5;
        filter.scratchDensity = config.scratchDensity ?? 0.3;
        filter.scratchWidth = config.scratchWidth ?? 1.0;
        filter.vignetting = config.vignetting ?? 0.3;
        filter.vignettingAlpha = config.vignettingAlpha ?? 1.0;
        filter.vignettingBlur = config.vignettingBlur ?? 0.3;
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