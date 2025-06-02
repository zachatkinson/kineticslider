import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBulgePinchFilter } from '../../../filters/BulgePinchFilter';
import type { BulgePinchFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the BulgePinchFilter from pixi-filters
const mockBulgePinchFilter = {
    strength: 0.5,
    radius: 100,
    center: [0.5, 0.5],
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
    BulgePinchFilter: vi.fn(() => mockBulgePinchFilter),
}));

describe('BulgePinchFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock filter properties to defaults
        mockBulgePinchFilter.strength = 0.5;
        mockBulgePinchFilter.radius = 100;
        mockBulgePinchFilter.center = [0.5, 0.5];
    });

    describe('createBulgePinchFilter', () => {
        it('should create filter with default configuration', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createBulgePinchFilter(config);

            expect(result).toBeDefined();
            expect(result.filter).toBe(mockBulgePinchFilter);
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
            
            // Since intensity 5 is applied at creation with default behavior (strength), strength = (5-5)/5 = 0
            expect(mockBulgePinchFilter.strength).toBe(0);
            expect(mockBulgePinchFilter.radius).toBe(100);
            expect(mockBulgePinchFilter.center).toEqual([0.5, 0.5]);
        });

        it('should create filter with strength configuration', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(7),
                strength: 0.8,
                primaryProperty: 'strength',
            };

            const result = createBulgePinchFilter(config);

            expect(result.filter).toBe(mockBulgePinchFilter);
            // With primaryProperty 'strength' and intensity 7, strength = (7-5)/5 = 0.4 (overriding configured 0.8)
            expect(mockBulgePinchFilter.strength).toBe(0.4);
        });

        it('should create filter with radius configuration', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(6),
                radius: 150,
                primaryProperty: 'radius',
            };

            const result = createBulgePinchFilter(config);

            expect(result.filter).toBe(mockBulgePinchFilter);
            // With primaryProperty 'radius' and intensity 6, radius = 20 + (6 * 18) = 128 (overriding configured 150)
            expect(mockBulgePinchFilter.radius).toBe(128);
        });

        it('should create filter with center configuration using center object', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                center: { x: 0.3, y: 0.7 },
            };

            const result = createBulgePinchFilter(config);

            expect(result.filter).toBe(mockBulgePinchFilter);
            expect(mockBulgePinchFilter.center).toEqual([0.3, 0.7]);
        });

        it('should create filter with center configuration using centerX and centerY', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                centerX: 0.2,
                centerY: 0.8,
            };

            const result = createBulgePinchFilter(config);

            expect(result.filter).toBe(mockBulgePinchFilter);
            expect(mockBulgePinchFilter.center).toEqual([0.2, 0.8]);
        });

        it('should prioritize centerX/centerY over center object', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                center: { x: 0.3, y: 0.7 },
                centerX: 0.1,
                centerY: 0.9,
            };

            const result = createBulgePinchFilter(config);

            expect(result.filter).toBe(mockBulgePinchFilter);
            expect(mockBulgePinchFilter.center).toEqual([0.1, 0.9]);
        });

        it('should create filter with all properties configured', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(8),
                strength: 0.7,
                radius: 120,
                centerX: 0.6,
                centerY: 0.4,
                primaryProperty: 'strength',
            };

            const result = createBulgePinchFilter(config);

            expect(result.filter).toBe(mockBulgePinchFilter);
            // With primaryProperty 'strength' and intensity 8, strength = (8-5)/5 = 0.6 (overriding configured 0.7)
            expect(mockBulgePinchFilter.strength).toBe(0.6);
            expect(mockBulgePinchFilter.radius).toBe(120);
            expect(mockBulgePinchFilter.center).toEqual([0.6, 0.4]);
        });
    });

    describe('updateIntensity', () => {
        it('should update intensity with strength as primary property', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                primaryProperty: 'strength',
            };

            const result = createBulgePinchFilter(config);
            
            result.updateIntensity(createFilterIntensity(8));
            expect(mockBulgePinchFilter.strength).toBe(0.6); // (8-5)/5
        });

        it('should update intensity with radius as primary property', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                primaryProperty: 'radius',
            };

            const result = createBulgePinchFilter(config);
            
            result.updateIntensity(createFilterIntensity(7));
            expect(mockBulgePinchFilter.radius).toBe(146); // 20 + (7 * 18)
        });

        it('should update intensity with default behavior (strength)', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createBulgePinchFilter(config);
            
            result.updateIntensity(createFilterIntensity(9));
            expect(mockBulgePinchFilter.strength).toBe(0.8); // (9-5)/5
        });

        it('should clamp intensity values to valid range', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                primaryProperty: 'strength',
            };

            const result = createBulgePinchFilter(config);
            
            result.updateIntensity(createFilterIntensity(0));
            expect(mockBulgePinchFilter.strength).toBe(-1); // (0-5)/5
            
            result.updateIntensity(createFilterIntensity(10));
            expect(mockBulgePinchFilter.strength).toBe(1); // (10-5)/5
        });

        it('should handle intermediate intensity values correctly for radius', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                primaryProperty: 'radius',
            };

            const result = createBulgePinchFilter(config);
            
            // Test various intensity mappings for radius
            result.updateIntensity(createFilterIntensity(0));
            expect(mockBulgePinchFilter.radius).toBe(20); // 20 + (0 * 18)
            
            result.updateIntensity(createFilterIntensity(5));
            expect(mockBulgePinchFilter.radius).toBe(110); // 20 + (5 * 18)
            
            result.updateIntensity(createFilterIntensity(10));
            expect(mockBulgePinchFilter.radius).toBe(200); // 20 + (10 * 18)
        });
    });

    describe('reset', () => {
        it('should reset filter to original configuration', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                strength: 0.8,
                radius: 150,
                centerX: 0.3,
                centerY: 0.7,
                primaryProperty: 'strength',
            };

            const result = createBulgePinchFilter(config);
            
            // Change the intensity
            result.updateIntensity(createFilterIntensity(8));
            expect(mockBulgePinchFilter.strength).toBe(0.6);
            
            // Reset should restore original configuration and apply initial intensity
            result.reset();
            expect(mockBulgePinchFilter.strength).toBe(0); // intensity 5 with strength: (5-5)/5 = 0 (overrides configured 0.8)
            expect(mockBulgePinchFilter.radius).toBe(150);
            expect(mockBulgePinchFilter.center).toEqual([0.3, 0.7]);
        });

        it('should reset to defaults when not specified in config', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(3),
            };

            const result = createBulgePinchFilter(config);
            
            // Modify properties
            mockBulgePinchFilter.strength = 0.9;
            mockBulgePinchFilter.radius = 200;
            mockBulgePinchFilter.center = [0.1, 0.9];
            
            result.reset();
            
            // Should reset to default values and apply intensity
            expect(mockBulgePinchFilter.strength).toBe(-0.4); // intensity 3: (3-5)/5 = -0.4
            expect(mockBulgePinchFilter.radius).toBe(100);
            expect(mockBulgePinchFilter.center).toEqual([0.5, 0.5]);
        });
    });

    describe('dispose', () => {
        it('should dispose filter properly', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createBulgePinchFilter(config);
            result.dispose?.();

            expect(mockBulgePinchFilter.destroy).toHaveBeenCalled();
        });
    });

    describe('getState', () => {
        it('should return current configuration state if getState is available', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                strength: 0.6,
                radius: 120,
            };

            const result = createBulgePinchFilter(config);
            
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
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(0),
                primaryProperty: 'strength',
            };

            const _result = createBulgePinchFilter(config);
            expect(mockBulgePinchFilter.strength).toBe(-1); // (0-5)/5
        });

        it('should work with intensity 10', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(10),
                primaryProperty: 'radius',
            };

            const _result = createBulgePinchFilter(config);
            expect(mockBulgePinchFilter.radius).toBe(200); // 20 + (10 * 18)
        });

        it('should handle missing optional properties gracefully', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
            };

            const result = createBulgePinchFilter(config);
            
            expect(result).toBeDefined();
            expect(result.filter).toBe(mockBulgePinchFilter);
        });

        it('should handle invalid primary property gracefully', () => {
            const config: any = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                primaryProperty: 'invalid',
            };

            const result = createBulgePinchFilter(config);
            
            // Should fall back to default behavior (strength)
            expect(result).toBeDefined();
            expect(result.filter).toBe(mockBulgePinchFilter);
            expect(mockBulgePinchFilter.strength).toBe(0); // Default behavior: (5-5)/5 = 0
        });

        it('should handle partial center configuration', () => {
            const config: BulgePinchFilterConfig = {
                type: 'bulgePinch',
                enabled: true,
                intensity: createFilterIntensity(5),
                center: { x: 0.3, y: 0.7 },
                centerX: 0.2, // Only X is specified, Y should come from center object
            };

            const result = createBulgePinchFilter(config);
            
            expect(result.filter).toBe(mockBulgePinchFilter);
            expect(mockBulgePinchFilter.center).toEqual([0.2, 0.7]); // centerX=0.2, centerY=center.y=0.7
        });
    });
}); 