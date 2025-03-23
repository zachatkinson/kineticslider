import { ColorMatrixFilter } from 'pixi.js';
import { type ColorMatrixFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

// Get the shader manager singleton
const shaderManager = ShaderResourceManager.getInstance();

/**
 * Creates a ColorMatrix filter that applies a 5x4 matrix transformation on RGBA values
 *
 * This filter can be used for various effects like changing brightness, contrast,
 * saturation, hue rotation, grayscale conversion, sepia tone, and many other effects.
 *
 * Uses shader pooling via ShaderResourceManager for improved performance.
 *
 * @param config - Configuration for the ColorMatrix filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createColorMatrixFilter(config: ColorMatrixFilterConfig): FilterResult {
    // Create the filter
    const filter = new ColorMatrixFilter();

    // Generate a unique key for this filter configuration
    const shaderKey = `colormatrix-${config.preset || 'custom'}-${config.alpha || 1}`;

    // Register filter with shader manager for reuse
    try {
        shaderManager.getShaderProgram(shaderKey, filter);
    } catch (error) {
        console.warn('Failed to register colorMatrix filter with shader manager:', error);
    }

    // Set initial alpha value if provided
    if (config.alpha !== undefined) {
        filter.alpha = Math.max(0, Math.min(1, config.alpha));
    }

    // Apply any preset effects if specified
    if (config.preset) {
        applyPreset(filter, config.preset, config.presetIntensity || 1, config);
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // For ColorMatrix, we need to decide what "intensity" means
        // Here we'll interpret it as the alpha value of the filter effect
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));
        filter.alpha = normalizedIntensity / 10;

        // If a preset was specified, reapply it with the new intensity
        if (config.preset) {
            // Convert the 0-10 intensity to a more appropriate range for the preset
            // Most presets work well in the 0-1 or 0-2 range
            const presetIntensity = (normalizedIntensity / 10) * 2;
            applyPreset(filter, config.preset, presetIntensity, config);
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state (identity matrix)
     */
    const reset = (): void => {
        filter.reset();

        filter.alpha = config.alpha ?? 1;
    };

    /**
     * Cleanup function to release shader when filter is no longer used
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseShader(shaderKey);
        } catch (error) {
            console.warn('Failed to release colorMatrix filter shader:', error);
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

/**
 * Apply a preset effect to the ColorMatrixFilter
 *
 * @param filter - The ColorMatrixFilter instance
 * @param preset - The name of the preset to apply
 * @param intensity - The intensity of the effect (typically 0-1)
 * @param config - Original filter configuration for additional options
 */
function applyPreset(filter: ColorMatrixFilter, preset: string, intensity: number = 1, config?: ColorMatrixFilterConfig): void {
    // Reset the filter first to ensure we start with an identity matrix
    filter.reset();

    // Apply the specified preset
    switch (preset.toLowerCase()) {
        case 'blackandwhite':
            filter.blackAndWhite(true);
            break;
        case 'brightness':
            filter.brightness(intensity, true);
            break;
        case 'browni':
            filter.browni(true);
            break;
        //case 'colortone':
        //case 'color-tone':
        // ColorTone takes multiple parameters:
        // - desaturation: how much to desaturate (usually around 0.2-0.3)
        // - toned: how much toning to apply (usually around 0.15-0.4)
        // - lightColor: color for light areas (typically warm color like #FFE580)
        // - darkColor: color for dark areas (typically cool color like #338AB3)

        // We'll create parameters based on intensity
        case 'contrast':
            filter.contrast(intensity, false);
            break;
        case 'desaturate':
            filter.desaturate();
            break;
        case 'greyscale':
        case 'grayscale':
            filter.greyscale(intensity, false);
            break;
        case 'hue':
            // For hue, we'll interpret intensity as a rotation in degrees (0-360)
            const rotation = intensity * 360;
            filter.hue(rotation, true);
            break;
        case 'kodachrome':
            filter.kodachrome(true);
            break;
        case 'lsd':
            filter.lsd(false);
            break;
        case 'negative':
            filter.negative(false);
            break;
        case 'night':
            filter.night(intensity, false);
            break;
        case 'polaroid':
            filter.polaroid(false);
            break;
        case 'predator':
            // The predator effect typically takes an amount parameter
            filter.predator(intensity, false);
            break;
        case 'saturation':
        case 'saturate':
            filter.saturate(intensity, false);
            break;
        case 'sepia':
            filter.sepia(false);
            break;
        case 'technicolor':
            filter.technicolor(true);
            break;
        case 'tint':
            // Parse hex color to RGB values (0-1)
            const hexToRgb = (hex: string) => {
                // Handle hex with or without # prefix
                const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
                const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
                const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
                const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
                return [r, g, b, 1];
            };

            // Check if a custom tint color was provided
            if (config?.tintColor) {
                // Use custom color
                const tintColor = hexToRgb(config.tintColor);
                filter.tint(tintColor, true);
            } else {
                // Use a default color based on intensity (shifting from red to yellow to white)
                const r = 1; // Red always 1
                const g = Math.min(1, intensity); // Green increases with intensity
                const b = Math.min(1, intensity * 0.5); // Blue increases at half the rate
                filter.tint([r, g, b, 1], false);
            }
            break;
        case 'toBGR':
            filter.toBGR(true);
            break;
        case 'vintage':
            filter.vintage(true);
            break;
        default:
            console.warn(`Unknown ColorMatrix preset: ${preset}`);
            break;
    }
}