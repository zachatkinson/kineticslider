import { DropShadowFilter } from 'pixi-filters';
import { createFilterIntensity } from '../types/filters';

/**
 * Configuration for the Drop Shadow filter
 *
 * @example
 * ```typescript
 * const config: DropShadowFilterConfig = {
 *   type: 'dropShadow',
 *   enabled: true,
 *   color: 0x000000,
 *   alpha: 0.5,
 *   blur: 2,
 *   distance: 5,
 *   intensity: 6
 * };
 * ```
 */
export interface DropShadowFilterConfig {
    type: 'dropShadow';
    enabled: boolean;
    intensity?: number;
    alpha?: number;
    blur?: number;
    color?: number;
    offset?: { x: number; y: number } | number;
    offsetX?: number;
    offsetY?: number;
    pixelSize?: number;
    pixelSizeX?: number;
    pixelSizeY?: number;
    quality?: number;
    shadowOnly?: boolean;
}

/**
 * Creates a DropShadow filter that applies a shadow effect to objects
 * 
 * @param config - Configuration for the DropShadow filter
 *
 * @returns Object with filter instance and control functions
 *
 */
export function createDropShadowFilter(config: DropShadowFilterConfig): {
    filter: DropShadowFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create options object for the filter
    const options: Partial<{
        alpha: number;
        blur: number;
        color: number;
        offsetX: number;
        offsetY: number;
        pixelSize: number;
        pixelSizeX: number;
        pixelSizeY: number;
        quality: number;
        shadowOnly: boolean;
    }> = {};

    // Apply configuration values if provided
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.blur !== undefined) options.blur = config.blur;
    if (config.color !== undefined) options.color = config.color;
    if (config.offset !== undefined) {
        if (typeof config.offset === 'number') {
            options.offsetX = config.offset;
            options.offsetY = config.offset;
        } else {
            options.offsetX = config.offset.x;
            options.offsetY = config.offset.y;
        }
    }
    if (config.offsetX !== undefined) options.offsetX = config.offsetX;
    if (config.offsetY !== undefined) options.offsetY = config.offsetY;
    if (config.pixelSize !== undefined) options.pixelSize = config.pixelSize;
    if (config.pixelSizeX !== undefined) options.pixelSizeX = config.pixelSizeX;
    if (config.pixelSizeY !== undefined) options.pixelSizeY = config.pixelSizeY;
    if (config.quality !== undefined) options.quality = config.quality;
    if (config.shadowOnly !== undefined) options.shadowOnly = config.shadowOnly;

    // Create the filter with options
    const filter = new DropShadowFilter(options);
    
    // Store original configuration values
    const originalConfig = { ...config };

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity
     *
     */
    const updateIntensity = (intensity: number): void => {
        const intensityValue = createFilterIntensity(intensity);
        
        // Scale blur and offset based on intensity
        const baseBlur = originalConfig.blur ?? 2;
        const baseOffsetX = originalConfig.offsetX ?? 2;
        const baseOffsetY = originalConfig.offsetY ?? 2;
        
        // Apply intensity scaling
        filter.blur = baseBlur + (intensityValue * 1.8); // Adds up to 18 blur at max intensity
        filter.offsetX = baseOffsetX + (intensityValue * 1.0); // Adds up to 10 offset at max
        filter.offsetY = baseOffsetY + (intensityValue * 1.0);
        
        // Scale alpha if not explicitly configured
        if (originalConfig.alpha === undefined) {
            filter.alpha = 0.5 + (intensityValue / 20); // 0.5 to 1.0 range
        } else {
            // Keep the explicitly configured alpha value
            filter.alpha = originalConfig.alpha;
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Check if shadow configuration was provided
        const hasShadowConfig = originalConfig.blur !== undefined || 
                               originalConfig.offsetX !== undefined || 
                               originalConfig.offsetY !== undefined ||
                               originalConfig.alpha !== undefined;

        if (hasShadowConfig) {
            // Reset to configured values
            filter.blur = originalConfig.blur ?? 2;
            filter.offsetX = originalConfig.offsetX ?? 2;
            filter.offsetY = originalConfig.offsetY ?? 2;
            filter.alpha = originalConfig.alpha ?? 0.5;
            
            // Reset other properties
            if (originalConfig.color !== undefined) {
                filter.color = originalConfig.color;
            }
            
            // Apply intensity when shadow config was provided
            if (originalConfig.intensity !== undefined) {
                updateIntensity(originalConfig.intensity);
            }
        } else {
            // Reset to defaults without applying intensity
            filter.blur = 2;
            filter.offsetX = 2;
            filter.offsetY = 2;
            filter.alpha = 0.5;
            filter.color = originalConfig.color ?? 0x000000;
        }
    };

    /**
     * Cleanup function
     */
    const dispose = (): void => {
        if (filter.destroy) {
            filter.destroy();
        }
    };

    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
        updateIntensity(config.intensity);
    }

    return {
        filter,
        updateIntensity,
        reset,
        dispose
    };
} 