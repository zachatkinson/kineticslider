import {ConvolutionFilter, type ConvolutionMatrix} from 'pixi-filters';
import { type ConvolutionFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Helper function to create ConvolutionMatrix from number array
 * @param values - Array of 9 numbers for the 3x3 matrix
 * @returns A Float32Array that conforms to the ConvolutionMatrix type
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
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Convolution filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createConvolutionFilter(config: ConvolutionFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {
        width: config.width ?? 200,      // Default width
        height: config.height ?? 200,     // Default height
    };

    // Use provided matrix or default to an identity matrix (no effect)
    const defaultMatrix = createMatrix([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    if (config.matrix) {
        options.matrix = config.matrix;
    } else {
        options.matrix = defaultMatrix;
    }

    // Create a unique key for this filter configuration
    const presetKey = config.preset || 'custom';
    const shaderKey = `convolution-filter-${presetKey}-${config.width || 200}-${config.height || 200}`;

    // Create the filter with options
    const filter = new ConvolutionFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering convolution filter with shader manager:', error);
    }

    // Common convolution matrices for different effects
    type PresetMatrices = {
        [key: string]: ConvolutionMatrix;
    };

    const presetMatrices: PresetMatrices = {
        normal: createMatrix([0, 0, 0, 0, 1, 0, 0, 0, 0]),            // Identity (no effect)
        gaussianBlur: createMatrix([1/16, 2/16, 1/16,
            2/16, 4/16, 2/16,
            1/16, 2/16, 1/16]),                // Gaussian blur
        boxBlur: createMatrix([1/9, 1/9, 1/9,
            1/9, 1/9, 1/9,
            1/9, 1/9, 1/9]),                       // Box blur
        sharpen: createMatrix([0, -1, 0,
            -1, 5, -1,
            0, -1, 0]),                            // Sharpen
        edgeDetection: createMatrix([-1, -1, -1,
            -1, 8, -1,
            -1, -1, -1]),                    // Edge detection
        emboss: createMatrix([-2, -1, 0,
            -1, 1, 1,
            0, 1, 2]),                             // Emboss
        topSobel: createMatrix([1, 2, 1,
            0, 0, 0,
            -1, -2, -1]),                          // Top Sobel edge detection
        rightSobel: createMatrix([-1, 0, 1,
            -2, 0, 2,
            -1, 0, 1])                          // Right Sobel edge detection
    };

    /**
     * Apply a preset matrix effect
     *
     * @param presetName - Name of the preset effect to apply
     * @param intensity - Optional intensity factor to scale the effect (1.0 = normal)
     */
    const applyPreset = (presetName: string, intensity: number = 1.0): void => {
        if (presetMatrices[presetName]) {
            // If intensity is not 1.0, scale the matrix values
            if (intensity !== 1.0) {
                // Start with identity matrix (center pixel only)
                const baseMatrix = new Float32Array(presetMatrices.normal);
                const effectMatrix = presetMatrices[presetName];
                const scaledMatrix = new Float32Array(9);

                // For each position in the matrix
                for (let i = 0; i < 9; i++) {
                    // Calculate the difference between effect and base (identity)
                    const diff = effectMatrix[i] - baseMatrix[i];
                    // Scale the difference by intensity and add to base
                    scaledMatrix[i] = baseMatrix[i] + (diff * intensity);
                }

                // Apply the scaled matrix
                filter.matrix = scaledMatrix;
            } else {
                // Apply preset directly at full intensity
                filter.matrix = new Float32Array(presetMatrices[presetName]);
            }
        } else {
            console.warn(`Preset "${presetName}" not found, using default matrix`);
            filter.matrix = new Float32Array(defaultMatrix);
        }
    };

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Convert to 0-1 range for easier matrix manipulation
        const scaledIntensity = normalizedIntensity / 10;

        // Check if we have a preset to apply
        if (config.preset && presetMatrices[config.preset]) {
            applyPreset(config.preset, scaledIntensity);
        }
        // If we have a primary matrix property defined
        else if (config.primaryProperty === 'matrix' && config.matrix) {
            // Scale between identity (no effect) and the provided matrix
            const baseMatrix = new Float32Array(presetMatrices.normal);
            const scaledMatrix = new Float32Array(9);

            // For each position in the matrix
            for (let i = 0; i < 9; i++) {
                if (config.matrix) {
                    // Calculate the difference between configured and base (identity)
                    const diff = config.matrix[i] - baseMatrix[i];
                    // Scale the difference by intensity and add to base
                    scaledMatrix[i] = baseMatrix[i] + (diff * scaledIntensity);
                } else {
                    scaledMatrix[i] = baseMatrix[i];
                }
            }

            // Apply the scaled matrix
            filter.matrix = scaledMatrix;
        }
        // If nothing else applies, use a default effect (sharpen)
        else {
            applyPreset('sharpen', scaledIntensity);
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to default state (identity matrix - no effect)
     */
    const reset = (): void => {
        filter.matrix = new Float32Array(presetMatrices.normal);
    };

    /**
     * Release any WebGL resources used by this filter
     */
    const dispose = (): void => {
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing convolution filter shader:', error);
        }
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}