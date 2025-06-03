import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAlphaFilter, type AlphaFilterConfig } from '../../../filters/AlphaFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PIXI AlphaFilter
const mockAlphaFilter = {
    alpha: 1.0,
    destroy: vi.fn()
};

vi.mock('pixi.js', () => ({
    AlphaFilter: vi.fn(() => mockAlphaFilter)
}));

describe('AlphaFilter', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Reset mock filter properties
        mockAlphaFilter.alpha = 1.0;
    });

    describe('Basic functionality', () => {
        it('should create an alpha filter with default settings', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true
            };

            const result = createAlphaFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with custom alpha value', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 0.5
            };

            createAlphaFilter(config);
            expect(mockAlphaFilter.alpha).toBe(0.5);
        });
    });

    describe('Intensity updates', () => {
        it('should update alpha based on intensity', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 1.0,
                intensity: 5
            };

            const result = createAlphaFilter(config);

            // Test various intensity levels
            result.updateIntensity(0);
            expect(mockAlphaFilter.alpha).toBe(0); // 1.0 * (0/10) = 0

            result.updateIntensity(5);
            expect(mockAlphaFilter.alpha).toBe(0.5); // 1.0 * (5/10) = 0.5

            result.updateIntensity(10);
            expect(mockAlphaFilter.alpha).toBe(1.0); // 1.0 * (10/10) = 1.0
        });

        it('should scale custom alpha value with intensity', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 0.8,
                intensity: 5
            };

            const result = createAlphaFilter(config);

            result.updateIntensity(5);
            expect(mockAlphaFilter.alpha).toBe(0.4); // 0.8 * (5/10) = 0.4
        });
    });

    describe('Reset functionality', () => {
        it('should reset to defaults when no alpha config provided', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                intensity: 7
            };

            const result = createAlphaFilter(config);

            // Reset should restore to defaults without applying intensity
            result.reset();
            expect(mockAlphaFilter.alpha).toBe(1.0);
        });

        it('should reset to configured values when alpha config provided', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 0.6,
                intensity: 8
            };

            const result = createAlphaFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore configured values and apply intensity
            result.reset();
            expect(mockAlphaFilter.alpha).toBeCloseTo(0.48); // 0.6 * (8/10) = 0.48
        });
    });

    describe('Filter configuration', () => {
        it('should handle default alpha of 1.0', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true
            };

            createAlphaFilter(config);
            expect(mockAlphaFilter.alpha).toBe(1.0);
        });

        it('should apply initial intensity if provided', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 0.8,
                intensity: 5
            };

            createAlphaFilter(config);
            expect(mockAlphaFilter.alpha).toBe(0.4); // 0.8 * (5/10)
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true
            };

            const result = createAlphaFilter(config);
            result.dispose();

            expect(mockAlphaFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true
            };

            // Remove destroy method
            delete (mockAlphaFilter as any).destroy;

            const result = createAlphaFilter(config);
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 1.0,
                intensity: 0
            };

            createAlphaFilter(config);
            expect(mockAlphaFilter.alpha).toBe(0); // Completely transparent
        });

        it('should handle maximum intensity values', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 0.7,
                intensity: 10
            };

            createAlphaFilter(config);
            expect(mockAlphaFilter.alpha).toBe(0.7); // Full configured alpha
        });

        it('should clamp alpha values to valid range', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                alpha: 1.5, // Invalid, should be clamped
                intensity: 5
            };

            const result = createAlphaFilter(config);

            result.updateIntensity(10);
            expect(mockAlphaFilter.alpha).toBeLessThanOrEqual(1.0);
        });

        it('should throw error for invalid intensity values in createFilterIntensity', () => {
            expect(() => createFilterIntensity(-1)).toThrow();
            expect(() => createFilterIntensity(11)).toThrow();
            expect(() => createFilterIntensity(NaN)).toThrow();
        });
    });

    describe('Type checking', () => {
        it('should enforce correct filter type', () => {
            const config: AlphaFilterConfig = {
                type: 'alpha',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('alpha');
        });
    });
}); 