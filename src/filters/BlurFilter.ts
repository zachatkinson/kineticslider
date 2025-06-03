import { BlurFilter } from 'pixi.js';
import { createFilterIntensity } from '../types/filters';

/**
 * Configuration for the Blur filter
 *
 * @example
 * ```typescript
 * const config: BlurFilterConfig = {
 *   type: 'blur',
 *   enabled: true,
 *   strengthX: 10,
 *   strengthY: 10,
 *   intensity: 5
 * };
 * ```
 */
export interface BlurFilterConfig {
    type: 'blur';
    enabled: boolean;
    intensity?: number;
    strengthX?: number;
    strengthY?: number;
    quality?: number;
    kernelSize?: number;
    resolution?: number;
    repeatEdgePixels?: boolean;
}

/**
 * Creates a Blur filter that applies a Gaussian blur to an object
 * 
 * The strength of the blur can be set for the x-axis and y-axis separately.
 * 
 * @param config - Configuration for the Blur filter
 *
 * @returns Object with filter instance and control functions
 *
 */
export function createBlurFilter(config: BlurFilterConfig): {
    filter: BlurFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create the filter with basic options
    const filter = new BlurFilter({
        strength: 8, // Default strength, will be updated by intensity
        strengthX: config.strengthX,
        strengthY: config.strengthY,
        quality: config.quality ?? 4,
        kernelSize: config.kernelSize ?? 5,
        resolution: config.resolution ?? 1
    });

    // Set additional properties if provided
    if (config.repeatEdgePixels !== undefined) {
        filter.repeatEdgePixels = config.repeatEdgePixels;
    }

    // Store original configuration values
    const originalConfig = { ...config };

    /**
     * Update the filter's blur intensity
     *
     * @param intensity
     *
     */
    const updateIntensity = (intensity: number): void => {
        const intensityValue = createFilterIntensity(intensity);
        
        // Base strength calculation
        const baseStrength = 8;
        const strength = baseStrength + (intensityValue * 9.2); // Maps 0-10 to 8-100
        
        // Apply to main strength
        filter.strength = strength;
        
        // Apply to individual axes if configured
        if (originalConfig.strengthX !== undefined) {
            filter.strengthX = originalConfig.strengthX + (intensityValue * (originalConfig.strengthX * 0.5));
        } else {
            filter.strengthX = strength;
        }
        
        if (originalConfig.strengthY !== undefined) {
            filter.strengthY = originalConfig.strengthY + (intensityValue * (originalConfig.strengthY * 0.5));
        } else {
            filter.strengthY = strength;
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Check if any strength configuration was provided
        const hasStrengthConfig = originalConfig.strengthX !== undefined || 
                                 originalConfig.strengthY !== undefined;

        if (hasStrengthConfig) {
            // Reset to configured values
            filter.strengthX = originalConfig.strengthX ?? 8;
            filter.strengthY = originalConfig.strengthY ?? 8;
            filter.strength = Math.max(filter.strengthX, filter.strengthY);
            
            // Apply intensity when strength config was provided
            if (originalConfig.intensity !== undefined) {
                updateIntensity(originalConfig.intensity);
            }
        } else {
            // Reset to defaults without applying intensity
            filter.strength = 8;
            filter.strengthX = 8;
            filter.strengthY = 8;
        }
    };

    /**
     * Cleanup function
     */
    const dispose = (): void => {
        if (filter.destroy) {
            filter.destroy();
        }
    };

    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
        updateIntensity(config.intensity);
    }

    return {
        filter,
        updateIntensity,
        reset,
        dispose
    };
} 