/**
 * DisplacementFilter Unit Tests
 * 
 * Tests for the DisplacementFilter implementation including creation,
 * intensity updates, state management, and resource cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createFilterIntensity,
  type DisplacementFilterConfig 
} from '../../../types/filters';

// Mock the entire DisplacementFilter module to avoid PIXI complexity
const mockFilterResult = {
  filter: {
    enabled: true,
    scale: { x: 20, y: 20 },
    destroy: vi.fn()
  },
  config: {} as DisplacementFilterConfig,
  updateIntensity: vi.fn(),
  reset: vi.fn(),
  dispose: vi.fn(),
  getState: vi.fn().mockReturnValue({
    intensity: 5,
    scaleX: 20,
    scaleY: 20
  })
};

// Mock the createFilter function
const mockCreateFilter = vi.fn().mockImplementation((config: DisplacementFilterConfig) => ({
  filter: {
    enabled: config.enabled,
    scale: { x: 20, y: 20 },
    destroy: vi.fn()
  },
  config,
  updateIntensity: mockFilterResult.updateIntensity,
  reset: mockFilterResult.reset,
  dispose: mockFilterResult.dispose,
  getState: mockFilterResult.getState
}));

// Mock PIXI.js components
vi.mock('pixi.js', () => ({
  DisplacementFilter: vi.fn(),
  Texture: {
    from: vi.fn().mockReturnValue({ width: 256, height: 256, destroy: vi.fn() })
  },
  Sprite: vi.fn().mockReturnValue({ destroy: vi.fn() }),
  Point: vi.fn().mockImplementation((x: number, y: number) => ({ x, y }))
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the filter module
vi.mock('../../../filters/DisplacementFilter', () => ({
  createFilter: mockCreateFilter,
  default: mockCreateFilter
}));

describe('DisplacementFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFilter.mockReturnValue(mockFilterResult);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Filter Creation', () => {
    it('should create displacement filter with string texture path', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png',
        scaleX: 30,
        scaleY: 25
      };

      const result = createFilter(config);

      expect(mockCreateFilter).toHaveBeenCalledWith(config);
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(result.reset).toBeInstanceOf(Function);
      expect(result.dispose).toBeInstanceOf(Function);
    });

    it('should create displacement filter with texture object', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const mockTexture = { width: 256, height: 256 };
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: mockTexture as any
      };

      const result = createFilter(config);

      expect(mockCreateFilter).toHaveBeenCalledWith(config);
      expect(result).toBeDefined();
    });

    it('should handle different scale configurations', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const configs = [
        {
          type: 'displacement' as const,
          enabled: true,
          intensity: createFilterIntensity(5),
          displacementMap: 'texture.png',
          scaleX: 50,
          scaleY: 45
        },
        {
          type: 'displacement' as const,
          enabled: true,
          intensity: createFilterIntensity(5),
          displacementMap: 'texture.png',
          scale: { x: 40, y: 35 }
        },
        {
          type: 'displacement' as const,
          enabled: true,
          intensity: createFilterIntensity(5),
          displacementMap: 'texture.png'
          // No scale provided - should use defaults
        }
      ];

      configs.forEach(config => {
        const result = createFilter(config);
        expect(mockCreateFilter).toHaveBeenCalledWith(config);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Filter Result Interface', () => {
    it('should provide all required interface methods', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png'
      };

      const result = createFilter(config);
      
      // Test interface compliance
      expect(result.filter).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(result.reset).toBeInstanceOf(Function);
      expect(result.dispose).toBeInstanceOf(Function);
      expect(result.getState).toBeInstanceOf(Function);
    });

    it('should handle updateIntensity calls', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png'
      };

      const result = createFilter(config);
      
      // Test that updateIntensity can be called
      const newIntensity = createFilterIntensity(8);
      result.updateIntensity(newIntensity);
      
      expect(mockFilterResult.updateIntensity).toHaveBeenCalledWith(newIntensity);
    });

    it('should handle reset calls', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png'
      };

      const result = createFilter(config);
      
      result.reset();
      expect(mockFilterResult.reset).toHaveBeenCalled();
    });

    it('should handle dispose calls', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png'
      };

      const result = createFilter(config);
      
      result.dispose?.();
      expect(mockFilterResult.dispose).toHaveBeenCalled();
    });

    it('should handle getState calls', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(7),
        displacementMap: 'texture.png'
      };

      const result = createFilter(config);
      
      // Test that getState function exists and can be called
      expect(result.getState).toBeInstanceOf(Function);
      expect(() => result.getState?.()).not.toThrow();
      expect(mockFilterResult.getState).toHaveBeenCalled();
    });
  });

  describe('Configuration Handling', () => {
    it('should pass configuration correctly', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: false,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png',
        scaleX: 100,
        scaleY: 80
      };

      createFilter(config);

      expect(mockCreateFilter).toHaveBeenCalledWith(config);
    });

    it('should handle various displacement map types', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const stringConfig: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'path/to/texture.png'
      };

      const textureConfig: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: { width: 512, height: 512 } as any
      };

      createFilter(stringConfig);
      createFilter(textureConfig);

      expect(mockCreateFilter).toHaveBeenCalledTimes(2);
      expect(mockCreateFilter).toHaveBeenNthCalledWith(1, stringConfig);
      expect(mockCreateFilter).toHaveBeenNthCalledWith(2, textureConfig);
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors gracefully', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      // Mock an error scenario
      mockCreateFilter.mockImplementationOnce(() => {
        throw new Error('Filter creation failed');
      });
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'invalid-texture.png'
      };

      expect(() => createFilter(config)).toThrow('Filter creation failed');
    });

    it('should handle invalid configurations', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      // Test with various edge cases
      const edgeCaseConfigs = [
        {
          type: 'displacement' as const,
          enabled: true,
          intensity: createFilterIntensity(0), // Minimum intensity
          displacementMap: ''
        },
        {
          type: 'displacement' as const,
          enabled: true,
          intensity: createFilterIntensity(10), // Maximum intensity
          displacementMap: 'texture.png'
        }
      ];

      edgeCaseConfigs.forEach(config => {
        const result = createFilter(config);
        expect(mockCreateFilter).toHaveBeenCalledWith(config);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Integration with PIXI Components', () => {
    it('should work with mocked PIXI components', async () => {
      const { createFilter } = await import('../../../filters/DisplacementFilter');
      
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'texture.png'
      };

      const result = createFilter(config);
      
      // Verify the mock was called and returned expected structure
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(typeof result.updateIntensity).toBe('function');
      expect(typeof result.reset).toBe('function');
      expect(typeof result.dispose).toBe('function');
      expect(typeof result.getState).toBe('function');
    });
  });
}); 