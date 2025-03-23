import { BlurFilter } from 'pixi.js';
import { type BlurFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

// Get the shader manager singleton
const shaderManager = ShaderResourceManager.getInstance();

/**
 * Creates a Blur filter that applies a Gaussian blur to an object
 *
 * The strength of the blur can be set for the x-axis and y-axis separately.
 * This implementation uses shader pooling for better performance.
 *
 * @param config - Configuration for the Blur filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createBlurFilter(config: BlurFilterConfig): FilterResult {
    // Create the filter with options
    const filter = new BlurFilter({
        strength: config.intensity ? config.intensity * 10 : 8,
        strengthX: config.strengthX ? config.strengthX * 10 : undefined,
        strengthY: config.strengthY ? config.strengthY * 10 : undefined,
        quality: config.quality ?? 4,
        kernelSize: config.kernelSize ?? 5,
        resolution: config.resolution ?? 1
    });

    // Set any additional properties if provided
    if (config.strengthX !== undefined) {
        filter.strengthX = config.strengthX;
    }

    if (config.strengthY !== undefined) {
        filter.strengthY = config.strengthY;
    }

    if (config.repeatEdgePixels !== undefined) {
        filter.repeatEdgePixels = config.repeatEdgePixels;
    }

    // Generate a unique key for this filter configuration
    const shaderKey = `blur-${config.quality || 4}-${config.kernelSize || 5}-${config.resolution || 1}`;

    // Register with shader manager for tracking
    try {
        shaderManager.getShaderProgram(shaderKey, filter);
    } catch (error) {
        console.warn('Failed to register blur filter with shader manager:', error);
    }

    /**
     * Update the filter's blur intensity
     *
     * @param intensity - New intensity value (maps to blur strength)
     */
    const updateIntensity = (intensity: number): void => {
        // Map intensity to strength (0-10 scale to appropriate blur strength)
        // Blur strength can range from 0-100, so we multiply intensity by 10.
        filter.strength = intensity * 10;
        filter.strengthX = config.strengthX ? config.strengthX * 10 : filter.strength;
        filter.strengthY = config.strengthY ? config.strengthY * 10 : filter.strength;
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state
     */
    const reset = (): void => {
        filter.strength = 0;
        filter.strengthX = 0;
        filter.strengthY = 0;
    };

    /**
     * Cleanup function to release shader when filter is no longer used
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseShader(shaderKey);
        } catch (error) {
            console.warn('Failed to release blur filter shader:', error);
        }

        if (filter.destroy) {
            filter.destroy();
        }
    };

    // Create a properly typed FilterResult object
    const result: FilterResult = {
        filter,
        updateIntensity,
        reset,
        dispose
    };
    return result;
}