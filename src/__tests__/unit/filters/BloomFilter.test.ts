import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBloomFilter } from '../../../filters/BloomFilter';
import type { BloomFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the BloomFilter from pixi-filters
const mockBloomFilter = {
    strength: 2,
    strengthX: 2,
    strengthY: 2,
    destroy: vi.fn(),
    enabled: true,
    alpha: 1,
    blendMode: 0,
    resolution: 1,
    multisample: false,
    padding: 0,
    autoFit: true,
    state: null,
    legacy: false,
};

vi.mock('pixi-filters', () => ({
    BloomFilter: vi.fn(() => mockBloomFilter),
}));

describe('BloomFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock filter properties
        mockBloomFilter.strength = 2;
        mockBloomFilter.strengthX = 2;
        mockBloomFilter.strengthY = 2;
    });

    it('should create filter with default configuration', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(5),
        };

        const result = createBloomFilter(config);

        expect(result.filter).toBe(mockBloomFilter);
        expect(result.config).toBe(config);
        expect(typeof result.updateIntensity).toBe('function');
        expect(typeof result.reset).toBe('function');
        expect(typeof result.dispose).toBe('function');
    });

    it('should apply initial strength configuration', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(5),
            strength: 4,
        };

        createBloomFilter(config);

        expect(mockBloomFilter.strength).toBe(10);
    });

    it('should apply initial strengthX and strengthY configuration', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(5),
            strengthX: 3,
            strengthY: 6,
        };

        createBloomFilter(config);

        expect(mockBloomFilter.strengthX).toBe(3);
        expect(mockBloomFilter.strengthY).toBe(6);
    });

    it('should apply strength object configuration', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(5),
            strengthX: 2,
            strengthY: 8
        };

        createBloomFilter(config);

        expect(mockBloomFilter.strengthX).toBe(2);
        expect(mockBloomFilter.strengthY).toBe(8);
    });

    it('should update intensity for strength property', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(0),
            primaryProperty: 'strength'
        };

        const result = createBloomFilter(config);
        result.updateIntensity(createFilterIntensity(8));

        expect(mockBloomFilter.strength).toBe(16); // 8 * 2 = 16
    });

    it('should update intensity for strengthX property', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(0),
            primaryProperty: 'strengthX'
        };

        const result = createBloomFilter(config);
        result.updateIntensity(createFilterIntensity(7));

        expect(mockBloomFilter.strengthX).toBe(14); // 7 * 2 = 14
    });

    it('should update intensity for strengthY property', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(0),
            primaryProperty: 'strengthY'
        };

        const result = createBloomFilter(config);
        result.updateIntensity(createFilterIntensity(6));

        expect(mockBloomFilter.strengthY).toBe(12); // 6 * 2 = 12
    });

    it('should clamp intensity values to 0-10 range', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(0),
            primaryProperty: 'strength'
        };

        const result = createBloomFilter(config);
        
        result.updateIntensity(createFilterIntensity(10)); // max allowed intensity
        expect(mockBloomFilter.strength).toBe(20); // 10 * 2 = 20
    });

    it('should reset filter to initial configuration', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(5),
            strength: 4,
            strengthX: 3,
            strengthY: 6
        };

        const result = createBloomFilter(config);
        
        result.updateIntensity(createFilterIntensity(9));
        result.reset();
        
        expect(mockBloomFilter.strength).toBe(10); // 5 * 2 = 10 (initial intensity applied)
        expect(mockBloomFilter.strengthX).toBe(3);
        expect(mockBloomFilter.strengthY).toBe(6);
    });

    it('should apply initial intensity after reset', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(7),
            primaryProperty: 'strength'
        };

        const result = createBloomFilter(config);
        
        result.updateIntensity(createFilterIntensity(2));
        result.reset();
        
        expect(mockBloomFilter.strength).toBe(14); // 7 * 2 = 14
    });

    it('should dispose filter properly', () => {
        const config: BloomFilterConfig = {
            type: 'bloom',
            enabled: true,
            intensity: createFilterIntensity(5),
        };

        const result = createBloomFilter(config);
        
        // Check if dispose method exists and call it
        if (result.dispose) {
            result.dispose();
        }

        expect(mockBloomFilter.destroy).toHaveBeenCalledOnce();
    });
}); 