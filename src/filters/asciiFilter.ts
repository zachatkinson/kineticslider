// src/components/KineticSlider/filters/asciiFilter.ts

import { AsciiFilter } from 'pixi-filters';
import { type AsciiFilterConfig, type FilterResult } from './types';
import type { ColorSource } from "pixi.js";
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates an AsciiFilter that renders the image as ASCII characters
 *
 * The AsciiFilter applies an ASCII art effect to the rendered object.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the ASCII filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createAsciiFilter(config: AsciiFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create a unique key for this filter configuration
    const colorKey = config.color ? JSON.stringify(config.color) : 'default';
    const shaderKey = `ascii-filter-${config.size || 8}-${colorKey}-${config.replaceColor || false}`;

    // Create the filter with basic options
    const filter = new AsciiFilter();

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering ASCII filter with shader manager:', error);
    }

    // Store config values for consistent use
    const configSize = config.size !== undefined ? config.size : 8;
    const configColor: ColorSource | undefined = config.color;
    const configReplaceColor: boolean | undefined = config.replaceColor;

    // Initialize filter state
    let isFirstActivation = true;
    let pendingTimeout: number | null = null;

    // Initialize with minimal settings first
    filter.size = configSize;

    if (configColor !== undefined) {
        filter.color = configColor;
    }

    // Start with replaceColor set to false, ensuring proper initial rendering
    filter.replaceColor = false;

    console.log('AsciiFilter created with initial properties:', {
        size: filter.size,
        color: filter.color,
        replaceColor: filter.replaceColor
    });

    /**
     * Force a complete refresh of the filter to ensure proper state
     */
    const forceRefresh = (intensity: number): void => {
        // Clear any pending timeout to avoid race conditions
        if (pendingTimeout !== null) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
        }

        // Ensure size is correct
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));
        filter.size  = Math.max(2, Math.round(2 + (normalizedIntensity * 1.8)));

        // Ensure color is correct
        if (configColor !== undefined) {
            filter.color = configColor;
        }

        // Temporarily set replaceColor to false (if it should be true)
        if (configReplaceColor === true) {
            filter.replaceColor = false;

            // Then set a timeout to set it to true after the next render
            pendingTimeout = window.setTimeout(() => {
                filter.replaceColor = true;
                pendingTimeout = null;
                console.log('AsciiFilter replaceColor applied after refresh');
            }, 50);
        } else if (configReplaceColor !== undefined) {
            filter.replaceColor = configReplaceColor;
        }
    };

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // For first activation, force a complete refresh
        if (isFirstActivation) {
            console.log('First activation of AsciiFilter - forcing complete refresh');
            forceRefresh(intensity);
            isFirstActivation = false;
        } else {
            // Standard intensity update
            const normalizedIntensity = Math.max(0, Math.min(10, intensity));
            filter.size = Math.max(2, Math.round(2 + (normalizedIntensity * 1.8)));


            // Ensure color is maintained
            if (configColor !== undefined) {
                filter.color = configColor;
            }

            // Ensure replaceColor is maintained
            if (configReplaceColor !== undefined) {
                filter.replaceColor = configReplaceColor;
            }
        }

        //console.log(`AsciiFilter intensity updated: ${intensity} → size: ${size ?? filter.size} (larger = chunkier ASCII)`);
    };

    /**
     * Reset the filter to defaults or config values
     */
    const reset = (): void => {
        // Clear any pending timeout
        if (pendingTimeout !== null) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
        }

        // Reset properties
        filter.size = configSize;

        if (configColor !== undefined) {
            filter.color = configColor;
        } else {
            filter.color = 0xffffff;
        }

        // For replaceColor, follow our special pattern
        if (configReplaceColor === true) {
            isFirstActivation = true; // Force the refresh process on next update
            filter.replaceColor = false; // Start with false
        } else if (configReplaceColor !== undefined) {
            filter.replaceColor = configReplaceColor;
        } else {
            filter.replaceColor = false;
        }

        console.log('AsciiFilter reset to initial state');
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        // Clear any pending timeout
        if (pendingTimeout !== null) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
        }

        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing ASCII filter shader:', error);
        }
        filter.destroy();
    };

    // No initial updateIntensity call here - wait for first active call

    return { filter, updateIntensity, reset, dispose };
}