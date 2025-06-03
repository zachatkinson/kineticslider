import { ConvolutionFilter, type ConvolutionMatrix } from 'pixi-filters';
import { createFilterIntensity } from '../types/filters';

/**
 * Configuration for the Convolution filter
 *
 * @example
 * ```typescript
 * const config: ConvolutionFilterConfig = {
 *   type: 'convolution',
 *   enabled: true,
 *   preset: 'sharpen',
 *   width: 200,
 *   height: 200,
 *   intensity: 7
 * };
 * ```
 */
export interface ConvolutionFilterConfig {
    type: 'convolution';
    enabled: boolean;
    intensity?: number;
    matrix?: ConvolutionMatrix;
    width?: number;
    height?: number;
    preset?: 'normal' | 'gaussianBlur' | 'boxBlur' | 'sharpen' | 'edgeDetection' | 'emboss' | 'topSobel' | 'rightSobel';
}

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
 * Creates a Convolution filter that applies a matrix convolution effect
 * 
 * A convolution combines pixels in the input image with neighboring pixels to produce
 * a new image. Using different matrices, a wide variety of effects can be achieved,
 * including blurring, edge detection, sharpening, embossing, and beveling.
 * 
 * @param config - Configuration for the Convolution filter
 *
 * @returns Object with filter instance and control functions
 *
 */
export function createConvolutionFilter(config: ConvolutionFilterConfig): {
    filter: ConvolutionFilter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    // Create options object for the filter
    const options: {
        width: number;
        height: number;
        matrix?: ConvolutionMatrix;
    } = {
        width: config.width ?? 200,
        height: config.height ?? 200,
    };

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
    if (config.matrix) {
        baseMatrix = config.matrix;
    } else if (config.preset && presetMatrices[config.preset]) {
        baseMatrix = presetMatrices[config.preset];
    } else {
        baseMatrix = presetMatrices.normal;
    }

    options.matrix = baseMatrix;

    // Create the filter with options
    const filter = new ConvolutionFilter(options);
    
    // Store original configuration values
    const originalConfig = { ...config };
    const originalMatrix = new Float32Array(baseMatrix);

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity
     *
     */
    const updateIntensity = (intensity: number): void => {
        const intensityValue = createFilterIntensity(intensity);
        
        // Scale the convolution matrix based on intensity
        // Start with identity matrix and blend with effect matrix
        const identityMatrix = presetMatrices.normal;
        const scaledMatrix = new Float32Array(9);
        
        // Blend between identity (no effect) and the full effect matrix
        for (let i = 0; i < 9; i++) {
            scaledMatrix[i] = identityMatrix[i] + (originalMatrix[i] - identityMatrix[i]) * (intensityValue / 10);
        }
        
        filter.matrix = scaledMatrix;
    };

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Check if matrix configuration was provided  
        const hasMatrixConfig = originalConfig.matrix !== undefined || originalConfig.preset !== undefined;

        if (hasMatrixConfig) {
            // Reset to configured matrix
            filter.matrix = originalMatrix;
            
            // Reset dimensions if configured
            if (originalConfig.width !== undefined) {
                filter.width = originalConfig.width;
            }
            if (originalConfig.height !== undefined) {
                filter.height = originalConfig.height;
            }
            
            // Apply intensity when matrix config was provided
            if (originalConfig.intensity !== undefined) {
                updateIntensity(originalConfig.intensity);
            }
        } else {
            // Reset to identity matrix without applying intensity
            filter.matrix = presetMatrices.normal;
            filter.width = originalConfig.width ?? 200;
            filter.height = originalConfig.height ?? 200;
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