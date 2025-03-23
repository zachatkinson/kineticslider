import { OldFilmFilter } from 'pixi-filters';
import { type OldFilmFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates an OldFilm filter that applies a vintage film effect
 *
 * The OldFilmFilter adds noise, scratches, sepia tone, and vignetting effects
 * to simulate the look of old film footage.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the OldFilm filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createOldFilmFilter(config: OldFilmFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.noise !== undefined) options.noise = config.noise;
    if (config.noiseSize !== undefined) options.noiseSize = config.noiseSize;
    if (config.scratch !== undefined) options.scratch = config.scratch;
    if (config.scratchDensity !== undefined) options.scratchDensity = config.scratchDensity;
    if (config.scratchWidth !== undefined) options.scratchWidth = config.scratchWidth;
    if (config.seed !== undefined) options.seed = config.seed;
    if (config.sepia !== undefined) options.sepia = config.sepia;
    if (config.vignetting !== undefined) options.vignetting = config.vignetting;
    if (config.vignettingAlpha !== undefined) options.vignettingAlpha = config.vignettingAlpha;
    if (config.vignettingBlur !== undefined) options.vignettingBlur = config.vignettingBlur;

    // Create a unique key for this filter configuration based on key parameters
    // Noise size and vignetting blur are the most significant for shader compilation
    const noiseSizeStr = (options.noiseSize || 1).toString();
    const vignettingBlurStr = (options.vignettingBlur || 1).toString();
    const shaderKey = `old-film-filter-${noiseSizeStr}-${vignettingBlurStr}`;

    // Create the filter with options
    const filter = new OldFilmFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering old film filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'noise':
                    // Map 0-10 to 0-1 for noise
                    filter.noise = normalizedIntensity / 10;
                    break;
                case 'scratch':
                    // Map 0-10 to 0-1 for scratch
                    filter.scratch = normalizedIntensity / 10;
                    break;
                case 'sepia':
                    // Map 0-10 to 0-1 for sepia
                    filter.sepia = normalizedIntensity / 10;
                    break;
                case 'vignetting':
                    // Map 0-10 to 0-1 for vignetting
                    filter.vignetting = normalizedIntensity / 10;
                    break;
                case 'scratchDensity':
                    // Map 0-10 to 0-1 for scratchDensity
                    filter.scratchDensity = normalizedIntensity / 10;
                    break;
                default:
                    // Default to a comprehensive effect adjustment
                    // Adjust multiple properties for a balanced increase in the vintage effect
                    filter.noise = Math.min(1, 0.2 + (normalizedIntensity / 20)); // 0.2-0.7 range
                    filter.scratch = Math.min(1, 0.3 + (normalizedIntensity / 15)); // 0.3-0.97 range
                    filter.sepia = Math.min(1, 0.2 + (normalizedIntensity / 20)); // 0.2-0.7 range
                    filter.vignetting = Math.min(1, 0.3 + (normalizedIntensity / 30)); // 0.3-0.63 range
            }
        } else {
            // Default behavior - adjust multiple properties for a balanced effect
            filter.noise = Math.min(1, 0.2 + (normalizedIntensity / 20)); // 0.2-0.7 range
            filter.scratch = Math.min(1, 0.3 + (normalizedIntensity / 15)); // 0.3-0.97 range
            filter.sepia = Math.min(1, 0.2 + (normalizedIntensity / 20)); // 0.2-0.7 range
            filter.vignetting = Math.min(1, 0.3 + (normalizedIntensity / 30)); // 0.3-0.63 range
        }

        // Randomize seed slightly for dynamic scratches if above minimum intensity
        if (normalizedIntensity > 3) {
            filter.seed = Math.random() * 1000;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset each property to config value if provided, otherwise use default

        // Noise properties
        filter.noise = config.noise !== undefined ? config.noise : 0.3;
        filter.noiseSize = config.noiseSize !== undefined ? config.noiseSize : 1;

        // Scratch properties
        filter.scratch = config.scratch !== undefined ? config.scratch : 0.5;
        filter.scratchDensity = config.scratchDensity !== undefined ? config.scratchDensity : 0.3;
        filter.scratchWidth = config.scratchWidth !== undefined ? config.scratchWidth : 1;

        // Seed property
        filter.seed = config.seed !== undefined ? config.seed : 0;

        // Sepia property
        filter.sepia = config.sepia !== undefined ? config.sepia : 0.3;

        // Vignetting properties
        filter.vignetting = config.vignetting !== undefined ? config.vignetting : 0.3;
        filter.vignettingAlpha = config.vignettingAlpha !== undefined ? config.vignettingAlpha : 1;
        filter.vignettingBlur = config.vignettingBlur !== undefined ? config.vignettingBlur : 1;

        // If intensity was provided in config, use updateIntensity to reset properly
        // This will adjust multiple properties based on the primaryProperty setting
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing old film filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}