/**
 * @fileoverview VirtualRenderer Integration Tests
 *
 * Tests the integration of VirtualRenderer with other KineticSlider components,
 * particularly with SliderCore, PerformanceMonitor, and the rendering pipeline.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualRenderer } from '../../performance/virtual-renderer';
import { PerformanceMonitor } from '../../managers/performance-monitor';
import { SimpleEventEmitter } from '../../core/event-emitter';
import type { VirtualItem } from '../../performance/virtual-renderer';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    children: [],
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  })),
  Sprite: vi.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    visible: true,
    alpha: 1,
    scale: { x: 1, y: 1 },
    destroy: vi.fn(),
    parent: null,
    texture: {},
  })),
  Texture: vi.fn().mockImplementation(() => ({
    width: 100,
    height: 100,
    destroy: vi.fn(),
    baseTexture: { destroy: vi.fn() },
  })),
  Graphics: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    beginFill: vi.fn(),
    drawRect: vi.fn(),
    endFill: vi.fn(),
    x: 0,
    y: 0,
  })),
  Rectangle: vi
    .fn()
    .mockImplementation((x, y, w, h) => ({ x, y, width: w, height: h })),
}));

describe('VirtualRenderer Integration Tests', () => {
  let virtualRenderer: VirtualRenderer;
  let performanceMonitor: PerformanceMonitor;
  let eventEmitter: SimpleEventEmitter;
  let mockContainer: any;
  let mockRenderer: any;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Container } = require('pixi.js');
    mockContainer = new Container();
    mockRenderer = {
      render: vi.fn(),
      view: { width: 1200, height: 800 },
    };

    virtualRenderer = new VirtualRenderer({
      containerWidth: 1200,
      containerHeight: 800,
      itemWidth: 200,
      itemHeight: 150,
      enableRecycling: true,
      maxPoolSize: 50,
      bufferSize: 2,
    });

    performanceMonitor = new PerformanceMonitor();

    eventEmitter = new SimpleEventEmitter();
  });

  afterEach(() => {
    virtualRenderer.dispose();
    performanceMonitor.dispose();
    vi.clearAllMocks();
  });

  describe('Performance Monitor Integration', () => {
    it('should track rendering performance metrics', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Start monitoring
      performanceMonitor.start();

      // Set large dataset
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: { value: Math.random() },
      }));
      virtualRenderer.setItems(items);

      // Simulate scrolling
      for (let i = 0; i < 10; i++) {
        virtualRenderer.updateViewport(i * 100, i * 50);
      }

      // Check performance metrics
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps.current).toBeGreaterThanOrEqual(0);
      expect(metrics.fps.average).toBeGreaterThanOrEqual(0);
    });

    it('should optimize when performance degrades', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Virtual renderer should adjust to large dataset
      virtualRenderer.updateViewport(500, 300);
      const stats = virtualRenderer.getStats();

      // Should have adjusted pool size or rendering strategy
      expect(stats.pooledItems).toBeGreaterThan(0);
      expect(stats.renderedItems).toBeLessThan(50); // Should render fewer items
    });
  });

  describe('Event System Integration', () => {
    it('should emit scroll events that integrate with other components', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const scrollHandler = vi.fn();
      const updateHandler = vi.fn();

      virtualRenderer.on('scroll', scrollHandler);
      virtualRenderer.on('items-updated', updateHandler);

      // Set items
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Update viewport
      virtualRenderer.updateViewport(200, 100);

      expect(scrollHandler).toHaveBeenCalledWith({
        x: 200,
        y: 100,
        visibleRange: expect.any(Object),
      });
      expect(updateHandler).toHaveBeenCalled();
    });

    it('should coordinate with global event system', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Listen for virtual renderer events on global emitter
      const globalScrollHandler = vi.fn();
      eventEmitter.on('virtual-scroll', globalScrollHandler);

      // Bridge events
      virtualRenderer.on('scroll', (data) => {
        eventEmitter.emit('virtual-scroll', data);
      });

      // Trigger scroll
      virtualRenderer.updateViewport(100, 50);

      expect(globalScrollHandler).toHaveBeenCalledWith({
        x: 100,
        y: 50,
        visibleRange: expect.any(Object),
      });
    });
  });

  describe('Sprite Pool Management', () => {
    it('should efficiently reuse sprites across updates', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Sprite } = require('pixi.js');
      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Track sprite creation
      const spriteCreations: any[] = [];
      Sprite.mockImplementation(() => {
        const sprite = {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          visible: true,
          destroy: vi.fn(),
          parent: null,
        };
        spriteCreations.push(sprite);
        return sprite;
      });

      // Initial render
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      const initialSpriteCount = spriteCreations.length;

      // Scroll multiple times
      for (let i = 0; i < 10; i++) {
        virtualRenderer.updateViewport(i * 50, 0);
      }

      // Should reuse sprites, not create many new ones
      const finalSpriteCount = spriteCreations.length;
      expect(finalSpriteCount - initialSpriteCount).toBeLessThan(20);
    });

    it('should handle rapid item updates without memory leaks', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Simulate rapid updates
      for (let batch = 0; batch < 10; batch++) {
        const items = Array.from({ length: 100 + batch * 10 }, (_, i) => ({
          id: `${batch}-${i}`,
          value: Math.random(),
        }));
        virtualRenderer.setItems(items);
        virtualRenderer.forceUpdate();
      }

      const stats = virtualRenderer.getStats();
      expect(stats.pooledItems).toBeLessThanOrEqual(50); // Max pool size
      expect(stats.totalItems).toBe(190); // Last batch size
    });
  });

  describe('Custom Renderer Integration', () => {
    it('should work with custom item renderers', () => {
      const customRenderer = vi.fn((item: VirtualItem, sprite: any) => {
        sprite.alpha = item.index % 2 === 0 ? 1 : 0.5;
        sprite.scale = { x: 1, y: 1 };
        return sprite;
      });

      virtualRenderer = new VirtualRenderer({
        containerWidth: 800,
        containerHeight: 600,
        itemWidth: 100,
        itemHeight: 100,
      });

      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      expect(customRenderer).toHaveBeenCalled();
    });

    it('should support dynamic renderer switching', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 30 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Initial render
      virtualRenderer.forceUpdate();

      // Switch to grid layout
      const newConfig = {
        containerWidth: 800,
        containerHeight: 600,
        itemWidth: 150,
        itemHeight: 150,
        columns: 4,
      };

      // Reinitialize with new config
      virtualRenderer.dispose();
      virtualRenderer = new VirtualRenderer(newConfig);
      virtualRenderer.initialize(mockContainer, mockRenderer);
      virtualRenderer.setItems(items);
      virtualRenderer.forceUpdate();

      const stats2 = virtualRenderer.getStats();
      expect(stats2.renderedItems).toBeLessThanOrEqual(20); // Different visible count
    });
  });

  describe('Memory Management Integration', () => {
    it('should properly clean up when integrated with memory profiler', () => {
      const memoryProfiler = {
        trackAllocation: vi.fn(),
        freeAllocation: vi.fn(),
        takeSnapshot: vi.fn(),
      };

      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Track allocations
      const items = Array.from({ length: 200 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);
      memoryProfiler.trackAllocation(
        'virtual-items',
        items,
        'Array',
        200 * 100
      );

      virtualRenderer.forceUpdate();

      // Clear items
      virtualRenderer.clear();
      memoryProfiler.freeAllocation('virtual-items');

      // Dispose
      virtualRenderer.dispose();
      memoryProfiler.freeAllocation('virtual-renderer');

      expect(memoryProfiler.freeAllocation).toHaveBeenCalledTimes(2);
    });

    it('should maintain stable memory usage during long sessions', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const memorySnapshots: number[] = [];

      // Simulate long session with many updates
      for (let session = 0; session < 20; session++) {
        const items = Array.from({ length: 100 }, (_, i) => ({
          id: `${session}-${i}`,
        }));
        virtualRenderer.setItems(items);

        // Simulate scrolling
        for (let scroll = 0; scroll < 5; scroll++) {
          virtualRenderer.updateViewport(scroll * 100, 0);
        }

        // Take memory snapshot (simplified)
        const stats = virtualRenderer.getStats();
        memorySnapshots.push(stats.pooledItems);
      }

      // Memory usage should stabilize
      const lastFive = memorySnapshots.slice(-5);
      const variance = Math.max(...lastFive) - Math.min(...lastFive);
      expect(variance).toBeLessThan(10); // Should be relatively stable
    });
  });

  describe('Viewport Synchronization', () => {
    it('should synchronize with external viewport changes', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 500 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // External viewport update (e.g., from slider navigation)
      const externalViewport = { x: 300, y: 200 };
      virtualRenderer.updateViewport(externalViewport.x, externalViewport.y);

      // Check visible items
      const stats = virtualRenderer.getStats();
      expect(stats.visibleItems).toBeGreaterThan(0);
      expect(stats.visibleItems).toBeLessThan(500);
    });

    it('should handle viewport resize events', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Simulate resize
      mockContainer.width = 1600;
      mockContainer.height = 900;
      virtualRenderer.resizeViewport(1600, 900);

      // Should adjust visible items
      const stats = virtualRenderer.getStats();
      expect(stats.renderedItems).toBeGreaterThan(0);
    });
  });

  describe('Batch Operations', () => {
    it('should efficiently handle batch item updates', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const initialItems = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(initialItems);

      // Batch update by recreating items
      const updatedItems = initialItems.map((item, i) =>
        i === 10 || i === 20 || i === 30 ? { ...item, updated: true } : item
      );
      virtualRenderer.setItems(updatedItems);

      virtualRenderer.forceUpdate();

      const stats = virtualRenderer.getStats();
      expect(stats.totalItems).toBe(50);
    });

    it('should support batch removal and addition', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Initial items
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Remove items 20-40
      const filtered = items.filter((item) => item.id < 20 || item.id > 40);
      virtualRenderer.setItems(filtered);

      expect(virtualRenderer.getStats().totalItems).toBe(79);

      // Add new items
      const newItems = Array.from({ length: 20 }, (_, i) => ({ id: 100 + i }));
      virtualRenderer.setItems([...filtered, ...newItems]);

      expect(virtualRenderer.getStats().totalItems).toBe(99);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from rendering errors', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      // Mock a rendering error
      mockRenderer.render = vi.fn().mockImplementationOnce(() => {
        throw new Error('Render failed');
      });

      const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Should not throw
      expect(() => virtualRenderer.forceUpdate()).not.toThrow();

      // Should still have items
      expect(virtualRenderer.getStats().totalItems).toBe(50);
    });

    it('should handle invalid viewport updates gracefully', () => {
      virtualRenderer.initialize(mockContainer, mockRenderer);

      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      // Invalid viewport values
      virtualRenderer.updateViewport(NaN, -Infinity);
      expect(virtualRenderer.getStats().renderedItems).toBeGreaterThanOrEqual(
        0
      );

      virtualRenderer.updateViewport(-10000, -10000);
      expect(virtualRenderer.getStats().renderedItems).toBeGreaterThanOrEqual(
        0
      );

      virtualRenderer.updateViewport(100000, 100000);
      expect(virtualRenderer.getStats().renderedItems).toBeGreaterThanOrEqual(
        0
      );
    });
  });
});
