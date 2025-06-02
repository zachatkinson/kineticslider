import { ColorMatrixFilter } from 'pixi.js';
import type { ColorMatrixFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced ColorMatrixFilter with intensity control
 * 
 * The ColorMatrixFilter applies a color matrix transformation to the display object.
 * This filter can be used for various color effects like sepia, grayscale, etc.
 * 
 * @param config - Configuration for the ColorMatrix filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const colorMatrixFilter = createColorMatrixFilter({
 *   type: 'colorMatrix',
 *   enabled: true,
 *   intensity: 8,
 *   alpha: 1.0,
 *   primaryProperty: 'alpha'
 * });
 * ```
 */
export function createColorMatrixFilter(config: ColorMatrixFilterConfig): FilterResult {
    // Set default values
    const alpha = config.alpha ?? 1.0;
    const matrix = config.matrix ?? null;

    // Create the filter with initial configuration
    const filter = new ColorMatrixFilter();

    // Apply initial configuration
    filter.alpha = alpha;
    if (matrix && matrix.length >= 16) {
        // PIXI ColorMatrixFilter expects a ColorMatrix (tuple with at least 16 elements)
        // TypeScript doesn't know that our number[] has enough elements, so we cast
        (filter as { matrix: number[] }).matrix = matrix;
    }

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Only apply intensity if there's a primaryProperty defined
        if (config.primaryProperty === 'alpha') {
            // Map intensity (0-10) to alpha (0-1)
            filter.alpha = normalizedIntensity / 10;
        }
        // If no primaryProperty is set and no alpha was configured, apply default intensity behavior
        else if (!config.primaryProperty && config.alpha === undefined) {
            // Default: apply alpha intensity when no specific alpha value was configured
            filter.alpha = normalizedIntensity / 10;
        }
        // If no primaryProperty but alpha was configured, don't override the configured value
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.alpha = config.alpha ?? 1.0;
        
        if (config.matrix && config.matrix.length >= 16) {
            (filter as { matrix: number[] }).matrix = config.matrix;
        } else {
            filter.reset(); // Reset to identity matrix
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

    // Apply initial intensity only if there's a primaryProperty or no alpha was configured
    if (config.primaryProperty || config.alpha === undefined) {
        updateIntensity(config.intensity);
    }

    return { filter, updateIntensity, reset, dispose, config };
} 