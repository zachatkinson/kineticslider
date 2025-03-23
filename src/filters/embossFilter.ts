// src/components/KineticSlider/filters/embossFilter.ts

import { EmbossFilter } from 'pixi-filters';
import { type EmbossFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates an Emboss filter that applies an emboss/relief effect to an object
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Emboss filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createEmbossFilter(config: EmbossFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create a unique key for this filter configuration
    const shaderKey = `emboss-filter-${config.strength || 5}`;

    // Create the filter with specified strength or default
    const filter = new EmbossFilter(config.strength);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering emboss filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Map the 0-10 intensity scale to appropriate strength values (0-20)
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));
        filter.strength = normalizedIntensity * 2; // 0-10 -> 0-20
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state
     */
    const reset = (): void => {
        // Reset strength to config value if provided, otherwise use default
        filter.strength = config.strength !== undefined ? config.strength : 5;
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing emboss filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}