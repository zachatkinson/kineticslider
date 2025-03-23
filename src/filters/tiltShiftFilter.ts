import { TiltShiftFilter } from 'pixi-filters';
import { type TiltShiftFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

// Get singleton instance of the shader manager
const shaderManager = ShaderResourceManager.getInstance();

/**
 * Creates a TiltShift filter that applies a tilt-shift camera effect
 *
 * The TiltShiftFilter creates a photography-like tilt-shift effect that makes scenes
 * look like miniature models by applying a gradient blur. The effect keeps a horizontal
 * or vertical strip in focus while blurring the rest.
 *
 * Uses shader pooling via ShaderResourceManager for improved performance.
 *
 * @param config - Configuration for the TiltShift filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createTiltShiftFilter(config: TiltShiftFilterConfig): FilterResult {
    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.blur !== undefined) options.blur = config.blur;
    if (config.gradientBlur !== undefined) options.gradientBlur = config.gradientBlur;

    // Handle start position parameters
    if (config.start !== undefined) options.start = config.start;
    if (config.startX !== undefined) options.startX = config.startX;
    if (config.startY !== undefined) options.startY = config.startY;

    // Handle end position parameters
    if (config.end !== undefined) options.end = config.end;
    if (config.endX !== undefined) options.endX = config.endX;
    if (config.endY !== undefined) options.endY = config.endY;

    // Create the filter with options
    const filter = new TiltShiftFilter(options);

    // Generate a unique key for this filter configuration
    const shaderKey = `tiltshift-${config.blur || 8}-${config.gradientBlur || 600}`;

    // Register filter with shader manager for reuse
    try {
        shaderManager.getShaderProgram(shaderKey, filter);
    } catch (error) {
        console.warn('Failed to register tiltShift filter with shader manager:', error);
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
                case 'blur':
                    // Map 0-10 to 0-20 for blur strength
                    filter.blur = normalizedIntensity * 2;
                    break;
                case 'gradientBlur':
                    // Map 0-10 to 0-2000 for gradient blur
                    filter.gradientBlur = normalizedIntensity * 200;
                    break;
                case 'focusArea':
                    // Adjust the focus area by modifying start and end positions
                    // At intensity 0, focus area is the entire screen (no effect)
                    // At intensity 10, focus area is a small strip in the middle
                    const centerY = 0.5; // Assuming focus on horizontal strip in the middle
                    const focusHeight = 1 - (normalizedIntensity * 0.08); // 1.0 to 0.2
                    const halfHeight = focusHeight / 2;

                    filter.startY = centerY - halfHeight;
                    filter.endY = centerY + halfHeight;
                    break;
                default:
                    // Default to adjusting blur if primaryProperty is not recognized
                    filter.blur = normalizedIntensity * 2;
            }
        } else {
            // Default behavior - adjust blur intensity
            filter.blur = normalizedIntensity * 2;

            // Also adjust gradient blur for a better effect as intensity increases
            filter.gradientBlur = normalizedIntensity * 200;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Reset blur to configured value or default
        filter.blur = config.blur !== undefined ? config.blur : 8;

        // Reset gradient blur to configured value or default
        filter.gradientBlur = config.gradientBlur !== undefined ? config.gradientBlur : 600;

        // Handle start position (prioritize specific coordinates over point object)
        if (config.startX !== undefined) {
            filter.startX = config.startX;
        } else if (config.start?.x !== undefined) {
            filter.startX = config.start.x;
        } else {
            filter.startX = 0; // Default startX
        }

        if (config.startY !== undefined) {
            filter.startY = config.startY;
        } else if (config.start?.y !== undefined) {
            filter.startY = config.start.y;
        } else {
            filter.startY = 0.3; // Default startY for horizontal focus strip
        }

        // Handle end position (prioritize specific coordinates over point object)
        if (config.endX !== undefined) {
            filter.endX = config.endX;
        } else if (config.end?.x !== undefined) {
            filter.endX = config.end.x;
        } else {
            filter.endX = 1; // Default endX
        }

        if (config.endY !== undefined) {
            filter.endY = config.endY;
        } else if (config.end?.y !== undefined) {
            filter.endY = config.end.y;
        } else {
            filter.endY = 0.7; // Default endY for horizontal focus strip
        }
    };

    /**
     * Cleanup function to release shader when filter is no longer used
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseShader(shaderKey);
        } catch (error) {
            console.warn('Failed to release tiltShift filter shader:', error);
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