import { BackdropBlurFilter } from 'pixi-filters';
import { type BackdropBlurFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a BackdropBlur filter that applies a Gaussian blur to everything behind an object,
 * and then draws the object on top of it.
 *
 * This filter is useful for creating depth effects where objects appear to have a blurred background
 * behind them, similar to a depth-of-field effect.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the BackdropBlur filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createBackdropBlurFilter(config: BackdropBlurFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create a unique key for this filter configuration
    const shaderKey = `backdrop-blur-filter-q${config.quality || 4}-k${config.kernelSize || 5}`;

    // Create the filter with options
    const filter = new BackdropBlurFilter({
        strength: config.intensity ? config.intensity * 10 : 8,
        quality: config.quality ?? 4,
        kernelSize: config.kernelSize ?? 5,
        resolution: config.resolution ?? 1
    });

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering backdrop blur filter with shader manager:', error);
    }

    // Set any additional properties if provided
    if (config.repeatEdgePixels !== undefined) {
        filter.repeatEdgePixels = config.repeatEdgePixels;
    }

    /**
     * Update the filter's blur intensity
     *
     * @param intensity - New intensity value (maps to blur strength)
     */
    const updateIntensity = (intensity: number): void => {
        // Map intensity to strength (0-10 scale to appropriate blur strength)
        // Blur strength can range from 0-100, so we multiply intensity by 10
        filter.strength = intensity * 10;
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset strength to config value if provided, otherwise use default
        const defaultStrength = config.intensity !== undefined ? config.intensity * 10 : 8;
        filter.strength = defaultStrength;

        // Reset quality if it was configured and property exists
        if (config.quality !== undefined && 'quality' in filter) {
            filter.quality = config.quality;
        }

        // Reset kernelSize if it was configured and property exists
        if (config.kernelSize !== undefined && 'kernelSize' in filter) {
            (filter as any).kernelSize = config.kernelSize;
        }

        // Reset resolution if it was configured and property exists
        if (config.resolution !== undefined && 'resolution' in filter) {
            (filter as any).resolution = config.resolution;
        }

        // Reset repeatEdgePixels if it was configured and property exists
        if (config.repeatEdgePixels !== undefined && 'repeatEdgePixels' in filter) {
            filter.repeatEdgePixels = config.repeatEdgePixels;
        }

        // If intensity was explicitly provided in config, use updateIntensity
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing backdrop blur filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}