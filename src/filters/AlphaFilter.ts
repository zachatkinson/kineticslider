import { AlphaFilter } from 'pixi.js';
import { createFilterIntensity } from '../types/filters';

/**
 * Configuration for the Alpha filter
 *
 * @example
 * ```typescript
 * const config: AlphaFilterConfig = {
 *   type: 'alpha',
 *   enabled: true,
 *   alpha: 0.5,
 *   intensity: 7
 * };
 * ```
 */
export interface AlphaFilterConfig {
    type: 'alpha';
    enabled: boolean;
    intensity?: number;
    alpha?: number;
}

/**
 * Creates an Alpha filter that applies transparency to the entire display object
 * 
 * This is recommended over Container's alpha property to avoid visual layering issues
 * with individual elements. AlphaFilter applies alpha evenly across the entire
 * display object and any opaque elements it contains.
 * 
 * @param config - Configuration for the Alpha filter
 *
 * @returns Object with filter instance and control functions
 *
 */
export function createAlphaFilter(config: AlphaFilterConfig): {
    filter: AlphaFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create the filter
    const filter = new AlphaFilter();
    
    // Store original configuration values
    const originalConfig = { ...config };

    /**
     * Update the filter's alpha intensity
     *
     * @param intensity
     *
     */
    const updateIntensity = (intensity: number): void => {
        const intensityValue = createFilterIntensity(intensity);
        
        // Base alpha calculation - lower intensity = more transparent
        const baseAlpha = originalConfig.alpha ?? 1.0;
        
        // Scale alpha based on intensity (0-10 maps to 0-1)
        filter.alpha = Math.max(0, Math.min(1, baseAlpha * (intensityValue / 10)));
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Check if alpha configuration was provided
        const hasAlphaConfig = originalConfig.alpha !== undefined;

        if (hasAlphaConfig) {
            // Reset to configured value
            const alphaValue = originalConfig.alpha;
            if (alphaValue !== undefined) {
                filter.alpha = alphaValue;
            }
            
            // Apply intensity when alpha config was provided
            if (originalConfig.intensity !== undefined) {
                updateIntensity(originalConfig.intensity);
            }
        } else {
            // Reset to default without applying intensity
            filter.alpha = 1.0; // Fully opaque by default
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

    // Set initial alpha value if configured (before applying intensity)
    if (config.alpha !== undefined) {
        filter.alpha = config.alpha;
    }

    // Apply initial intensity if provided, which will override the alpha with scaled value
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