import { GlowFilter } from 'pixi-filters';
import { type GlowFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Glow filter that applies a glow effect to an object
 *
 * The GlowFilter creates a glow effect around objects with configurable
 * inner and outer glow strengths, color, and quality settings.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Glow filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createGlowFilter(config: GlowFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object with explicit values from config
    const options = {
        // Directly specify each option from the config
        distance: config.distance ?? 10,
        outerStrength: config.outerStrength ?? 4,
        innerStrength: config.innerStrength ?? 0,
        color: config.color ?? 0xFFFFFF,
        quality: config.quality ?? 0.1,
        knockout: config.knockout ?? false,
        alpha: config.alpha ?? 1
    };

    // Create a unique key for this filter configuration
    const colorHex = options.color.toString(16);
    const knockoutStr = options.knockout ? 'ko' : 'noko';
    const shaderKey = `glow-filter-${colorHex}-${options.quality}-${knockoutStr}`;

    // Log the options being passed to the filter
    console.log('Creating GlowFilter with options:', JSON.stringify(options, (key, value) => {
        // Special handling for color to show hex value
        if (key === 'color' && typeof value === 'number') {
            return '0x' + value.toString(16).padStart(6, '0').toUpperCase();
        }
        return value;
    }));

    // Create the filter with explicit options
    const filter = new GlowFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering glow filter with shader manager:', error);
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
                case 'innerStrength':
                    // Map 0-10 to 0-10 for inner strength
                    filter.innerStrength = normalizedIntensity;
                    break;
                case 'outerStrength':
                    // Map 0-10 to 0-10 for outer strength
                    filter.outerStrength = normalizedIntensity;
                    break;
                case 'distance':
                    // Map 0-10 to 0-30 for distance
                    filter.distance = normalizedIntensity * 3;
                    break;
                case 'quality':
                    // Map 0-10 to 0-1 for quality
                    filter.quality = normalizedIntensity / 10;
                    break;
                case 'alpha':
                    // Map 0-10 to 0-1 for alpha
                    filter.alpha = normalizedIntensity / 10;
                    break;
                default:
                    // Default to adjusting outer strength
                    filter.outerStrength = normalizedIntensity;
            }
        } else {
            // Default behavior - adjust outer strength (most visible effect)
            filter.outerStrength = normalizedIntensity;
        }

        // Log the current filter state after updating
        console.log('GlowFilter after intensity update:', {
            intensity: normalizedIntensity,
            outerStrength: filter.outerStrength,
            innerStrength: filter.innerStrength,
            distance: filter.distance,
            color: '0x' + (filter.color as number).toString(16).padStart(6, '0').toUpperCase(),
            quality: filter.quality,
            alpha: filter.alpha,
            knockout: filter.knockout
        });
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to its configured state (or defaults if no config provided)
     */
    const reset = (): void => {
        // Reset to configured values or defaults if not specified
        filter.distance = config.distance ?? 10;
        filter.outerStrength = config.outerStrength ?? 4;
        filter.innerStrength = config.innerStrength ?? 0;
        filter.color = config.color ?? 0xFFFFFF;
        filter.alpha = config.alpha ?? 1;
        filter.knockout = config.knockout ?? false;
        filter.quality = config.quality ?? 0.1;

        console.log('Reset GlowFilter to:', {
            distance: filter.distance,
            outerStrength: filter.outerStrength,
            innerStrength: filter.innerStrength,
            color: '0x' + (filter.color as number).toString(16).padStart(6, '0').toUpperCase(),
            alpha: filter.alpha,
            knockout: filter.knockout,
            quality: filter.quality
        });
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing glow filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}