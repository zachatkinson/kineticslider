import { DropShadowFilter } from 'pixi-filters';
import { type DropShadowFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

// Get the shader manager singleton
const shaderManager = ShaderResourceManager.getInstance();

/**
 * Creates a DropShadow filter that applies a shadow effect to objects
 *
 * Uses shader pooling via ShaderResourceManager for improved performance.
 *
 * @param config - Configuration for the DropShadow filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createDropShadowFilter(config: DropShadowFilterConfig): FilterResult {
    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.blur !== undefined) options.blur = config.blur;
    if (config.color !== undefined) options.color = config.color;
    if (config.offset !== undefined) options.offset = config.offset;
    if (config.offsetX !== undefined) options.offsetX = config.offsetX;
    if (config.offsetY !== undefined) options.offsetY = config.offsetY;
    if (config.pixelSize !== undefined) options.pixelSize = config.pixelSize;
    if (config.pixelSizeX !== undefined) options.pixelSizeX = config.pixelSizeX;
    if (config.pixelSizeY !== undefined) options.pixelSizeY = config.pixelSizeY;
    if (config.quality !== undefined) options.quality = config.quality;
    if (config.shadowOnly !== undefined) options.shadowOnly = config.shadowOnly;

    // Create the filter with options
    const filter = new DropShadowFilter(options);

    // Generate a unique key for this filter configuration
    const shaderKey = `dropshadow-${config.quality || 3}-${config.blur || 2}-${config.alpha || 1}`;

    // Register filter with shader manager for reuse
    try {
        shaderManager.getShaderProgram(shaderKey, filter);
    } catch (error) {
        console.warn('Failed to register dropShadow filter with shader manager:', error);
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
                case 'blur':
                    // Map 0-10 to 0-20 for blur
                    filter.blur = normalizedIntensity * 2;
                    break;
                case 'offsetX':
                    // Map 0-10 to 0-20 for offset
                    filter.offsetX = normalizedIntensity * 2;
                    break;
                case 'offsetY':
                    // Map 0-10 to 0-20 for offset
                    filter.offsetY = normalizedIntensity * 2;
                    break;
                default:
                    // Default to blur adjustment
                    filter.blur = normalizedIntensity * 2;
            }
        } else {
            // Default behavior - adjust blur and offset together for a balanced shadow effect
            filter.blur = normalizedIntensity * 2;
            filter.offsetX = 2 + normalizedIntensity;
            filter.offsetY = 2 + normalizedIntensity;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset alpha to config value if provided, otherwise use default (1)
        if ('alpha' in filter) {
            filter.alpha = config.alpha !== undefined ? config.alpha : 1;
        }

        // Reset enabled property to config value if provided, otherwise use default (true)
        if ('enabled' in filter) {
            (filter as any).enabled = config.enabled !== undefined ? config.enabled : true;
        }

        // If intensity was provided in config, use updateIntensity to reset properly
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Cleanup function to release shader when filter is no longer used
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseShader(shaderKey);
        } catch (error) {
            console.warn('Failed to release dropShadow filter shader:', error);
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