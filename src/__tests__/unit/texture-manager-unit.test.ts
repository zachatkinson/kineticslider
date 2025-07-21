/**
 * @fileoverview Simplified Unit Tests for TextureManager
 *
 * Fast unit tests focusing on basic API without real texture loading.
 * Complex texture loading tests moved to E2E suite.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextureManager } from '../../rendering/texture-manager';

// Mock PIXI.js completely with proper Texture structure
vi.mock('pixi.js', () => {
  const mockTexture = {
    source: { width: 100, height: 100 },
    baseTexture: { width: 100, height: 100 },
    width: 100,
    height: 100,
    valid: true,
  };

  return {
    Assets: {
      load: vi.fn().mockResolvedValue(mockTexture),
    },
    Texture: {
      from: vi.fn().mockReturnValue(mockTexture),
    },
  };
});

describe('TextureManager Unit Tests', () => {
  let textureManager: TextureManager;

  beforeEach(() => {
    textureManager = new TextureManager();
  });

  afterEach(() => {
    textureManager.dispose();
  });

  describe('Basic Functionality', () => {
    it('should initialize without errors', () => {
      expect(textureManager).toBeDefined();
      expect(typeof textureManager.loadTexture).toBe('function');
      expect(typeof textureManager.dispose).toBe('function');
    });

    it('should have basic API methods', () => {
      expect(typeof textureManager.loadTexture).toBe('function');
      expect(typeof textureManager.loadTextures).toBe('function');
      expect(typeof textureManager.getCachedTexture).toBe('function');
      expect(typeof textureManager.clearCache).toBe('function');
      expect(typeof textureManager.getMemoryUsage).toBe('function');
      expect(typeof textureManager.dispose).toBe('function');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache methods', () => {
      expect(typeof textureManager.getCachedTexture).toBe('function');
      expect(typeof textureManager.clearCache).toBe('function');
    });

    it('should handle cache clearing', () => {
      textureManager.clearCache();
      const clearedCache = textureManager.getCachedTexture('any-test.jpg');
      expect(clearedCache).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should provide memory usage information', () => {
      const usage = textureManager.getMemoryUsage();
      expect(usage).toHaveProperty('cached');
      expect(usage).toHaveProperty('total');
      expect(typeof usage.cached).toBe('number');
      expect(typeof usage.total).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should provide error handling methods', () => {
      expect(() => textureManager.dispose()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should dispose without errors', () => {
      expect(() => textureManager.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      textureManager.dispose();
      expect(() => textureManager.dispose()).not.toThrow();
    });
  });
});
