import { AdvancedBloomFilter } from 'pixi-filters';
import { type AdvancedBloomFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

// Get the shader manager singleton
const shaderManager = ShaderResourceManager.getInstance();

/**
 * Creates an AdvancedBloomFilter that applies a bloom effect with advanced controls
 *
 * The AdvancedBloomFilter applies a bloom effect to an object with more control options
 * than the standard BloomFilter, at the cost of performance.
 *
 * Uses shader pooling via ShaderResourceManager for improved performance.
 *
 * @param config - Configuration for the AdvancedBloom filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createAdvancedBloomFilter(config: AdvancedBloomFilterConfig): FilterResult {
    // Create options object with defaults for required properties
    const options: any = {
        bloomScale: config.bloomScale ?? 1,
        blur: config.blur ?? 2,
        brightness: config.brightness ?? 1,
        quality: config.quality ?? 4,
        threshold: config.threshold ?? 0.5,
    };

    // Add optional properties if specified
    if (config.pixelSize !== undefined) {
        options.pixelSize = config.pixelSize;
    }

    // Create the filter with options
    const filter = new AdvancedBloomFilter(options);

    // Generate a unique key for this filter configuration
    const shaderKey = `advbloom-${config.quality || 4}-${config.threshold || 0.5}`;

    // Register filter with shader manager for reuse
    try {
        shaderManager.getShaderProgram(shaderKey, filter);
    } catch (error) {
        console.warn('Failed to register advancedBloom filter with shader manager:', error);
    }

    /**
     * Update the filter's intensity based on the configuration's primaryProperty
     * or the default behavior which adjusts bloomScale and brightness.
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        if (config.primaryProperty) {
            // Map intensity (0-10) to appropriate range for the specified property
            switch (config.primaryProperty) {
                case 'bloomScale':
                    // bloomScale: Higher values = more intense brightness (0-2 is a good range)
                    filter.bloomScale = normalizedIntensity / 5; // 0-10 -> 0-2
                    break;
                case 'brightness':
                    // brightness: Higher values = more blown-out (0-2 is a good range)
                    filter.brightness = normalizedIntensity / 5; // 0-10 -> 0-2
                    break;
                case 'blur':
                    // blur: Strength of blur properties (1-10 is a good range)
                    filter.blur = Math.max(1, normalizedIntensity / 2); // 0-10 -> 0-5 (min 1)
                    break;
                case 'threshold':
                    // threshold: How bright a color needs to be affected (0-1)
                    filter.threshold = normalizedIntensity / 10; // 0-10 -> 0-1
                    break;
                default:
                    // Default behavior if primaryProperty is not recognized
                    filter.bloomScale = normalizedIntensity / 5; // 0-10 -> 0-2
            }
        } else {
            // Default behavior if no primaryProperty is specified:
            // Adjust both bloomScale and brightness proportionally
            filter.bloomScale = normalizedIntensity / 5; // 0-10 -> 0-2
            filter.brightness = Math.min(1.5, 0.5 + (normalizedIntensity / 20)); // 0-10 -> 0.5-1.5
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state (minimal bloom effect)
     */
    const reset = (): void => {
        filter.threshold = 0.5;
        filter.bloomScale = 0.1; // Very subtle bloom
        filter.brightness = 1;
        filter.blur = 2;
        filter.quality = 4;

        // Reset pixel size if it was modified
        if ('pixelSize' in filter && filter.pixelSize) {
            filter.pixelSize = { x: 1, y: 1 };
        }
    };

    /**
     * Cleanup function to release shader when filter is no longer used
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseShader(shaderKey);
        } catch (error) {
            console.warn('Failed to release advancedBloom filter shader:', error);
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