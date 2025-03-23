import { RadialBlurFilter } from 'pixi-filters';
import { type RadialBlurFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a RadialBlur filter that applies a radial motion blur to an object
 *
 * The RadialBlurFilter creates a circular/radial blur effect, with controllable
 * center position, angle, and radius settings.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the RadialBlur filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createRadialBlurFilter(config: RadialBlurFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.angle !== undefined) options.angle = config.angle;
    if (config.center !== undefined) options.center = config.center;
    if (config.centerX !== undefined) options.centerX = config.centerX;
    if (config.centerY !== undefined) options.centerY = config.centerY;
    if (config.kernelSize !== undefined) options.kernelSize = config.kernelSize;
    if (config.radius !== undefined) options.radius = config.radius;

    // Create a unique key for this filter configuration
    // The kernel size is the most significant parameter that affects the shader compilation
    const kernelSizeStr = (options.kernelSize || 5).toString();
    const shaderKey = `radial-blur-filter-${kernelSizeStr}`;

    // Create the filter with options
    const filter = new RadialBlurFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering radial blur filter with shader manager:', error);
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
                    // Map 0-10 to 0-360 degrees for angle
                    filter.angle = normalizedIntensity * 36; // 0-10 → 0-360
                    break;
                case 'radius':
                    // Map 0-10 to 0-100 for radius (or -1 for infinity)
                    // Use -1 (infinity) if intensity is at maximum
                    filter.radius = normalizedIntensity === 10 ? -1 : normalizedIntensity * 10;
                    break;
                case 'kernelSize':
                    // Map 0-10 to 3-21 for kernelSize (odd numbers only)
                    // Start with 3, then add 2 for each intensity unit
                    const kernelBase = 3;
                    const kernelStep = Math.floor(normalizedIntensity);
                    filter.kernelSize = kernelBase + (kernelStep * 2);
                    break;
                case 'centerX':
                    // Map 0-10 to -0.5 to 0.5 for centerX offset
                    // (0 = center, negative = left, positive = right)
                    filter.centerX = (normalizedIntensity - 5) / 10;
                    break;
                case 'centerY':
                    // Map 0-10 to -0.5 to 0.5 for centerY offset
                    // (0 = center, negative = top, positive = bottom)
                    filter.centerY = (normalizedIntensity - 5) / 10;
                    break;
                default:
                    // Default to angle adjustment
                    filter.angle = normalizedIntensity * 36; // 0-10 → 0-360
            }
        } else {
            // Default behavior - adjust angle and radius together for more dramatic effect
            filter.angle = normalizedIntensity * 36; // 0-10 → 0-360

            // Only use infinite radius for max intensity
            if (normalizedIntensity >= 9.5) {
                filter.radius = -1; // Infinite radius
            } else {
                // Otherwise scale radius proportionally
                filter.radius = normalizedIntensity * 10;
            }
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Reset to configured values or defaults if not specified
        filter.angle = config.angle !== undefined ? config.angle : 0;

        // Handle center coordinates
        if (config.center !== undefined) {
            // If center object was provided, use that
            filter.center = config.center;
        } else {
            // Otherwise use individual centerX/centerY if provided
            filter.centerX = config.centerX !== undefined ? config.centerX : 0;
            filter.centerY = config.centerY !== undefined ? config.centerY : 0;
        }

        // Reset kernel size and radius
        filter.kernelSize = config.kernelSize !== undefined ? config.kernelSize : 5;
        filter.radius = config.radius !== undefined ? config.radius : -1;
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing radial blur filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}