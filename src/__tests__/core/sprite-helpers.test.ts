/**
 * @fileoverview Sprite Helpers Tests
 *
 * Unit tests for sprite helper utility functions.
 * Tests type-safe sprite operations, scale calculations, and DRY elimination patterns.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBaseScale,
  setBaseScale,
  calculateFinalScale,
  applyUniformScale,
  normalizeScale,
  calculateDragScaleFactor,
} from '../../core/sprite-helpers';
import { SCALE } from '../../core/constants';
import type { Sprite } from 'pixi.js';

// Interface for mock sprite with baseScale property
interface MockSprite extends Sprite {
  baseScale?: number;
}

// Mock sprite factory
function createMockSprite(overrides: Partial<MockSprite> = {}): MockSprite {
  return {
    x: 0,
    y: 0,
    scale: {
      x: 1,
      y: 1,
      set: function (x: number, y: number) {
        this.x = x;
        this.y = y;
      },
    },
    alpha: 1,
    visible: true,
    baseScale: undefined,
    ...overrides,
  } as MockSprite;
}

describe('Sprite Helpers', () => {
  let mockSprite: MockSprite;

  beforeEach(() => {
    mockSprite = createMockSprite();
  });

  describe('getBaseScale', () => {
    it('should return baseScale when property exists', () => {
      const sprite = createMockSprite({ baseScale: 1.5 });
      const scale = getBaseScale(sprite);
      expect(scale).toBe(1.5);
    });

    it('should return SCALE.DEFAULT when baseScale is undefined', () => {
      const sprite = createMockSprite({ baseScale: undefined });
      const scale = getBaseScale(sprite);
      expect(scale).toBe(SCALE.DEFAULT);
    });

    it('should return SCALE.DEFAULT when baseScale is null', () => {
      const sprite = createMockSprite();
      (sprite as unknown as { baseScale: null }).baseScale = null;
      const scale = getBaseScale(sprite);
      expect(scale).toBe(SCALE.DEFAULT);
    });

    it('should return SCALE.DEFAULT when baseScale is 0', () => {
      const sprite = createMockSprite({ baseScale: 0 });
      const scale = getBaseScale(sprite);
      expect(scale).toBe(SCALE.DEFAULT);
    });

    it('should handle very small baseScale values', () => {
      const sprite = createMockSprite({ baseScale: 0.001 });
      const scale = getBaseScale(sprite);
      expect(scale).toBe(0.001);
    });

    it('should handle very large baseScale values', () => {
      const sprite = createMockSprite({ baseScale: 100 });
      const scale = getBaseScale(sprite);
      expect(scale).toBe(100);
    });

    it('should handle negative baseScale values', () => {
      const sprite = createMockSprite({ baseScale: -1.5 });
      const scale = getBaseScale(sprite);
      expect(scale).toBe(-1.5);
    });
  });

  describe('setBaseScale', () => {
    it('should set baseScale property on sprite', () => {
      setBaseScale(mockSprite, 1.8);
      expect((mockSprite as MockSprite).baseScale).toBe(1.8);
    });

    it('should overwrite existing baseScale', () => {
      const sprite = createMockSprite({ baseScale: 1.2 });
      setBaseScale(sprite, 2.0);
      expect((sprite as MockSprite).baseScale).toBe(2.0);
    });

    it('should handle zero scale', () => {
      setBaseScale(mockSprite, 0);
      expect((mockSprite as MockSprite).baseScale).toBe(0);
    });

    it('should handle negative scale', () => {
      setBaseScale(mockSprite, -1.5);
      expect((mockSprite as MockSprite).baseScale).toBe(-1.5);
    });

    it('should handle decimal scale values', () => {
      setBaseScale(mockSprite, 0.75);
      expect((mockSprite as MockSprite).baseScale).toBe(0.75);
    });

    it('should handle very large scale values', () => {
      setBaseScale(mockSprite, 999.999);
      expect((mockSprite as MockSprite).baseScale).toBe(999.999);
    });
  });

  describe('calculateFinalScale', () => {
    it('should multiply base scale by multiplier', () => {
      const sprite = createMockSprite({ baseScale: 1.2 });
      const finalScale = calculateFinalScale(sprite, 1.5);
      expect(finalScale).toBeCloseTo(1.8, 5); // 1.2 * 1.5
    });

    it('should use SCALE.DEFAULT when baseScale not set', () => {
      const finalScale = calculateFinalScale(mockSprite, 2);
      expect(finalScale).toBe(SCALE.DEFAULT * 2);
    });

    it('should handle zero multiplier', () => {
      const sprite = createMockSprite({ baseScale: 1.5 });
      const finalScale = calculateFinalScale(sprite, 0);
      expect(finalScale).toBe(0);
    });

    it('should handle negative multiplier', () => {
      const sprite = createMockSprite({ baseScale: 1.0 });
      const finalScale = calculateFinalScale(sprite, -0.5);
      expect(finalScale).toBe(-0.5);
    });

    it('should handle very small multipliers', () => {
      const sprite = createMockSprite({ baseScale: 2.0 });
      const finalScale = calculateFinalScale(sprite, 0.001);
      expect(finalScale).toBeCloseTo(0.002, 6);
    });

    it('should handle very large multipliers', () => {
      const sprite = createMockSprite({ baseScale: 1.5 });
      const finalScale = calculateFinalScale(sprite, 100);
      expect(finalScale).toBe(150);
    });
  });

  describe('applyUniformScale', () => {
    it('should apply scale to both x and y', () => {
      applyUniformScale(mockSprite, 1.5);
      expect(mockSprite.scale.x).toBe(1.5);
      expect(mockSprite.scale.y).toBe(1.5);
    });

    it('should handle zero scale', () => {
      applyUniformScale(mockSprite, 0);
      expect(mockSprite.scale.x).toBe(0);
      expect(mockSprite.scale.y).toBe(0);
    });

    it('should handle negative scales', () => {
      applyUniformScale(mockSprite, -1.2);
      expect(mockSprite.scale.x).toBe(-1.2);
      expect(mockSprite.scale.y).toBe(-1.2);
    });

    it('should overwrite existing different x/y scales', () => {
      mockSprite.scale.x = 2.0;
      mockSprite.scale.y = 0.5;

      applyUniformScale(mockSprite, 1.8);
      expect(mockSprite.scale.x).toBe(1.8);
      expect(mockSprite.scale.y).toBe(1.8);
    });

    it('should handle very small scales', () => {
      applyUniformScale(mockSprite, 0.001);
      expect(mockSprite.scale.x).toBe(0.001);
      expect(mockSprite.scale.y).toBe(0.001);
    });

    it('should handle very large scales', () => {
      applyUniformScale(mockSprite, 50);
      expect(mockSprite.scale.x).toBe(50);
      expect(mockSprite.scale.y).toBe(50);
    });
  });

  describe('normalizeScale', () => {
    it('should return scale within bounds unchanged', () => {
      const normalizedScale = normalizeScale(1.5);
      expect(normalizedScale).toBe(1.5);
    });

    it('should clamp scale to minimum', () => {
      const normalizedScale = normalizeScale(-10);
      expect(normalizedScale).toBe(SCALE.MIN);
    });

    it('should clamp scale to maximum', () => {
      const normalizedScale = normalizeScale(1000);
      expect(normalizedScale).toBe(SCALE.MAX);
    });

    it('should handle scale exactly at minimum', () => {
      const normalizedScale = normalizeScale(SCALE.MIN);
      expect(normalizedScale).toBe(SCALE.MIN);
    });

    it('should handle scale exactly at maximum', () => {
      const normalizedScale = normalizeScale(SCALE.MAX);
      expect(normalizedScale).toBe(SCALE.MAX);
    });

    it('should handle zero scale', () => {
      const normalizedScale = normalizeScale(0);
      if (0 < SCALE.MIN) {
        expect(normalizedScale).toBe(SCALE.MIN);
      } else {
        expect(normalizedScale).toBe(0);
      }
    });

    it('should handle very small positive scales', () => {
      const normalizedScale = normalizeScale(0.001);
      expect(normalizedScale).toBeGreaterThanOrEqual(SCALE.MIN);
      expect(normalizedScale).toBeLessThanOrEqual(SCALE.MAX);
    });
  });

  describe('calculateDragScaleFactor', () => {
    it('should calculate scale factor from drag distance', () => {
      const factor = calculateDragScaleFactor(50, 100, 0.2); // 50% of threshold, 0.2 intensity
      expect(factor).toBeCloseTo(1.1, 5); // 1 + 0.5 * 0.2 = 1.1
    });

    it('should cap at maximum when distance exceeds threshold', () => {
      const factor = calculateDragScaleFactor(200, 100, 0.3); // 200% of threshold
      expect(factor).toBeCloseTo(1.3, 5); // 1 + 1.0 * 0.3 = 1.3 (capped at 1.0 normalized factor)
    });

    it('should handle zero distance', () => {
      const factor = calculateDragScaleFactor(0, 100, 0.5);
      expect(factor).toBe(1.0); // 1 + 0 * 0.5 = 1.0
    });

    it('should handle negative distance (absolute value)', () => {
      const factor = calculateDragScaleFactor(-75, 100, 0.4);
      expect(factor).toBeCloseTo(1.3, 5); // 1 + 0.75 * 0.4 = 1.3
    });

    it('should handle zero intensity', () => {
      const factor = calculateDragScaleFactor(50, 100, 0);
      expect(factor).toBe(1.0); // 1 + 0.5 * 0 = 1.0
    });

    it('should handle negative intensity', () => {
      const factor = calculateDragScaleFactor(50, 100, -0.2);
      expect(factor).toBeCloseTo(0.9, 5); // 1 + 0.5 * (-0.2) = 0.9
    });

    it('should handle zero threshold gracefully', () => {
      // This should cap the normalized factor at 1.0 to prevent division by zero
      const factor = calculateDragScaleFactor(50, 0, 0.3);
      expect(factor).toBeCloseTo(1.3, 5); // Should use normalized factor of 1.0
    });

    it('should handle very small thresholds', () => {
      const factor = calculateDragScaleFactor(0.5, 0.1, 0.2);
      expect(factor).toBeCloseTo(1.2, 5); // Should use normalized factor of 1.0 (capped)
    });

    it('should handle high intensity values', () => {
      const factor = calculateDragScaleFactor(25, 100, 2.0); // 25% distance, high intensity
      expect(factor).toBeCloseTo(1.5, 5); // 1 + 0.25 * 2.0 = 1.5
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should throw appropriate errors for null sprites', () => {
      expect(() => {
        getBaseScale(null as unknown as Sprite);
      }).toThrow();

      expect(() => {
        setBaseScale(null as unknown as Sprite, 1.5);
      }).toThrow();
    });

    it('should throw appropriate errors for undefined sprites', () => {
      expect(() => {
        calculateFinalScale(undefined as unknown as Sprite, 2);
      }).toThrow();

      expect(() => {
        applyUniformScale(undefined as unknown as Sprite, 1.5);
      }).toThrow();
    });

    it('should handle sprites with missing properties', () => {
      const incompleteSprite = { x: 100 } as unknown as Sprite;

      expect(() => {
        getBaseScale(incompleteSprite);
      }).not.toThrow();

      expect(() => {
        setBaseScale(incompleteSprite, 1.2);
      }).not.toThrow();
    });

    it('should handle infinite and NaN values', () => {
      expect(() => {
        setBaseScale(mockSprite, Infinity);
      }).not.toThrow();

      const result = calculateFinalScale(mockSprite, NaN);
      expect(result).toBeNaN();

      expect(() => {
        applyUniformScale(mockSprite, Infinity);
      }).not.toThrow();
    });

    it('should handle NaN in normalize scale', () => {
      const normalizedScale = normalizeScale(NaN);
      expect(normalizedScale).toBeNaN(); // Math.max/min with NaN returns NaN
    });

    it('should handle Infinity in normalize scale', () => {
      const normalizedScale = normalizeScale(Infinity);
      expect(normalizedScale).toBe(SCALE.MAX);
    });
  });

  describe('Performance', () => {
    it('should efficiently handle many scale operations', () => {
      const sprites = Array.from({ length: 1000 }, () => createMockSprite());
      const start = performance.now();

      sprites.forEach((sprite, index) => {
        setBaseScale(sprite, 1 + index * 0.001);
        const finalScale = calculateFinalScale(sprite, 1.5);
        applyUniformScale(sprite, finalScale);
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should efficiently normalize many scales', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        normalizeScale(Math.random() * 10 - 5); // Random values from -5 to 5
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5); // Should complete in under 5ms
    });

    it('should efficiently calculate many drag scale factors', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        calculateDragScaleFactor(
          Math.random() * 200,
          100 + Math.random() * 50,
          Math.random() * 0.5
        );
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in under 10ms
    });
  });

  describe('Integration Scenarios', () => {
    it('should work together for common drag interaction pattern', () => {
      // Simulate a common drag interaction workflow
      const sprite = createMockSprite();

      // 1. Set initial base scale
      setBaseScale(sprite, 1.2);

      // 2. Calculate drag scale factor
      const dragFactor = calculateDragScaleFactor(60, 100, 0.3); // 60px drag, 100px threshold, 0.3 intensity

      // 3. Calculate final scale
      const finalScale = calculateFinalScale(sprite, dragFactor);

      // 4. Normalize and apply scale
      const normalizedScale = normalizeScale(finalScale);
      applyUniformScale(sprite, normalizedScale);

      // Verify the complete workflow
      expect(getBaseScale(sprite)).toBe(1.2);
      expect(dragFactor).toBeCloseTo(1.18, 5); // 1 + 0.6 * 0.3
      expect(finalScale).toBeCloseTo(1.416, 5); // 1.2 * 1.18
      expect(sprite.scale.x).toBe(normalizedScale);
      expect(sprite.scale.y).toBe(normalizedScale);
    });

    it('should maintain consistency across multiple operations', () => {
      const sprite = createMockSprite();
      setBaseScale(sprite, 1.5);

      // Apply multiple transformations
      const factor1 = calculateDragScaleFactor(25, 100, 0.2);
      const scale1 = calculateFinalScale(sprite, factor1);
      applyUniformScale(sprite, normalizeScale(scale1));

      const factor2 = calculateDragScaleFactor(75, 100, 0.1);
      const scale2 = calculateFinalScale(sprite, factor2);
      applyUniformScale(sprite, normalizeScale(scale2));

      // Base scale should remain unchanged
      expect(getBaseScale(sprite)).toBe(1.5);
      // Final scale should be properly calculated
      expect(sprite.scale.x).toBe(sprite.scale.y); // Uniform scaling maintained
    });
  });
});
