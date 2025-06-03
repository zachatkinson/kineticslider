import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createColorReplaceFilter, type ColorReplaceFilterConfig } from '../../../filters/ColorReplaceFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PIXI ColorReplaceFilter from pixi-filters
const mockColorReplaceFilter = {
    originalColor: 0xff0000,
    targetColor: 0x000000,
    tolerance: 0.4,
    destroy: vi.fn()
};

vi.mock('pixi-filters', () => ({
    ColorReplaceFilter: vi.fn(() => mockColorReplaceFilter)
}));

describe('ColorReplaceFilter', () => {
    let ColorReplaceFilterMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Get the mock after imports are resolved
        const pixiFiltersModule = await import('pixi-filters');
        ColorReplaceFilterMock = pixiFiltersModule.ColorReplaceFilter as any;
        
        // Reset mock filter properties
        mockColorReplaceFilter.originalColor = 0xff0000;
        mockColorReplaceFilter.targetColor = 0x000000;
        mockColorReplaceFilter.tolerance = 0.4;
    });

    describe('Basic functionality', () => {
        it('should create a color replace filter with default settings', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true
            };

            const result = createColorReplaceFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with custom colors and tolerance', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                originalColor: 0x00ff00,
                targetColor: 0x0000ff,
                tolerance: 0.6
            };

            createColorReplaceFilter(config);
            
            expect(ColorReplaceFilterMock).toHaveBeenCalledWith({
                originalColor: 0x00ff00,
                targetColor: 0x0000ff,
                tolerance: 0.6
            });
        });

        it('should use default values when not specified', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true
            };

            createColorReplaceFilter(config);
            
            expect(ColorReplaceFilterMock).toHaveBeenCalledWith({
                originalColor: 0xff0000, // Default red
                targetColor: 0x000000,   // Default black
                tolerance: 0.4           // Default tolerance
            });
        });
    });

    describe('Intensity updates', () => {
        it('should adjust tolerance based on intensity (inverted for sensitivity)', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                tolerance: 0.4,
                intensity: 5
            };

            const result = createColorReplaceFilter(config);

            // Test various intensity levels
            result.updateIntensity(0);
            // toleranceScale = 1 - (0/10) = 1
            // tolerance = 0.4 * (0.1 + 1 * 0.9) = 0.4 * 1 = 0.4
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.4);

            result.updateIntensity(5);
            // toleranceScale = 1 - (5/10) = 0.5
            // tolerance = 0.4 * (0.1 + 0.5 * 0.9) = 0.4 * 0.55 = 0.22
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.22);

            result.updateIntensity(10);
            // toleranceScale = 1 - (10/10) = 0
            // tolerance = 0.4 * (0.1 + 0 * 0.9) = 0.4 * 0.1 = 0.04
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.04);
        });

        it('should work with custom tolerance values', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                tolerance: 0.8,
                intensity: 5
            };

            const result = createColorReplaceFilter(config);

            result.updateIntensity(5);
            // toleranceScale = 1 - (5/10) = 0.5
            // tolerance = 0.8 * (0.1 + 0.5 * 0.9) = 0.8 * 0.55 = 0.44
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.44);
        });
    });

    describe('Reset functionality', () => {
        it('should reset to defaults when no tolerance config provided', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                originalColor: 0x00ff00,
                targetColor: 0x0000ff,
                intensity: 7
            };

            const result = createColorReplaceFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore to defaults without applying intensity
            result.reset();
            expect(mockColorReplaceFilter.tolerance).toBe(0.4);
            expect(mockColorReplaceFilter.originalColor).toBe(0x00ff00);
            expect(mockColorReplaceFilter.targetColor).toBe(0x0000ff);
        });

        it('should reset to configured values when tolerance config provided', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                originalColor: 0x00ff00,
                targetColor: 0x0000ff,
                tolerance: 0.6,
                intensity: 8
            };

            const result = createColorReplaceFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore configured values and apply intensity
            result.reset();
            // Should apply intensity 8: tolerance = 0.6 * (0.1 + 0.2 * 0.9) = 0.6 * 0.28 = 0.168
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.168);
            expect(mockColorReplaceFilter.originalColor).toBe(0x00ff00);
            expect(mockColorReplaceFilter.targetColor).toBe(0x0000ff);
        });
    });

    describe('Filter configuration', () => {
        it('should handle all color replace options', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                originalColor: 0xffffff,
                targetColor: 0x000000,
                tolerance: 0.3
            };

            createColorReplaceFilter(config);
            
            expect(ColorReplaceFilterMock).toHaveBeenCalledWith({
                originalColor: 0xffffff,
                targetColor: 0x000000,
                tolerance: 0.3
            });
        });

        it('should apply initial intensity if provided', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                tolerance: 0.5,
                intensity: 6
            };

            createColorReplaceFilter(config);
            // Should apply intensity 6: tolerance = 0.5 * (0.1 + 0.4 * 0.9) = 0.5 * 0.46 = 0.23
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.23);
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true
            };

            const result = createColorReplaceFilter(config);
            result.dispose();

            expect(mockColorReplaceFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true
            };

            // Remove destroy method
            delete (mockColorReplaceFilter as any).destroy;

            const result = createColorReplaceFilter(config);
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                tolerance: 0.4,
                intensity: 0
            };

            createColorReplaceFilter(config);
            expect(mockColorReplaceFilter.tolerance).toBe(0.4); // Maximum tolerance (least sensitive)
        });

        it('should handle maximum intensity values', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                tolerance: 0.4,
                intensity: 10
            };

            createColorReplaceFilter(config);
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.04); // Minimum tolerance (most sensitive)
        });

        it('should maintain minimum tolerance threshold', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                tolerance: 0.1,
                intensity: 10
            };

            const result = createColorReplaceFilter(config);
            
            result.updateIntensity(10);
            // Even with max intensity, should maintain 10% of base tolerance
            expect(mockColorReplaceFilter.tolerance).toBeCloseTo(0.01); // 0.1 * 0.1
        });

        it('should throw error for invalid intensity values in createFilterIntensity', () => {
            expect(() => createFilterIntensity(-1)).toThrow();
            expect(() => createFilterIntensity(11)).toThrow();
            expect(() => createFilterIntensity(NaN)).toThrow();
        });
    });

    describe('Type checking', () => {
        it('should enforce correct filter type', () => {
            const config: ColorReplaceFilterConfig = {
                type: 'colorReplace',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('colorReplace');
        });
    });
}); 