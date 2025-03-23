import { ColorGradientFilter } from 'pixi-filters';
import { type ColorGradientFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a ColorGradient filter that applies a color gradient to an object
 *
 * The ColorGradientFilter renders a colored gradient overlay that can either replace
 * the existing colors or be multiplied with them. You can provide an array of colors
 * and optional stops to control the gradient appearance.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the ColorGradient filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createColorGradientFilter(config: ColorGradientFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {
        angle: config.angle ?? 90,
        alpha: config.alpha ?? 1,
        maxColors: config.maxColors ?? 0, // 0 = no limit
        replace: config.replace ?? false,
        type: config.type ?? ColorGradientFilter.LINEAR
    };

    // If gradient colors are provided, add them to options
    if (config.colors && Array.isArray(config.colors)) {
        options.colors = config.colors;
    } else {
        // Default to a simple two-color gradient if none provided
        options.colors = [0x000000, 0xFFFFFF];
    }

    // If stops are provided, add them to options
    if (config.stops && Array.isArray(config.stops)) {
        options.stops = config.stops;
    }

    // Create a unique key for this filter configuration
    const colorStr = options.colors.map((c: number) => c.toString(16)).join('-');
    const stopsStr = options.stops ? options.stops.join('-') : 'default';
    const shaderKey = `color-gradient-filter-${options.type}-${colorStr}-${stopsStr}-${options.replace}`;

    // Create the filter with options
    const filter = new ColorGradientFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering color gradient filter with shader manager:', error);
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
                    // Map 0-10 to 0-1 range for alpha
                    filter.alpha = normalizedIntensity / 10;
                    break;
                case 'angle':
                    // Map 0-10 to 0-360 degrees for angle
                    filter.angle = normalizedIntensity * 36; // 0-360 range
                    break;
                default:
                    // Default behavior - adjust alpha
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
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset angle to config value if provided, otherwise use default
        filter.angle = config.angle !== undefined ? config.angle : 90;

        // Reset alpha to config value if provided, otherwise use default
        filter.alpha = config.alpha !== undefined ? config.alpha : 1;

        // Reset maxColors to config value if provided, otherwise use default
        if ('maxColors' in filter && config.maxColors !== undefined) {
            (filter as any).maxColors = config.maxColors;
        }

        // Reset replace option to config value if provided, otherwise use default
        if ('replace' in filter && config.replace !== undefined) {
            (filter as any).replace = config.replace;
        }

        // Reset gradient type to config value if provided, otherwise use default
        if ('type' in filter && config.type !== undefined) {
            (filter as any).type = config.type;
        }

        // Reset colors to config value if provided, otherwise use default
        if ('colors' in filter && config.colors !== undefined) {
            (filter as any).colors = config.colors;
        }

        // Reset stops to config value if provided, otherwise use default
        if ('stops' in filter && config.stops !== undefined) {
            (filter as any).stops = config.stops;
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
        } catch (error) {
            console.warn('Error releasing color gradient filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}