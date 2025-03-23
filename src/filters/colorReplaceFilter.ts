import { ColorReplaceFilter } from 'pixi-filters';
import { type ColorReplaceFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a ColorReplace filter that replaces a specific color with another color
 *
 * The ColorReplaceFilter replaces all instances of one color with another,
 * with a configurable tolerance/sensitivity level.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the ColorReplace filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createColorReplaceFilter(config: ColorReplaceFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {
        originalColor: config.originalColor ?? 0xff0000, // Default red
        targetColor: config.targetColor ?? 0x000000,     // Default black
        tolerance: config.tolerance ?? 0.4               // Default tolerance
    };

    // Create a unique key for this filter configuration
    const originalColorHex = options.originalColor.toString(16);
    const targetColorHex = options.targetColor.toString(16);
    const shaderKey = `color-replace-filter-${originalColorHex}-${targetColorHex}`;

    // Create the filter with options
    const filter = new ColorReplaceFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering color replace filter with shader manager:', error);
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
                case 'tolerance':
                    // Map 0-10 to a reasonable tolerance range (0-1)
                    // Lower values are more exact (less tolerance), higher values are more inclusive
                    filter.tolerance = normalizedIntensity / 10;
                    break;
                default:
                    // For other properties, we just adjust the tolerance as it's the main parameter
                    // that makes sense to control with intensity
                    filter.tolerance = normalizedIntensity / 10;
            }
        } else {
            // Default behavior - adjust tolerance
            filter.tolerance = normalizedIntensity / 10;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state
     */
    const reset = (): void => {
        // Reset tolerance to config value if provided, otherwise use default
        filter.tolerance = config.tolerance !== undefined ? config.tolerance : 0.4;

        // Reset original color to config value if provided
        if (config.originalColor !== undefined) {
            filter.originalColor = config.originalColor;
        }

        // Reset target color to config value if provided
        if (config.targetColor !== undefined) {
            filter.targetColor = config.targetColor;
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing color replace filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}