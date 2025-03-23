import { ColorOverlayFilter } from 'pixi-filters';
import { type ColorOverlayFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a ColorOverlay filter that applies a color overlay to an object
 *
 * The ColorOverlayFilter applies a single color across the entire display object
 * with configurable alpha. It's useful for tinting images, creating color washes,
 * or applying color effects.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the ColorOverlay filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createColorOverlayFilter(config: ColorOverlayFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create a unique key for this filter configuration
    const colorHex = (config.color ?? 0xFF5500).toString(16);
    const shaderKey = `color-overlay-filter-${colorHex}`;

    // Create the filter with options
    const filter = new ColorOverlayFilter({
        color: config.color ?? 0xFF5500, // Use a default orange color
        alpha: config.alpha ?? 1         // Default alpha is 1 (fully opaque)
    });

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering color overlay filter with shader manager:', error);
    }

    // Make sure the color property is set correctly
    if (config.color !== undefined) {
        filter.color = config.color;
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
        if (config.primaryProperty === 'alpha') {
            // Map 0-10 to 0-1 range for alpha
            filter.alpha = normalizedIntensity / 10;
        }
        else if (config.primaryProperty === 'color') {
            // For color intensity, we'll adjust the alpha value
            // but keep the original color
            filter.alpha = normalizedIntensity / 10;

            // Make sure we maintain the original color
            if (config.color !== undefined) {
                filter.color = config.color;
            }
        }
        else {
            // Default behavior - adjust alpha
            filter.alpha = normalizedIntensity / 10;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset color to config value if provided, otherwise use default
        filter.color = config.color !== undefined ? config.color : 0xFF5500;

        // Reset alpha to config value if explicitly provided
        if (config.alpha !== undefined) {
            filter.alpha = config.alpha;
        } else if (config.intensity === undefined) {
            // Only set to 0 if neither alpha nor intensity were provided
            filter.alpha = 0;
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
            console.warn('Error releasing color overlay filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}