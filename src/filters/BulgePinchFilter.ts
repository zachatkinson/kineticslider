import { BulgePinchFilter } from 'pixi-filters';
import type { BulgePinchFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced BulgePinchFilter with intensity control
 * 
 * The BulgePinchFilter applies a bulge or pinch distortion effect from a center point.
 * Positive strength values create a bulge, negative values create a pinch effect.
 * 
 * @param config - Configuration for the BulgePinch filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const bulgePinchFilter = createBulgePinchFilter({
 *   type: 'bulgePinch',
 *   enabled: true,
 *   intensity: 6,
 *   strength: 0.5,
 *   radius: 100,
 *   primaryProperty: 'strength'
 * });
 * ```
 */
export function createBulgePinchFilter(config: BulgePinchFilterConfig): FilterResult {
    // Set default values
    const strength = config.strength ?? 0.5;
    const radius = config.radius ?? 100;
    const centerX = config.centerX ?? config.center?.x ?? 0.5;
    const centerY = config.centerY ?? config.center?.y ?? 0.5;

    // Create the filter with initial configuration
    const filter = new BulgePinchFilter();

    // Apply initial configuration
    filter.strength = strength;
    filter.radius = radius;
    filter.center = [centerX, centerY];

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        if (config.primaryProperty === 'strength') {
            // Map intensity (0-10) to strength (-1 to 1)
            filter.strength = (normalizedIntensity - 5) / 5; // Creates range from -1 to 1
        }
        else if (config.primaryProperty === 'radius') {
            // Map intensity (0-10) to radius (20-200)
            filter.radius = 20 + (normalizedIntensity * 18); // Creates range from 20 to 200
        }
        else {
            // Default: adjust strength
            filter.strength = (normalizedIntensity - 5) / 5; // Creates range from -1 to 1
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.strength = config.strength ?? 0.5;
        filter.radius = config.radius ?? 100;
        
        const centerX = config.centerX ?? config.center?.x ?? 0.5;
        const centerY = config.centerY ?? config.center?.y ?? 0.5;
        filter.center = [centerX, centerY];

        // If intensity was provided in config, apply that
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        filter.destroy();
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    return { filter, updateIntensity, reset, dispose, config };
} 