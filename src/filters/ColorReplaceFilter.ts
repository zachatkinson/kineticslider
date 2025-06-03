import { ColorReplaceFilter } from 'pixi-filters';
import { createFilterIntensity } from '../types/filters';

/**
 * Configuration for the ColorReplace filter
 *
 * @example
 * ```typescript
 * const config: ColorReplaceFilterConfig = {
 *   type: 'colorReplace',
 *   enabled: true,
 *   originalColor: 0xff0000,
 *   newColor: 0x00ff00,
 *   tolerance: 0.1,
 *   intensity: 5
 * };
 * ```
 */
export interface ColorReplaceFilterConfig {
    type: 'colorReplace';
    enabled: boolean;
    intensity?: number;
    originalColor?: number;
    targetColor?: number;
    tolerance?: number;
}

/**
 * Creates a ColorReplace filter that replaces a specific color with another color
 * 
 * The ColorReplaceFilter replaces all instances of one color with another,
 * with a configurable tolerance/sensitivity level.
 * 
 * @param config - Configuration for the ColorReplace filter
 *
 * @returns Object with filter instance and control functions  
 *
 */
export function createColorReplaceFilter(config: ColorReplaceFilterConfig): {
    filter: ColorReplaceFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create the filter with options
    const filter = new ColorReplaceFilter({
        originalColor: config.originalColor ?? 0xff0000, // Default red
        targetColor: config.targetColor ?? 0x000000,     // Default black
        tolerance: config.tolerance ?? 0.4               // Default tolerance
    });
    
    // Store original configuration values
    const originalConfig = { ...config };

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity
     *
     */
    const updateIntensity = (intensity: number): void => {
        const intensityValue = createFilterIntensity(intensity);
        
        // Scale tolerance based on intensity 
        // Higher intensity = more sensitive (lower tolerance)
        // Lower intensity = less sensitive (higher tolerance)
        const baseTolerance = originalConfig.tolerance ?? 0.4;
        const toleranceScale = 1 - (intensityValue / 10); // Invert for sensitivity
        filter.tolerance = baseTolerance * (0.1 + toleranceScale * 0.9); // Keep minimum 10% tolerance
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Check if tolerance configuration was provided
        const hasToleranceConfig = originalConfig.tolerance !== undefined;

        if (hasToleranceConfig) {
            // Reset to configured values
            const toleranceValue = originalConfig.tolerance;
            if (toleranceValue !== undefined) {
                filter.tolerance = toleranceValue;
            }
            
            // Reset colors to configured values
            if (originalConfig.originalColor !== undefined) {
                filter.originalColor = originalConfig.originalColor;
            }
            
            if (originalConfig.targetColor !== undefined) {
                filter.targetColor = originalConfig.targetColor;
            }
            
            // Apply intensity when tolerance config was provided
            if (originalConfig.intensity !== undefined) {
                updateIntensity(originalConfig.intensity);
            }
        } else {
            // Reset to defaults without applying intensity
            filter.tolerance = 0.4;
            filter.originalColor = originalConfig.originalColor ?? 0xff0000;
            filter.targetColor = originalConfig.targetColor ?? 0x000000;
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