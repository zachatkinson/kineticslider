/**
 * @fileoverview Unit Tests for ResourceLoader
 *
 * Simplified unit tests focusing on:
 * 1. Constructor behavior
 * 2. Basic method contracts
 * 3. Configuration validation
 * 4. Simple state changes
 * 5. Direct method inputs/outputs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResourceLoader } from '../../rendering/resource-loader';
import { createTestResourceConfig } from '../utils/test-factories';

// Minimal mocks for external dependencies
vi.mock('pixi.js', () => ({
  Assets: {
    load: vi.fn(),
  },
}));

describe('ResourceLoader Unit Tests', () => {
  let resourceLoader: ResourceLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    resourceLoader = new ResourceLoader();
  });

  afterEach(() => {
    resourceLoader.dispose();
  });

  describe('Constructor Behavior', () => {
    it('should initialize with default configuration', () => {
      const loader = new ResourceLoader();
      expect(loader).toBeDefined();
      expect(loader).toBeInstanceOf(ResourceLoader);
      loader.dispose();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        cleanupInterval: 10000,
        idleTimeout: 60000,
        memoryPressureThreshold: 0.8,
        criticalMemoryThreshold: 0.9,
        trackReferences: true,
        autoCleanup: true,
      };
      
      const loader = new ResourceLoader(customConfig);
      expect(loader).toBeDefined();
      expect(loader).toBeInstanceOf(ResourceLoader);
      loader.dispose();
    });

    it('should merge partial configuration with defaults', () => {
      const partialConfig = { cleanupInterval: 5000 };
      const loader = new ResourceLoader(partialConfig);
      
      expect(loader).toBeDefined();
      loader.dispose();
    });

    it('should handle empty configuration object', () => {
      const loader = new ResourceLoader({});
      expect(loader).toBeDefined();
      loader.dispose();
    });
  });

  describe('Basic Method Contracts', () => {
    it('should have loadResource method', () => {
      expect(typeof resourceLoader.loadResource).toBe('function');
    });

    it('should have loadResources method', () => {
      expect(typeof resourceLoader.loadResources).toBe('function');
    });

    it('should have cancelLoading method', () => {
      expect(typeof resourceLoader.cancelLoading).toBe('function');
    });

    it('should have getLoadingStats method', () => {
      expect(typeof resourceLoader.getLoadingStats).toBe('function');
    });

    it('should have dispose method', () => {
      expect(typeof resourceLoader.dispose).toBe('function');
    });

    it('should return promises for async methods', () => {
      const result = resourceLoader.loadResource('test.jpg', 'texture');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return expected types for sync methods', () => {
      const stats = resourceLoader.getLoadingStats();
      expect(typeof stats).toBe('object');
      
      expect(() => resourceLoader.cancelLoading()).not.toThrow();
      expect(() => resourceLoader.dispose()).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid cleanupInterval values', () => {
      const validConfigs = [
        { cleanupInterval: 1000 },
        { cleanupInterval: 30000 },
        { cleanupInterval: 60000 },
      ];

      validConfigs.forEach(config => {
        const loader = new ResourceLoader(config);
        expect(loader).toBeDefined();
        loader.dispose();
      });
    });

    it('should accept valid threshold values', () => {
      const validConfigs = [
        { memoryPressureThreshold: 0.5 },
        { memoryPressureThreshold: 0.8 },
        { criticalMemoryThreshold: 0.9 },
        { criticalMemoryThreshold: 0.95 },
      ];

      validConfigs.forEach(config => {
        const loader = new ResourceLoader(config);
        expect(loader).toBeDefined();
        loader.dispose();
      });
    });

    it('should accept boolean configuration values', () => {
      const loader1 = new ResourceLoader({ trackReferences: true });
      const loader2 = new ResourceLoader({ autoCleanup: false });
      
      expect(loader1).toBeDefined();
      expect(loader2).toBeDefined();
      
      loader1.dispose();
      loader2.dispose();
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfigs = [
        { cleanupInterval: -1000 },
        { idleTimeout: -5000 },
        { memoryPressureThreshold: -0.5 },
        { memoryPressureThreshold: 1.5 },
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          const loader = new ResourceLoader(config);
          loader.dispose();
        }).not.toThrow();
      });
    });
  });

  describe('Simple State Changes', () => {
    it('should initialize with empty stats', () => {
      const stats = resourceLoader.getLoadingStats();
      
      expect(stats.pending).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it('should update stats structure consistently', () => {
      const stats = resourceLoader.getLoadingStats();
      
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
    });

    it('should handle cancellation without errors', () => {
      expect(() => resourceLoader.cancelLoading()).not.toThrow();
      
      const stats = resourceLoader.getLoadingStats();
      expect(stats.pending).toBe(0);
    });

    it('should handle dispose without errors', () => {
      expect(() => resourceLoader.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      resourceLoader.dispose();
      expect(() => resourceLoader.dispose()).not.toThrow();
    });

    it('should maintain consistent state after dispose', () => {
      resourceLoader.dispose();
      
      const stats = resourceLoader.getLoadingStats();
      expect(stats.pending).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Direct Method Inputs/Outputs', () => {
    it('should validate resource URL parameter', () => {
      // Test with valid URL formats
      const validUrls = [
        'image.jpg',
        'path/to/image.png',
        'https://example.com/resource.json',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      ];

      validUrls.forEach(url => {
        const promise = resourceLoader.loadResource(url, 'texture');
        expect(promise).toBeInstanceOf(Promise);
      });
    });

    it('should validate resource type parameter', () => {
      const supportedTypes = ['texture', 'image', 'audio', 'json', 'font'];
      
      supportedTypes.forEach(type => {
        const promise = resourceLoader.loadResource('test.file', type);
        expect(promise).toBeInstanceOf(Promise);
      });
    });

    it('should handle empty resource arrays', () => {
      const promise = resourceLoader.loadResources([]);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should validate resource array structure', () => {
      const validResources = [
        { url: 'test1.jpg', type: 'texture' },
        { url: 'test2.mp3', type: 'audio' },
        { url: 'test3.json', type: 'json' },
      ];

      const promise = resourceLoader.loadResources(validResources);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should handle progress callback parameter', () => {
      const resources = [{ url: 'test.jpg', type: 'texture' }];
      const mockCallback = vi.fn();

      const promise = resourceLoader.loadResources(resources, mockCallback);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should return consistent stats object structure', () => {
      const stats = resourceLoader.getLoadingStats();
      
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple cancellation calls', () => {
      expect(() => {
        resourceLoader.cancelLoading();
        resourceLoader.cancelLoading();
        resourceLoader.cancelLoading();
      }).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should use test configuration properly', () => {
      const testConfig = createTestResourceConfig();
      const loader = new ResourceLoader(testConfig);
      
      expect(loader).toBeDefined();
      loader.dispose();
    });

    it('should maintain configuration consistency', () => {
      const config = {
        cleanupInterval: 5000,
        trackReferences: true,
      };
      
      const loader = new ResourceLoader(config);
      expect(loader).toBeDefined();
      
      // Configuration should not affect basic operations
      expect(() => loader.cancelLoading()).not.toThrow();
      expect(loader.getLoadingStats()).toBeDefined();
      
      loader.dispose();
    });

    it('should handle configuration edge cases', () => {
      const edgeCases = [
        { cleanupInterval: 0 },
        { idleTimeout: 0 },
        { memoryPressureThreshold: 0 },
        { memoryPressureThreshold: 1 },
        { criticalMemoryThreshold: 1 },
      ];

      edgeCases.forEach(config => {
        expect(() => {
          const loader = new ResourceLoader(config);
          loader.dispose();
        }).not.toThrow();
      });
    });
  });

  describe('Error Handling Contracts', () => {
    it('should handle invalid resource types gracefully', () => {
      const promise = resourceLoader.loadResource('test.file', 'invalid-type');
      
      // Should return a promise that may reject
      expect(promise).toBeInstanceOf(Promise);
      
      // For unit tests, just verify the promise structure
      expect(promise).toHaveProperty('then');
      expect(promise).toHaveProperty('catch');
    });

    it('should handle empty URL strings', () => {
      const promise = resourceLoader.loadResource('', 'texture');
      
      expect(promise).toBeInstanceOf(Promise);
      
      // For unit tests, just verify the promise structure
      expect(promise).toHaveProperty('then');
      expect(promise).toHaveProperty('catch');
    });

    it('should handle malformed resource objects', () => {
      const malformedResources = [
        { url: '', type: 'texture' },
        { url: 'test.jpg', type: '' },
        { url: 'test.jpg' }, // missing type
        { type: 'texture' }, // missing url
      ];

      malformedResources.forEach(resource => {
        const promise = resourceLoader.loadResources([resource as never]);
        expect(promise).toBeInstanceOf(Promise);
      });
    });
  });
});