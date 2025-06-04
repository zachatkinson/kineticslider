import { ConvolutionFilter, type ConvolutionMatrix } from 'pixi-filters';
import type { ConvolutionFilterConfig, FilterResult } from '../types/filters';

/**
 * Helper function to create ConvolutionMatrix from number array
 *
 * @param values - Array of 9 numbers representing the 3x3 convolution matrix
 *
 * @returns ConvolutionMatrix for use with ConvolutionFilter
 *
 */
function createMatrix(values: number[]): ConvolutionMatrix {
    return new Float32Array(values);
}

/**
 * Enhanced ConvolutionFilter with modern PIXI properties
 * 
 * A convolution combines pixels in the input image with neighboring pixels to produce
 * a new image. Using different matrices, a wide variety of effects can be achieved,
 * including blurring, edge detection, sharpening, embossing, and beveling.
 * 
 * @param config - Configuration for the Convolution filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const convolutionFilter = createConvolutionFilter({
 *   type: 'convolution',
 *   enabled: true,
 *   preset: 'sharpen',
 *   width: 200,
 *   height: 200,
 *   intensity: 7,
 *   primaryProperty: 'matrix'
 * });
 * ```
 */
export function createConvolutionFilter(config: ConvolutionFilterConfig): FilterResult {
    // Common convolution matrices for different effects
    const presetMatrices = {
        normal: createMatrix([0, 0, 0, 0, 1, 0, 0, 0, 0]),            // Identity (no effect)
        gaussianBlur: createMatrix([1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16]), // Gaussian blur
        boxBlur: createMatrix([1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]),               // Box blur
        sharpen: createMatrix([0, -1, 0, -1, 5, -1, 0, -1, 0]),                             // Sharpen
        edgeDetection: createMatrix([-1, -1, -1, -1, 8, -1, -1, -1, -1]),                   // Edge detection
        emboss: createMatrix([-2, -1, 0, -1, 1, 1, 0, 1, 2]),                               // Emboss
        topSobel: createMatrix([1, 2, 1, 0, 0, 0, -1, -2, -1]),                             // Top Sobel edge detection
        rightSobel: createMatrix([-1, 0, 1, -2, 0, 2, -1, 0, 1])                            // Right Sobel edge detection
    };

    // Use provided matrix, preset, or default to identity matrix
    let baseMatrix: ConvolutionMatrix;
    if (config.matrix && config.matrix.length >= 9) {
        baseMatrix = createMatrix(config.matrix.slice(0, 9)); // Ensure exactly 9 values
    } else if (config.preset && presetMatrices[config.preset]) {
        baseMatrix = presetMatrices[config.preset];
    } else {
        baseMatrix = presetMatrices.normal;
    }

    // Create the filter with modern PIXI properties
    const filter = new ConvolutionFilter({
        width: config.width ?? 200,
        height: config.height ?? 200,
        matrix: baseMatrix
    });
    
    // Store original matrix for intensity calculations
    const originalMatrix = new Float32Array(baseMatrix);

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Apply intensity to the primary property if defined
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'matrix':
                    // Scale the convolution matrix based on intensity
                    // Start with identity matrix and blend with effect matrix
                    const identityMatrix = presetMatrices.normal;
                    const scaledMatrix = new Float32Array(9);
                    
                    // Blend between identity (no effect) and the full effect matrix
                    const blendFactor = normalizedIntensity / 10;
                    for (let i = 0; i < 9; i++) {
                        scaledMatrix[i] = identityMatrix[i] + (originalMatrix[i] - identityMatrix[i]) * blendFactor;
                    }
                    
                    filter.matrix = scaledMatrix;
                    break;
                
                case 'width':
                    // Map intensity to width scaling (this is less common but possible)
                    const baseWidth = config.width ?? 200;
                    filter.width = baseWidth * (0.5 + (normalizedIntensity / 10) * 0.5); // 50%-100% scaling
                    break;
                
                case 'height':
                    // Map intensity to height scaling (this is less common but possible)
                    const baseHeight = config.height ?? 200;
                    filter.height = baseHeight * (0.5 + (normalizedIntensity / 10) * 0.5); // 50%-100% scaling
                    break;
            }
        } else {
            // Default behavior: adjust matrix intensity
            const identityMatrix = presetMatrices.normal;
            const scaledMatrix = new Float32Array(9);
            
            const blendFactor = normalizedIntensity / 10;
            for (let i = 0; i < 9; i++) {
                scaledMatrix[i] = identityMatrix[i] + (originalMatrix[i] - identityMatrix[i]) * blendFactor;
            }
            
            filter.matrix = scaledMatrix;
        }
    };

    /**
     * Reset the filter to initial configuration values
     */
    const reset = (): void => {
        // Reset to configured values or defaults
        filter.matrix = originalMatrix;
        filter.width = config.width ?? 200;
        filter.height = config.height ?? 200;

        // Apply intensity after restoring config values, if there's a primaryProperty
        if (config.intensity !== undefined && config.primaryProperty) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Get current filter state
     *
     * @returns Record containing current filter properties and state
     *
     */
    const getState = (): Record<string, unknown> => {
        return {
            matrix: Array.from(filter.matrix),  // Convert to regular array for serialization
            width: filter.width,
            height: filter.height,
            type: config.type,
            enabled: config.enabled,
            configuredMatrix: config.matrix,
            configuredPreset: config.preset,
            configuredWidth: config.width,
            configuredHeight: config.height
        };
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        filter.destroy();
    };

    // Apply initial intensity if provided and there's a primaryProperty
    if (config.primaryProperty || (config.matrix === undefined && config.preset === undefined)) {
        updateIntensity(config.intensity);
    }

    return { filter, updateIntensity, reset, dispose, getState, config };
} 