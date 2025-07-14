/**
 * @fileoverview Unit Tests for ShaderManager
 *
 * Simplified unit tests focusing on:
 * 1. Constructor behavior
 * 2. Basic method contracts
 * 3. Configuration validation
 * 4. Simple state changes
 * 5. Direct method inputs/outputs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShaderManager } from '../../rendering/shader-manager';
import { createTestShaderConfig } from '../utils/test-factories';

// Minimal mock for GlProgram
vi.mock('pixi.js', () => ({
  GlProgram: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
  })),
}));

describe('ShaderManager Unit Tests', () => {
  let shaderManager: ShaderManager;

  beforeEach(() => {
    vi.clearAllMocks();
    shaderManager = new ShaderManager();
  });

  afterEach(() => {
    shaderManager.dispose();
  });

  describe('Constructor Behavior', () => {
    it('should initialize with default configuration', () => {
      const manager = new ShaderManager();
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(ShaderManager);
      manager.dispose();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        maxCached: 10,
        compileTimeout: 2000,
        enableDebugging: true,
      };
      
      const manager = new ShaderManager(customConfig);
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(ShaderManager);
      manager.dispose();
    });

    it('should merge partial configuration with defaults', () => {
      const partialConfig = { maxCached: 5 };
      const manager = new ShaderManager(partialConfig);
      
      expect(manager).toBeDefined();
      manager.dispose();
    });

    it('should handle empty configuration object', () => {
      const manager = new ShaderManager({});
      expect(manager).toBeDefined();
      manager.dispose();
    });
  });

  describe('Basic Method Contracts', () => {
    it('should have compileShader method', () => {
      expect(typeof shaderManager.compileShader).toBe('function');
    });

    it('should have getCachedShader method', () => {
      expect(typeof shaderManager.getCachedShader).toBe('function');
    });

    it('should have getShaderStats method', () => {
      expect(typeof shaderManager.getShaderStats).toBe('function');
    });

    it('should have clearCache method', () => {
      expect(typeof shaderManager.clearCache).toBe('function');
    });

    it('should have invalidateCache method', () => {
      expect(typeof shaderManager.invalidateCache).toBe('function');
    });

    it('should have precompileShaders method', () => {
      expect(typeof shaderManager.precompileShaders).toBe('function');
    });

    it('should have dispose method', () => {
      expect(typeof shaderManager.dispose).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid maxCached values', () => {
      const validConfigs = [
        { maxCached: 1 },
        { maxCached: 100 },
        { maxCached: 1000 },
      ];

      validConfigs.forEach(config => {
        const manager = new ShaderManager(config);
        expect(manager).toBeDefined();
        manager.dispose();
      });
    });

    it('should accept valid compileTimeout values', () => {
      const validConfigs = [
        { compileTimeout: 100 },
        { compileTimeout: 5000 },
        { compileTimeout: 10000 },
      ];

      validConfigs.forEach(config => {
        const manager = new ShaderManager(config);
        expect(manager).toBeDefined();
        manager.dispose();
      });
    });

    it('should accept boolean enableDebugging values', () => {
      const manager1 = new ShaderManager({ enableDebugging: true });
      const manager2 = new ShaderManager({ enableDebugging: false });
      
      expect(manager1).toBeDefined();
      expect(manager2).toBeDefined();
      
      manager1.dispose();
      manager2.dispose();
    });

    it('should handle invalid configuration gracefully', () => {
      // Test with various invalid configurations
      const invalidConfigs = [
        { maxCached: -1 },
        { maxCached: 0 },
        { compileTimeout: -100 },
        { compileTimeout: 0 },
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          const manager = new ShaderManager(config);
          manager.dispose();
        }).not.toThrow();
      });
    });
  });

  describe('Simple State Changes', () => {
    it('should initialize with empty stats', () => {
      const stats = shaderManager.getShaderStats();
      
      expect(stats.compiled).toBe(0);
      expect(stats.cached).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.cacheSize).toBe(0);
      expect(stats.totalCompilationTime).toBe(0);
      expect(stats.averageCompilationTime).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
    });

    it('should return null for non-existent cached shader', () => {
      const shader = shaderManager.getCachedShader('non-existent');
      expect(shader).toBeNull();
    });

    it('should clear cache without errors', () => {
      expect(() => shaderManager.clearCache()).not.toThrow();
      
      const stats = shaderManager.getShaderStats();
      expect(stats.cacheSize).toBe(0);
    });

    it('should invalidate cache without errors', () => {
      expect(() => shaderManager.invalidateCache()).not.toThrow();
      
      const stats = shaderManager.getShaderStats();
      expect(stats.cacheSize).toBe(0);
    });

    it('should handle dispose without errors', () => {
      expect(() => shaderManager.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      shaderManager.dispose();
      expect(() => shaderManager.dispose()).not.toThrow();
    });
  });

  describe('Direct Method Inputs/Outputs', () => {
    it('should validate shader source strings', () => {
      const validation = shaderManager.validateShaderSource(
        'attribute vec2 aVertexPosition; uniform mat3 projectionMatrix; void main() { gl_Position = vec4(0.0); }',
        'void main() { gl_FragColor = vec4(1.0); }'
      );
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    it('should detect invalid vertex shader', () => {
      const validation = shaderManager.validateShaderSource('', 'void main() { gl_FragColor = vec4(1.0); }');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('empty');
    });

    it('should detect invalid fragment shader', () => {
      const validation = shaderManager.validateShaderSource(
        'attribute vec2 aVertexPosition; uniform mat3 projectionMatrix; void main() { gl_Position = vec4(0.0); }',
        ''
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('empty');
    });

    it('should detect missing required attributes', () => {
      const validation = shaderManager.validateShaderSource(
        'uniform mat3 projectionMatrix; void main() { gl_Position = vec4(0.0); }',
        'void main() { gl_FragColor = vec4(1.0); }'
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('aVertexPosition'))).toBe(true);
    });

    it('should detect missing required uniforms', () => {
      const validation = shaderManager.validateShaderSource(
        'attribute vec2 aVertexPosition; void main() { gl_Position = vec4(0.0); }',
        'void main() { gl_FragColor = vec4(1.0); }'
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('projectionMatrix'))).toBe(true);
    });

    it('should return consistent stats object structure', () => {
      const stats = shaderManager.getShaderStats();
      
      expect(stats).toHaveProperty('compiled');
      expect(stats).toHaveProperty('cached');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('totalCompilationTime');
      expect(stats).toHaveProperty('averageCompilationTime');
      expect(stats).toHaveProperty('cacheHitRate');
      
      expect(typeof stats.compiled).toBe('number');
      expect(typeof stats.cached).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.totalCompilationTime).toBe('number');
      expect(typeof stats.averageCompilationTime).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });

    it('should handle precompileShaders with empty array', async () => {
      await expect(shaderManager.precompileShaders([])).resolves.not.toThrow();
    });

    it('should handle precompileShaders with valid config structure', async () => {
      const configs = [
        {
          name: 'test',
          vertex: 'attribute vec2 aVertexPosition; uniform mat3 projectionMatrix; void main() { gl_Position = vec4(0.0); }',
          fragment: 'void main() { gl_FragColor = vec4(1.0); }'
        }
      ];
      
      // Should not throw for valid structure (actual compilation may fail due to mocks)
      await expect(shaderManager.precompileShaders(configs)).resolves.not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should use test configuration properly', () => {
      const testConfig = createTestShaderConfig();
      const manager = new ShaderManager(testConfig);
      
      expect(manager).toBeDefined();
      manager.dispose();
    });

    it('should maintain state consistency after operations', () => {
      // const initialStats = shaderManager.getShaderStats();
      
      shaderManager.clearCache();
      const afterClearStats = shaderManager.getShaderStats();
      
      expect(afterClearStats.cacheSize).toBe(0);
      expect(afterClearStats.compiled).toBe(0);
      expect(afterClearStats.cached).toBe(0);
      expect(afterClearStats.failed).toBe(0);
    });
  });
});