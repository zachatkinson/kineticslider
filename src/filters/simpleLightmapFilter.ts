import { SimpleLightmapFilter } from 'pixi-filters';
import { Assets, Texture } from 'pixi.js';
import { type SimpleLightmapFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a SimpleLightmap filter that applies a lighting effect
 *
 * The SimpleLightmapFilter creates a lighting effect by using a texture as a
 * lightmap source along with an ambient color. This can be used to create
 * dynamic lighting effects on images or other display objects.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the SimpleLightmap filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createSimpleLightmapFilter(config: SimpleLightmapFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create initial texture (placeholder or actual)
    let lightMapTexture: any = config.lightMap;

    if (typeof config.lightMap === 'string') {
        // For string paths, start with a placeholder
        lightMapTexture = Texture.EMPTY; // Use empty texture as placeholder

        // Load the actual texture asynchronously
        Assets.load(config.lightMap)
            .then(texture => {
                if (filter) {
                    filter.lightMap = texture;
                }
            })
            .catch(error => {
                console.error(`Failed to load lightMap texture: ${config.lightMap}`, error);
            });
    }

    // Convert color to a compatible format for SimpleLightmapFilter
    // SimpleLightmapFilter expects a number for the color
    let colorValue: number | undefined;

    if (config.color !== undefined) {
        // If it's already a number, use it directly
        if (typeof config.color === 'number') {
            colorValue = config.color;
        }
    }

    // Create a unique key for this filter configuration
    // The filter is mostly driven by external texture so we'll use a simpler key
    const colorHex = (colorValue || 0).toString(16);
    const shaderKey = `simple-lightmap-filter-${colorHex}`;

    // Create the filter with properly typed parameters
    const filter = new SimpleLightmapFilter(
        lightMapTexture,          // lightMap texture
        colorValue || 0x000000,   // ambient color as number (default black)
        config.alpha              // alpha value
    );

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering simple lightmap filter with shader manager:', error);
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
                case 'alpha':
                    // Map 0-10 to 0-1 for alpha
                    filter.alpha = normalizedIntensity / 10;
                    break;
                case 'brightness':
                    // Here we simulate a brightness effect by adjusting the alpha
                    // Higher intensity means more of the lightMap shows (brighter effect)
                    filter.alpha = normalizedIntensity / 10;
                    break;
                case 'colorIntensity':
                    // Here we could adjust the color intensity, but SimpleLightmap doesn't
                    // directly support this. Instead, we'll leave the color as is
                    // and use alpha to control overall intensity
                    filter.alpha = normalizedIntensity / 10;
                    break;
                default:
                    // Default to alpha adjustment
                    filter.alpha = normalizedIntensity / 10;
            }
        } else {
            // Default behavior - adjust alpha
            filter.alpha = normalizedIntensity / 10;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state
     */
    const reset = (): void => {
        // Reset alpha to configured value or default
        filter.alpha = config.alpha !== undefined ? config.alpha : 1;

        // Reset color to configured value or default
        if (colorValue !== undefined) {
            filter.color = colorValue;
        } else {
            filter.color = 0x000000;
        }
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing simple lightmap filter shader:', error);
        }

        // If we have a custom lightmap texture, we might want to dispose of it
        // but we should be careful to only dispose of textures we create
        // and not shared textures from the global Texture cache

        // Destroy the filter
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}