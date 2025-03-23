import { SimplexNoiseFilter } from 'pixi-filters';
import { type SimplexNoiseFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a SimplexNoise filter that applies a noise pattern to the object
 *
 * The SimplexNoiseFilter multiplies simplex noise with the current texture data,
 * creating various noise effects like static, clouds, or organic textures.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the SimplexNoise filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createSimplexNoiseFilter(config: SimplexNoiseFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.noiseScale !== undefined) options.noiseScale = config.noiseScale;
    if (config.offsetX !== undefined) options.offsetX = config.offsetX;
    if (config.offsetY !== undefined) options.offsetY = config.offsetY;
    if (config.offsetZ !== undefined) options.offsetZ = config.offsetZ;
    if (config.step !== undefined) options.step = config.step;
    if (config.strength !== undefined) options.strength = config.strength;

    // Create a unique key for this filter configuration
    // The step parameter is the most significant for shader compilation
    const stepStr = (options.step || -1).toString();
    const shaderKey = `simplex-noise-filter-${stepStr}`;

    // Create the filter with options
    const filter = new SimplexNoiseFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering simplex noise filter with shader manager:', error);
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
                case 'noiseScale':
                    // Map 0-10 to 1-20 for noise scale
                    // Lower values = larger noise patterns, higher values = finer noise
                    filter.noiseScale = 1 + (normalizedIntensity * 1.9); // 1-20 range
                    break;
                case 'strength':
                    // Map 0-10 to 0-1 for strength
                    filter.strength = normalizedIntensity / 10;
                    break;
                case 'step':
                    // Map 0-10 to 0-1 for step threshold
                    // Only values > 0 will use the step function
                    filter.step = normalizedIntensity > 0 ? normalizedIntensity / 10 : -1;
                    break;
                case 'offset':
                    // If offset is specified as primary, update all offsets equally
                    const offsetValue = normalizedIntensity * 10; // 0-100 range
                    filter.offsetX = offsetValue;
                    filter.offsetY = offsetValue;
                    filter.offsetZ = offsetValue;
                    break;
                case 'offsetX':
                    // Map 0-10 to 0-100 for offsetX
                    filter.offsetX = normalizedIntensity * 10;
                    break;
                case 'offsetY':
                    // Map 0-10 to 0-100 for offsetY
                    filter.offsetY = normalizedIntensity * 10;
                    break;
                case 'offsetZ':
                    // Map 0-10 to 0-100 for offsetZ
                    filter.offsetZ = normalizedIntensity * 10;
                    break;
                default:
                    // Default to strength adjustment
                    filter.strength = normalizedIntensity / 10;
            }
        } else {
            // Default behavior - adjust strength if no primary property is specified
            filter.strength = normalizedIntensity / 10;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset each property to config value if provided, otherwise use default

        // Noise scale
        filter.noiseScale = config.noiseScale !== undefined ? config.noiseScale : 10;

        // Offset values
        filter.offsetX = config.offsetX !== undefined ? config.offsetX : 0;
        filter.offsetY = config.offsetY !== undefined ? config.offsetY : 0;
        filter.offsetZ = config.offsetZ !== undefined ? config.offsetZ : 0;

        // Step threshold
        filter.step = config.step !== undefined ? config.step : -1;

        // Strength
        filter.strength = config.strength !== undefined ? config.strength : 0;

        // If intensity was provided in config, use updateIntensity to reset properly
        // This will adjust properties based on the primaryProperty setting
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
            console.warn('Error releasing simplex noise filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}