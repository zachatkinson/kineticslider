import { GrayscaleFilter } from 'pixi-filters';
import { createFilterIntensity } from '../types/filters';

/**
 * Configuration for the Grayscale filter
 *
 * @example
 * ```typescript
 * const config: GrayscaleFilterConfig = {
 *   type: 'grayscale',
 *   enabled: true,
 *   intensity: 8
 * };
 * ```
 */
export interface GrayscaleFilterConfig {
    type: 'grayscale';
    enabled: boolean;
    intensity?: number;
}

/**
 * Creates a Grayscale filter that converts the image to grayscale
 * 
 * The GrayscaleFilter removes all color information, resulting in a black and white image.
 * Since this filter doesn't have configurable parameters, intensity acts as an on/off switch.
 * 
 * @param config - Configuration for the Grayscale filter  
 *
 * @returns Object with filter instance and control functions
 *
 */
export function createGrayscaleFilter(config: GrayscaleFilterConfig): {
    filter: GrayscaleFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create the filter - GrayscaleFilter has no constructor parameters
    const filter = new GrayscaleFilter();
    
    // Store original configuration values
    const originalConfig = { ...config };

    // Set initial enabled state based on config
    filter.enabled = config.enabled;

    /**
     * Update the filter's intensity
     * Since GrayscaleFilter doesn't have configurable intensity,
     * we treat intensity as a scaling factor by manipulating the filter's enabled state
     * or blending the effect.
     *
     * @param intensity
     *
     */
    const updateIntensity = (intensity: number): void => {
        const intensityValue = createFilterIntensity(intensity);
        
        // For grayscale, we can use the filter's alpha property to blend the effect
        // when intensity is lower than maximum
        if ('alpha' in filter) {
            (filter as GrayscaleFilter & { alpha: number }).alpha = intensityValue / 10;
        }
        
        // Only enable/disable based on intensity if the original config enabled it
        // If originally disabled, respect that setting
        if (originalConfig.enabled) {
            filter.enabled = intensityValue > 0;
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to enabled state based on initial configuration
        filter.enabled = originalConfig.enabled;
        
        // Reset alpha blending if available
        if ('alpha' in filter) {
            (filter as GrayscaleFilter & { alpha: number }).alpha = 1.0;
        }
        
        // Apply initial intensity if provided
        if (originalConfig.intensity !== undefined) {
            updateIntensity(originalConfig.intensity);
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

    // Apply initial intensity if provided (but only if filter is originally enabled)
    if (config.intensity !== undefined && config.enabled) {
        updateIntensity(config.intensity);
    }

    return {
        filter,
        updateIntensity,
        reset,
        dispose
    };
} 