import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmbossFilter } from '../../../filters/EmbossFilter';
import type { EmbossFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the EmbossFilter from pixi-filters
const mockEmbossFilter = {
    strength: 5,
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
    EmbossFilter: vi.fn(() => mockEmbossFilter),
}));

describe('EmbossFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock filter properties to defaults
        mockEmbossFilter.strength = 5;
    });

    describe('createEmbossFilter', () => {
        it('should create filter with default configuration', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createEmbossFilter(config);

            expect(result).toBeDefined();
            expect(result.filter).toBe(mockEmbossFilter);
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
            
            // Since intensity 5 is applied at creation, strength = 5 * 2 = 10
            expect(mockEmbossFilter.strength).toBe(10);
        });

        it('should create filter with strength configuration', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(7),
                strength: 8,
            };

            const result = createEmbossFilter(config);

            expect(result.filter).toBe(mockEmbossFilter);
            // With intensity 7, strength = 7 * 2 = 14 (overriding configured 8)
            expect(mockEmbossFilter.strength).toBe(14);
        });

        it('should handle default strength when not configured', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(3),
            };

            const result = createEmbossFilter(config);

            expect(result.filter).toBe(mockEmbossFilter);
            // With intensity 3, strength = 3 * 2 = 6
            expect(mockEmbossFilter.strength).toBe(6);
        });
    });

    describe('updateIntensity', () => {
        it('should update intensity and map to strength correctly', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
                strength: 10,
            };

            const result = createEmbossFilter(config);
            
            result.updateIntensity(createFilterIntensity(8));
            expect(mockEmbossFilter.strength).toBe(16); // 8 * 2
        });

        it('should clamp intensity values to valid range', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createEmbossFilter(config);
            
            result.updateIntensity(createFilterIntensity(0));
            expect(mockEmbossFilter.strength).toBe(0);
            
            result.updateIntensity(createFilterIntensity(10));
            expect(mockEmbossFilter.strength).toBe(20); // 10 * 2
        });

        it('should handle intermediate intensity values correctly', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createEmbossFilter(config);
            
            // Test various intensity mappings
            result.updateIntensity(createFilterIntensity(2));
            expect(mockEmbossFilter.strength).toBe(4); // 2 * 2
            
            result.updateIntensity(createFilterIntensity(5));
            expect(mockEmbossFilter.strength).toBe(10); // 5 * 2
            
            result.updateIntensity(createFilterIntensity(9));
            expect(mockEmbossFilter.strength).toBe(18); // 9 * 2
        });
    });

    describe('reset', () => {
        it('should reset filter to original configuration', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
                strength: 12,
            };

            const result = createEmbossFilter(config);
            
            // Change the intensity
            result.updateIntensity(createFilterIntensity(8));
            expect(mockEmbossFilter.strength).toBe(16);
            
            // Reset should restore original configuration and apply initial intensity
            result.reset();
            expect(mockEmbossFilter.strength).toBe(10); // intensity 5 * 2 = 10 (overrides configured strength of 12)
        });

        it('should reset to default strength when not specified in config', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(3),
            };

            const result = createEmbossFilter(config);
            
            // Modify strength
            mockEmbossFilter.strength = 20;
            
            result.reset();
            
            // Should reset to default and apply intensity scaling
            expect(mockEmbossFilter.strength).toBe(6); // intensity 3 * 2 = 6
        });
    });

    describe('dispose', () => {
        it('should dispose filter properly', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createEmbossFilter(config);
            result.dispose?.();

            expect(mockEmbossFilter.destroy).toHaveBeenCalled();
        });
    });

    describe('getState', () => {
        it('should return current configuration state if getState is available', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
                strength: 8,
            };

            const result = createEmbossFilter(config);
            
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
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(0),
            };

            const _result = createEmbossFilter(config);
            expect(mockEmbossFilter.strength).toBe(0);
        });

        it('should work with intensity 10', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(10),
            };

            const _result = createEmbossFilter(config);
            expect(mockEmbossFilter.strength).toBe(20);
        });

        it('should handle missing optional properties gracefully', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createEmbossFilter(config);
            
            expect(result).toBeDefined();
            expect(result.filter).toBe(mockEmbossFilter);
        });

        it('should apply configured strength then override with intensity', () => {
            const config: EmbossFilterConfig = {
                type: 'emboss',
                enabled: true,
                intensity: createFilterIntensity(6),
                strength: 15,
            };

            const result = createEmbossFilter(config);
            
            // The configured strength is applied first, then intensity overrides it
            expect(result.filter).toBe(mockEmbossFilter);
            expect(mockEmbossFilter.strength).toBe(12); // intensity 6 * 2 = 12 (overrides configured 15)
        });
    });
}); 