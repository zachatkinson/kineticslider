import { OutlineFilter } from 'pixi-filters';
import type { FilterResult, OutlineFilterConfig } from '../types/filters';

/**
 * Enhanced OutlineFilter with intensity control
 * 
 * The OutlineFilter draws an outline around the edges of the display object.
 * The thickness parameter controls the width of the outline.
 * 
 * @param config - Configuration for the Outline filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const outlineFilter = createOutlineFilter({
 *   type: 'outline',
 *   enabled: true,
 *   intensity: 7,
 *   thickness: 2,
 *   color: 0xff0000,
 *   primaryProperty: 'thickness'
 * });
 * ```
 */
export function createOutlineFilter(config: OutlineFilterConfig): FilterResult {
    // Set default values
    const thickness = config.thickness ?? 2;
    const color = config.color ?? 0x000000;
    const quality = config.quality ?? 0.1;
    const alpha = config.alpha ?? 1.0;
    const knockout = config.knockout ?? false;

    // Create the filter with initial configuration
    const filter = new OutlineFilter();

    // Apply initial configuration
    filter.thickness = thickness;
    filter.color = color;
    filter.quality = quality;
    filter.alpha = alpha;
    filter.knockout = knockout;

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
        if (config.primaryProperty === 'thickness') {
            // Map intensity (0-10) to thickness (0-10)
            filter.thickness = normalizedIntensity;
        }
        else if (config.primaryProperty === 'alpha') {
            // Map intensity (0-10) to alpha (0-1)
            filter.alpha = normalizedIntensity / 10;
        }
        else {
            // Default: adjust thickness
            filter.thickness = normalizedIntensity;
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.thickness = config.thickness ?? 2;
        filter.color = config.color ?? 0x000000;
        filter.quality = config.quality ?? 0.1;
        filter.alpha = config.alpha ?? 1.0;
        filter.knockout = config.knockout ?? false;

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