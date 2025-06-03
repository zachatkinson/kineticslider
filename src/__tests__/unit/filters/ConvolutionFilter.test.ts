import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConvolutionFilter, type ConvolutionFilterConfig } from '../../../filters/ConvolutionFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PIXI ConvolutionFilter from pixi-filters
const mockConvolutionFilter = {
    matrix: new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]), // Identity matrix
    width: 200,
    height: 200,
    destroy: vi.fn()
};

vi.mock('pixi-filters', () => ({
    ConvolutionFilter: vi.fn(() => mockConvolutionFilter)
}));

describe('ConvolutionFilter', () => {
    let ConvolutionFilterMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Get the mock after imports are resolved
        const pixiFiltersModule = await import('pixi-filters');
        ConvolutionFilterMock = pixiFiltersModule.ConvolutionFilter as any;
        
        // Reset mock filter properties
        mockConvolutionFilter.matrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
        mockConvolutionFilter.width = 200;
        mockConvolutionFilter.height = 200;
    });

    describe('Basic functionality', () => {
        it('should create a convolution filter with default settings', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true
            };

            const result = createConvolutionFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with custom matrix', () => {
            const customMatrix = new Float32Array([1, 0, -1, 2, 0, -2, 1, 0, -1]);
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                matrix: customMatrix,
                width: 300,
                height: 250
            };

            createConvolutionFilter(config);
            
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: customMatrix,
                width: 300,
                height: 250
            });
        });

        it('should create filter with preset matrix', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'sharpen',
                width: 400,
                height: 300
            };

            createConvolutionFilter(config);
            
            // Should use sharpen matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
            const expectedMatrix = new Float32Array([0, -1, 0, -1, 5, -1, 0, -1, 0]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 400,
                height: 300
            });
        });

        it('should use default dimensions when not specified', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true
            };

            createConvolutionFilter(config);
            
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]), // Identity matrix
                width: 200,
                height: 200
            });
        });
    });

    describe('Preset matrices', () => {
        it('should handle gaussianBlur preset', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'gaussianBlur'
            };

            createConvolutionFilter(config);
            
            const expectedMatrix = new Float32Array([1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 200,
                height: 200
            });
        });

        it('should handle boxBlur preset', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'boxBlur'
            };

            createConvolutionFilter(config);
            
            const expectedMatrix = new Float32Array([1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 200,
                height: 200
            });
        });

        it('should handle edgeDetection preset', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'edgeDetection'
            };

            createConvolutionFilter(config);
            
            const expectedMatrix = new Float32Array([-1, -1, -1, -1, 8, -1, -1, -1, -1]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 200,
                height: 200
            });
        });

        it('should handle emboss preset', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'emboss'
            };

            createConvolutionFilter(config);
            
            const expectedMatrix = new Float32Array([-2, -1, 0, -1, 1, 1, 0, 1, 2]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 200,
                height: 200
            });
        });

        it('should handle topSobel and rightSobel presets', () => {
            const config1: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'topSobel'
            };

            createConvolutionFilter(config1);
            
            let expectedMatrix = new Float32Array([1, 2, 1, 0, 0, 0, -1, -2, -1]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 200,
                height: 200
            });

            // Clear and test rightSobel
            ConvolutionFilterMock.mockClear();

            const config2: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'rightSobel'
            };

            createConvolutionFilter(config2);
            
            expectedMatrix = new Float32Array([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: expectedMatrix,
                width: 200,
                height: 200
            });
        });
    });

    describe('Intensity updates', () => {
        it('should blend between identity matrix and effect matrix based on intensity', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'sharpen', // [0, -1, 0, -1, 5, -1, 0, -1, 0]
                intensity: 5
            };

            const result = createConvolutionFilter(config);

            // Test at zero intensity (should be identity matrix)
            result.updateIntensity(0);
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            expect(mockConvolutionFilter.matrix).toEqual(identityMatrix);

            // Test at 50% intensity (blend between identity and sharpen)
            result.updateIntensity(5);
            // Sharpen matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
            // Identity matrix: [0, 0, 0, 0, 1, 0, 0, 0, 0]
            // 50% blend: [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0]
            const expectedMatrix = new Float32Array([0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0]);
            expect(mockConvolutionFilter.matrix).toEqual(expectedMatrix);

            // Test at full intensity (should be full effect matrix)
            result.updateIntensity(10);
            const sharpenMatrix = new Float32Array([0, -1, 0, -1, 5, -1, 0, -1, 0]);
            expect(mockConvolutionFilter.matrix).toEqual(sharpenMatrix);
        });

        it('should work with custom matrices', () => {
            const customMatrix = new Float32Array([1, 0, 0, 0, 2, 0, 0, 0, 1]);
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                matrix: customMatrix,
                intensity: 5
            };

            const result = createConvolutionFilter(config);

            result.updateIntensity(5);
            // 50% blend between identity and custom matrix
            // Identity: [0, 0, 0, 0, 1, 0, 0, 0, 0]
            // Custom:  [1, 0, 0, 0, 2, 0, 0, 0, 1]
            // 50%:     [0.5, 0, 0, 0, 1.5, 0, 0, 0, 0.5]
            const expectedMatrix = new Float32Array([0.5, 0, 0, 0, 1.5, 0, 0, 0, 0.5]);
            expect(mockConvolutionFilter.matrix).toEqual(expectedMatrix);
        });
    });

    describe('Reset functionality', () => {
        it('should reset to identity matrix when no matrix config provided', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                width: 300,
                height: 250,
                intensity: 7
            };

            const result = createConvolutionFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore to identity matrix without applying intensity
            result.reset();
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            expect(mockConvolutionFilter.matrix).toEqual(identityMatrix);
            expect(mockConvolutionFilter.width).toBe(300);
            expect(mockConvolutionFilter.height).toBe(250);
        });

        it('should reset to configured matrix when matrix config provided', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'emboss',
                width: 400,
                height: 300,
                intensity: 8
            };

            const result = createConvolutionFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore configured matrix and apply intensity
            result.reset();
            // Should apply intensity 8: blend 80% towards emboss matrix
            const embossMatrix = new Float32Array([-2, -1, 0, -1, 1, 1, 0, 1, 2]);
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            const expectedMatrix = new Float32Array(9);
            for (let i = 0; i < 9; i++) {
                expectedMatrix[i] = identityMatrix[i] + (embossMatrix[i] - identityMatrix[i]) * 0.8;
            }
            expect(mockConvolutionFilter.matrix).toEqual(expectedMatrix);
            expect(mockConvolutionFilter.width).toBe(400);
            expect(mockConvolutionFilter.height).toBe(300);
        });

        it('should reset custom matrix correctly', () => {
            const customMatrix = new Float32Array([0, 1, 0, 1, -4, 1, 0, 1, 0]);
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                matrix: customMatrix,
                intensity: 6
            };

            const result = createConvolutionFilter(config);

            // Change values
            result.updateIntensity(3);

            // Reset should restore custom matrix and apply intensity
            result.reset();
            // Should blend 60% towards custom matrix
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            const expectedMatrix = new Float32Array(9);
            for (let i = 0; i < 9; i++) {
                expectedMatrix[i] = identityMatrix[i] + (customMatrix[i] - identityMatrix[i]) * 0.6;
            }
            expect(mockConvolutionFilter.matrix).toEqual(expectedMatrix);
        });
    });

    describe('Filter configuration', () => {
        it('should handle all convolution options', () => {
            const customMatrix = new Float32Array([1, 1, 1, 1, -8, 1, 1, 1, 1]);
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                matrix: customMatrix,
                width: 500,
                height: 400
            };

            createConvolutionFilter(config);
            
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: customMatrix,
                width: 500,
                height: 400
            });
        });

        it('should apply initial intensity if provided', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'boxBlur',
                intensity: 3
            };

            createConvolutionFilter(config);
            
            // Should blend 30% towards box blur matrix
            const boxBlurMatrix = new Float32Array([1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]);
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            const expectedMatrix = new Float32Array(9);
            for (let i = 0; i < 9; i++) {
                expectedMatrix[i] = identityMatrix[i] + (boxBlurMatrix[i] - identityMatrix[i]) * 0.3;
            }
            expect(mockConvolutionFilter.matrix).toEqual(expectedMatrix);
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true
            };

            const result = createConvolutionFilter(config);
            result.dispose();

            expect(mockConvolutionFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true
            };

            // Remove destroy method
            delete (mockConvolutionFilter as any).destroy;

            const result = createConvolutionFilter(config);
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'sharpen',
                intensity: 0
            };

            createConvolutionFilter(config);
            // Should be identity matrix (no effect)
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            expect(mockConvolutionFilter.matrix).toEqual(identityMatrix);
        });

        it('should handle maximum intensity values', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'edgeDetection',
                intensity: 10
            };

            createConvolutionFilter(config);
            // Should be full edge detection matrix
            const edgeDetectionMatrix = new Float32Array([-1, -1, -1, -1, 8, -1, -1, -1, -1]);
            expect(mockConvolutionFilter.matrix).toEqual(edgeDetectionMatrix);
        });

        it('should handle invalid preset gracefully', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                preset: 'invalidPreset' as any
            };

            createConvolutionFilter(config);
            // Should default to identity matrix
            const identityMatrix = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            expect(ConvolutionFilterMock).toHaveBeenCalledWith({
                matrix: identityMatrix,
                width: 200,
                height: 200
            });
        });

        it('should throw error for invalid intensity values in createFilterIntensity', () => {
            expect(() => createFilterIntensity(-1)).toThrow();
            expect(() => createFilterIntensity(11)).toThrow();
            expect(() => createFilterIntensity(NaN)).toThrow();
        });
    });

    describe('Type checking', () => {
        it('should enforce correct filter type', () => {
            const config: ConvolutionFilterConfig = {
                type: 'convolution',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('convolution');
        });
    });
}); 