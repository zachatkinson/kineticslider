import { EmbossFilter } from 'pixi-filters';
import type { EmbossFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced EmbossFilter with intensity control
 * 
 * The EmbossFilter creates an embossed effect on the display object.
 * The strength parameter controls how pronounced the emboss effect is.
 * 
 * @param config - Configuration for the Emboss filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const embossFilter = createEmbossFilter({
 *   type: 'emboss',
 *   enabled: true,
 *   intensity: 7,
 *   strength: 5,
 *   primaryProperty: 'strength'
 * });
 * ```
 */
export function createEmbossFilter(config: EmbossFilterConfig): FilterResult {
    // Set default values
    const strength = config.strength ?? 5;

    // Create the filter with initial configuration
    const filter = new EmbossFilter();

    // Apply initial configuration
    filter.strength = strength;

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Map intensity (0-10) to strength (0-20)
        filter.strength = normalizedIntensity * 2; // Creates range from 0 to 20
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.strength = config.strength ?? 5;

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