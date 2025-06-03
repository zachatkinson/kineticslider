import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGrayscaleFilter, type GrayscaleFilterConfig } from '../../../filters/GrayscaleFilter';

// Mock the PIXI GrayscaleFilter from pixi-filters
const mockGrayscaleFilter = {
    enabled: true,
    alpha: 1.0,
    destroy: vi.fn()
};

vi.mock('pixi-filters', () => ({
    GrayscaleFilter: vi.fn(() => mockGrayscaleFilter)
}));

describe('GrayscaleFilter', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Reset mock filter properties
        mockGrayscaleFilter.enabled = true;
        mockGrayscaleFilter.alpha = 1.0;
    });

    describe('Basic functionality', () => {
        it('should create a grayscale filter with default settings', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true
            };

            const result = createGrayscaleFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with enabled state', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: false
            };

            createGrayscaleFilter(config);
            expect(mockGrayscaleFilter.enabled).toBe(false);
        });
    });

    describe('Intensity updates', () => {
        it('should update alpha based on intensity', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 5
            };

            const result = createGrayscaleFilter(config);

            // Test various intensity levels
            result.updateIntensity(0);
            expect(mockGrayscaleFilter.alpha).toBe(0); // (0/10) = 0
            expect(mockGrayscaleFilter.enabled).toBe(false);

            result.updateIntensity(5);
            expect(mockGrayscaleFilter.alpha).toBe(0.5); // (5/10) = 0.5
            expect(mockGrayscaleFilter.enabled).toBe(true);

            result.updateIntensity(10);
            expect(mockGrayscaleFilter.alpha).toBe(1.0); // (10/10) = 1.0
            expect(mockGrayscaleFilter.enabled).toBe(true);
        });

        it('should enable/disable filter based on intensity', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true
            };

            const result = createGrayscaleFilter(config);

            result.updateIntensity(0);
            expect(mockGrayscaleFilter.enabled).toBe(false);

            result.updateIntensity(1);
            expect(mockGrayscaleFilter.enabled).toBe(true);
        });
    });

    describe('Reset functionality', () => {
        it('should reset to defaults when no intensity config provided', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true
            };

            const result = createGrayscaleFilter(config);

            // Change values
            result.updateIntensity(3);

            // Reset should restore to defaults without applying intensity
            result.reset();
            expect(mockGrayscaleFilter.enabled).toBe(true);
            expect(mockGrayscaleFilter.alpha).toBe(1.0);
        });

        it('should reset to configured values when intensity config provided', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 6
            };

            const result = createGrayscaleFilter(config);

            // Change values
            result.updateIntensity(2);

            // Reset should restore configured values and apply intensity
            result.reset();
            expect(mockGrayscaleFilter.alpha).toBe(0.6); // (6/10) = 0.6
            expect(mockGrayscaleFilter.enabled).toBe(true);
        });
    });

    describe('Filter configuration', () => {
        it('should handle enabled state correctly', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: false
            };

            createGrayscaleFilter(config);
            expect(mockGrayscaleFilter.enabled).toBe(false);
        });

        it('should apply initial intensity if provided', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 4
            };

            createGrayscaleFilter(config);
            expect(mockGrayscaleFilter.alpha).toBe(0.4); // (4/10)
            expect(mockGrayscaleFilter.enabled).toBe(true);
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true
            };

            const result = createGrayscaleFilter(config);
            result.dispose();

            expect(mockGrayscaleFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true
            };

            // Remove destroy method
            delete (mockGrayscaleFilter as any).destroy;

            const result = createGrayscaleFilter(config);
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 0
            };

            createGrayscaleFilter(config);
            expect(mockGrayscaleFilter.alpha).toBe(0); // No grayscale effect
            expect(mockGrayscaleFilter.enabled).toBe(false);
        });

        it('should handle maximum intensity values', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 10
            };

            createGrayscaleFilter(config);
            expect(mockGrayscaleFilter.alpha).toBe(1.0); // Full effect
            expect(mockGrayscaleFilter.enabled).toBe(true);
        });

        it('should handle filter without alpha property', () => {
            // Remove alpha property to test fallback
            delete (mockGrayscaleFilter as any).alpha;

            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 5
            };

            const result = createGrayscaleFilter(config);
            
            // Should not throw even without alpha property
            expect(() => result.updateIntensity(8)).not.toThrow();
            expect(mockGrayscaleFilter.enabled).toBe(true);
        });
    });

    describe('Type checking', () => {
        it('should enforce correct filter type', () => {
            const config: GrayscaleFilterConfig = {
                type: 'grayscale',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('grayscale');
        });
    });
}); 