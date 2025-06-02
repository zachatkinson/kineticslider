import { TwistFilter } from 'pixi-filters';
import type { TwistFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced TwistFilter with intensity control
 * 
 * The TwistFilter applies a twist distortion effect around a center point.
 * The angle parameter controls the intensity of the twist effect.
 * 
 * @param config - Configuration for the Twist filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const twistFilter = createTwistFilter({
 *   type: 'twist',
 *   enabled: true,
 *   intensity: 8,
 *   angle: 4,
 *   radius: 200,
 *   primaryProperty: 'angle'
 * });
 * ```
 */
export function createTwistFilter(config: TwistFilterConfig): FilterResult {
    // Set default values
    const angle = config.angle ?? 4;
    const radius = config.radius ?? 200;
    const offsetX = config.offsetX ?? 0;
    const offsetY = config.offsetY ?? 0;

    // Create the filter with initial configuration
    const filter = new TwistFilter();

    // Apply initial configuration
    filter.angle = angle;
    filter.radius = radius;
    filter.offsetX = offsetX;
    filter.offsetY = offsetY;

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
        if (config.primaryProperty === 'angle') {
            // Map intensity (0-10) to angle (-10 to 10)
            filter.angle = (normalizedIntensity - 5) * 2; // Creates range from -10 to 10
        }
        else if (config.primaryProperty === 'radius') {
            // Map intensity (0-10) to radius (50-500)
            filter.radius = 50 + (normalizedIntensity * 45); // Creates range from 50 to 500
        }
        else {
            // Default: adjust angle
            filter.angle = (normalizedIntensity - 5) * 2; // Creates range from -10 to 10
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.angle = config.angle ?? 4;
        filter.radius = config.radius ?? 200;
        filter.offsetX = config.offsetX ?? 0;
        filter.offsetY = config.offsetY ?? 0;

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