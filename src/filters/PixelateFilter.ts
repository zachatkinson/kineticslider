import { PixelateFilter } from 'pixi-filters';
import type { PixelateFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced PixelateFilter with intensity control
 * 
 * The PixelateFilter reduces the image resolution, making it appear pixelated or "8-bit" style.
 * The size parameter controls the size of the pixels, with larger values creating a more pixelated effect.
 * 
 * @param config - Configuration for the Pixelate filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const pixelateFilter = createPixelateFilter({
 *   type: 'pixelate',
 *   enabled: true,
 *   intensity: 7,
 *   size: 10,
 *   primaryProperty: 'size'
 * });
 * ```
 */
export function createPixelateFilter(config: PixelateFilterConfig): FilterResult {
    // Create options for the filter
    let size: number | [number, number] = config.size || 10;

    // If sizeX and sizeY are specified, use them instead
    if (config.sizeX !== undefined || config.sizeY !== undefined) {
        const x = config.sizeX ?? 10;
        const y = config.sizeY ?? 10;
        size = [x, y];
    }

    // Create the filter with the size option
    const filter = new PixelateFilter(size);

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Map intensity (0-10) to pixel size (1-30)
        // At intensity 0, we want minimal pixelation (pixel size of 1)
        // At intensity 10, we want maximum pixelation (pixel size of 30)
        const pixelSize = 1 + (normalizedIntensity * 2.9); // Maps 0-10 to 1-30

        // Determine which property to adjust based on config
        if (config.primaryProperty === 'sizeX') {
            // Apply to sizeX only when primaryProperty is sizeX
            filter.sizeX = pixelSize;
        }
        else if (config.primaryProperty === 'sizeY') {
            // Only adjust Y dimension, keep X at its configured value
            filter.sizeY = pixelSize;
        }
        else {
            // Default: adjust both dimensions equally
            filter.size = pixelSize;
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // If the original filter was configured with separate X and Y values
        if (config.sizeX !== undefined || config.sizeY !== undefined) {
            // Reset to the configured values or default of 10
            const x = config.sizeX !== undefined ? config.sizeX : 10;
            const y = config.sizeY !== undefined ? config.sizeY : 10;

            // Apply the values to the filter
            filter.sizeX = x;
            filter.sizeY = y;
        }
        // If size was provided as a single value
        else if (config.size !== undefined) {
            filter.size = config.size;
        }
        // No size configuration was provided
        else {
            // Reset to minimal pixelation (pixel size of 1)
            filter.size = 1;
        }

        // Apply intensity after restoring config values, if there's a primaryProperty
        if (config.intensity !== undefined && config.primaryProperty) {
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
    if (config.intensity !== undefined) {
        updateIntensity(config.intensity);
    }

    return { filter, config, updateIntensity, reset, dispose };
} 