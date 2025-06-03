import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBlurFilter, type BlurFilterConfig } from '../../../filters/BlurFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PIXI BlurFilter
const mockBlurFilter = {
    strength: 8,
    strengthX: 8,
    strengthY: 8,
    quality: 4,
    kernelSize: 5,
    resolution: 1,
    repeatEdgePixels: false,
    destroy: vi.fn()
};

vi.mock('pixi.js', () => ({
    BlurFilter: vi.fn(() => mockBlurFilter)
}));

describe('BlurFilter', () => {
    let BlurFilterMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Get the mock after imports are resolved
        const pixiModule = await import('pixi.js');
        BlurFilterMock = pixiModule.BlurFilter as any;
        
        // Reset mock filter properties
        mockBlurFilter.strength = 8;
        mockBlurFilter.strengthX = 8;
        mockBlurFilter.strengthY = 8;
        mockBlurFilter.quality = 4;
        mockBlurFilter.kernelSize = 5;
        mockBlurFilter.resolution = 1;
        mockBlurFilter.repeatEdgePixels = false;
    });

    describe('Basic functionality', () => {
        it('should create a blur filter with default settings', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true
            };

            const result = createBlurFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with custom strength values', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                strengthX: 10,
                strengthY: 15,
                quality: 2,
                kernelSize: 3
            };

            createBlurFilter(config);

            // Verify the constructor was called with the correct options
            expect(BlurFilterMock).toHaveBeenCalledWith({
                strength: 8,
                strengthX: 10,
                strengthY: 15,
                quality: 2,
                kernelSize: 3,
                resolution: 1
            });
        });
    });

    describe('Intensity updates', () => {
        it('should update blur strength based on intensity', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                intensity: 0
            };

            const result = createBlurFilter(config);

            // Test minimum intensity
            result.updateIntensity(0);
            expect(mockBlurFilter.strength).toBe(8); // Base strength

            // Test mid intensity  
            result.updateIntensity(5);
            expect(mockBlurFilter.strength).toBeCloseTo(54); // 8 + (5 * 9.2)

            // Test maximum intensity
            result.updateIntensity(10);
            expect(mockBlurFilter.strength).toBeCloseTo(100); // 8 + (10 * 9.2)
        });

        it('should update individual strength axes when configured', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                strengthX: 12,
                strengthY: 8,
                intensity: 4
            };

            createBlurFilter(config);

            // Verify individual axes are calculated correctly
            // strengthX: 12 + (4 * (12 * 0.5)) = 12 + (4 * 6) = 12 + 24 = 36
            // strengthY: 8 + (4 * (8 * 0.5)) = 8 + (4 * 4) = 8 + 16 = 24
            expect(mockBlurFilter.strengthX).toBeCloseTo(36); // 12 + (4 * 6)
            expect(mockBlurFilter.strengthY).toBeCloseTo(24); // 8 + (4 * 4)
        });
    });

    describe('Reset functionality', () => {
        it('should reset to defaults when no strength config provided', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                intensity: 7
            };

            const result = createBlurFilter(config);

            // Reset should restore to defaults without applying intensity
            result.reset();
            expect(mockBlurFilter.strength).toBe(8);
            expect(mockBlurFilter.strengthX).toBe(8);
            expect(mockBlurFilter.strengthY).toBe(8);
        });

        it('should reset to configured values when strength config provided', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                strengthX: 15,
                strengthY: 10,
                intensity: 5
            };

            const result = createBlurFilter(config);

            // Change values
            result.updateIntensity(8);

            // Reset should restore configured values and apply intensity
            result.reset();
            // strengthX: 15 + (5 * (15 * 0.5)) = 15 + (5 * 7.5) = 15 + 37.5 = 52.5
            // strengthY: 10 + (5 * (10 * 0.5)) = 10 + (5 * 5) = 10 + 25 = 35  
            expect(mockBlurFilter.strengthX).toBeCloseTo(52.5); // 15 + (5 * 7.5)
            expect(mockBlurFilter.strengthY).toBeCloseTo(35);   // 10 + (5 * 5)
        });
    });

    describe('Filter configuration', () => {
        it('should handle all blur filter options', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                strengthX: 20,
                strengthY: 15,
                quality: 8,
                kernelSize: 7,
                resolution: 2,
                repeatEdgePixels: true
            };

            createBlurFilter(config);

            expect(mockBlurFilter.repeatEdgePixels).toBe(true);
        });

        it('should use default values for unspecified options', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true
            };

            createBlurFilter(config);

            expect(BlurFilterMock).toHaveBeenCalledWith({
                strength: 8,
                strengthX: undefined,
                strengthY: undefined,
                quality: 4,
                kernelSize: 5,
                resolution: 1
            });
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true
            };

            const result = createBlurFilter(config);
            result.dispose();

            expect(mockBlurFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true
            };

            // Remove destroy method
            delete (mockBlurFilter as any).destroy;

            const result = createBlurFilter(config);
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                intensity: 0
            };

            const result = createBlurFilter(config);
            
            result.updateIntensity(0);
            expect(mockBlurFilter.strength).toBe(8); // Should remain at base value
        });

        it('should handle maximum intensity values', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                intensity: 10
            };

            createBlurFilter(config);
            expect(mockBlurFilter.strength).toBeCloseTo(100); // Should reach maximum
        });

        it('should throw error for invalid intensity values in createFilterIntensity', () => {
            expect(() => createFilterIntensity(-1)).toThrow();
            expect(() => createFilterIntensity(11)).toThrow();
            expect(() => createFilterIntensity(NaN)).toThrow();
        });
    });

    describe('Type checking', () => {
        it('should enforce correct filter type', () => {
            const config: BlurFilterConfig = {
                type: 'blur',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('blur');
        });
    });
}); 