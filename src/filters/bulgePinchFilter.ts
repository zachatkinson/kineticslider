import { BulgePinchFilter } from 'pixi-filters';
import { type BulgePinchFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a BulgePinch filter that applies a bulge or pinch effect in a circle
 *
 * The BulgePinchFilter creates either a bulge (magnifying glass) effect or
 * a pinch effect within a circular area of the image.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the BulgePinch filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createBulgePinchFilter(config: BulgePinchFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {
        radius: config.radius ?? 100,
        strength: config.strength ?? 1,
    };

    // Handle center coordinates
    if (config.center) {
        options.center = config.center;
    } else {
        options.center = { x: 0.5, y: 0.5 }; // Default center (middle of the screen)
    }

    // Create a unique key for this filter configuration
    const centerX = options.center.x.toFixed(2);
    const centerY = options.center.y.toFixed(2);
    const shaderKey = `bulge-pinch-filter-r${options.radius}-s${options.strength}-c${centerX},${centerY}`;

    // Create the filter with options
    const filter = new BulgePinchFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering bulge pinch filter with shader manager:', error);
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
                    // Map 0-10 to -1 to 1 range if specified to include pinch effect
                    if (config.allowPinch) {
                        // Map 0-10 to -1 to 1 (0-5 is pinch, 5-10 is bulge)
                        filter.strength = (normalizedIntensity - 5) / 5;
                    } else {
                        // Map 0-10 to 0-1 (only bulge effect)
                        filter.strength = normalizedIntensity / 10;
                    }
                    break;
                case 'radius':
                    // Map 0-10 to 10-200 radius range
                    filter.radius = 10 + (normalizedIntensity * 19); // 10-200 range
                    break;
                case 'centerX':
                    // Map 0-10 to 0-1 for x position
                    filter.center.x = normalizedIntensity / 10;
                    break;
                case 'centerY':
                    // Map 0-10 to 0-1 for y position
                    filter.center.y = normalizedIntensity / 10;
                    break;
                default:
                    // Default to strength adjustment
                    if (config.allowPinch) {
                        filter.strength = (normalizedIntensity - 5) / 5;
                    } else {
                        filter.strength = normalizedIntensity / 10;
                    }
            }
        } else {
            // Default behavior - adjust strength
            if (config.allowPinch) {
                filter.strength = (normalizedIntensity - 5) / 5;
            } else {
                filter.strength = normalizedIntensity / 10;
            }
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset center to config value if provided, otherwise use default
        if (config.center !== undefined) {
            filter.center = config.center;
        } else {
            filter.center = { x: 0.5, y: 0.5 };
        }

        // Reset radius to config value if provided, otherwise use default
        filter.radius = config.radius !== undefined ? config.radius : 100;

        // Reset strength to config value if provided, otherwise use default
        // If no strength was provided but intensity was, we'll handle that with updateIntensity
        if (config.strength !== undefined) {
            filter.strength = config.strength;
        } else if (config.intensity === undefined) {
            // Only set to 0 if neither strength nor intensity were provided
            filter.strength = 0;
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
            console.warn('Error releasing bulge pinch filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}