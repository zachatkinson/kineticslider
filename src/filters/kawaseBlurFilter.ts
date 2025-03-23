import { KawaseBlurFilter } from 'pixi-filters';
import { type KawaseBlurFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a KawaseBlur filter that applies a faster blur algorithm
 *
 * The KawaseBlurFilter is a much faster alternative to Gaussian blur,
 * but with slightly different visual characteristics.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the KawaseBlur filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createKawaseBlurFilter(config: KawaseBlurFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.clamp !== undefined) options.clamp = config.clamp;
    if (config.kernels !== undefined) options.kernels = config.kernels;
    if (config.pixelSize !== undefined) options.pixelSize = config.pixelSize;
    if (config.pixelSizeX !== undefined) options.pixelSizeX = config.pixelSizeX;
    if (config.pixelSizeY !== undefined) options.pixelSizeY = config.pixelSizeY;
    if (config.quality !== undefined) options.quality = config.quality;
    if (config.strength !== undefined) options.strength = config.strength;

    // Create a unique key for this filter configuration
    const qualityStr = (options.quality || 3).toString();
    const clampStr = options.clamp ? 'clamp' : 'noclamp';
    const shaderKey = `kawase-blur-filter-${qualityStr}-${clampStr}`;

    // Create the filter with options
    const filter = new KawaseBlurFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering kawase blur filter with shader manager:', error);
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
                case 'strength':
                    // Map 0-10 to 0-20 for strength (0 = no blur, 20 = very blurry)
                    filter.strength = normalizedIntensity * 2;
                    break;
                case 'quality':
                    // Map 0-10 to 1-10 for quality (higher = better quality but slower)
                    filter.quality = Math.max(1, Math.round(normalizedIntensity));
                    break;
                case 'pixelSize':
                    // Map 0-10 to 1-5 for pixelSize (impacts appearance of the blur)
                    const pixelSize = 1 + (normalizedIntensity / 2.5);
                    filter.pixelSize = { x: pixelSize, y: pixelSize };
                    break;
                default:
                    // Default to adjusting strength
                    filter.strength = normalizedIntensity * 2;
            }
        } else {
            // Default behavior - adjust strength (most intuitive parameter)
            filter.strength = normalizedIntensity * 2;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset kernels to config value or default
        filter.kernels = config.kernels !== undefined ? config.kernels : [0];

        // Reset pixelSize to config values or default
        if (config.pixelSize !== undefined) {
            filter.pixelSize = config.pixelSize;
        } else if (config.pixelSizeX !== undefined || config.pixelSizeY !== undefined) {
            // If individual components were provided
            const x = config.pixelSizeX !== undefined ? config.pixelSizeX : 1;
            const y = config.pixelSizeY !== undefined ? config.pixelSizeY : 1;
            filter.pixelSize = { x, y };
        } else {
            // Default value
            filter.pixelSize = { x: 1, y: 1 };
        }

        // Reset quality to config value or default
        filter.quality = config.quality !== undefined ? config.quality : 3;

        // Reset strength to config value or default
        filter.strength = config.strength !== undefined ? config.strength : 4;

        // If intensity was provided, use updateIntensity to reset properly
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
            console.warn('Error releasing kawase blur filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}