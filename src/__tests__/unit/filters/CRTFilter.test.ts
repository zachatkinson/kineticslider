import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCRTFilter, type CRTFilterConfig } from '../../../filters/CRTFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PIXI CRTFilter from pixi-filters
const mockCRTFilter = {
    curvature: 1.0,
    lineContrast: 0.25,
    lineWidth: 1.0,
    noise: 0.3,
    noiseSize: 1.0,
    seed: 0,
    time: 0,
    verticalLine: false,
    vignetting: 0.3,
    vignettingAlpha: 1.0,
    vignettingBlur: 0.3,
    destroy: vi.fn()
};

vi.mock('pixi-filters', () => ({
    CRTFilter: vi.fn(() => mockCRTFilter)
}));

describe('CRTFilter', () => {
    let CRTFilterMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Get the mock after imports are resolved
        const pixiFiltersModule = await import('pixi-filters');
        CRTFilterMock = pixiFiltersModule.CRTFilter as any;
        
        // Reset mock filter properties
        mockCRTFilter.curvature = 1.0;
        mockCRTFilter.lineContrast = 0.25;
        mockCRTFilter.lineWidth = 1.0;
        mockCRTFilter.noise = 0.3;
        mockCRTFilter.noiseSize = 1.0;
        mockCRTFilter.seed = 0;
        mockCRTFilter.time = 0;
        mockCRTFilter.verticalLine = false;
        mockCRTFilter.vignetting = 0.3;
        mockCRTFilter.vignettingAlpha = 1.0;
        mockCRTFilter.vignettingBlur = 0.3;
    });

    describe('Basic functionality', () => {
        it('should create a CRT filter with default settings', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true
            };

            const result = createCRTFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with custom configuration', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                curvature: 2.0,
                lineContrast: 0.5,
                lineWidth: 1.5,
                noise: 0.4,
                noiseSize: 2.0,
                seed: 123,
                time: 10.5,
                verticalLine: true,
                vignetting: 0.5,
                vignettingAlpha: 0.8,
                vignettingBlur: 0.4
            };

            createCRTFilter(config);
            
            expect(CRTFilterMock).toHaveBeenCalledWith({
                curvature: 2.0,
                lineContrast: 0.5,
                lineWidth: 1.5,
                noise: 0.4,
                noiseSize: 2.0,
                seed: 123,
                time: 10.5,
                verticalLine: true,
                vignetting: 0.5,
                vignettingAlpha: 0.8,
                vignettingBlur: 0.4
            });
        });

        it('should create filter with minimal configuration', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.6
            };

            createCRTFilter(config);
            
            expect(CRTFilterMock).toHaveBeenCalledWith({
                noise: 0.6
            });
        });
    });

    describe('Intensity updates', () => {
        it('should update CRT effects based on intensity', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.2,
                lineContrast: 0.3,
                curvature: 1.5,
                vignetting: 0.4,
                intensity: 5
            };

            const result = createCRTFilter(config);

            // Test various intensity levels
            result.updateIntensity(0);
            expect(mockCRTFilter.noise).toBe(0.2); // 0.2 + (0 * 0.07) = 0.2
            expect(mockCRTFilter.lineContrast).toBe(0.3); // 0.3 + (0 * 0.075) = 0.3
            expect(mockCRTFilter.curvature).toBe(1.5); // 1.5 + (0 * 0.9) = 1.5
            expect(mockCRTFilter.vignetting).toBe(0.4); // 0.4 + (0 * 0.07) = 0.4

            result.updateIntensity(5);
            expect(mockCRTFilter.noise).toBeCloseTo(0.55); // 0.2 + (5 * 0.07) = 0.55
            expect(mockCRTFilter.lineContrast).toBeCloseTo(0.675); // 0.3 + (5 * 0.075) = 0.675
            expect(mockCRTFilter.curvature).toBeCloseTo(6.0); // 1.5 + (5 * 0.9) = 6.0
            expect(mockCRTFilter.vignetting).toBeCloseTo(0.75); // 0.4 + (5 * 0.07) = 0.75

            result.updateIntensity(10);
            expect(mockCRTFilter.noise).toBeCloseTo(0.9); // 0.2 + (10 * 0.07) = 0.9
            expect(mockCRTFilter.lineContrast).toBeCloseTo(1.05); // 0.3 + (10 * 0.075) = 1.05
            expect(mockCRTFilter.curvature).toBeCloseTo(10.5); // 1.5 + (10 * 0.9) = 10.5
            expect(mockCRTFilter.vignetting).toBeCloseTo(1.1); // 0.4 + (10 * 0.07) = 1.1
        });

        it('should use default values when not configured', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                intensity: 6
            };

            createCRTFilter(config);

            // Should use defaults: noise=0.3, lineContrast=0.25, curvature=1.0, vignetting=0.3
            expect(mockCRTFilter.noise).toBeCloseTo(0.72); // 0.3 + (6 * 0.07) = 0.72
            expect(mockCRTFilter.lineContrast).toBeCloseTo(0.7); // 0.25 + (6 * 0.075) = 0.7
            expect(mockCRTFilter.curvature).toBeCloseTo(6.4); // 1.0 + (6 * 0.9) = 6.4
            expect(mockCRTFilter.vignetting).toBeCloseTo(0.72); // 0.3 + (6 * 0.07) = 0.72
        });

        it('should scale line width when configured', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                lineWidth: 2.0,
                intensity: 4
            };

            const result = createCRTFilter(config);

            result.updateIntensity(4);
            expect(mockCRTFilter.lineWidth).toBeCloseTo(3.8); // 2.0 + (4 * 0.45) = 3.8
        });

        it('should not modify line width when not configured', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                intensity: 4
            };

            createCRTFilter(config);
            // lineWidth should remain unchanged if not configured
            expect(mockCRTFilter.lineWidth).toBe(1.0);
        });
    });

    describe('Reset functionality', () => {
        it('should reset to defaults when no CRT config provided', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                lineWidth: 2.0, // This doesn't count as CRT config
                intensity: 7
            };

            const result = createCRTFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore to defaults without applying intensity
            result.reset();
            expect(mockCRTFilter.noise).toBe(0.3);
            expect(mockCRTFilter.lineContrast).toBe(0.25);
            expect(mockCRTFilter.curvature).toBe(1.0);
            expect(mockCRTFilter.vignetting).toBe(0.3);
            expect(mockCRTFilter.lineWidth).toBe(2.0);
        });

        it('should reset to configured values when CRT config provided', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.5,
                lineContrast: 0.6,
                curvature: 2.0,
                vignetting: 0.8,
                lineWidth: 1.5,
                intensity: 8
            };

            const result = createCRTFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore configured values and apply intensity
            result.reset();
            expect(mockCRTFilter.noise).toBeCloseTo(1.06); // 0.5 + (8 * 0.07) = 1.06
            expect(mockCRTFilter.lineContrast).toBeCloseTo(1.2); // 0.6 + (8 * 0.075) = 1.2
            expect(mockCRTFilter.curvature).toBeCloseTo(9.2); // 2.0 + (8 * 0.9) = 9.2
            expect(mockCRTFilter.vignetting).toBeCloseTo(1.36); // 0.8 + (8 * 0.07) = 1.36
            expect(mockCRTFilter.lineWidth).toBeCloseTo(5.1); // 1.5 + (8 * 0.45) = 5.1
        });

        it('should reset additional properties when configured', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.4, // This makes it count as CRT config
                noiseSize: 2.0,
                vignettingAlpha: 0.7,
                vignettingBlur: 0.5,
                intensity: 6
            };

            const result = createCRTFilter(config);

            result.reset();
            expect(mockCRTFilter.noiseSize).toBe(2.0);
            expect(mockCRTFilter.vignettingAlpha).toBe(0.7);
            expect(mockCRTFilter.vignettingBlur).toBe(0.5);
        });
    });

    describe('Filter configuration', () => {
        it('should handle all CRT options', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                curvature: 3.0,
                lineContrast: 0.8,
                lineWidth: 2.5,
                noise: 0.7,
                noiseSize: 1.5,
                seed: 456,
                time: 25.0,
                verticalLine: true,
                vignetting: 0.9,
                vignettingAlpha: 0.6,
                vignettingBlur: 0.8
            };

            createCRTFilter(config);
            
            expect(CRTFilterMock).toHaveBeenCalledWith({
                curvature: 3.0,
                lineContrast: 0.8,
                lineWidth: 2.5,
                noise: 0.7,
                noiseSize: 1.5,
                seed: 456,
                time: 25.0,
                verticalLine: true,
                vignetting: 0.9,
                vignettingAlpha: 0.6,
                vignettingBlur: 0.8
            });
        });

        it('should apply initial intensity if provided', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.2,
                curvature: 1.0,
                intensity: 3
            };

            createCRTFilter(config);
            expect(mockCRTFilter.noise).toBeCloseTo(0.41); // 0.2 + (3 * 0.07) = 0.41
            expect(mockCRTFilter.curvature).toBeCloseTo(3.7); // 1.0 + (3 * 0.9) = 3.7
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true
            };

            const result = createCRTFilter(config);
            result.dispose();

            expect(mockCRTFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true
            };

            // Remove destroy method
            delete (mockCRTFilter as any).destroy;

            const result = createCRTFilter(config);
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.4,
                curvature: 2.0,
                intensity: 0
            };

            createCRTFilter(config);
            expect(mockCRTFilter.noise).toBe(0.4); // No additional effect
            expect(mockCRTFilter.curvature).toBe(2.0);
        });

        it('should handle maximum intensity values', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                noise: 0.1,
                lineContrast: 0.1,
                curvature: 0.5,
                vignetting: 0.1,
                intensity: 10
            };

            createCRTFilter(config);
            expect(mockCRTFilter.noise).toBeCloseTo(0.8); // 0.1 + (10 * 0.07) = 0.8
            expect(mockCRTFilter.lineContrast).toBeCloseTo(0.85); // 0.1 + (10 * 0.075) = 0.85
            expect(mockCRTFilter.curvature).toBeCloseTo(9.5); // 0.5 + (10 * 0.9) = 9.5
            expect(mockCRTFilter.vignetting).toBeCloseTo(0.8); // 0.1 + (10 * 0.07) = 0.8
        });

        it('should handle boolean values correctly', () => {
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                verticalLine: true,
                seed: 0,
                time: 0.0
            };

            createCRTFilter(config);
            
            expect(CRTFilterMock).toHaveBeenCalledWith({
                verticalLine: true,
                seed: 0,
                time: 0.0
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
            const config: CRTFilterConfig = {
                type: 'crt',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('crt');
        });
    });
}); 