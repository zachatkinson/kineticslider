/**
 * @fileoverview Integration Tests for ShaderManager
 *
 * Integration tests for the ShaderManager class focusing on:
 * 1. Component integration with rendering systems
 * 2. Configuration coordination
 * 3. Statistics integration
 * 4. Memory management integration
 * 5. Error handling integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// import { GlProgram } from 'pixi.js';
import { ShaderManager } from '../../rendering/shader-manager';
import {
  createTestShaderConfig,
  // createMockGlProgram,
  // createTestShaderSources,
} from '../utils/test-factories';

// Mock PIXI.js GlProgram and shader compilation
vi.mock('pixi.js', () => ({
  GlProgram: vi.fn().mockImplementation((vertex, fragment) => ({
    vertex,
    fragment,
    destroy: vi.fn(),
    bind: vi.fn(),
    unbind: vi.fn(),
    uniforms: {},
    attributes: {},
  })),
}));

describe('ShaderManager Integration', () => {
  let shaderManager: ShaderManager;

  beforeEach(() => {
    vi.clearAllMocks();
    shaderManager = new ShaderManager();
  });

  afterEach(() => {
    shaderManager.dispose();
    vi.restoreAllMocks();
  });

  describe('Component Integration', () => {
    it('should integrate with configuration system', () => {
      const config = createTestShaderConfig();
      const manager = new ShaderManager(config);
      
      expect(manager).toBeDefined();
      expect(manager.getShaderStats()).toBeDefined();
      
      manager.dispose();
    });

    it('should provide consistent API contracts', () => {
      expect(typeof shaderManager.compileShader).toBe('function');
      expect(typeof shaderManager.getCachedShader).toBe('function');
      expect(typeof shaderManager.precompileShaders).toBe('function');
      expect(typeof shaderManager.invalidateCache).toBe('function');
      expect(typeof shaderManager.getShaderStats).toBe('function');
      expect(typeof shaderManager.dispose).toBe('function');
    });

    it('should coordinate with rendering systems', () => {
      const stats = shaderManager.getShaderStats();
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('compiled');
      expect(stats).toHaveProperty('cached');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('Statistics Integration', () => {
    it('should maintain statistics consistency', () => {
      const initialStats = shaderManager.getShaderStats();
      expect(initialStats.cacheSize).toBe(0);
      expect(initialStats.compiled).toBe(0);
      expect(initialStats.cached).toBe(0);
      expect(initialStats.failed).toBe(0);
    });

    it('should reset statistics properly', () => {
      shaderManager.invalidateCache();
      const stats = shaderManager.getShaderStats();
      expect(stats.cacheSize).toBe(0);
    });

    it('should provide comprehensive statistics', () => {
      const stats = shaderManager.getShaderStats();
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('compiled');
      expect(stats).toHaveProperty('cached');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('totalCompilationTime');
      expect(stats).toHaveProperty('averageCompilationTime');
      expect(stats).toHaveProperty('cacheHitRate');
    });
  });

  describe('Memory Management Integration', () => {
    it('should handle disposal without errors', () => {
      expect(() => shaderManager.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      shaderManager.dispose();
      expect(() => shaderManager.dispose()).not.toThrow();
    });

    it('should maintain state after disposal', () => {
      shaderManager.dispose();
      const stats = shaderManager.getShaderStats();
      expect(stats.cacheSize).toBe(0);
      expect(stats.compiled).toBe(0);
    });

    it('should handle cache invalidation', () => {
      expect(() => shaderManager.invalidateCache()).not.toThrow();
      const stats = shaderManager.getShaderStats();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cache operations gracefully', () => {
      expect(() => shaderManager.getCachedShader('non-existent')).not.toThrow();
      const result = shaderManager.getCachedShader('non-existent');
      expect(result).toBeNull();
    });

    it('should handle invalidation without errors', () => {
      expect(() => shaderManager.invalidateCache()).not.toThrow();
      expect(() => shaderManager.invalidateCache()).not.toThrow(); // Multiple calls
    });

    it('should maintain system stability', () => {
      // Multiple operations should not break the system
      shaderManager.invalidateCache();
      shaderManager.getCachedShader('test');
      shaderManager.dispose();
      
      expect(() => shaderManager.getShaderStats()).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should handle various configuration scenarios', () => {
      const configs = [
        {},
        { maxCached: 50 },
        { compileTimeout: 1000 },
        { enableDebugging: true },
        { maxCached: 10, compileTimeout: 500 },
      ];

      configs.forEach(config => {
        const manager = new ShaderManager(config);
        expect(manager).toBeDefined();
        expect(manager.getShaderStats()).toBeDefined();
        manager.dispose();
      });
    });

    it('should integrate with test factories', () => {
      const testConfig = createTestShaderConfig();
      const manager = new ShaderManager(testConfig);
      
      expect(manager).toBeDefined();
      manager.dispose();
    });

    it('should handle precompilation API contracts', () => {
      const shaderConfigs = [
        {
          name: 'test-shader',
          vertex: 'vertex source',
          fragment: 'fragment source',
        },
      ];

      // For integration tests, just verify the API contract
      const promise = shaderManager.precompileShaders(shaderConfigs);
      expect(promise).toBeInstanceOf(Promise);
    });
  });

});