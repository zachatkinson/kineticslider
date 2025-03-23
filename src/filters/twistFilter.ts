import { TwistFilter } from 'pixi-filters';
import { type TwistFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Twist filter that applies a swirl/twist effect to an object
 *
 * The TwistFilter makes display objects appear twisted in the given direction,
 * creating a swirl effect from a defined center point.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Twist filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createTwistFilter(config: TwistFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.angle !== undefined) options.angle = config.angle;
    if (config.radius !== undefined) options.radius = config.radius;
    if (config.offset !== undefined) options.offset = config.offset;
    if (config.offsetX !== undefined) options.offsetX = config.offsetX;
    if (config.offsetY !== undefined) options.offsetY = config.offsetY;

    // Create a unique key for this filter configuration
    const shaderKey = 'twist-filter';

    // Create the filter with options
    const filter = new TwistFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering twist filter with shader manager:', error);
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
                    // Map 0-10 to 0-20 for angle
                    // At 0, no twist, at 10, strong twist
                    filter.angle = normalizedIntensity * 2;
                    break;
                case 'radius':
                    // Map 0-10 to 50-500 for radius
                    // Smaller radius = tighter twist
                    filter.radius = 50 + (normalizedIntensity * 45);
                    break;
                case 'center':
                    // This would adjust both offsetX and offsetY
                    // to move the center from one side to another
                    // For simplicity, we'll move diagonally from top-left to bottom-right
                    const position = normalizedIntensity / 10; // 0-1 range
                    filter.offsetX = position - 0.5; // -0.5 to 0.5 range
                    filter.offsetY = position - 0.5; // -0.5 to 0.5 range
                    break;
                case 'offsetX':
                    // Map 0-10 to -0.5 to 0.5 range for x offset
                    filter.offsetX = (normalizedIntensity / 10) - 0.5;
                    break;
                case 'offsetY':
                    // Map 0-10 to -0.5 to 0.5 range for y offset
                    filter.offsetY = (normalizedIntensity / 10) - 0.5;
                    break;
                default:
                    // Default to angle adjustment
                    filter.angle = normalizedIntensity * 2;
            }
        } else {
            // Default behavior - adjust angle
            filter.angle = normalizedIntensity * 2;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Reset angle to config value or default
        filter.angle = config.angle !== undefined ? config.angle : 4;

        // Reset radius to config value or default
        filter.radius = config.radius !== undefined ? config.radius : 200;

        // Handle offset coordinates - prioritize individual properties over point object
        if (config.offsetX !== undefined) {
            filter.offsetX = config.offsetX;
        } else if (config.offset?.x !== undefined) {
            filter.offsetX = config.offset.x;
        } else {
            filter.offsetX = 0; // Default offsetX
        }

        if (config.offsetY !== undefined) {
            filter.offsetY = config.offsetY;
        } else if (config.offset?.y !== undefined) {
            filter.offsetY = config.offset.y;
        } else {
            filter.offsetY = 0; // Default offsetY
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing twist filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}