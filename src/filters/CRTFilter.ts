import { CRTFilter } from 'pixi-filters';
import { createFilterIntensity, type CRTFilterConfig } from '../types/filters';

/**
 * Creates a CRT filter that applies a CRT (Cathode Ray Tube) effect to an object
 * 
 * The CRTFilter simulates an old CRT display with features like scan lines,
 * screen curvature, vignetting, and noise.
 * 
 * @param config - Configuration for the CRT filter
 *
 * @returns Object with filter instance and control functions
 *
 */
export function createCRTFilter(config: CRTFilterConfig): {
    filter: CRTFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create options object for the filter
    const options: Partial<{
        curvature: number;
        lineContrast: number;
        lineWidth: number;
        noise: number;
        noiseSize: number;
        seed: number;
        time: number;
        verticalLine: boolean;
        vignetting: number;
        vignettingAlpha: number;
        vignettingBlur: number;
    }> = {};

    // Apply configuration values if provided
    if (config.curvature !== undefined) options.curvature = config.curvature;
    if (config.lineContrast !== undefined) options.lineContrast = config.lineContrast;
    if (config.lineWidth !== undefined) options.lineWidth = config.lineWidth;
    if (config.noise !== undefined) options.noise = config.noise;
    if (config.noiseSize !== undefined) options.noiseSize = config.noiseSize;
    if (config.seed !== undefined) options.seed = config.seed;
    if (config.time !== undefined) options.time = config.time;
    if (config.verticalLine !== undefined) options.verticalLine = config.verticalLine;
    if (config.vignetting !== undefined) options.vignetting = config.vignetting;
    if (config.vignettingAlpha !== undefined) options.vignettingAlpha = config.vignettingAlpha;
    if (config.vignettingBlur !== undefined) options.vignettingBlur = config.vignettingBlur;

    // Create the filter with options
    const filter = new CRTFilter(options);
    
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
        
        // Primary effect: scale noise and line contrast together
        const baseNoise = originalConfig.noise ?? 0.3;
        const baseLineContrast = originalConfig.lineContrast ?? 0.25;
        const baseCurvature = originalConfig.curvature ?? 1.0;
        const baseVignetting = originalConfig.vignetting ?? 0.3;
        
        // Apply intensity scaling to create a comprehensive CRT effect
        filter.noise = baseNoise + (intensityValue * 0.07); // 0.3 to 1.0 range
        filter.lineContrast = baseLineContrast + (intensityValue * 0.075); // 0.25 to 1.0 range  
        filter.curvature = baseCurvature + (intensityValue * 0.9); // 1.0 to 10.0 range
        filter.vignetting = baseVignetting + (intensityValue * 0.07); // 0.3 to 1.0 range
        
        // Scale line width if configured
        if (originalConfig.lineWidth !== undefined) {
            filter.lineWidth = originalConfig.lineWidth + (intensityValue * 0.45); // Add up to 4.5
        }
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Check if CRT configuration was provided
        const hasCRTConfig = originalConfig.noise !== undefined || 
                            originalConfig.lineContrast !== undefined ||
                            originalConfig.curvature !== undefined ||
                            originalConfig.vignetting !== undefined;

        if (hasCRTConfig) {
            // Reset to configured values
            filter.noise = originalConfig.noise ?? 0.3;
            filter.lineContrast = originalConfig.lineContrast ?? 0.25;
            filter.curvature = originalConfig.curvature ?? 1.0;
            filter.vignetting = originalConfig.vignetting ?? 0.3;
            
            // Reset other properties
            if (originalConfig.lineWidth !== undefined) {
                filter.lineWidth = originalConfig.lineWidth;
            }
            if (originalConfig.noiseSize !== undefined) {
                filter.noiseSize = originalConfig.noiseSize;
            }
            if (originalConfig.vignettingAlpha !== undefined) {
                filter.vignettingAlpha = originalConfig.vignettingAlpha;
            }
            if (originalConfig.vignettingBlur !== undefined) {
                filter.vignettingBlur = originalConfig.vignettingBlur;
            }
            
            // Apply intensity when CRT config was provided
            if (originalConfig.intensity !== undefined) {
                updateIntensity(originalConfig.intensity);
            }
        } else {
            // Reset to defaults without applying intensity
            filter.noise = 0.3;
            filter.lineContrast = 0.25;
            filter.curvature = 1.0;
            filter.vignetting = 0.3;
            filter.lineWidth = originalConfig.lineWidth ?? 1.0;
            filter.noiseSize = originalConfig.noiseSize ?? 1.0;
            filter.vignettingAlpha = originalConfig.vignettingAlpha ?? 1.0;
            filter.vignettingBlur = originalConfig.vignettingBlur ?? 0.3;
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