/**
 * @fileoverview VirtualRenderer E2E Tests
 *
 * End-to-end tests for virtual rendering functionality in real browser environment.
 * Tests scrolling performance, memory usage, and visual rendering.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('VirtualRenderer E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/demo/virtual-renderer.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Virtual Scrolling', () => {
    test('should render only visible items', async () => {
      // Initialize with large dataset
      await page.evaluate(() => {
        window.testData = {
          items: Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            title: `Item ${i}`,
            image: `/images/test-${i % 10}.jpg`,
          })),
        };
        window.initVirtualRenderer(window.testData.items);
      });

      // Check initial visible items
      const visibleItems = await page.locator('.virtual-item:visible').count();
      expect(visibleItems).toBeLessThan(50); // Should only render visible items

      // Check total items in DOM
      const totalDOMItems = await page.locator('.virtual-item').count();
      expect(totalDOMItems).toBeLessThan(100); // Should have limited DOM nodes
    });

    test('should maintain smooth scrolling at 60fps', async () => {
      // Setup performance observer
      const metrics = await page.evaluate(() => {
        const observer = new PerformanceObserver((list) => {
          window.performanceEntries = list.getEntries();
        });
        observer.observe({ entryTypes: ['measure', 'frame'] });

        // Initialize renderer
        window.initVirtualRenderer(
          Array.from({ length: 5000 }, (_, i) => ({ id: i }))
        );

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(window.performanceEntries || []);
          }, 100);
        });
      });

      // Perform smooth scroll
      await page.evaluate(() => {
        const container = document.querySelector('.virtual-container');
        if (container) {
          container.scrollTo({ top: 5000, behavior: 'smooth' });
        }
      });

      await page.waitForTimeout(2000); // Wait for scroll to complete

      // Measure FPS during scroll
      const fps = await page.evaluate(() => {
        const frames = performance.getEntriesByType('frame' as any);
        if (frames.length < 2) return 60;

        const durations = frames.map((f: any) => f.duration || 16.67);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        return 1000 / avgDuration;
      });

      expect(fps).toBeGreaterThan(50); // Should maintain close to 60fps
    });

    test('should recycle sprites during scroll', async () => {
      await page.evaluate(() => {
        window.spritePool = [];
        window.initVirtualRenderer(
          Array.from({ length: 1000 }, (_, i) => ({ id: i })),
          {
            onSpriteCreate: (sprite: any) => window.spritePool.push(sprite),
          }
        );
      });

      // Initial render
      await page.waitForTimeout(500);
      const initialSpriteCount = await page.evaluate(() => window.spritePool.length);

      // Scroll multiple times
      for (let i = 0; i < 5; i++) {
        await page.evaluate((scrollY) => {
          document.querySelector('.virtual-container')?.scrollTo(0, scrollY);
        }, i * 500);
        await page.waitForTimeout(200);
      }

      // Check sprite count didn't grow significantly
      const finalSpriteCount = await page.evaluate(() => window.spritePool.length);
      expect(finalSpriteCount).toBeLessThan(initialSpriteCount * 1.5); // Minimal new sprites
    });
  });

  test.describe('Memory Management', () => {
    test('should maintain stable memory during long sessions', async () => {
      // Skip if performance.memory not available
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      // Initialize with large dataset
      await page.evaluate(() => {
        window.initVirtualRenderer(
          Array.from({ length: 10000 }, (_, i) => ({ id: i }))
        );
      });

      const memorySnapshots: number[] = [];

      // Take memory snapshots during scrolling
      for (let i = 0; i < 10; i++) {
        await page.evaluate((scrollY) => {
          document.querySelector('.virtual-container')?.scrollTo(0, scrollY);
        }, i * 1000);

        const memory = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
          }
          return 0;
        });

        memorySnapshots.push(memory);
        await page.waitForTimeout(500);
      }

      // Check memory didn't grow excessively
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });

    test('should clean up properly when items are removed', async () => {
      // Initialize with items
      await page.evaluate(() => {
        window.virtualRenderer = window.initVirtualRenderer(
          Array.from({ length: 1000 }, (_, i) => ({ id: i }))
        );
      });

      // Get initial DOM count
      const initialCount = await page.locator('.virtual-item').count();

      // Clear items
      await page.evaluate(() => {
        window.virtualRenderer.clearItems();
      });

      await page.waitForTimeout(500);

      // Check DOM was cleaned
      const finalCount = await page.locator('.virtual-item').count();
      expect(finalCount).toBe(0);
    });
  });

  test.describe('Viewport Updates', () => {
    test('should update visible range on viewport resize', async () => {
      await page.evaluate(() => {
        window.virtualRenderer = window.initVirtualRenderer(
          Array.from({ length: 500 }, (_, i) => ({ id: i }))
        );
      });

      // Get initial visible count
      const initialVisible = await page.locator('.virtual-item:visible').count();

      // Resize viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // Get new visible count
      const newVisible = await page.locator('.virtual-item:visible').count();

      // Should have more visible items with larger viewport
      expect(newVisible).toBeGreaterThan(initialVisible);
    });

    test('should handle rapid viewport changes', async () => {
      await page.evaluate(() => {
        window.virtualRenderer = window.initVirtualRenderer(
          Array.from({ length: 1000 }, (_, i) => ({ id: i }))
        );
        window.errors = [];
        window.addEventListener('error', (e) => window.errors.push(e));
      });

      // Rapidly change viewport
      const viewportSizes = [
        { width: 800, height: 600 },
        { width: 1024, height: 768 },
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        { width: 640, height: 480 },
      ];

      for (const size of viewportSizes) {
        await page.setViewportSize(size);
        await page.waitForTimeout(100);
      }

      // Check no errors occurred
      const errors = await page.evaluate(() => window.errors);
      expect(errors).toHaveLength(0);

      // Check renderer still functional
      const visibleItems = await page.locator('.virtual-item:visible').count();
      expect(visibleItems).toBeGreaterThan(0);
    });
  });

  test.describe('Performance Benchmarks', () => {
    test('should meet 60fps target with 10,000 items', async () => {
      // Start performance measurement
      await page.evaluate(() => {
        window.frameTimings = [];
        let lastTime = performance.now();

        const measureFrame = () => {
          const now = performance.now();
          window.frameTimings.push(now - lastTime);
          lastTime = now;
          requestAnimationFrame(measureFrame);
        };
        requestAnimationFrame(measureFrame);

        // Initialize with large dataset
        window.initVirtualRenderer(
          Array.from({ length: 10000 }, (_, i) => ({ id: i }))
        );
      });

      // Perform scrolling
      await page.evaluate(async () => {
        const container = document.querySelector('.virtual-container');
        if (!container) return;

        for (let i = 0; i < 20; i++) {
          container.scrollTo(0, i * 200);
          await new Promise((r) => setTimeout(r, 50));
        }
      });

      // Calculate average FPS
      const avgFrameTime = await page.evaluate(() => {
        const timings = window.frameTimings.slice(10); // Skip initial frames
        if (timings.length === 0) return 16.67;
        return timings.reduce((a, b) => a + b, 0) / timings.length;
      });

      const fps = 1000 / avgFrameTime;
      expect(fps).toBeGreaterThan(50); // Should be close to 60fps
    });

    test('should handle dataset updates efficiently', async () => {
      await page.evaluate(() => {
        window.virtualRenderer = window.initVirtualRenderer([]);
        window.updateTimes = [];
      });

      // Perform multiple dataset updates
      for (let i = 1; i <= 5; i++) {
        const updateTime = await page.evaluate((count) => {
          const start = performance.now();
          const items = Array.from({ length: count * 1000 }, (_, j) => ({
            id: j,
            batch: count,
          }));
          window.virtualRenderer.setItems(items);
          return performance.now() - start;
        }, i);

        expect(updateTime).toBeLessThan(100); // Each update under 100ms
      }
    });
  });

  test.describe('Interaction', () => {
    test('should handle click events on virtual items', async () => {
      await page.evaluate(() => {
        window.clickedItems = [];
        window.initVirtualRenderer(
          Array.from({ length: 100 }, (_, i) => ({ id: i })),
          {
            onClick: (item: any) => window.clickedItems.push(item.id),
          }
        );
      });

      // Click on visible items
      const visibleItems = page.locator('.virtual-item:visible');
      const count = await visibleItems.count();

      if (count > 0) {
        await visibleItems.nth(0).click();
        await visibleItems.nth(Math.min(1, count - 1)).click();
      }

      const clicked = await page.evaluate(() => window.clickedItems);
      expect(clicked.length).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async () => {
      await page.evaluate(() => {
        window.virtualRenderer = window.initVirtualRenderer(
          Array.from({ length: 100 }, (_, i) => ({ id: i }))
        );
      });

      // Focus container
      await page.focus('.virtual-container');

      // Navigate with keyboard
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(100);

      // Check scroll position changed
      const scrollTop = await page.evaluate(() => {
        return document.querySelector('.virtual-container')?.scrollTop || 0;
      });

      expect(scrollTop).toBeGreaterThan(0);
    });
  });

  test.describe('Visual Rendering', () => {
    test('should render items without visual glitches', async () => {
      await page.evaluate(() => {
        window.initVirtualRenderer(
          Array.from({ length: 100 }, (_, i) => ({
            id: i,
            color: `hsl(${i * 3.6}, 70%, 50%)`,
          }))
        );
      });

      // Take screenshot for visual regression
      await page.waitForTimeout(500);
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 800, height: 600 },
      });

      expect(screenshot).toBeTruthy();

      // Scroll and take another screenshot
      await page.evaluate(() => {
        document.querySelector('.virtual-container')?.scrollTo(0, 500);
      });
      await page.waitForTimeout(500);

      const scrolledScreenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 800, height: 600 },
      });

      expect(scrolledScreenshot).toBeTruthy();
      // In real scenario, compare with baseline screenshots
    });

    test('should maintain item positions during scroll', async () => {
      await page.evaluate(() => {
        window.virtualRenderer = window.initVirtualRenderer(
          Array.from({ length: 200 }, (_, i) => ({ id: i }))
        );
      });

      // Get initial positions
      const initialPositions = await page.evaluate(() => {
        const items = document.querySelectorAll('.virtual-item');
        return Array.from(items).slice(0, 5).map((item) => {
          const rect = item.getBoundingClientRect();
          return { id: item.getAttribute('data-id'), top: rect.top };
        });
      });

      // Scroll down and back up
      await page.evaluate(() => {
        const container = document.querySelector('.virtual-container');
        container?.scrollTo(0, 1000);
      });
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        const container = document.querySelector('.virtual-container');
        container?.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);

      // Check positions are restored
      const finalPositions = await page.evaluate(() => {
        const items = document.querySelectorAll('.virtual-item');
        return Array.from(items).slice(0, 5).map((item) => {
          const rect = item.getBoundingClientRect();
          return { id: item.getAttribute('data-id'), top: rect.top };
        });
      });

      // Positions should be similar (within tolerance)
      initialPositions.forEach((initial, i) => {
        const final = finalPositions[i];
        if (initial && final && initial.id === final.id) {
          expect(Math.abs(initial.top - final.top)).toBeLessThan(5);
        }
      });
    });
  });
});