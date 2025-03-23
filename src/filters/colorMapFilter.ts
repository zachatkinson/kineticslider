import { ColorMapFilter } from 'pixi-filters';
import { type ColorMapFilterConfig, type FilterResult } from './types';
import { Assets, Texture } from 'pixi.js';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a ColorMap filter that applies a color-map effect to an object
 *
 * The ColorMapFilter applies a color-map transformation using a provided texture map.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the ColorMap filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createColorMapFilter(config: ColorMapFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create initial texture (placeholder or actual)
    let colorMapTexture: any = config.colorMap;
    let texturePath = '';

    if (typeof config.colorMap === 'string') {
        texturePath = config.colorMap;
        // For string paths, start with a placeholder
        colorMapTexture = Texture.EMPTY; // Use empty texture as placeholder
    }

    // Create a unique key for this filter configuration
    const textureId = texturePath || (typeof config.colorMap === 'object' ? 'texture-object' : 'default');
    const shaderKey = `color-map-filter-${textureId}-${config.nearest ?? false}-${config.mix ?? 0.5}`;

    // Create the filter - use the appropriate constructor based on documentation
    let filter: ColorMapFilter;

    if (config.nearest !== undefined || config.mix !== undefined) {
        // Use overload 2 with individual parameters
        filter = new ColorMapFilter(
            colorMapTexture,
            config.nearest,
            config.mix
        );
    } else {
        // Use overload 1 with options object, but only include properties
        // that are part of ColorMapFilterOptions
        filter = new ColorMapFilter({
            colorMap: colorMapTexture,
            nearest: config.nearest
            // Note: we're not including colorSize here as it's not in the options type
        });
    }

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering color map filter with shader manager:', error);
    }

    // If using a string path, load the texture asynchronously
    if (texturePath) {
        Assets.load(texturePath)
            .then(texture => {
                if (filter) {
                    filter.colorMap = texture;
                }
            })
            .catch(error => {
                console.error(`Failed to load colorMap texture: ${texturePath}`, error);
            });
    }

    // If colorSize is specifically provided, try to set it directly on the filter
    // after creation (if the property exists)
    if (config.colorSize !== undefined && 'colorSize' in filter) {
        (filter as any).colorSize = config.colorSize;
    }

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Map intensity to mix (0-10 -> 0-1)
        filter.mix = normalizedIntensity / 10;
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset mix to config value if explicitly provided
        if (config.mix !== undefined) {
            filter.mix = config.mix;
        } else if (config.intensity === undefined) {
            // Only set to 0 if neither mix nor intensity were provided
            filter.mix = 0;
        }

        // Reset nearest if it was configured and property exists
        if (config.nearest !== undefined && 'nearest' in filter) {
            filter.nearest = config.nearest;
        }

        // Reset colorSize if it was configured and property exists
        if (config.colorSize !== undefined && 'colorSize' in filter) {
            (filter as any).colorSize = config.colorSize;
        }

        // If intensity was provided in config, use updateIntensity to reset properly
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

            // If the colorMap is a texture we created or loaded, destroy it
            if (filter.colorMap && filter.colorMap !== Texture.EMPTY &&
                filter.colorMap !== colorMapTexture && typeof config.colorMap === 'string') {
                filter.colorMap.destroy(true);
            }
        } catch (error) {
            console.warn('Error releasing color map filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}