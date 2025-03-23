import { CRTFilter } from 'pixi-filters';
import { type CRTFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a CRT filter that applies a CRT (Cathode Ray Tube) effect to an object
 *
 * The CRTFilter simulates an old CRT display with features like scan lines,
 * screen curvature, vignetting, and noise.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the CRT filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createCRTFilter(config: CRTFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.curvature !== undefined) options.curvature = config.curvature;
    if (config.lineContrast !== undefined) options.lineContrast = config.lineContrast;
    if (config.lineWidth !== undefined) options.lineWidth = config.lineWidth;
    if (config.noise !== undefined) options.noise = config.noise;
    if (config.noiseSize !== undefined) options.noiseSize = config.noiseSize;
    if (config.seed !== undefined) options.seed = config.seed;
    if (config.time !== undefined) options.time = config.time;
    if (config.verticalLine !== undefined) options.verticalLine = config.verticalLine;
    if (config.vignetting !== undefined) options.vignetting = config.vignetting;
    if (config.vignettingAlpha !== undefined) options.vignettingAlpha = config.vignettingAlpha;
    if (config.vignettingBlur !== undefined) options.vignettingBlur = config.vignettingBlur;

    // Create a unique key for this filter configuration
    const primaryProp = config.primaryProperty || 'noise';
    const shaderKey = `crt-filter-${primaryProp}-${config.verticalLine || false}`;

    // Create the filter with options
    const filter = new CRTFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering CRT filter with shader manager:', error);
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
                case 'curvature':
                    // Map 0-10 to 0-10 for curvature (0 is flat, higher values increase curve)
                    filter.curvature = normalizedIntensity;
                    break;
                case 'lineContrast':
                    // Map 0-10 to 0-1 for line contrast
                    filter.lineContrast = normalizedIntensity / 10;
                    break;
                case 'lineWidth':
                    // Map 0-10 to 0.5-5 for line width
                    filter.lineWidth = 0.5 + (normalizedIntensity / 2);
                    break;
                case 'vignetting':
                    // Map 0-10 to 0-1 for vignetting (0.5 is a good midpoint)
                    filter.vignetting = normalizedIntensity / 10;
                    break;
                case 'vignettingAlpha':
                    // Map 0-10 to 0-1 for vignetting alpha
                    filter.vignettingAlpha = normalizedIntensity / 10;
                    break;
                default:
                    // Default to adjusting noise if primary property is not recognized
                    filter.noise = normalizedIntensity / 10;
            }
        } else {
            // Default behavior - adjust noise level
            filter.noise = normalizedIntensity / 10;

            // Optionally adjust other parameters based on intensity for a more comprehensive effect
            if (normalizedIntensity > 5) {
                // Increase curvature, line width, and vignetting as intensity increases beyond midpoint
                filter.curvature = (normalizedIntensity - 5) / 2; // 0-2.5 range
                filter.vignetting = 0.3 + ((normalizedIntensity - 5) / 20); // 0.3-0.55 range
            }
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset each property to config value if provided, otherwise use default

        // Display properties
        filter.curvature = config.curvature !== undefined ? config.curvature : 1;
        filter.verticalLine = config.verticalLine !== undefined ? config.verticalLine : false;

        // Line properties
        filter.lineContrast = config.lineContrast !== undefined ? config.lineContrast : 0.25;
        filter.lineWidth = config.lineWidth !== undefined ? config.lineWidth : 1;

        // Noise properties
        filter.noise = config.noise !== undefined ? config.noise : 0.3;
        filter.noiseSize = config.noiseSize !== undefined ? config.noiseSize : 0;
        filter.seed = config.seed !== undefined ? config.seed : 0;

        // Time property
        filter.time = config.time !== undefined ? config.time : 0.3;

        // Vignetting properties
        filter.vignetting = config.vignetting !== undefined ? config.vignetting : 0.3;
        filter.vignettingAlpha = config.vignettingAlpha !== undefined ? config.vignettingAlpha : 1;
        filter.vignettingBlur = config.vignettingBlur !== undefined ? config.vignettingBlur : 0.3;

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
            console.warn('Error releasing CRT filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}