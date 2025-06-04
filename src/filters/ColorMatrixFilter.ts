import { ColorMatrixFilter } from 'pixi.js';
import type { ColorMatrixFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced ColorMatrixFilter with modern PIXI 8 methods
 * 
 * Uses PIXI 8's built-in color matrix methods for brightness, contrast, 
 * saturation, hue, and other color adjustments instead of manual matrix manipulation.
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
 *   brightness: 1.2,
 *   contrast: 1.1,
 *   saturation: 1.3,
 *   hue: 15,
 *   intensity: 8,
 *   primaryProperty: 'brightness'
 * });
 * ```
 */
export function createColorMatrixFilter(config: ColorMatrixFilterConfig): FilterResult {
    // Create the filter instance
    const filter = new ColorMatrixFilter();

    // Store initial config values
    const initialConfig = {
        alpha: config.alpha ?? 1.0,
        brightness: config.brightness ?? 1.0,
        contrast: config.contrast ?? 1.0,
        saturation: config.saturation ?? 1.0,
        hue: config.hue ?? 0,
        sepia: config.sepia ?? false,
        greyscale: config.greyscale ?? false,
        negative: config.negative ?? false
    };

    /**
     * Apply all color matrix settings to the filter
     */
    const applySettings = (): void => {
        // Reset to identity matrix first
        filter.reset();

        // Apply custom matrix if provided (overrides all other settings)
        if (config.matrix && config.matrix.length >= 20) {
            // For custom matrix, we'd need to use the internal _loadMatrix method
            // But for modern PIXI 8, we prefer using the built-in methods
            console.warn('Custom matrix not fully supported in modern PIXI 8 implementation. Use individual properties instead.');
        } else {
            // Apply effects in order using PIXI 8 methods
            
            // Apply brightness adjustment
            if (initialConfig.brightness !== 1.0) {
                filter.brightness(initialConfig.brightness, true);
            }

            // Apply contrast adjustment  
            if (initialConfig.contrast !== 1.0) {
                filter.contrast(initialConfig.contrast, true);
            }

            // Apply saturation adjustment
            if (initialConfig.saturation !== 1.0) {
                filter.saturate(initialConfig.saturation, true);
            }

            // Apply hue rotation
            if (initialConfig.hue !== 0) {
                filter.hue(initialConfig.hue, true);
            }

            // Apply special effects
            if (initialConfig.sepia) {
                filter.sepia(true);
            }

            if (initialConfig.greyscale) {
                filter.greyscale(1.0, true);
            }

            if (initialConfig.negative) {
                filter.negative(true);
            }
        }

        // Set alpha (this is a direct property, not a method)
        filter.alpha = initialConfig.alpha;
    };

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Apply intensity to the primary property if defined
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'alpha':
                    // Map intensity (0-10) to alpha (0-1)
                    filter.alpha = normalizedIntensity / 10;
                    break;
                
                case 'brightness':
                    // Map intensity (0-10) to brightness (0-2)
                    const brightness = normalizedIntensity / 5; // 0-2 range
                    filter.reset();
                    filter.brightness(brightness, false);
                    // Reapply other settings
                    if (initialConfig.contrast !== 1.0) filter.contrast(initialConfig.contrast, true);
                    if (initialConfig.saturation !== 1.0) filter.saturate(initialConfig.saturation, true);
                    if (initialConfig.hue !== 0) filter.hue(initialConfig.hue, true);
                    break;
                
                case 'contrast':
                    // Map intensity (0-10) to contrast (0-2)
                    const contrast = normalizedIntensity / 5; // 0-2 range
                    filter.reset();
                    if (initialConfig.brightness !== 1.0) filter.brightness(initialConfig.brightness, false);
                    filter.contrast(contrast, true);
                    if (initialConfig.saturation !== 1.0) filter.saturate(initialConfig.saturation, true);
                    if (initialConfig.hue !== 0) filter.hue(initialConfig.hue, true);
                    break;
                
                case 'saturation':
                    // Map intensity (0-10) to saturation (0-2)
                    const saturation = normalizedIntensity / 5; // 0-2 range
                    filter.reset();
                    if (initialConfig.brightness !== 1.0) filter.brightness(initialConfig.brightness, false);
                    if (initialConfig.contrast !== 1.0) filter.contrast(initialConfig.contrast, true);
                    filter.saturate(saturation, true);
                    if (initialConfig.hue !== 0) filter.hue(initialConfig.hue, true);
                    break;
                
                case 'hue':
                    // Map intensity (0-10) to hue rotation (0-360 degrees)
                    const hue = (normalizedIntensity / 10) * 360; // 0-360 range
                    filter.reset();
                    if (initialConfig.brightness !== 1.0) filter.brightness(initialConfig.brightness, false);
                    if (initialConfig.contrast !== 1.0) filter.contrast(initialConfig.contrast, true);
                    if (initialConfig.saturation !== 1.0) filter.saturate(initialConfig.saturation, true);
                    filter.hue(hue, true);
                    break;
            }
            
            // Always maintain the alpha setting
            filter.alpha = initialConfig.alpha;
            
        } else if (config.alpha === undefined) {
            // Default behavior: apply intensity to alpha when no primaryProperty is set
            filter.alpha = normalizedIntensity / 10;
        }
    };

    /**
     * Reset the filter to initial configuration values
     */
    const reset = (): void => {
        // Restore all values to configured defaults
        Object.assign(initialConfig, {
            alpha: config.alpha ?? 1.0,
            brightness: config.brightness ?? 1.0,
            contrast: config.contrast ?? 1.0,
            saturation: config.saturation ?? 1.0,
            hue: config.hue ?? 0,
            sepia: config.sepia ?? false,
            greyscale: config.greyscale ?? false,
            negative: config.negative ?? false
        });

        // Reapply all settings
        applySettings();

        // Apply intensity after restoring config values, if there's a primaryProperty
        if (config.intensity !== undefined && config.primaryProperty) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Get current filter state
     *
     * @returns Record containing current filter properties and state
     *
     */
    const getState = (): Record<string, unknown> => {
        return {
            alpha: filter.alpha,
            matrix: filter.matrix, // Current matrix state
            type: config.type,
            enabled: config.enabled,
            brightness: initialConfig.brightness,
            contrast: initialConfig.contrast,
            saturation: initialConfig.saturation,
            hue: initialConfig.hue,
            sepia: initialConfig.sepia,
            greyscale: initialConfig.greyscale,
            negative: initialConfig.negative
        };
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        filter.destroy();
    };

    // Apply initial settings
    applySettings();

    // Apply initial intensity only if there's a primaryProperty or no alpha was configured
    if (config.primaryProperty || config.alpha === undefined) {
        updateIntensity(config.intensity);
    }

    return { filter, updateIntensity, reset, dispose, getState, config };
} 