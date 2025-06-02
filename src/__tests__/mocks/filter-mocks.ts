/**
 * Centralized Filter Mocks for Testing
 * 
 * This module provides reusable mock objects and utilities for filter testing,
 * eliminating duplication across individual filter test files.
 * 
 * @module FilterMocks
 * @version 1.0.0
 */

import { vi } from 'vitest';

/**
 * Base properties common to all PIXI filters
 */
export const baseFilterProperties = {
  enabled: true,
  blendMode: 0,
  resolution: 1,
  multisample: false,
  padding: 0,
  autoFit: true,
  state: null,
  legacy: false,
  destroy: vi.fn(),
};

/**
 * Mock for OutlineFilter from pixi-filters
 * 
 * @returns Mock outline filter object
 *
 */
export const createMockOutlineFilter = (): Record<string, unknown> => ({
  thickness: 2,
  color: 0x000000,
  quality: 0.1,
  alpha: 1.0,
  knockout: false,
  ...baseFilterProperties,
});

/**
 * Mock for NoiseFilter from pixi.js
 * 
 * @returns Mock noise filter object
 *
 */
export const createMockNoiseFilter = (): Record<string, unknown> => ({
  noise: 0.5,
  seed: 0,
  ...baseFilterProperties,
});

/**
 * Mock for PixelateFilter from pixi-filters
 * 
 * @returns Mock pixelate filter object
 *
 */
export const createMockPixelateFilter = (): Record<string, unknown> => ({
  size: 10,
  sizeX: 10,
  sizeY: 10,
  ...baseFilterProperties,
});

/**
 * Mock for BloomFilter from pixi-filters
 * 
 * @returns Mock bloom filter object
 *
 */
export const createMockBloomFilter = (): Record<string, unknown> => ({
  strength: 2,
  strengthX: 2,
  strengthY: 2,
  ...baseFilterProperties,
});

/**
 * Mock for TwistFilter from pixi-filters
 * 
 * @returns Mock twist filter object
 *
 */
export const createMockTwistFilter = (): Record<string, unknown> => ({
  angle: 4,
  radius: 200,
  offsetX: 0,
  offsetY: 0,
  ...baseFilterProperties,
});

/**
 * Mock for EmbossFilter from pixi-filters
 * 
 * @returns Mock emboss filter object
 *
 */
export const createMockEmbossFilter = (): Record<string, unknown> => ({
  strength: 5,
  ...baseFilterProperties,
});

/**
 * Mock for BulgePinchFilter from pixi-filters
 * 
 * @returns Mock bulge pinch filter object
 *
 */
export const createMockBulgePinchFilter = (): Record<string, unknown> => ({
  strength: 0.5,
  radius: 100,
  center: [0.5, 0.5],
  ...baseFilterProperties,
});

/**
 * Mock for ColorMatrixFilter from pixi.js
 * 
 * @returns Mock color matrix filter object
 *
 */
export const createMockColorMatrixFilter = (): Record<string, unknown> => ({
  alpha: 1.0,
  matrix: null as any,
  reset: vi.fn(),
  ...baseFilterProperties,
});

/**
 * Mock for OldFilmFilter from pixi-filters
 * 
 * @returns Mock old film filter object
 *
 */
export const createMockOldFilmFilter = (): Record<string, unknown> => ({
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
  ...baseFilterProperties,
});

/**
 * Mock for GlowFilter from pixi-filters
 * 
 * @returns Mock glow filter object
 *
 */
export const createMockGlowFilter = (): Record<string, unknown> => ({
  distance: 10,
  innerStrength: 0,
  outerStrength: 4,
  quality: 0.1,
  color: 0xffffff,
  alpha: 1,
  knockout: false,
  ...baseFilterProperties,
});

/**
 * Mock for RGBSplitFilter from pixi-filters
 * 
 * @param options - Optional configuration for the mock
 *
 * @returns Mock RGB split filter object
 *
 */
export const createMockRGBSplitFilter = (options: Record<string, unknown> = {}): Record<string, unknown> => ({
  red: options.red || { x: -10, y: 0 },
  green: options.green || { x: 0, y: 10 },
  blue: options.blue || { x: 0, y: 0 },
  ...baseFilterProperties,
});

/**
 * Mock for GlitchFilter from pixi-filters
 * 
 * @param options - Optional configuration for the mock
 *
 * @returns Mock glitch filter object
 *
 */
export const createMockGlitchFilter = (options: Record<string, unknown> = {}): Record<string, unknown> => ({
  slices: options.slices ?? 5,
  offset: options.offset ?? 100,
  direction: options.direction ?? 0,
  red: options.red ?? { x: 0, y: 0 },
  green: options.green ?? { x: 0, y: 0 },
  blue: options.blue ?? { x: 0, y: 0 },
  seed: options.seed ?? 0,
  ...baseFilterProperties,
});

/**
 * Mock setup helper for beforeEach in filter tests
 * 
 * @param mockFilter - The mock filter object to reset
 *
 * @param defaultProps - Default properties to reset to
 *
 * @returns void
 *
 */
export const resetMockFilter = (mockFilter: Record<string, unknown>, defaultProps: Record<string, unknown>): void => {
  vi.clearAllMocks();
  Object.assign(mockFilter, defaultProps);
};

/**
 * Common test assertions for filter results
 * 
 * @param result - Filter result object to test
 *
 * @param expectedType - Expected filter type
 *
 * @returns void
 *
 */
export const assertFilterResult = (result: Record<string, unknown>, expectedType?: string): void => {
  expect(result).toHaveProperty('filter');
  expect(result).toHaveProperty('updateIntensity');
  expect(result).toHaveProperty('reset');
  expect(result).toHaveProperty('dispose');
  expect(result).toHaveProperty('config');
  
  if (expectedType) {
    expect((result.config as Record<string, unknown>).type).toBe(expectedType);
  }
  
  expect(typeof result.updateIntensity).toBe('function');
  expect(typeof result.reset).toBe('function');
  expect(typeof result.dispose).toBe('function');
};

/**
 * Test intensity mapping helper
 * 
 * @param updateIntensity - The updateIntensity function to test
 *
 * @param mockFilter - The mock filter object
 *
 * @param propertyName - Property name to check
 *
 * @param intensityValue - Intensity value to test (0-10)
 *
 * @param expectedValue - Expected mapped value
 *
 * @returns void
 *
 */
export const testIntensityMapping = (
  updateIntensity: (intensity: Record<string, unknown>) => void,
  mockFilter: Record<string, unknown>,
  propertyName: string,
  intensityValue: number,
  expectedValue: number
): void => {
  updateIntensity({ intensity: intensityValue } as Record<string, unknown>);
  expect(mockFilter[propertyName]).toBe(expectedValue);
};

/**
 * Mock factory for creating filter-specific vi.mock calls
 * 
 * @param filterName - Name of the filter class
 *
 * @param mockFactory - Factory function that creates the mock
 *
 * @param _moduleName - Module name ('pixi-filters' or 'pixi.js')
 *
 * @returns Mock object for vi.mock
 *
 */
export const createFilterMock = (
  filterName: string,
  mockFactory: () => Record<string, unknown>,
  _moduleName: 'pixi-filters' | 'pixi.js' = 'pixi-filters'
): Record<string, () => Record<string, unknown>> => {
  return {
    [filterName]: vi.fn(mockFactory),
  };
};

/**
 * Setup mock globals for timer functions (for animated filters)
 * 
 * @returns Object with mock timer functions
 *
 */
export const setupTimerMocks = (): { mockSetInterval: ReturnType<typeof vi.fn>; mockClearInterval: ReturnType<typeof vi.fn> } => {
  const mockSetInterval = vi.fn().mockImplementation((_fn: () => void, _delay: number) => {
    return 123 as unknown; // Return a mock timer ID
  });
  const mockClearInterval = vi.fn().mockImplementation((): void => {});

  global.setInterval = mockSetInterval;
  global.clearInterval = mockClearInterval;

  return { mockSetInterval, mockClearInterval };
};

/**
 * Cleanup timer mocks
 * 
 * @returns void
 *
 */
export const cleanupTimerMocks = (): void => {
  if (global.setInterval && 'mockRestore' in global.setInterval) {
    (global.setInterval as unknown as { mockRestore: () => void }).mockRestore();
  }
  if (global.clearInterval && 'mockRestore' in global.clearInterval) {
    (global.clearInterval as unknown as { mockRestore: () => void }).mockRestore();
  }
}; 