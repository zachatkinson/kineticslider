import { ZoomBlurFilter } from 'pixi-filters';
import { type ZoomBlurFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a ZoomBlur filter that applies a radial blur effect
 *
 * The ZoomBlurFilter creates a zoom/radial blur effect that makes objects appear
 * as if they are zooming in or out from a center point.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the ZoomBlur filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createZoomBlurFilter(config: ZoomBlurFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.center !== undefined) options.center = config.center;
    if (config.centerX !== undefined) options.centerX = config.centerX;
    if (config.centerY !== undefined) options.centerY = config.centerY;
    if (config.innerRadius !== undefined) options.innerRadius = config.innerRadius;
    if (config.radius !== undefined) options.radius = config.radius;
    if (config.strength !== undefined) options.strength = config.strength;

    // Create a unique shader key based on configuration
    // Use innerRadius as it's the most significant parameter for shader compilation
    const innerRadiusStr = (options.innerRadius || 0).toString();
    const shaderKey = `zoom-blur-filter-${innerRadiusStr}`;

    // Create the filter with options
    const filter = new ZoomBlurFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering zoom blur filter with shader manager:', error);
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
                    // Map 0-10 to 0-1 for strength (0.1 is good default)
                    filter.strength = normalizedIntensity / 10;
                    break;
                case 'radius':
                    // Map 0-10 to different radius values
                    // At 0: small radius (100)
                    // At 5: larger radius (500)
                    // At 10: -1 (infinity)
                    if (normalizedIntensity >= 9.5) {
                        filter.radius = -1; // Infinite radius
                    } else {
                        filter.radius = 100 + (normalizedIntensity * 80);
                    }
                    break;
                case 'innerRadius':
                    // Map 0-10 to 0-200 for inner radius
                    filter.innerRadius = normalizedIntensity * 20;
                    break;
                case 'centerX':
                    // Map 0-10 to 0-1 for x position (0.5 is center)
                    filter.centerX = normalizedIntensity / 10;
                    break;
                case 'centerY':
                    // Map 0-10 to 0-1 for y position (0.5 is center)
                    filter.centerY = normalizedIntensity / 10;
                    break;
                case 'center':
                    // Move the center based on intensity
                    // For simplicity, move from left to right as intensity increases
                    const position = normalizedIntensity / 10; // 0-1 range
                    filter.centerX = position;
                    filter.centerY = 0.5; // Keep vertical center fixed
                    break;
                default:
                    // Default to strength adjustment
                    filter.strength = normalizedIntensity / 10;
            }
        } else {
            // Default behavior - adjust strength as it's the most visible parameter
            filter.strength = normalizedIntensity / 10;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Reset center coordinates - prioritize individual properties over point object
        if (config.centerX !== undefined) {
            filter.centerX = config.centerX;
        } else if (config.center?.x !== undefined) {
            filter.centerX = config.center.x;
        } else {
            filter.centerX = 0; // Default centerX
        }

        if (config.centerY !== undefined) {
            filter.centerY = config.centerY;
        } else if (config.center?.y !== undefined) {
            filter.centerY = config.center.y;
        } else {
            filter.centerY = 0; // Default centerY
        }

        // Reset inner radius to config value or default
        filter.innerRadius = config.innerRadius !== undefined ? config.innerRadius : 0;

        // Reset radius to config value or default
        filter.radius = config.radius !== undefined ? config.radius : -1;

        // Reset strength to config value or default
        filter.strength = config.strength !== undefined ? config.strength : 0.1;
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing zoom blur filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}