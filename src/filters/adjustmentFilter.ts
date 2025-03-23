import { AdjustmentFilter } from 'pixi-filters';
import { type AdjustmentFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates an Adjustment filter that allows controlling gamma, contrast, saturation, brightness,
 * alpha and color-channel shifts without using a matrix
 *
 * This filter is faster and simpler than ColorMatrixFilter as it doesn't use a matrix.
 * It provides direct control over common image adjustments.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Adjustment filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createAdjustmentFilter(config: AdjustmentFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create the filter with options
    const options: any = {
        gamma: config.gamma ?? 1,
        contrast: config.contrast ?? 1,
        saturation: config.saturation ?? 1,
        brightness: config.brightness ?? 1,
        red: config.red ?? 1,
        green: config.green ?? 1,
        blue: config.blue ?? 1,
        alpha: config.alpha ?? 1
    };

    // Create a unique key for this filter configuration
    const shaderKey = `adjustment-filter-${config.primaryProperty || 'default'}`;

    // Create the filter with options
    const filter = new AdjustmentFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering adjustment filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration
     * For AdjustmentFilter, intensity modifies the primary property specified in config
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        // If primaryProperty is specified, use that, otherwise use a default behavior
        if (config.primaryProperty) {
            // Map intensity (0-10) to appropriate range for the specified property
            // Most properties work well around 0-2 range, with 1 being neutral
            let value: number;

            switch (config.primaryProperty) {
                case 'contrast':
                case 'saturation':
                    // For contrast and saturation, 0 is no effect (grayscale for saturation),
                    // 1 is normal, and values > 1 increase the effect
                    value = normalizedIntensity / 5; // 0-10 -> 0-2
                    break;
                case 'brightness':
                    // Brightness: 0 is black, 1 is normal, >1 is brighter
                    value = normalizedIntensity / 5; // 0-10 -> 0-2
                    break;
                case 'gamma':
                    // Gamma: 0-1 darkens, 1 is normal, >1 lightens
                    value = normalizedIntensity / 5; // 0-10 -> 0-2
                    break;
                case 'red':
                case 'green':
                case 'blue':
                    // Color channels: 0 removes the channel, 1 is normal, >1 intensifies
                    value = normalizedIntensity / 5; // 0-10 -> 0-2
                    break;
                case 'alpha':
                    // Alpha: 0 is transparent, 1 is fully opaque
                    value = normalizedIntensity / 10; // 0-10 -> 0-1
                    break;
                default:
                    // Default fallback
                    value = normalizedIntensity / 5; // 0-10 -> 0-2
            }

            // Apply the value to the specified property
            (filter as any)[config.primaryProperty] = value;
        } else {
            // Default behavior if no primary property is specified:
            // Increase contrast as intensity increases (common use case)
            filter.contrast = normalizedIntensity / 5; // 0-10 -> 0-2
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state (neutral values)
     */
    const reset = (): void => {
        filter.gamma = 1;
        filter.contrast = 1;
        filter.saturation = 1;
        filter.brightness = 1;
        filter.red = 1;
        filter.green = 1;
        filter.blue = 1;
        filter.alpha = 1;
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing adjustment filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}