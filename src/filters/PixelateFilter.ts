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
        // Check if any size configuration was provided
        const hasSizeConfig = config.sizeX !== undefined || 
                             config.sizeY !== undefined || 
                             config.size !== undefined;

        if (hasSizeConfig) {
            // Reset to configured values
            if (config.sizeX !== undefined || config.sizeY !== undefined) {
                filter.sizeX = config.sizeX ?? 1;
                filter.sizeY = config.sizeY ?? 1;
            } else if (config.size !== undefined) {
                filter.size = config.size;
            }
            
            // Apply intensity when size config was provided
            if (config.intensity !== undefined) {
                updateIntensity(config.intensity);
            }
        } else {
            // No size config provided - reset to defaults WITHOUT applying intensity
            filter.size = 1;
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
        updateIntensity(config.intensity as number);
    }

    return { filter, config, updateIntensity, reset, dispose };
} 