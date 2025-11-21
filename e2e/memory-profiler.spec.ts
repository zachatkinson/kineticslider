/**
 * @fileoverview MemoryProfiler E2E Tests
 *
 * End-to-end tests for memory profiling functionality in real browser environment.
 * Tests real memory monitoring, leak detection, and optimization recommendations.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('MemoryProfiler E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/demo/memory-profiler.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Real Memory Monitoring', () => {
    test('should track actual memory usage in browser', async () => {
      // Skip if performance.memory not available
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      // Initialize memory profiler
      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
          enableLeakDetection: true,
          detailedTracking: true,
        });
      });

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory.usedJSHeapSize;
      });

      // Create memory-intensive operations
      await page.evaluate(() => {
        // Create large arrays
        window.testData = {
          largeArrays: Array.from({ length: 100 }, () => new Array(10000).fill(0)),
          objects: Array.from({ length: 5000 }, (_, i) => ({ id: i, data: Math.random() })),
        };

        // Track with profiler
        window.memoryProfiler.trackAllocation(
          'test-arrays',
          window.testData.largeArrays,
          'Array',
          100 * 10000 * 8
        );

        window.memoryProfiler.trackAllocation(
          'test-objects',
          window.testData.objects,
          'Object',
          5000 * 100
        );
      });

      // Wait for memory allocation
      await page.waitForTimeout(1000);

      // Check memory increased
      const afterAllocationMemory = await page.evaluate(() => {
        return (performance as any).memory.usedJSHeapSize;
      });

      expect(afterAllocationMemory).toBeGreaterThan(initialMemory);

      // Take memory snapshot
      const snapshot = await page.evaluate(() => {
        return window.memoryProfiler.takeSnapshot();
      });

      expect(snapshot.usedMemory).toBeGreaterThan(0);
      expect(snapshot.allocations.size).toBeGreaterThan(0);
      expect(snapshot.totalTrackedMemory).toBeGreaterThan(0);
    });

    test('should detect real memory growth patterns', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
          memoryThreshold: 50 * 1024 * 1024, // 50MB
        });

        window.memorySnapshots = [];
      });

      // Simulate memory growth over time
      for (let i = 0; i < 5; i++) {
        await page.evaluate((iteration) => {
          // Create increasingly large data structures
          const size = (iteration + 1) * 1000;
          const data = Array.from({ length: size }, (_, j) => ({
            id: j,
            iteration,
            data: new Array(100).fill(Math.random()),
          }));

          window.memoryProfiler.trackAllocation(
            `growth-${iteration}`,
            data,
            'GrowthData',
            size * 800
          );

          // Take snapshot
          const snapshot = window.memoryProfiler.takeSnapshot();
          window.memorySnapshots.push({
            iteration,
            memory: snapshot.usedMemory,
            tracked: snapshot.totalTrackedMemory,
          });
        }, i);

        await page.waitForTimeout(500);
      }

      // Verify memory growth trend
      const snapshots = await page.evaluate(() => window.memorySnapshots);
      
      expect(snapshots.length).toBe(5);
      expect(snapshots[4].memory).toBeGreaterThan(snapshots[0].memory);
      expect(snapshots[4].tracked).toBeGreaterThan(snapshots[0].tracked);

      // Check for memory trend detection
      const trends = await page.evaluate(() => {
        const report = window.memoryProfiler.generateReport();
        return report.trends;
      });

      expect(trends.length).toBeGreaterThan(0);
    });

    test('should monitor memory during realistic slider operations', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      // Initialize slider with memory profiling
      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
          enableLeakDetection: true,
        });

        // Initialize slider with many slides
        window.slider = window.initKineticSlider({
          slideCount: 1000,
          enableVirtualScrolling: true,
          enableTextureAtlas: true,
        });

        window.operationMemory = [];
      });

      // Perform various slider operations while monitoring memory
      const operations = [
        'navigate-forward',
        'navigate-backward',
        'rapid-navigation',
        'texture-loading',
        'viewport-resize',
      ];

      for (const operation of operations) {
        const beforeMemory = await page.evaluate(() => 
          (performance as any).memory.usedJSHeapSize
        );

        await page.evaluate(async (op) => {
          switch (op) {
            case 'navigate-forward':
              for (let i = 0; i < 50; i++) {
                window.slider.next();
                await new Promise(r => setTimeout(r, 10));
              }
              break;
            case 'navigate-backward':
              for (let i = 0; i < 50; i++) {
                window.slider.prev();
                await new Promise(r => setTimeout(r, 10));
              }
              break;
            case 'rapid-navigation':
              for (let i = 0; i < 100; i++) {
                window.slider.goToSlide(Math.floor(Math.random() * 1000));
                await new Promise(r => setTimeout(r, 5));
              }
              break;
            case 'texture-loading':
              // Simulate loading new textures
              for (let i = 0; i < 20; i++) {
                window.slider.loadTexture(`dynamic-${i}`, `/images/test-${i}.jpg`);
              }
              break;
            case 'viewport-resize':
              for (let i = 0; i < 10; i++) {
                window.slider.resize(800 + i * 100, 600 + i * 50);
                await new Promise(r => setTimeout(r, 50));
              }
              break;
          }
        }, operation);

        await page.waitForTimeout(500);

        const afterMemory = await page.evaluate((op) => {
          const memory = (performance as any).memory.usedJSHeapSize;
          const snapshot = window.memoryProfiler.takeSnapshot();
          
          window.operationMemory.push({
            operation: op,
            memory,
            tracked: snapshot.totalTrackedMemory,
            allocations: snapshot.allocations.size,
          });

          return memory;
        }, operation);

        // Memory shouldn't grow excessively for any operation
        expect(afterMemory - beforeMemory).toBeLessThan(50 * 1024 * 1024); // 50MB max growth
      }

      // Verify memory tracking results
      const operationResults = await page.evaluate(() => window.operationMemory);
      expect(operationResults.length).toBe(operations.length);
      
      operationResults.forEach((result) => {
        expect(result.memory).toBeGreaterThan(0);
        expect(result.tracked).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Leak Detection', () => {
    test('should detect real memory leaks in browser', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          enableLeakDetection: true,
          detailedTracking: true,
        });

        window.leakyObjects = [];
        window.cleanObjects = [];
      });

      // Create intentional memory leaks
      await page.evaluate(() => {
        // Create objects that won't be cleaned up
        for (let i = 0; i < 100; i++) {
          const leakyObj = {
            id: i,
            data: new Array(1000).fill(Math.random()),
            circular: null as any,
          };
          leakyObj.circular = leakyObj; // Circular reference

          window.leakyObjects.push(leakyObj);
          window.memoryProfiler.trackAllocation(
            `leaky-${i}`,
            leakyObj,
            'LeakyObject',
            8000
          );
        }

        // Create objects that will be cleaned up
        for (let i = 0; i < 100; i++) {
          const cleanObj = { id: i, data: Math.random() };
          window.cleanObjects.push(cleanObj);
          window.memoryProfiler.trackAllocation(
            `clean-${i}`,
            cleanObj,
            'CleanObject',
            100
          );
        }
      });

      // Take baseline snapshot
      await page.evaluate(() => window.memoryProfiler.takeSnapshot());
      await page.waitForTimeout(500);

      // Clean up the "clean" objects
      await page.evaluate(() => {
        window.cleanObjects.forEach((_, i) => {
          window.memoryProfiler.trackDeallocation(`clean-${i}`);
        });
        window.cleanObjects = [];
      });

      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      await page.waitForTimeout(1000);

      // Take another snapshot after cleanup
      await page.evaluate(() => window.memoryProfiler.takeSnapshot());

      // Detect leaks
      const leakResults = await page.evaluate(() => {
        return window.memoryProfiler.detectLeaks();
      });

      expect(leakResults.suspectedLeaks.length).toBeGreaterThan(0);
      
      // Should identify leaky objects
      const leakyTypes = leakResults.suspectedLeaks.map(leak => leak.type);
      expect(leakyTypes).toContain('LeakyObject');
      
      // Should have recommendations
      expect(leakResults.recommendations.length).toBeGreaterThan(0);
    });

    test('should detect DOM-related memory leaks', async () => {
      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          enableLeakDetection: true,
        });

        window.domElements = [];
        window.eventListeners = [];
      });

      // Create DOM elements with event listeners that won't be cleaned up
      await page.evaluate(() => {
        for (let i = 0; i < 50; i++) {
          const element = document.createElement('div');
          element.id = `leaky-element-${i}`;
          element.innerHTML = `<span>Content ${i}</span>`;
          
          const listener = () => console.log(`Clicked ${i}`);
          element.addEventListener('click', listener);
          
          document.body.appendChild(element);
          
          window.domElements.push(element);
          window.eventListeners.push(listener);
          
          window.memoryProfiler.trackAllocation(
            `dom-element-${i}`,
            element,
            'HTMLElement',
            1000
          );
        }
      });

      await page.waitForTimeout(500);
      
      // Take snapshot
      await page.evaluate(() => window.memoryProfiler.takeSnapshot());

      // Remove elements from DOM but keep references (leak simulation)
      await page.evaluate(() => {
        window.domElements.forEach((element, i) => {
          document.body.removeChild(element);
          // Not calling removeEventListener - creates leak
          // Not calling trackDeallocation - simulates forgotten cleanup
        });
      });

      await page.waitForTimeout(1000);
      
      // Take another snapshot
      await page.evaluate(() => window.memoryProfiler.takeSnapshot());

      // Check for DOM-related leaks
      const leakResults = await page.evaluate(() => {
        return window.memoryProfiler.detectLeaks();
      });

      expect(leakResults.suspectedLeaks.length).toBeGreaterThan(0);
      
      const recommendations = leakResults.recommendations;
      expect(recommendations.some(r => 
        r.description.includes('DOM') || 
        r.description.includes('event')
      )).toBe(true);
    });
  });

  test.describe('Performance Optimization', () => {
    test('should provide actionable optimization recommendations', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
          memoryThreshold: 30 * 1024 * 1024, // 30MB threshold
        });
      });

      // Create various memory usage patterns
      await page.evaluate(() => {
        // Large arrays (inefficient)
        window.largeArrays = Array.from({ length: 20 }, () => 
          new Array(50000).fill(Math.random())
        );

        // Many small objects (fragmentation)
        window.smallObjects = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: Math.random(),
        }));

        // Cached data (potentially optimizable)
        window.cache = new Map();
        for (let i = 0; i < 1000; i++) {
          window.cache.set(`key-${i}`, {
            value: Math.random(),
            timestamp: Date.now(),
            accessed: 0,
          });
        }

        // Track allocations
        window.memoryProfiler.trackAllocation(
          'large-arrays',
          window.largeArrays,
          'Array',
          20 * 50000 * 8
        );

        window.memoryProfiler.trackAllocation(
          'small-objects',
          window.smallObjects,
          'Object',
          10000 * 100
        );

        window.memoryProfiler.trackAllocation(
          'cache-data',
          window.cache,
          'Map',
          1000 * 200
        );
      });

      await page.waitForTimeout(1000);

      // Generate recommendations
      const recommendations = await page.evaluate(() => {
        // Simulate memory pressure
        return window.memoryProfiler.generateOptimizationRecommendations();
      });

      expect(recommendations.length).toBeGreaterThan(0);

      // Should have specific recommendation types
      const types = recommendations.map(r => r.type);
      expect(types.some(t => 
        ['reduce-allocations', 'optimize-cache', 'use-pooling', 'lazy-loading'].includes(t)
      )).toBe(true);

      // Each recommendation should have actionable details
      recommendations.forEach((rec) => {
        expect(rec.description).toBeTruthy();
        expect(rec.impact).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(rec.priority);
      });
    });

    test('should measure optimization effectiveness', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
        });

        // Create inefficient data structure
        window.inefficientData = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          largeArray: new Array(1000).fill(Math.random()),
          metadata: {
            created: Date.now(),
            accessed: 0,
            tags: Array.from({ length: 50 }, () => Math.random().toString()),
          },
        }));

        window.memoryProfiler.trackAllocation(
          'inefficient-data',
          window.inefficientData,
          'InefficientStructure',
          1000 * 8000
        );
      });

      // Take baseline measurement
      const baseline = await page.evaluate(() => {
        const snapshot = window.memoryProfiler.takeSnapshot();
        return {
          memory: snapshot.usedMemory,
          tracked: snapshot.totalTrackedMemory,
        };
      });

      // Apply optimization
      await page.evaluate(() => {
        // Optimize: Use more efficient data structure
        window.optimizedData = {
          ids: window.inefficientData.map(item => item.id),
          data: new Float32Array(window.inefficientData.length * 1000),
          metadata: window.inefficientData.map(item => ({
            created: item.metadata.created,
            accessed: item.metadata.accessed,
          })),
        };

        // Track new structure
        window.memoryProfiler.trackAllocation(
          'optimized-data',
          window.optimizedData,
          'OptimizedStructure',
          1000 * 4000 // Roughly half the size
        );

        // Remove old structure
        window.memoryProfiler.trackDeallocation('inefficient-data');
        window.inefficientData = null;
      });

      await page.waitForTimeout(500);

      // Measure after optimization
      const optimized = await page.evaluate(() => {
        const snapshot = window.memoryProfiler.takeSnapshot();
        return {
          memory: snapshot.usedMemory,
          tracked: snapshot.totalTrackedMemory,
        };
      });

      // Should show memory reduction
      expect(optimized.tracked).toBeLessThan(baseline.tracked);
      
      const savings = baseline.tracked - optimized.tracked;
      expect(savings).toBeGreaterThan(1024 * 1024); // At least 1MB savings
    });
  });

  test.describe('Visual Monitoring', () => {
    test('should display real-time memory metrics', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      // Initialize with UI
      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
          enableUI: true,
        });
      });

      // Check UI elements are present
      await expect(page.locator('.memory-profiler-ui')).toBeVisible();
      await expect(page.locator('.memory-usage-chart')).toBeVisible();
      await expect(page.locator('.allocation-list')).toBeVisible();

      // Create some memory activity
      await page.evaluate(() => {
        window.testActivity = Array.from({ length: 100 }, () => 
          new Array(1000).fill(Math.random())
        );
      });

      await page.waitForTimeout(1000);

      // Check that UI updates
      const memoryDisplay = await page.locator('.current-memory').textContent();
      expect(memoryDisplay).toMatch(/\d+(\.\d+)?\s*(MB|KB|B)/);

      const allocationCount = await page.locator('.allocation-count').textContent();
      expect(allocationCount).toMatch(/\d+/);
    });

    test('should show memory trends in chart', async () => {
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      await page.evaluate(() => {
        window.memoryProfiler = window.initMemoryProfiler({
          autoProfile: true,
          enableUI: true,
          chartUpdateInterval: 100,
        });
      });

      // Generate memory activity over time
      for (let i = 0; i < 10; i++) {
        await page.evaluate((iteration) => {
          const data = Array.from({ length: 50 * (iteration + 1) }, () => Math.random());
          window[`data_${iteration}`] = data;
        }, i);

        await page.waitForTimeout(200);
      }

      // Check chart has data points
      const chartPoints = await page.locator('.memory-chart-point').count();
      expect(chartPoints).toBeGreaterThan(5);

      // Chart should show upward trend
      const chartTrend = await page.evaluate(() => {
        const points = Array.from(document.querySelectorAll('.memory-chart-point'));
        const values = points.map(p => parseFloat(p.getAttribute('data-value') || '0'));
        return values[values.length - 1] > values[0];
      });

      expect(chartTrend).toBe(true);
    });
  });
});