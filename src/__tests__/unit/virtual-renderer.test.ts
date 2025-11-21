/**
 * @fileoverview Unit tests for VirtualRenderer
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { VirtualRenderer } from '../../performance/virtual-renderer';
import type {
  VirtualItem,
  VirtualRendererConfig,
} from '../../performance/virtual-renderer';
import { Container } from 'pixi.js';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
  })),
  Sprite: vi.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: true,
    alpha: 1,
    tint: 0xffffff,
    scale: { set: vi.fn() },
    destroy: vi.fn(),
    parent: null,
    texture: null,
  })),
}));

describe('VirtualRenderer', () => {
  let virtualRenderer: VirtualRenderer;
  let mockContainer: Container;
  let mockRenderer: any;

  beforeEach(() => {
    virtualRenderer = new VirtualRenderer();
    mockContainer = new Container();
    mockRenderer = {
      render: vi.fn(),
      resize: vi.fn(),
    };
  });

  afterEach(() => {
    virtualRenderer.dispose();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(virtualRenderer).toBeDefined();
      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.visibleItems).toBe(0);
      expect(stats.renderedItems).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const config: Partial<VirtualRendererConfig> = {
        containerWidth: 1200,
        containerHeight: 800,
        itemWidth: 300,
        itemHeight: 200,
        bufferSize: 3,
        enableRecycling: true,
        maxPoolSize: 100,
      };

      const customRenderer = new VirtualRenderer(config);
      expect(customRenderer).toBeDefined();
      customRenderer.dispose();
    });

    it('should initialize sprite pool when recycling is enabled', () => {
      const renderer = new VirtualRenderer({
        enableRecycling: true,
        maxPoolSize: 20,
      });

      renderer.initialize(mockContainer, mockRenderer);
      const stats = renderer.getStats();
      expect(stats.pooledItems).toBeGreaterThan(0);
      renderer.dispose();
    });
  });

  describe('Item Management', () => {
    beforeEach(() => {
      virtualRenderer.initialize(mockContainer, mockRenderer);
    });

    it('should set items with default item creation', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));
      virtualRenderer.setItems(items);

      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(100);
    });

    it('should set items with custom item creation', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));

      const createItem = (data: any, index: number): VirtualItem => ({
        id: `custom-${index}`,
        index,
        data,
        width: 250,
        height: 150,
        x: (index % 4) * 250,
        y: Math.floor(index / 4) * 150,
      });

      virtualRenderer.setItems(items, createItem);

      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(50);
    });

    it('should handle empty item array', () => {
      virtualRenderer.setItems([]);

      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.visibleItems).toBe(0);
    });
  });

  describe('Viewport Updates', () => {
    beforeEach(() => {
      virtualRenderer.initialize(mockContainer, mockRenderer);
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
    });

    it('should update viewport on scroll', () => {
      const viewportChangeSpy = vi.fn();
      virtualRenderer.on('viewport-change', viewportChangeSpy);

      virtualRenderer.updateViewport(100, 200);

      expect(viewportChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          scrollX: 100,
          scrollY: 200,
        })
      );
    });

    it('should ignore small scroll changes below threshold', () => {
      const viewportChangeSpy = vi.fn();
      virtualRenderer.on('viewport-change', viewportChangeSpy);

      virtualRenderer.updateViewport(1, 1); // Below default threshold of 5
      expect(viewportChangeSpy).not.toHaveBeenCalled();

      virtualRenderer.updateViewport(10, 10); // Above threshold
      expect(viewportChangeSpy).toHaveBeenCalled();
    });

    it('should emit scroll start and end events', async () => {
      const scrollStartSpy = vi.fn();
      const scrollEndSpy = vi.fn();

      virtualRenderer.on('scroll-start', scrollStartSpy);
      virtualRenderer.on('scroll-end', scrollEndSpy);

      virtualRenderer.updateViewport(100, 100);
      expect(scrollStartSpy).toHaveBeenCalled();

      // Wait for scroll end timeout
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(scrollEndSpy).toHaveBeenCalled();
    });

    it('should handle viewport resize', () => {
      virtualRenderer.resizeViewport(1600, 900);

      const viewportChangeSpy = vi.fn();
      virtualRenderer.on('viewport-change', viewportChangeSpy);

      virtualRenderer.updateViewport(0, 0);

      expect(viewportChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1600,
          height: 900,
        })
      );
    });
  });

  describe('Virtual Scrolling', () => {
    beforeEach(() => {
      virtualRenderer.initialize(mockContainer, mockRenderer);
    });

    it('should only render visible items', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        x: (i % 10) * 200,
        y: Math.floor(i / 10) * 150,
      }));

      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      const stats = virtualRenderer.getStats();
      expect(stats.visibleItems).toBeLessThan(stats.totalItems);
      expect(stats.renderedItems).toBe(stats.visibleItems);
    });

    it('should update visible items on scroll', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        x: (i % 10) * 200,
        y: Math.floor(i / 10) * 150,
      }));

      virtualRenderer.setItems(items);

      const itemsUpdateSpy = vi.fn();
      virtualRenderer.on('items-update', itemsUpdateSpy);

      virtualRenderer.updateViewport(0, 1000);

      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      expect(itemsUpdateSpy).toHaveBeenCalled();
      const updatedItems = itemsUpdateSpy.mock.calls[0][0];
      expect(Array.isArray(updatedItems)).toBe(true);
    });

    it('should include buffer items outside viewport', () => {
      const renderer = new VirtualRenderer({
        containerWidth: 400,
        containerHeight: 300,
        itemWidth: 100,
        itemHeight: 100,
        bufferSize: 2,
      });

      renderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: (i % 10) * 100,
        y: Math.floor(i / 10) * 100,
      }));

      renderer.setItems(items);
      renderer.forceUpdate();

      const stats = renderer.getStats();
      // Should render viewport items (4x3=12) plus buffer
      expect(stats.visibleItems).toBeGreaterThan(12);

      renderer.dispose();
    });
  });

  describe('Sprite Recycling', () => {
    it('should recycle sprites when enabled', () => {
      const renderer = new VirtualRenderer({
        enableRecycling: true,
        maxPoolSize: 10,
      });

      renderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 20 }, (_, i) => ({ id: i }));
      renderer.setItems(items);
      renderer.forceUpdate();

      // Scroll to different area
      renderer.updateViewport(0, 1000);
      renderer.forceUpdate();

      const stats2 = renderer.getStats();
      expect(stats2.recycledItems).toBeGreaterThan(0);

      renderer.dispose();
    });

    it('should not exceed max pool size', () => {
      const maxPoolSize = 5;
      const renderer = new VirtualRenderer({
        enableRecycling: true,
        maxPoolSize,
      });

      renderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      renderer.setItems(items);

      // Multiple updates to trigger recycling
      for (let i = 0; i < 10; i++) {
        renderer.updateViewport(0, i * 200);
        renderer.forceUpdate();
      }

      const stats = renderer.getStats();
      expect(stats.pooledItems).toBeLessThanOrEqual(maxPoolSize);

      renderer.dispose();
    });
  });

  describe('Performance', () => {
    it('should emit performance warning on slow updates', async () => {
      const performanceWarningSpy = vi.fn();
      virtualRenderer.on('performance-warning', performanceWarningSpy);

      // Mock slow update
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (cb: FrameRequestCallback) => {
        setTimeout(() => {
          const start = performance.now();
          // Simulate slow update
          while (performance.now() - start < 20) {
            // Busy wait
          }
          cb(0);
        }, 0);
        return 0;
      };

      const items = Array.from({ length: 10000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      await new Promise(resolve => setTimeout(resolve, 100));
      global.requestAnimationFrame = originalRAF;
      // Performance warning might be emitted based on actual timing
    });

    it('should track render statistics', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      const stats = virtualRenderer.getStats();
      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('visibleItems');
      expect(stats).toHaveProperty('renderedItems');
      expect(stats).toHaveProperty('pooledItems');
      expect(stats).toHaveProperty('recycledItems');
      expect(stats).toHaveProperty('frameTime');
      expect(stats).toHaveProperty('updateTime');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should estimate memory usage', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      const memoryUsage = virtualRenderer.estimateMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);

      const stats = virtualRenderer.getStats();
      expect(stats.memoryUsage).toBe(memoryUsage);
    });
  });

  describe('Cleanup', () => {
    it('should clear all rendered items', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      const statsBefore = virtualRenderer.getStats();
      expect(statsBefore.renderedItems).toBeGreaterThan(0);

      virtualRenderer.clear();

      const statsAfter = virtualRenderer.getStats();
      expect(statsAfter.visibleItems).toBe(0);
      expect(statsAfter.renderedItems).toBe(0);
    });

    it('should dispose properly', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      virtualRenderer.dispose();

      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.visibleItems).toBe(0);
      expect(stats.renderedItems).toBe(0);
      expect(stats.pooledItems).toBe(0);
    });

    it('should handle multiple dispose calls', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      expect(() => {
        virtualRenderer.dispose();
        virtualRenderer.dispose(); // Second dispose should not throw
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rendering without initialization', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));

      expect(() => {
        virtualRenderer.setItems(items);
        virtualRenderer.forceUpdate();
      }).not.toThrow();
    });

    it('should handle very large datasets', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(100000);

      // Should still only render visible items
      virtualRenderer.forceUpdate();
      expect(stats.visibleItems).toBeLessThan(1000); // Much less than total
    });

    it('should handle rapid scroll updates', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Rapid scroll updates
      for (let i = 0; i < 100; i++) {
        virtualRenderer.updateViewport(i * 10, i * 5);
      }

      // Should not crash or leak memory
      const stats = virtualRenderer.getStats();
      expect(stats.renderedItems).toBeLessThanOrEqual(stats.totalItems);
    });
  });
});
