import { DotFilter } from 'pixi-filters';
import { type DotFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Dot filter that applies a dotscreen effect to an object
 *
 * This filter makes display objects appear to be made out of halftone dots
 * like an old printer or newspaper.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Dot filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createDotFilter(config: DotFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.angle !== undefined) options.angle = config.angle;
    if (config.scale !== undefined) options.scale = config.scale;
    if (config.grayscale !== undefined) options.grayscale = config.grayscale;

    // Create a unique key for this filter configuration
    const grayscaleKey = config.grayscale !== undefined ? config.grayscale.toString() : 'true';
    const shaderKey = `dot-filter-a${options.angle || 5}-s${options.scale || 1}-g${grayscaleKey}`;

    // Log what we're creating for debugging
    console.log('Creating DotFilter with options:', options);

    // Create the filter with options
    const filter = new DotFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering dot filter with shader manager:', error);
    }

    // Explicitly set grayscale after creation to ensure it takes effect
    if (config.grayscale !== undefined) {
        filter.grayscale = config.grayscale;
        console.log('DotFilter grayscale set to:', filter.grayscale);
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
                case 'angle':
                    // Map 0-10 to 1-10 for angle (dot radius)
                    filter.angle = 1 + normalizedIntensity;
                    break;
                case 'scale':
                    // Map 0-10 to 0.5-5 for scale (pattern size)
                    filter.scale = 0.5 + (normalizedIntensity / 2);
                    break;
                default:
                    // Default to adjusting angle
                    filter.angle = 1 + normalizedIntensity;
            }
        } else {
            // Default behavior - adjust angle
            filter.angle = 1 + normalizedIntensity;
        }

        // IMPORTANT: Re-apply grayscale setting to ensure it doesn't get reset
        if (config.grayscale !== undefined) {
            filter.grayscale = config.grayscale;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset angle to config value if provided, otherwise use default
        filter.angle = config.angle !== undefined ? config.angle : 5;

        // Reset scale to config value if provided, otherwise use default
        filter.scale = config.scale !== undefined ? config.scale : 1;

        // Reset grayscale to config value if provided, otherwise use default
        filter.grayscale = config.grayscale !== undefined ? config.grayscale : true;

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
            console.warn('Error releasing dot filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}