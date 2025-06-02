import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOldFilmFilter } from '../../../filters/OldFilmFilter';
import type { OldFilmFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the OldFilmFilter from pixi-filters
const mockOldFilmFilter = {
    sepia: 0.3,
    noise: 0.3,
    noiseSize: 1.0,
    scratch: 0.5,
    scratchDensity: 0.3,
    scratchWidth: 1.0,
    vignetting: 0.3,
    vignettingAlpha: 1.0,
    vignettingBlur: 0.3,
    seed: 0,
    destroy: vi.fn(),
    enabled: true,
    blendMode: 0,
    resolution: 1,
    multisample: false,
    padding: 0,
    autoFit: true,
    state: null,
    legacy: false,
};

vi.mock('pixi-filters', () => ({
    OldFilmFilter: vi.fn(() => mockOldFilmFilter),
}));

describe('OldFilmFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock filter properties to defaults
        mockOldFilmFilter.sepia = 0.3;
        mockOldFilmFilter.noise = 0.3;
        mockOldFilmFilter.noiseSize = 1.0;
        mockOldFilmFilter.scratch = 0.5;
        mockOldFilmFilter.scratchDensity = 0.3;
        mockOldFilmFilter.scratchWidth = 1.0;
        mockOldFilmFilter.vignetting = 0.3;
        mockOldFilmFilter.vignettingAlpha = 1.0;
        mockOldFilmFilter.vignettingBlur = 0.3;
        mockOldFilmFilter.seed = 0;
    });

    describe('createOldFilmFilter', () => {
        it('should create filter with default configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createOldFilmFilter(config);

            expect(result).toBeDefined();
            expect(result.filter).toBe(mockOldFilmFilter);
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
            
            // Since intensity 5 is applied at creation, with no primary property, all effects are scaled to 0.5 * defaultValues
            expect(mockOldFilmFilter.sepia).toBe(0.15); // 0.5 * 0.3
            expect(mockOldFilmFilter.noise).toBe(0.15); // 0.5 * 0.3  
            expect(mockOldFilmFilter.scratch).toBe(0.25); // 0.5 * 0.5
            expect(mockOldFilmFilter.vignetting).toBe(0.15); // 0.5 * 0.3
        });

        it('should create filter with sepia configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(7),
                sepia: 0.8,
                primaryProperty: 'sepia',
            };

            const result = createOldFilmFilter(config);

            expect(result.filter).toBe(mockOldFilmFilter);
            // With primaryProperty 'sepia', intensity 7 maps to sepia = 7/10 = 0.7 (overriding configured 0.8)
            expect(mockOldFilmFilter.sepia).toBe(0.7);
        });

        it('should create filter with noise configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(6),
                noise: 0.5,
                noiseSize: 2.0,
                primaryProperty: 'noise',
            };

            const result = createOldFilmFilter(config);

            expect(result.filter).toBe(mockOldFilmFilter);
            // With primaryProperty 'noise', intensity 6 maps to noise = 6/10 = 0.6 (overriding configured 0.5)
            expect(mockOldFilmFilter.noise).toBe(0.6);
            expect(mockOldFilmFilter.noiseSize).toBe(2.0);
        });

        it('should create filter with scratch configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(8),
                scratch: 0.7,
                scratchDensity: 0.4,
                scratchWidth: 1.5,
                primaryProperty: 'scratch',
            };

            const result = createOldFilmFilter(config);

            expect(result.filter).toBe(mockOldFilmFilter);
            // With primaryProperty 'scratch', intensity 8 maps to scratch = 8/10 = 0.8 (overriding configured 0.7)
            expect(mockOldFilmFilter.scratch).toBe(0.8);
            expect(mockOldFilmFilter.scratchDensity).toBe(0.4);
            expect(mockOldFilmFilter.scratchWidth).toBe(1.5);
        });

        it('should create filter with vignetting configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(4),
                vignetting: 0.6,
                vignettingAlpha: 0.8,
                vignettingBlur: 0.5,
                primaryProperty: 'vignetting',
            };

            const result = createOldFilmFilter(config);

            expect(result.filter).toBe(mockOldFilmFilter);
            // With primaryProperty 'vignetting', intensity 4 maps to vignetting = 4/10 = 0.4 (overriding configured 0.6)
            expect(mockOldFilmFilter.vignetting).toBe(0.4);
            expect(mockOldFilmFilter.vignettingAlpha).toBe(0.8);
            expect(mockOldFilmFilter.vignettingBlur).toBe(0.5);
        });

        it('should create filter with all properties configured', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(3), // This will scale down the default effects
                sepia: 0.4,
                noise: 0.6,
                noiseSize: 1.5,
                scratch: 0.8,
                scratchDensity: 0.5,
                scratchWidth: 2.0,
                vignetting: 0.7,
                vignettingAlpha: 0.9,
                vignettingBlur: 0.4,
                seed: 12345,
            };

            const result = createOldFilmFilter(config);

            expect(result.filter).toBe(mockOldFilmFilter);
            // With no primaryProperty and intensity 3, proportional scaling: 0.3 * defaultValues
            expect(mockOldFilmFilter.sepia).toBe(0.09); // 0.3 * 0.3
            expect(mockOldFilmFilter.noise).toBe(0.09); // 0.3 * 0.3
            expect(mockOldFilmFilter.noiseSize).toBe(1.5);
            expect(mockOldFilmFilter.scratch).toBe(0.15); // 0.3 * 0.5
            expect(mockOldFilmFilter.scratchDensity).toBe(0.5);
            expect(mockOldFilmFilter.scratchWidth).toBe(2.0);
            expect(mockOldFilmFilter.vignetting).toBe(0.09); // 0.3 * 0.3
            expect(mockOldFilmFilter.vignettingAlpha).toBe(0.9);
            expect(mockOldFilmFilter.vignettingBlur).toBe(0.4);
            expect(mockOldFilmFilter.seed).toBe(12345);
        });

        it('should create filter with seed configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                seed: 9999,
            };

            const result = createOldFilmFilter(config);

            expect(result.filter).toBe(mockOldFilmFilter);
            expect(mockOldFilmFilter.seed).toBe(9999);
        });
    });

    describe('updateIntensity', () => {
        it('should update intensity with sepia as primary property', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                sepia: 0.5,
                primaryProperty: 'sepia',
            };

            const result = createOldFilmFilter(config);
            
            result.updateIntensity(createFilterIntensity(8));
            expect(mockOldFilmFilter.sepia).toBe(0.8); // 8/10
        });

        it('should update intensity with noise as primary property', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                noise: 0.5,
                primaryProperty: 'noise',
            };

            const result = createOldFilmFilter(config);
            
            result.updateIntensity(createFilterIntensity(7));
            expect(mockOldFilmFilter.noise).toBe(0.7); // 7/10
        });

        it('should update intensity with scratch as primary property', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                scratch: 0.5,
                primaryProperty: 'scratch',
            };

            const result = createOldFilmFilter(config);
            
            result.updateIntensity(createFilterIntensity(6));
            expect(mockOldFilmFilter.scratch).toBe(0.6); // 6/10
        });

        it('should update intensity with vignetting as primary property', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                vignetting: 0.5,
                primaryProperty: 'vignetting',
            };

            const result = createOldFilmFilter(config);
            
            result.updateIntensity(createFilterIntensity(9));
            expect(mockOldFilmFilter.vignetting).toBe(0.9); // 9/10
        });

        it('should update all properties proportionally when no primary property is specified', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createOldFilmFilter(config);
            
            // Start from known state after initial intensity 5 (0.5 scaling)
            expect(mockOldFilmFilter.sepia).toBe(0.15); // 0.5 * 0.3
            expect(mockOldFilmFilter.noise).toBe(0.15); // 0.5 * 0.3
            expect(mockOldFilmFilter.scratch).toBe(0.25); // 0.5 * 0.5
            expect(mockOldFilmFilter.vignetting).toBe(0.15); // 0.5 * 0.3
            
            result.updateIntensity(createFilterIntensity(8));
            
            // When no primary property, it should scale all effects proportionally with intensity 8 (0.8 scaling)
            expect(mockOldFilmFilter.sepia).toBe(0.24); // 0.8 * 0.3
            expect(mockOldFilmFilter.noise).toBe(0.24); // 0.8 * 0.3
            expect(mockOldFilmFilter.scratch).toBe(0.4); // 0.8 * 0.5
            expect(mockOldFilmFilter.vignetting).toBe(0.24); // 0.8 * 0.3
        });

        it('should clamp intensity values to valid range', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                sepia: 0.5,
                primaryProperty: 'sepia',
            };

            const result = createOldFilmFilter(config);
            
            result.updateIntensity(createFilterIntensity(0));
            expect(mockOldFilmFilter.sepia).toBe(0);
            
            result.updateIntensity(createFilterIntensity(10));
            expect(mockOldFilmFilter.sepia).toBe(1);
        });
    });

    describe('reset', () => {
        it('should reset filter to original configuration', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                sepia: 0.6,
                noise: 0.4,
                primaryProperty: 'sepia',
            };

            const result = createOldFilmFilter(config);
            
            // Change the intensity
            result.updateIntensity(createFilterIntensity(8));
            expect(mockOldFilmFilter.sepia).toBe(0.8);
            
            // Reset should restore original configuration and apply initial intensity
            result.reset();
            expect(mockOldFilmFilter.sepia).toBe(0.5); // intensity 5 with primary property 'sepia' = 5/10
            expect(mockOldFilmFilter.noise).toBe(0.4);
        });

        it('should reset all properties to defaults when not specified in config', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(3), // Will scale to 0.3
            };

            const result = createOldFilmFilter(config);
            
            // Modify properties
            mockOldFilmFilter.sepia = 0.9;
            mockOldFilmFilter.noise = 0.8;
            
            result.reset();
            
            // Should reset to default values and apply intensity scaling
            expect(mockOldFilmFilter.sepia).toBe(0.09); // 0.3 * 0.3
            expect(mockOldFilmFilter.noise).toBe(0.09); // 0.3 * 0.3
            expect(mockOldFilmFilter.noiseSize).toBe(1.0);
            expect(mockOldFilmFilter.scratch).toBe(0.15); // 0.3 * 0.5
            expect(mockOldFilmFilter.scratchDensity).toBe(0.3);
            expect(mockOldFilmFilter.scratchWidth).toBe(1.0);
            expect(mockOldFilmFilter.vignetting).toBe(0.09); // 0.3 * 0.3
            expect(mockOldFilmFilter.vignettingAlpha).toBe(1.0);
            expect(mockOldFilmFilter.vignettingBlur).toBe(0.3);
            // Note: seed is random, so we don't test it
        });
    });

    describe('dispose', () => {
        it('should dispose filter properly', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createOldFilmFilter(config);
            result.dispose?.();

            expect(mockOldFilmFilter.destroy).toHaveBeenCalled();
        });
    });

    describe('getState', () => {
        it('should return current configuration state if getState is available', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                sepia: 0.6,
                noise: 0.4,
                primaryProperty: 'sepia',
            };

            const result = createOldFilmFilter(config);
            
            if (result.getState) {
                const state = result.getState();
                expect(state).toEqual(config);
            } else {
                // getState is optional, so if it doesn't exist, that's fine
                expect(result.getState).toBeUndefined();
            }
        });
    });

    describe('edge cases', () => {
        it('should work with intensity 0', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(0),
                primaryProperty: 'sepia',
            };

            const _result = createOldFilmFilter(config);
            expect(mockOldFilmFilter.sepia).toBe(0);
        });

        it('should work with intensity 10', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(10),
                primaryProperty: 'noise',
            };

            const _result = createOldFilmFilter(config);
            expect(mockOldFilmFilter.noise).toBe(1);
        });

        it('should handle missing optional properties gracefully', () => {
            const config: OldFilmFilterConfig = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createOldFilmFilter(config);
            
            expect(result).toBeDefined();
            expect(result.filter).toBe(mockOldFilmFilter);
        });

        it('should handle invalid primary property gracefully', () => {
            const config: any = {
                type: 'oldFilm',
                enabled: true,
                intensity: createFilterIntensity(5),
                primaryProperty: 'invalid',
            };

            const result = createOldFilmFilter(config);
            
            // Should still create the filter even with invalid primary property
            expect(result).toBeDefined();
            expect(result.filter).toBe(mockOldFilmFilter);
        });
    });
}); 