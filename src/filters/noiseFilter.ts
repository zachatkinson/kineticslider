import { NoiseFilter } from 'pixi.js';
import { type NoiseFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Noise filter that applies random noise to an image
 *
 * The noise effect can be used to create film grain, static, or other textured effects.
 * Based on: https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/noise.js
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Noise filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createNoiseFilter(config: NoiseFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {
        noise: config.noiseLevel || 0.5, // Default noise level is 0.5
        seed: config.seed || Math.random() // Default seed is a random value
    };

    // Create a unique key for this filter configuration
    // For noise, we use a single shader key as only the uniforms change when noise/seed values change
    const shaderKey = 'noise-filter';

    // Create the filter with options
    const filter = new NoiseFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering noise filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Map the 0-10 intensity scale to 0-1 for the noise property
        filter.noise = Math.max(0, Math.min(10, intensity)) / 10;


        // Generate a new seed value for the noise if requested
        if (config.generateNewSeedOnUpdate) {
            filter.seed = Math.random();
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset noise level to config value if provided, otherwise use default
        if (config.noiseLevel !== undefined) {
            filter.noise = config.noiseLevel;
        } else if (config.intensity !== undefined) {
            // If intensity is provided but not noiseLevel, don't explicitly set noise
            // as updateIntensity will handle it
        } else {
            // If neither is provided, default to 0 (no noise)
            filter.noise = 0;
        }

        // Handle seed resetting with proper config respect
        if (config.seed !== undefined) {
            // If a specific seed was provided in config, use that value
            filter.seed = config.seed;
        } else if (config.generateNewSeedOnUpdate === true) {
            // Only generate a new seed if explicitly requested
            filter.seed = Math.random();
        } else {
            // Otherwise keep the current seed or use a consistent default
            // This avoids changing the visual effect unexpectedly on reset
            filter.seed = filter.seed || 0;
        }

        // If intensity was provided in config, use updateIntensity to reset properly
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
            console.warn('Error releasing noise filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}