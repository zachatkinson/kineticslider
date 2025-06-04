import { ColorReplaceFilter } from 'pixi-filters';
import type { ColorReplaceFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced ColorReplaceFilter with modern PIXI properties
 * 
 * Replaces all instances of one color with another color, with configurable
 * tolerance/sensitivity. Uses modern PIXI properties (originalColor, targetColor, tolerance)
 * instead of deprecated properties (epsilon, newColor).
 * 
 * @param config - Configuration for the ColorReplace filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const colorReplaceFilter = createColorReplaceFilter({
 *   type: 'colorReplace',
 *   enabled: true,
 *   originalColor: 0xff0000,  // Red
 *   targetColor: 0x00ff00,    // Green  
 *   tolerance: 0.1,
 *   intensity: 5,
 *   primaryProperty: 'tolerance'
 * });
 * ```
 */
export function createColorReplaceFilter(config: ColorReplaceFilterConfig): FilterResult {
    // Set default values based on PIXI documentation
    const originalColor = config.originalColor ?? 0xff0000; // Default red
    const targetColor = config.targetColor ?? 0x000000;     // Default black
    const tolerance = config.tolerance ?? 0.4;               // Default tolerance
    
    // Create the filter with modern PIXI properties
    const filter = new ColorReplaceFilter({
        originalColor,
        targetColor,
        tolerance
    });

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Apply intensity to the primary property if defined
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'tolerance':
                    // Map intensity (0-10) to tolerance sensitivity
                    // Higher intensity = more sensitive (lower tolerance)
                    // Lower intensity = less sensitive (higher tolerance)
                    const baseTolerance = config.tolerance ?? 0.4;
                    const toleranceScale = 1 - (normalizedIntensity / 10); // Invert for sensitivity
                    filter.tolerance = baseTolerance * (0.1 + toleranceScale * 0.9); // Keep minimum 10% tolerance
                    break;
                
                case 'originalColor':
                case 'targetColor':
                    // For color properties, we can't easily map intensity to color changes
                    // So we'll fall back to tolerance adjustment
                    const colorBaseTolerance = config.tolerance ?? 0.4;
                    const colorToleranceScale = 1 - (normalizedIntensity / 10);
                    filter.tolerance = colorBaseTolerance * (0.1 + colorToleranceScale * 0.9);
                    break;
            }
        } else {
            // Default behavior: adjust tolerance sensitivity
            const defaultBaseTolerance = config.tolerance ?? 0.4;
            const defaultToleranceScale = 1 - (normalizedIntensity / 10);
            filter.tolerance = defaultBaseTolerance * (0.1 + defaultToleranceScale * 0.9);
        }
    };

    /**
     * Reset the filter to initial configuration values
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.originalColor = config.originalColor ?? 0xff0000;
        filter.targetColor = config.targetColor ?? 0x000000;
        filter.tolerance = config.tolerance ?? 0.4;

        // Apply intensity after restoring config values, if there's a primaryProperty
        if (config.intensity !== undefined && config.primaryProperty) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Get current filter state
     *
     * @returns Record containing current filter properties and state
     *
     */
    const getState = (): Record<string, unknown> => {
        return {
            originalColor: filter.originalColor,
            targetColor: filter.targetColor,
            tolerance: filter.tolerance,
            type: config.type,
            enabled: config.enabled,
            configuredOriginalColor: config.originalColor,
            configuredTargetColor: config.targetColor,
            configuredTolerance: config.tolerance
        };
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        filter.destroy();
    };

    // Apply initial intensity if provided and there's a primaryProperty
    if (config.primaryProperty || config.tolerance === undefined) {
        updateIntensity(config.intensity);
    }

    return { filter, updateIntensity, reset, dispose, getState, config };
} 