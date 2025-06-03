import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDropShadowFilter, type DropShadowFilterConfig } from '../../../filters/DropShadowFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PIXI DropShadowFilter from pixi-filters
const createMockDropShadowFilter = (options: any = {}): {
    alpha: number;
    blur: number;
    color: number;
    offsetX: number;
    offsetY: number;
    pixelSize: number;
    pixelSizeX: number;
    pixelSizeY: number;
    quality: number;
    shadowOnly: boolean;
    destroy: any;
    enabled: boolean;
    [key: string]: any;
} => ({
    alpha: options.alpha ?? 0.5,
    blur: options.blur ?? 2,
    color: options.color ?? 0x000000,
    offsetX: options.offsetX ?? 2,
    offsetY: options.offsetY ?? 2,
    pixelSize: options.pixelSize ?? 1,
    pixelSizeX: options.pixelSizeX ?? 1,
    pixelSizeY: options.pixelSizeY ?? 1,
    quality: options.quality ?? 1,
    shadowOnly: options.shadowOnly ?? false,
    destroy: vi.fn(),
    enabled: true,
    ...options
});

vi.mock('pixi-filters', () => ({
    DropShadowFilter: vi.fn().mockImplementation((options: any = {}) => 
        createMockDropShadowFilter(options)
    )
}));

describe('DropShadowFilter', () => {
    let DropShadowFilterMock: any;
    let mockDropShadowFilter: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Get the mock after imports are resolved
        const pixiFiltersModule = await import('pixi-filters');
        DropShadowFilterMock = pixiFiltersModule.DropShadowFilter as any;
        
        // The mock will be created fresh for each test by the mock implementation
        mockDropShadowFilter = null;
    });

    describe('Basic functionality', () => {
        it('should create a drop shadow filter with default settings', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true
            };

            const result = createDropShadowFilter(config);

            expect(result.filter).toBeDefined();
            expect(typeof result.updateIntensity).toBe('function');
            expect(typeof result.reset).toBe('function');
            expect(typeof result.dispose).toBe('function');
        });

        it('should create filter with custom configuration', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                alpha: 0.8,
                blur: 4,
                color: 0xff0000,
                offsetX: 5,
                offsetY: 3,
                quality: 2,
                shadowOnly: true
            };

            createDropShadowFilter(config);
            
            expect(DropShadowFilterMock).toHaveBeenCalledWith({
                alpha: 0.8,
                blur: 4,
                color: 0xff0000,
                offsetX: 5,
                offsetY: 3,
                quality: 2,
                shadowOnly: true
            });
        });

        it('should handle offset as object', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                offset: { x: 10, y: 15 }
            };

            createDropShadowFilter(config);
            
            expect(DropShadowFilterMock).toHaveBeenCalledWith({
                offsetX: 10,
                offsetY: 15
            });
        });
    });

    describe('Intensity updates', () => {
        it('should update blur and offset based on intensity', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                blur: 3,
                offsetX: 4,
                offsetY: 2,
                intensity: 5
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created

            // Test various intensity levels
            result.updateIntensity(0);
            expect(mockDropShadowFilter.blur).toBe(3); // 3 + (0 * 1.8) = 3
            expect(mockDropShadowFilter.offsetX).toBe(4); // 4 + (0 * 1.0) = 4
            expect(mockDropShadowFilter.offsetY).toBe(2); // 2 + (0 * 1.0) = 2

            result.updateIntensity(5);
            expect(mockDropShadowFilter.blur).toBe(12); // 3 + (5 * 1.8) = 12
            expect(mockDropShadowFilter.offsetX).toBe(9); // 4 + (5 * 1.0) = 9
            expect(mockDropShadowFilter.offsetY).toBe(7); // 2 + (5 * 1.0) = 7

            result.updateIntensity(10);
            expect(mockDropShadowFilter.blur).toBe(21); // 3 + (10 * 1.8) = 21
            expect(mockDropShadowFilter.offsetX).toBe(14); // 4 + (10 * 1.0) = 14
            expect(mockDropShadowFilter.offsetY).toBe(12); // 2 + (10 * 1.0) = 12
        });

        it('should use default values when not configured', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                intensity: 6
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created

            // Should use defaults: blur=2, offsetX=2, offsetY=2
            expect(mockDropShadowFilter.blur).toBe(12.8); // 2 + (6 * 1.8) = 12.8
            expect(mockDropShadowFilter.offsetX).toBe(8); // 2 + (6 * 1.0) = 8
            expect(mockDropShadowFilter.offsetY).toBe(8); // 2 + (6 * 1.0) = 8
        });

        it('should scale alpha when not explicitly configured', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                intensity: 8
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created

            result.updateIntensity(8);
            // alpha = 0.5 + (8/20) = 0.5 + 0.4 = 0.9
            expect(mockDropShadowFilter.alpha).toBe(0.9);
        });

        it('should not modify alpha when explicitly configured', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                alpha: 0.7,
                intensity: 8
            };

            const result = createDropShadowFilter(config);
            const mockFilter = result.filter as any; // Cast to any to access mock properties

            // Alpha should remain at configured value
            expect(mockFilter.alpha).toBe(0.7);
        });

        it('should apply initial intensity if provided', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                blur: 4,
                offsetX: 3,
                offsetY: 2,
                intensity: 4
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created
            
            expect(mockDropShadowFilter.blur).toBe(11.2); // 4 + (4 * 1.8) = 11.2
            expect(mockDropShadowFilter.offsetX).toBe(7); // 3 + (4 * 1.0) = 7
            expect(mockDropShadowFilter.offsetY).toBe(6); // 2 + (4 * 1.0) = 6
        });
    });

    describe('Reset functionality', () => {
        it('should reset to defaults when no shadow config provided', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                color: 0xff0000,
                intensity: 7
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created

            // Change values
            result.updateIntensity(2);

            // Reset should restore to defaults without applying intensity
            result.reset();
            expect(mockDropShadowFilter.blur).toBe(2);
            expect(mockDropShadowFilter.offsetX).toBe(2);
            expect(mockDropShadowFilter.offsetY).toBe(2);
            expect(mockDropShadowFilter.alpha).toBe(0.5);
            expect(mockDropShadowFilter.color).toBe(0xff0000);
        });

        it('should reset to configured values when shadow config provided', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                blur: 5,
                offsetX: 3,
                offsetY: 4,
                alpha: 0.8,
                color: 0x00ff00,
                intensity: 6
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created

            // Change values
            result.updateIntensity(2);

            // Reset should restore configured values and apply intensity
            result.reset();
            expect(mockDropShadowFilter.blur).toBe(15.8); // 5 + (6 * 1.8) = 15.8
            expect(mockDropShadowFilter.offsetX).toBe(9); // 3 + (6 * 1.0) = 9
            expect(mockDropShadowFilter.offsetY).toBe(10); // 4 + (6 * 1.0) = 10
            expect(mockDropShadowFilter.alpha).toBe(0.8);
            expect(mockDropShadowFilter.color).toBe(0x00ff00);
        });
    });

    describe('Filter configuration', () => {
        it('should handle all drop shadow options', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                alpha: 0.9,
                blur: 6,
                color: 0x0000ff,
                offsetX: 8,
                offsetY: 6,
                pixelSize: 2,
                pixelSizeX: 3,
                pixelSizeY: 1,
                quality: 3,
                shadowOnly: true
            };

            createDropShadowFilter(config);
            
            expect(DropShadowFilterMock).toHaveBeenCalledWith({
                alpha: 0.9,
                blur: 6,
                color: 0x0000ff,
                offsetX: 8,
                offsetY: 6,
                pixelSize: 2,
                pixelSizeX: 3,
                pixelSizeY: 1,
                quality: 3,
                shadowOnly: true
            });
        });
    });

    describe('Disposal', () => {
        it('should properly dispose of the filter', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created
            
            result.dispose();

            expect(mockDropShadowFilter.destroy).toHaveBeenCalled();
        });

        it('should handle disposal when destroy method is not available', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created

            // Remove destroy method
            delete (mockDropShadowFilter as any).destroy;
            
            // Should not throw
            expect(() => result.dispose()).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle zero intensity values', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                blur: 2,
                offsetX: 2,
                offsetY: 2,
                intensity: 0
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created
            
            expect(mockDropShadowFilter.blur).toBe(2); // No additional blur
            expect(mockDropShadowFilter.offsetX).toBe(2); // No additional offset
            expect(mockDropShadowFilter.offsetY).toBe(2);
        });

        it('should handle maximum intensity values', () => {
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                blur: 1,
                offsetX: 1,
                offsetY: 1,
                intensity: 10
            };

            const result = createDropShadowFilter(config);
            mockDropShadowFilter = result.filter; // Get the actual mock created
            
            expect(mockDropShadowFilter.blur).toBe(19); // 1 + (10 * 1.8) = 19
            expect(mockDropShadowFilter.offsetX).toBe(11); // 1 + (10 * 1.0) = 11
            expect(mockDropShadowFilter.offsetY).toBe(11);
        });

        it('should handle various offset configurations', () => {
            const config1: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                offset: 5
            };

            createDropShadowFilter(config1);
            expect(DropShadowFilterMock).toHaveBeenCalledWith({
                offsetX: 5,
                offsetY: 5
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
            const config: DropShadowFilterConfig = {
                type: 'dropShadow',
                enabled: true,
                intensity: 5
            };

            expect(config.type).toBe('dropShadow');
        });
    });
}); 