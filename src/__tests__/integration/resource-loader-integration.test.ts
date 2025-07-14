/**
 * @fileoverview Integration Tests for ResourceLoader
 *
 * Integration tests for the ResourceLoader class focusing on:
 * 1. Component integration with other systems
 * 2. Configuration coordination
 * 3. Statistics integration
 * 4. Memory management integration
 * 5. Error handling integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// import { Assets } from 'pixi.js';
import { ResourceLoader } from '../../rendering/resource-loader';
import {
  createTestResourceConfig,
  // createMockResourceDefinition,
  // createMockLoadingProgress,
} from '../utils/test-factories';

// Mock PIXI.js Assets
vi.mock('pixi.js', () => ({
  Assets: {
    load: vi.fn(),
  },
}));

// Mock global Audio constructor
global.Audio = vi.fn().mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: '',
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock FontFace
global.FontFace = vi.fn().mockImplementation(() => ({
  load: vi.fn().mockResolvedValue({}),
}));

// Mock document.fonts
Object.defineProperty(document, 'fonts', {
  value: {
    add: vi.fn(),
  },
  writable: true,
});

describe('ResourceLoader Integration', () => {
  let resourceLoader: ResourceLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    resourceLoader = new ResourceLoader();
  });

  afterEach(() => {
    resourceLoader.dispose();
    vi.restoreAllMocks();
  });

  describe('Component Integration', () => {
    it('should integrate with configuration system', () => {
      const config = createTestResourceConfig();
      const loader = new ResourceLoader(config);
      
      expect(loader).toBeDefined();
      expect(loader.getLoadingStats()).toBeDefined();
      
      loader.dispose();
    });

    it('should provide consistent API contracts', () => {
      expect(typeof resourceLoader.loadResource).toBe('function');
      expect(typeof resourceLoader.loadResources).toBe('function');
      expect(typeof resourceLoader.getLoadingStats).toBe('function');
      expect(typeof resourceLoader.cancelLoading).toBe('function');
      expect(typeof resourceLoader.dispose).toBe('function');
    });

    it('should coordinate with other resource systems', () => {
      const stats = resourceLoader.getLoadingStats();
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('Statistics Integration', () => {
    it('should maintain statistics consistency', () => {
      const initialStats = resourceLoader.getLoadingStats();
      expect(initialStats.pending).toBe(0);
      expect(initialStats.completed).toBe(0);
      expect(initialStats.failed).toBe(0);
    });

    it('should reset statistics properly', () => {
      resourceLoader.cancelLoading();
      const stats = resourceLoader.getLoadingStats();
      expect(stats.pending).toBe(0);
    });
  });

  describe('Memory Management Integration', () => {
    it('should handle disposal without errors', () => {
      expect(() => resourceLoader.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      resourceLoader.dispose();
      expect(() => resourceLoader.dispose()).not.toThrow();
    });

    it('should maintain state after disposal', () => {
      resourceLoader.dispose();
      const stats = resourceLoader.getLoadingStats();
      expect(stats.pending).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cancellation gracefully', () => {
      expect(() => resourceLoader.cancelLoading()).not.toThrow();
    });

    it('should maintain system stability', () => {
      // Multiple operations should not break the system
      resourceLoader.cancelLoading();
      resourceLoader.cancelLoading();
      resourceLoader.dispose();
      
      expect(() => resourceLoader.getLoadingStats()).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should handle various configuration scenarios', () => {
      const configs = [
        {},
        { cleanupInterval: 5000 },
        { trackReferences: true },
        { autoCleanup: false },
      ];

      configs.forEach(config => {
        const loader = new ResourceLoader(config);
        expect(loader).toBeDefined();
        expect(loader.getLoadingStats()).toBeDefined();
        loader.dispose();
      });
    });

    it('should integrate with test factories', () => {
      const testConfig = createTestResourceConfig();
      const loader = new ResourceLoader(testConfig);
      
      expect(loader).toBeDefined();
      loader.dispose();
    });
  });
});