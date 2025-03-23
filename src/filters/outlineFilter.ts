// src/components/KineticSlider/filters/outlineFilter.ts
import { OutlineFilter } from 'pixi-filters';
import { type OutlineFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates an Outline filter that adds a colored outline around objects
 *
 * The OutlineFilter draws a customizable outline around the edges of objects,
 * with configurable thickness, color, and quality settings.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Outline filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createOutlineFilter(config: OutlineFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.thickness !== undefined) options.thickness = config.thickness;
    if (config.color !== undefined) options.color = config.color;
    if (config.quality !== undefined) options.quality = config.quality;
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.knockout !== undefined) options.knockout = config.knockout;

    // Create a unique key for this filter configuration
    // Quality is the most significant parameter for shader compilation
    const qualityStr = (options.quality || 0.1).toString();
    const knockoutStr = options.knockout ? 'ko' : 'noko';
    const colorHex = (options.color || 0x000000).toString(16);
    const shaderKey = `outline-filter-${qualityStr}-${knockoutStr}-${colorHex}`;

    // Create the filter with options
    const filter = new OutlineFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering outline filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'thickness':
                    // Map 0-10 to 0-20 for thickness (0 = no outline, 20 = very thick)
                    filter.thickness = normalizedIntensity * 2;
                    break;
                case 'alpha':
                    // Map 0-10 to 0-1 for alpha
                    filter.alpha = normalizedIntensity / 10;
                    break;
                case 'quality':
                    // Map 0-10 to 0-1 for quality
                    filter.quality = normalizedIntensity / 10;
                    break;
                default:
                    // Default to adjusting thickness
                    filter.thickness = normalizedIntensity * 2;
            }
        } else {
            // Default behavior - adjust thickness
            filter.thickness = normalizedIntensity * 2;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state
     */
    const reset = (): void => {
        // Reset using config values if provided, otherwise use defaults
        filter.thickness = config.thickness !== undefined ? config.thickness : 1;
        filter.color = config.color !== undefined ? config.color : 0x000000;
        filter.quality = config.quality !== undefined ? config.quality : 0.1;
        filter.alpha = config.alpha !== undefined ? config.alpha : 1;
        filter.knockout = config.knockout !== undefined ? config.knockout : false;
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing outline filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}