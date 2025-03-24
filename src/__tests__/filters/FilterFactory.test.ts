import { FilterFactory } from '../../filters';
import { FilterType, BlurFilterConfig } from '../../filters/types';
import { jest, describe, beforeEach, test, expect } from '@jest/globals';

// Mock the filter modules that FilterFactory might try to load
jest.mock('../../filters/blurFilter', () => ({
    createBlurFilter: jest.fn().mockReturnValue({
        type: 'blur',
        filter: { blur: 5 },
    }),
}));

describe('FilterFactory', () => {
    beforeEach(() => {
        // Clear mocks and reset modules before each test
        jest.clearAllMocks();
        jest.resetModules();
    });

    test('initializes with default settings', () => {
        // Initialize FilterFactory with default settings
        FilterFactory.initialize({
            enableShaderPooling: false,
            enableDebug: false,
        });

        // Should not throw errors
        expect(() => FilterFactory.initialize()).not.toThrow();
    });

    test('creates a basic filter without error', async () => {
        // First initialize
        FilterFactory.initialize({
            enableShaderPooling: false,
            enableDebug: false,
        });

        // Create a properly typed filter config
        const filterConfig: BlurFilterConfig = {
            type: 'blur',
            intensity: 0.5,
            enabled: true,
            strength: 5,
            quality: 4,
            kernelSize: 5,
            resolution: 1
        };

        // Attempt to create the filter
        const result = await FilterFactory.createFilter(filterConfig);

        // Should return something (even if just a mock in tests)
        expect(result).toBeDefined();
    });
});