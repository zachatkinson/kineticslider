/**
 * @fileoverview LazyLoader E2E Tests
 *
 * End-to-end tests for lazy loading functionality in real browser environment.
 * Tests dynamic module loading, user interactions, and progressive enhancement.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('LazyLoader E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/demo/lazy-loader.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dynamic Feature Loading', () => {
    test('should load features on demand in real browser', async () => {
      // Initialize lazy loader
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          enableCaching: true,
          maxConcurrentLoads: 3,
          defaultTimeout: 5000,
        });

        // Register test features
        window.lazyLoader.registerFeature({
          id: 'tooltip',
          name: 'Tooltip Feature',
          modulePath: '/modules/tooltip.js',
          strategy: 'on-demand',
          priority: 'high',
        });

        window.lazyLoader.registerFeature({
          id: 'modal',
          name: 'Modal Feature',
          modulePath: '/modules/modal.js',
          strategy: 'on-demand',
          priority: 'medium',
        });

        window.loadResults = [];
      });

      // Trigger feature loading
      const tooltipResult = await page.evaluate(async () => {
        const result = await window.lazyLoader.loadFeature('tooltip');
        window.loadResults.push(result);
        return result;
      });

      expect(tooltipResult.success).toBe(true);
      expect(tooltipResult.featureId).toBe('tooltip');
      expect(tooltipResult.loadTime).toBeGreaterThan(0);
      expect(tooltipResult.cached).toBe(false);

      // Second load should be cached
      const cachedResult = await page.evaluate(async () => {
        const result = await window.lazyLoader.loadFeature('tooltip');
        window.loadResults.push(result);
        return result;
      });

      expect(cachedResult.cached).toBe(true);
      expect(cachedResult.loadTime).toBe(0);
    });

    test('should handle loading failures gracefully', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({});

        // Register feature with invalid path
        window.lazyLoader.registerFeature({
          id: 'invalid-feature',
          name: 'Invalid Feature',
          modulePath: '/modules/non-existent.js',
          strategy: 'on-demand',
          priority: 'low',
        });
      });

      // Should handle load failure
      const error = await page.evaluate(async () => {
        try {
          await window.lazyLoader.loadFeature('invalid-feature');
          return null;
        } catch (e) {
          return e.message;
        }
      });

      expect(error).toBeTruthy();
    });

    test('should load multiple features concurrently', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          maxConcurrentLoads: 3,
        });

        // Register multiple features
        const features = ['feature-a', 'feature-b', 'feature-c', 'feature-d', 'feature-e'];
        features.forEach(id => {
          window.lazyLoader.registerFeature({
            id,
            name: `${id} Feature`,
            modulePath: `/modules/${id}.js`,
            strategy: 'on-demand',
            priority: 'medium',
          });
        });

        window.concurrentResults = [];
      });

      // Load all features simultaneously
      const results = await page.evaluate(async () => {
        const features = ['feature-a', 'feature-b', 'feature-c', 'feature-d', 'feature-e'];
        const startTime = performance.now();
        
        const promises = features.map(id => window.lazyLoader.loadFeature(id));
        const results = await Promise.all(promises);
        
        const endTime = performance.now();
        window.concurrentResults = results;
        
        return {
          results,
          totalTime: endTime - startTime,
          successCount: results.filter(r => r.success).length,
        };
      });

      expect(results.successCount).toBe(5);
      expect(results.totalTime).toBeLessThan(3000); // Should complete in reasonable time
    });
  });

  test.describe('Loading Strategies', () => {
    test('should load immediate features on registration', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({});
        window.immediateLoaded = false;

        // Register immediate feature
        window.lazyLoader.registerFeature({
          id: 'immediate-feature',
          name: 'Immediate Feature',
          modulePath: '/modules/immediate.js',
          strategy: 'immediate',
          priority: 'critical',
        });

        // Check if it starts loading immediately
        setTimeout(() => {
          window.immediateLoaded = window.lazyLoader.isLoaded('immediate-feature');
        }, 100);
      });

      await page.waitForTimeout(200);

      const isLoaded = await page.evaluate(() => window.immediateLoaded);
      expect(isLoaded).toBe(true);
    });

    test('should load features on user interaction', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({});
        window.interactionFeatures = ['tooltip', 'dropdown', 'context-menu'];

        // Register interaction-based features
        window.interactionFeatures.forEach(id => {
          window.lazyLoader.registerFeature({
            id: `interaction-${id}`,
            name: `Interaction ${id}`,
            modulePath: `/modules/${id}.js`,
            strategy: 'on-interaction',
            priority: 'high',
          });
        });

        // Setup interaction loading
        window.lazyLoader.loadOnInteraction(
          window.interactionFeatures.map(id => `interaction-${id}`)
        );
      });

      // Check features are not loaded initially
      const initiallyLoaded = await page.evaluate(() => {
        return window.interactionFeatures.map(id => 
          window.lazyLoader.isLoaded(`interaction-${id}`)
        );
      });

      expect(initiallyLoaded.every(loaded => !loaded)).toBe(true);

      // Simulate user interaction
      await page.click('body');
      await page.waitForTimeout(500);

      // Features should be loaded after interaction
      const afterInteraction = await page.evaluate(() => {
        return window.interactionFeatures.map(id => 
          window.lazyLoader.isLoaded(`interaction-${id}`)
        );
      });

      expect(afterInteraction.every(loaded => loaded)).toBe(true);
    });

    test('should preload features during idle time', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          enablePreloading: true,
          preloadThreshold: 500,
        });

        // Register preload features
        window.lazyLoader.registerFeature({
          id: 'preload-feature',
          name: 'Preload Feature',
          modulePath: '/modules/preload.js',
          strategy: 'preload',
          priority: 'high',
        });

        window.lazyLoader.registerFeature({
          id: 'idle-feature',
          name: 'Idle Feature',
          modulePath: '/modules/idle.js',
          strategy: 'on-idle',
          priority: 'low',
        });
      });

      // Wait for preload/idle loading
      await page.waitForTimeout(1000);

      const loadedStates = await page.evaluate(() => ({
        preloadLoaded: window.lazyLoader.isLoaded('preload-feature'),
        idleLoaded: window.lazyLoader.isLoaded('idle-feature'),
      }));

      expect(loadedStates.preloadLoaded).toBe(true);
      expect(loadedStates.idleLoaded).toBe(true);
    });
  });

  test.describe('Progressive Enhancement', () => {
    test('should enhance basic functionality with loaded features', async () => {
      // Start with basic slider
      await page.evaluate(() => {
        window.slider = window.initBasicSlider({
          container: document.getElementById('slider-container'),
          slides: Array.from({ length: 10 }, (_, i) => ({ id: i, image: `/images/slide-${i}.jpg` })),
        });

        window.lazyLoader = window.initLazyLoader({});
        window.enhancements = [];
      });

      // Check basic functionality works
      const initialSlides = await page.locator('.slide').count();
      expect(initialSlides).toBe(10);

      // Load progressive enhancements
      await page.evaluate(async () => {
        // Register enhancement features
        const enhancements = [
          {
            id: 'smooth-transitions',
            name: 'Smooth Transitions',
            modulePath: '/modules/transitions.js',
            strategy: 'on-demand',
            priority: 'high',
          },
          {
            id: 'touch-gestures',
            name: 'Touch Gestures',
            modulePath: '/modules/gestures.js',
            strategy: 'on-demand',
            priority: 'medium',
          },
          {
            id: 'autoplay',
            name: 'Autoplay',
            modulePath: '/modules/autoplay.js',
            strategy: 'on-demand',
            priority: 'low',
          },
        ];

        // Register all enhancements
        enhancements.forEach(feature => {
          window.lazyLoader.registerFeature(feature);
        });

        // Load enhancements progressively
        for (const feature of enhancements) {
          const result = await window.lazyLoader.loadFeature(feature.id);
          if (result.success && result.module.enhance) {
            result.module.enhance(window.slider);
            window.enhancements.push(feature.id);
          }
        }
      });

      // Verify enhancements were applied
      const enhancements = await page.evaluate(() => window.enhancements);
      expect(enhancements).toContain('smooth-transitions');
      expect(enhancements).toContain('touch-gestures');
      expect(enhancements).toContain('autoplay');

      // Test enhanced functionality
      const hasTransitions = await page.evaluate(() => {
        const slides = document.querySelectorAll('.slide');
        return Array.from(slides).some(slide => 
          getComputedStyle(slide).transition !== 'none'
        );
      });

      expect(hasTransitions).toBe(true);
    });

    test('should gracefully degrade when features fail to load', async () => {
      await page.evaluate(() => {
        window.slider = window.initBasicSlider({
          container: document.getElementById('slider-container'),
          slides: [{ id: 1 }, { id: 2 }, { id: 3 }],
        });

        window.lazyLoader = window.initLazyLoader({});
        window.failureHandled = false;

        // Register feature that will fail
        window.lazyLoader.registerFeature({
          id: 'failing-enhancement',
          name: 'Failing Enhancement',
          modulePath: '/modules/non-existent-enhancement.js',
          strategy: 'on-demand',
          priority: 'high',
        });
      });

      // Try to load failing feature
      await page.evaluate(async () => {
        try {
          await window.lazyLoader.loadFeature('failing-enhancement');
        } catch (error) {
          window.failureHandled = true;
          // Slider should still work without enhancement
          console.log('Enhancement failed, continuing with basic functionality');
        }
      });

      const failureHandled = await page.evaluate(() => window.failureHandled);
      expect(failureHandled).toBe(true);

      // Basic slider should still be functional
      const slideCount = await page.locator('.slide').count();
      expect(slideCount).toBe(3);
    });
  });

  test.describe('Memory and Performance', () => {
    test('should manage memory efficiently during feature loading', async () => {
      // Skip if performance.memory not available
      const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
      if (!hasMemoryAPI) {
        test.skip();
        return;
      }

      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          enableCaching: true,
          maxCacheSize: 5 * 1024 * 1024, // 5MB
        });

        window.memorySnapshots = [];
      });

      // Load many features and track memory
      for (let i = 0; i < 20; i++) {
        await page.evaluate(async (index) => {
          // Register feature
          window.lazyLoader.registerFeature({
            id: `memory-feature-${index}`,
            name: `Memory Feature ${index}`,
            modulePath: `/modules/feature-${index}.js`,
            strategy: 'on-demand',
            priority: 'medium',
            estimatedSize: 500000, // 500KB each
          });

          // Load feature
          await window.lazyLoader.loadFeature(`memory-feature-${index}`);

          // Take memory snapshot
          if (performance.memory) {
            window.memorySnapshots.push({
              index,
              memory: performance.memory.usedJSHeapSize,
              timestamp: Date.now(),
            });
          }
        }, i);

        await page.waitForTimeout(100);
      }

      // Check memory management
      const memoryData = await page.evaluate(() => ({
        snapshots: window.memorySnapshots,
        stats: window.lazyLoader.getStats(),
      }));

      expect(memoryData.snapshots.length).toBe(20);
      
      // Memory should not grow indefinitely due to cache management
      const initialMemory = memoryData.snapshots[0].memory;
      const finalMemory = memoryData.snapshots[19].memory;
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // Less than 20MB growth
      expect(memoryData.stats.loadedFeatures).toBe(20);
    });

    test('should meet performance targets for feature loading', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          maxConcurrentLoads: 5,
        });

        window.performanceResults = {
          loadTimes: [],
          totalTime: 0,
        };

        // Register performance test features
        const features = Array.from({ length: 50 }, (_, i) => ({
          id: `perf-feature-${i}`,
          name: `Performance Feature ${i}`,
          modulePath: `/modules/perf-${i}.js`,
          strategy: 'on-demand',
          priority: i < 10 ? 'high' : i < 30 ? 'medium' : 'low',
        }));

        features.forEach(feature => {
          window.lazyLoader.registerFeature(feature);
        });
      });

      // Load features and measure performance
      const performanceResults = await page.evaluate(async () => {
        const startTime = performance.now();
        const features = Array.from({ length: 50 }, (_, i) => `perf-feature-${i}`);
        
        // Load features in batches to test concurrent loading
        const batchSize = 10;
        for (let i = 0; i < features.length; i += batchSize) {
          const batch = features.slice(i, i + batchSize);
          const batchStart = performance.now();
          
          await Promise.all(batch.map(id => window.lazyLoader.loadFeature(id)));
          
          const batchTime = performance.now() - batchStart;
          window.performanceResults.loadTimes.push(batchTime);
        }

        window.performanceResults.totalTime = performance.now() - startTime;
        
        return {
          ...window.performanceResults,
          stats: window.lazyLoader.getStats(),
        };
      });

      // Performance expectations
      expect(performanceResults.totalTime).toBeLessThan(5000); // Under 5 seconds total
      expect(performanceResults.stats.loadedFeatures).toBe(50);
      expect(performanceResults.stats.averageLoadTime).toBeLessThan(100); // Under 100ms average

      // Batch load times should be reasonable
      performanceResults.loadTimes.forEach((time, index) => {
        expect(time).toBeLessThan(1000); // Under 1 second per batch
      });
    });
  });

  test.describe('Network Conditions', () => {
    test('should adapt to slow network conditions', async () => {
      // Simulate slow network
      await page.route('**/modules/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        route.continue();
      });

      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          enablePerformanceMonitoring: true,
          defaultTimeout: 2000,
        });

        // Mock slow network detection
        Object.defineProperty(navigator, 'connection', {
          value: {
            effectiveType: '2g',
            downlink: 0.5,
          },
          writable: true,
        });

        window.lazyLoader.registerFeature({
          id: 'network-sensitive',
          name: 'Network Sensitive Feature',
          modulePath: '/modules/heavy-feature.js',
          strategy: 'on-demand',
          priority: 'low',
          conditions: [
            {
              type: 'network',
              value: 'fast',
            },
          ],
        });

        window.lazyLoader.registerFeature({
          id: 'network-tolerant',
          name: 'Network Tolerant Feature',
          modulePath: '/modules/light-feature.js',
          strategy: 'on-demand',
          priority: 'high',
        });
      });

      // Try to load features
      const results = await page.evaluate(async () => {
        const results = [];

        // This should fail due to network condition
        try {
          await window.lazyLoader.loadFeature('network-sensitive');
          results.push({ id: 'network-sensitive', success: true });
        } catch (error) {
          results.push({ id: 'network-sensitive', success: false, error: error.message });
        }

        // This should succeed
        try {
          const result = await window.lazyLoader.loadFeature('network-tolerant');
          results.push({ id: 'network-tolerant', success: result.success });
        } catch (error) {
          results.push({ id: 'network-tolerant', success: false, error: error.message });
        }

        return results;
      });

      const sensitiveResult = results.find(r => r.id === 'network-sensitive');
      const tolerantResult = results.find(r => r.id === 'network-tolerant');

      expect(sensitiveResult.success).toBe(false);
      expect(tolerantResult.success).toBe(true);
    });
  });

  test.describe('Visual Integration', () => {
    test('should show loading states in UI', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({
          enableUI: true,
        });

        // Add loading indicator to page
        const indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        indicator.textContent = 'Loading features...';
        indicator.style.display = 'none';
        document.body.appendChild(indicator);

        // Show/hide loading indicator
        window.lazyLoader.on('feature-loading', () => {
          document.getElementById('loading-indicator').style.display = 'block';
        });

        window.lazyLoader.on('feature-loaded', () => {
          document.getElementById('loading-indicator').style.display = 'none';
        });
      });

      // Check indicator is initially hidden
      await expect(page.locator('#loading-indicator')).toBeHidden();

      // Load a feature
      await page.evaluate(async () => {
        window.lazyLoader.registerFeature({
          id: 'ui-feature',
          name: 'UI Feature',
          modulePath: '/modules/ui-feature.js',
          strategy: 'on-demand',
          priority: 'high',
        });

        window.lazyLoader.loadFeature('ui-feature');
      });

      // Loading indicator should appear briefly
      await expect(page.locator('#loading-indicator')).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForTimeout(1000);
      
      // Indicator should be hidden again
      await expect(page.locator('#loading-indicator')).toBeHidden();
    });

    test('should update feature status display', async () => {
      await page.evaluate(() => {
        window.lazyLoader = window.initLazyLoader({});

        // Create status display
        const statusDiv = document.createElement('div');
        statusDiv.id = 'feature-status';
        document.body.appendChild(statusDiv);

        window.updateStatus = () => {
          const stats = window.lazyLoader.getStats();
          statusDiv.textContent = `Loaded: ${stats.loadedFeatures}/${stats.totalFeatures}`;
        };

        // Register features
        ['status-a', 'status-b', 'status-c'].forEach(id => {
          window.lazyLoader.registerFeature({
            id,
            name: `Status ${id}`,
            modulePath: `/modules/${id}.js`,
            strategy: 'on-demand',
            priority: 'medium',
          });
        });

        window.updateStatus();
      });

      // Check initial status
      await expect(page.locator('#feature-status')).toHaveText('Loaded: 0/3');

      // Load features one by one
      for (const id of ['status-a', 'status-b', 'status-c']) {
        await page.evaluate(async (featureId) => {
          await window.lazyLoader.loadFeature(featureId);
          window.updateStatus();
        }, id);

        await page.waitForTimeout(100);
      }

      // Final status should show all loaded
      await expect(page.locator('#feature-status')).toHaveText('Loaded: 3/3');
    });
  });
});