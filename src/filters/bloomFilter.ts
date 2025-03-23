import { BloomFilter } from 'pixi-filters';
import { type BloomFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * This file should be placed at:
 * src/components/KineticSlider/filters/bloomFilter.ts
 */

/**
 * Creates a Bloom filter that applies a Gaussian blur to create a bloom effect
 *
 * The BloomFilter applies a Gaussian blur to an object, creating a glow effect.
 * The strength of the blur can be set for x- and y-axis separately.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Bloom filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createBloomFilter(config: BloomFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object based on the configuration
    const options: any = {};

    // Set the strength if provided (for both X and Y)
    if (config.strength !== undefined) {
        options.strength = config.strength;
    }

    // Set individual X and Y strengths if provided
    if (config.strengthX !== undefined) {
        options.strengthX = config.strengthX;
    }

    if (config.strengthY !== undefined) {
        options.strengthY = config.strengthY;
    }

    // Create a unique key for this filter configuration
    const strengthXKey = config.strengthX !== undefined ? config.strengthX.toString() : 'default';
    const strengthYKey = config.strengthY !== undefined ? config.strengthY.toString() : 'default';
    const shaderKey = `bloom-filter-${config.strength || 2}-${strengthXKey}-${strengthYKey}`;

    // Create the filter with options
    const filter = new BloomFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering bloom filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine how to apply the intensity based on config
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'strength':
                    // Apply to overall strength (both X and Y)
                    filter.strength = {x: normalizedIntensity * 2, y: normalizedIntensity * 2} ; // 0-10 → 0-20
                    break;
                case 'strengthX':
                    // Apply to X strength only
                    filter.strengthX = normalizedIntensity * 2; // 0-10 → 0-20
                    break;
                case 'strengthY':
                    // Apply to Y strength only
                    filter.strengthY = normalizedIntensity * 2; // 0-10 → 0-20
                    break;
                default:
                    // Default to overall strength
                    filter.strength = normalizedIntensity * 2; // 0-10 → 0-20
            }
        } else {
            // Default behavior - apply to overall strength
            filter.strength = normalizedIntensity * 2; // 0-10 → 0-20
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Use config values if provided, otherwise use default value of 2
        if (config.strength !== undefined) {
            filter.strength = config.strength;
        } else if (config.strengthX !== undefined && config.strengthY !== undefined) {
            filter.strengthX = config.strengthX;
            filter.strengthY = config.strengthY;
        } else if (config.strengthX !== undefined) {
            filter.strengthX = config.strengthX;
            filter.strengthY = 2; // Default for Y if only X is provided
        } else if (config.strengthY !== undefined) {
            filter.strengthX = 2; // Default for X if only Y is provided
            filter.strengthY = config.strengthY;
        } else {
            // Reset to default values if no config values were provided
            filter.strength = 2; // Default value is 2
        }

        // If intensity was provided in config, apply that
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
            console.warn('Error releasing bloom filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}