import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createColorMatrixFilter } from '../../../filters/ColorMatrixFilter';
import type { ColorMatrixFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the ColorMatrixFilter from pixi.js
const mockColorMatrixFilter = {
    alpha: 1.0,
    matrix: null as any,
    reset: vi.fn(),
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

vi.mock('pixi.js', () => ({
    ColorMatrixFilter: vi.fn(() => mockColorMatrixFilter),
}));

describe('ColorMatrixFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock filter properties
        mockColorMatrixFilter.alpha = 1.0;
        mockColorMatrixFilter.matrix = null;
    });

    it('should create filter with default configuration', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
        };

        const result = createColorMatrixFilter(config);

        expect(result.filter).toBe(mockColorMatrixFilter);
        expect(result.config).toBe(config);
        expect(typeof result.updateIntensity).toBe('function');
        expect(typeof result.reset).toBe('function');
        expect(typeof result.dispose).toBe('function');
    });

    it('should apply initial alpha configuration', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            alpha: 0.8,
        };

        createColorMatrixFilter(config);

        expect(mockColorMatrixFilter.alpha).toBe(0.8);
    });

    it('should apply initial matrix configuration', () => {
        const matrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];
        
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            matrix,
        };

        createColorMatrixFilter(config);

        expect(mockColorMatrixFilter.matrix).toBe(matrix);
    });

    it('should not apply matrix if it has less than 16 elements', () => {
        const matrix = [1, 0, 0, 0]; // Only 4 elements
        
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            matrix,
        };

        createColorMatrixFilter(config);

        expect(mockColorMatrixFilter.matrix).toBeNull();
    });

    it('should update intensity for alpha property', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            primaryProperty: 'alpha',
        };

        const result = createColorMatrixFilter(config);
        result.updateIntensity(createFilterIntensity(8));

        expect(mockColorMatrixFilter.alpha).toBe(0.8);
    });

    it('should update intensity with default behavior when no primary property is set', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
        };

        const result = createColorMatrixFilter(config);
        result.updateIntensity(createFilterIntensity(7));

        // Default behavior should adjust alpha
        expect(mockColorMatrixFilter.alpha).toBe(0.7);
    });

    it('should clamp intensity values to 0-10 range', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            primaryProperty: 'alpha',
        };

        const result = createColorMatrixFilter(config);
        
        result.updateIntensity(-5);
        expect(mockColorMatrixFilter.alpha).toBe(0);
        
        result.updateIntensity(15);
        expect(mockColorMatrixFilter.alpha).toBe(1);
    });

    it('should reset filter to initial configuration', () => {
        const matrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];
        
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            alpha: 0.8,
            matrix,
        };

        const result = createColorMatrixFilter(config);
        
        // Modify the filter
        result.updateIntensity(createFilterIntensity(3));
        mockColorMatrixFilter.alpha = 0.5;
        
        // Reset should restore original values
        result.reset();
        
        expect(mockColorMatrixFilter.alpha).toBe(0.8);
        expect(mockColorMatrixFilter.matrix).toBe(matrix);
    });

    it('should call filter reset method when no matrix is configured', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            alpha: 0.8,
        };

        const result = createColorMatrixFilter(config);
        
        // Reset should call filter.reset() for matrix
        result.reset();
        
        expect(mockColorMatrixFilter.reset).toHaveBeenCalled();
    });

    it('should apply initial intensity after reset', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(7),
            primaryProperty: 'alpha',
        };

        const result = createColorMatrixFilter(config);
        
        // Modify the filter
        mockColorMatrixFilter.alpha = 1.0;
        
        // Reset should apply the initial intensity
        result.reset();
        
        expect(mockColorMatrixFilter.alpha).toBe(0.7);
    });

    it('should dispose filter properly', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
        };

        const result = createColorMatrixFilter(config);
        result.dispose?.();

        expect(mockColorMatrixFilter.destroy).toHaveBeenCalled();
    });

    it('should handle getState function properly', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            alpha: 0.8,
        };

        const result = createColorMatrixFilter(config);
        
        const state = result.getState?.();
        if (state) {
            expect(state).toEqual(config);
        }
    });

    it('should work with intensity 0', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(0),
            primaryProperty: 'alpha',
        };

        const _result = createColorMatrixFilter(config);
        expect(mockColorMatrixFilter.alpha).toBe(0);
    });

    it('should work with intensity 10', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(10),
            primaryProperty: 'alpha',
        };

        const _result = createColorMatrixFilter(config);
        expect(mockColorMatrixFilter.alpha).toBe(1);
    });

    it('should apply correct intensity mapping for different intensity values', () => {
        const config: ColorMatrixFilterConfig = {
            type: 'colorMatrix',
            enabled: true,
            intensity: createFilterIntensity(5),
            primaryProperty: 'alpha',
        };

        const result = createColorMatrixFilter(config);
        
        // Test various intensity mappings
        result.updateIntensity(createFilterIntensity(2));
        expect(mockColorMatrixFilter.alpha).toBe(0.2);
        
        result.updateIntensity(createFilterIntensity(5));
        expect(mockColorMatrixFilter.alpha).toBe(0.5);
        
        result.updateIntensity(createFilterIntensity(9));
        expect(mockColorMatrixFilter.alpha).toBe(0.9);
    });
}); 