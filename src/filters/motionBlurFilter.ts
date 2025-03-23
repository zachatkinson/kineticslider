import { MotionBlurFilter } from 'pixi-filters';
import { type MotionBlurFilterConfig, type FilterResult } from './types';
import type { PointData } from 'pixi.js';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a MotionBlur filter that applies a motion blur effect to an object
 *
 * The MotionBlurFilter creates blur in a specific direction simulating movement.
 * It has controls for velocity (direction and intensity of the effect) as well as
 * kernel size and offset parameters.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the MotionBlur filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createMotionBlurFilter(config: MotionBlurFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.kernelSize !== undefined) options.kernelSize = config.kernelSize;
    if (config.offset !== undefined) options.offset = config.offset;
    if (config.velocity !== undefined) options.velocity = config.velocity;
    if (config.velocityX !== undefined) options.velocityX = config.velocityX;
    if (config.velocityY !== undefined) options.velocityY = config.velocityY;

    // Create a unique key for this filter configuration
    const kernelSizeStr = (options.kernelSize || 5).toString();
    const shaderKey = `motion-blur-filter-${kernelSizeStr}`;

    // Create the filter with options
    const filter = new MotionBlurFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering motion blur filter with shader manager:', error);
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
                case 'velocity':
                    // If velocity is an object with x and y properties
                    if (config.direction) {
                        // Calculate velocity based on intensity and direction
                        const angle = config.direction * Math.PI / 180; // Convert degrees to radians
                        const velocityMagnitude = normalizedIntensity * 2; // Scale intensity to reasonable velocity

                        // Calculate x and y components
                        filter.velocityX = Math.cos(angle) * velocityMagnitude;
                        filter.velocityY = Math.sin(angle) * velocityMagnitude;
                    } else {
                        // Default to horizontal motion if no direction specified
                        filter.velocityX = normalizedIntensity * 2;
                        filter.velocityY = 0;
                    }
                    break;
                case 'velocityX':
                    // Map 0-10 to 0-20 range for a visible effect
                    filter.velocityX = normalizedIntensity * 2;
                    break;
                case 'velocityY':
                    // Map 0-10 to 0-20 range for a visible effect
                    filter.velocityY = normalizedIntensity * 2;
                    break;
                case 'kernelSize':
                    // Map 0-10 to 5-15 range (must be odd number >= 5)
                    // First multiply by 1, then add 5, then ensure it's an odd number
                    const rawSize = 5 + Math.floor(normalizedIntensity);
                    filter.kernelSize = rawSize % 2 === 0 ? rawSize + 1 : rawSize;
                    break;
                case 'offset':
                    // Map 0-10 to 0-10 range for offset
                    filter.offset = normalizedIntensity;
                    break;
                default:
                    // Default to adjusting velocityX
                    filter.velocityX = normalizedIntensity * 2;
            }
        } else {
            // Default behavior - use direction if specified or default to horizontal motion
            if (config.direction !== undefined) {
                // Calculate velocity based on intensity and direction
                const angle = config.direction * Math.PI / 180; // Convert degrees to radians
                const velocityMagnitude = normalizedIntensity * 2; // Scale intensity

                // Calculate x and y components
                filter.velocityX = Math.cos(angle) * velocityMagnitude;
                filter.velocityY = Math.sin(angle) * velocityMagnitude;
            } else {
                // Default to horizontal motion
                filter.velocityX = normalizedIntensity * 2;
                filter.velocityY = 0;
            }
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Reset kernel size to config value or default
        filter.kernelSize = config.kernelSize !== undefined ? config.kernelSize : 5;

        // Reset offset to config value or default
        filter.offset = config.offset !== undefined ? config.offset : 0;

        // Reset velocity - prioritize direct velocityX/Y settings over velocity object
        if (config.velocityX !== undefined) {
            filter.velocityX = config.velocityX;
        } else if (config.velocity?.x !== undefined) {
            filter.velocityX = config.velocity.x;
        } else {
            filter.velocityX = 0;
        }

        if (config.velocityY !== undefined) {
            filter.velocityY = config.velocityY;
        } else if (config.velocity?.y !== undefined) {
            filter.velocityY = config.velocity.y;
        } else {
            filter.velocityY = 0;
        }

        // If direction was specified but no velocities, calculate from direction
        if (config.direction !== undefined &&
            config.velocityX === undefined &&
            config.velocityY === undefined &&
            config.velocity === undefined) {
            const angle = config.direction * Math.PI / 180; // Convert degrees to radians
            const defaultVelocity = 0; // No velocity when reset
            filter.velocityX = Math.cos(angle) * defaultVelocity;
            filter.velocityY = Math.sin(angle) * defaultVelocity;
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing motion blur filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}