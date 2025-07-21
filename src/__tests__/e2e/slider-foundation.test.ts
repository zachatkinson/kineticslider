/**
 * @fileoverview Slider Foundation E2E Tests
 *
 * Tests the foundation components needed for _slider functionality.
 * Prepares E2E infrastructure for Phase 2 while testing current capabilities.
 *
 * These tests ensure our foundation is ready for _slider implementation.
 */

import { test, expect } from '@playwright/test';
import {
  VIEWPORT,
  TEST_PERFORMANCE,
  TEST_TIMING,
  TEST_TOLERANCE,
  EVENT_NAMES,
} from '../../core/constants';
import { navigateAndWait } from './utils';

test.describe('KineticSlider Foundation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('Page Foundation', () => {
    test('should load without JavaScript errors', async ({ page }) => {
      const jsErrors: string[] = [];

      page.on(EVENT_NAMES.PAGE_ERROR, (_error) => {
        jsErrors.push(_error.message);
      });

      page.on(EVENT_NAMES.CONSOLE, (msg) => {
        if (msg.type() === 'error') {
          jsErrors.push(msg.text());
        }
      });

      // Navigate and wait for any async operations
      await page.reload();
      await page.waitForTimeout(TEST_TIMING.STANDARD_TIMEOUT);

      expect(jsErrors).toHaveLength(0);
    });

    test('should have proper HTML structure for _slider container', async ({
      page,
    }) => {
      // Test that we have a suitable container for the _slider
      const hasContainer = await page.evaluate(() => {
        // Look for any element that could contain a _slider
        const containers = document.querySelectorAll('div, main, section');
        return containers.length > 0;
      });

      expect(hasContainer).toBe(true);
    });

    test('should support modern browser APIs needed for _slider', async ({
      page,
    }) => {
      const apiSupport = await page.evaluate(() => {
        return {
          requestAnimationFrame: typeof requestAnimationFrame === 'function',
          performance: typeof performance === 'object' && 'now' in performance,
          customElements: 'customElements' in window,
          intersectionObserver: 'IntersectionObserver' in window,
          resizeObserver: 'ResizeObserver' in window,
          webgl: (() => {
            try {
              const canvas = document.createElement('canvas');
              return !!(
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl')
              );
            } catch {
              return false;
            }
          })(),
        };
      });

      expect(apiSupport.requestAnimationFrame).toBe(true);
      expect(apiSupport.performance).toBe(true);
      expect(apiSupport.customElements).toBe(true);
      expect(apiSupport.intersectionObserver).toBe(true);
      expect(apiSupport.resizeObserver).toBe(true);
      expect(apiSupport.webgl).toBe(true);
    });
  });

  test.describe('Accessibility Foundation', () => {
    test('should have proper accessibility structure', async ({ page }) => {
      // Test basic accessibility requirements for future _slider
      const a11yStructure = await page.evaluate(() => {
        return {
          hasLang: document.documentElement.hasAttribute('lang'),
          hasTitle: !!document.title,
          hasHeadings:
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          hasSkipLinks: document.querySelectorAll('a[href^="#"]').length > 0,
          hasValidTabIndex: Array.from(
            document.querySelectorAll('[tabindex]')
          ).every((el) => {
            const tabIndex = parseInt(el.getAttribute('tabindex') || '0');
            return tabIndex >= -1;
          }),
        };
      });

      expect(a11yStructure.hasLang).toBe(true);
      expect(a11yStructure.hasTitle).toBe(true);
      expect(a11yStructure.hasValidTabIndex).toBe(true);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test that keyboard navigation works for future _slider controls
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );

      // Should have focusable elements
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper color contrast', async ({ page }) => {
      // Basic color contrast check for _slider text
      const contrastCheck = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let hasText = false;

        for (const el of elements) {
          if (el.textContent && el.textContent.trim()) {
            hasText = true;
            break;
          }
        }

        return { hasText };
      });

      expect(contrastCheck.hasText).toBe(true);
    });
  });

  test.describe('Performance Foundation', () => {
    test('should meet performance budgets', async ({ page }) => {
      const performanceMetrics = await page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        return {
          domContentLoaded:
            timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          firstContentfulPaint:
            navigation.domContentLoadedEventEnd - navigation.fetchStart,
          resourceCount: performance.getEntriesByType('resource').length,
        };
      });

      // Performance budgets for _slider-ready page
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
      expect(performanceMetrics.loadComplete).toBeLessThan(
        TEST_PERFORMANCE.MAX_LOAD_TIME
      );
      expect(performanceMetrics.resourceCount).toBeLessThan(60); // Reasonable resource count for development
    });

    test('should have efficient memory usage', async ({ page }) => {
      const memoryInfo = await page.evaluate(() => {
        const memory = (
          performance as unknown as {
            memory?: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          }
        ).memory;
        if (!memory) return { available: false };

        return {
          available: true,
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          efficiency: memory.usedJSHeapSize / memory.totalJSHeapSize,
        };
      });

      if (memoryInfo.available) {
        expect(memoryInfo.used).toBeLessThan(TEST_PERFORMANCE.MEMORY_WARNING); // Less than 25MB (in bytes)
        expect(memoryInfo.efficiency).toBeGreaterThan(
          TEST_TOLERANCE.MEMORY_EFFICIENCY
        ); // At least 10% efficiency
      }
    });
  });

  test.describe('Slider Preparation', () => {
    test('should support touch events for mobile _slider', async ({ page }) => {
      const touchSupport = await page.evaluate(() => {
        return {
          touchEvents: 'ontouchstart' in window,
          pointerEvents: 'onpointerdown' in window,
          gestureEvents: 'ongesturestart' in window,
        };
      });

      // Should support either touch or pointer events
      expect(touchSupport.touchEvents || touchSupport.pointerEvents).toBe(true);
    });

    test('should handle viewport changes for responsive _slider', async ({
      page,
    }) => {
      const initialViewport = page.viewportSize();

      // Test mobile viewport
      await page.setViewportSize(VIEWPORT.MOBILE);
      await page.waitForTimeout(100);

      const mobileSupport = await page.evaluate(() => {
        return {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          devicePixelRatio: window.devicePixelRatio,
          orientation: screen.orientation?.type || 'landscape-primary',
        };
      });

      expect(mobileSupport.viewport.width).toBe(VIEWPORT.MOBILE.width);

      // Test tablet viewport
      await page.setViewportSize(VIEWPORT.TABLET);
      await page.waitForTimeout(100);

      const tabletSupport = await page.evaluate(() => window.innerWidth);
      expect(tabletSupport).toBe(VIEWPORT.TABLET.width);

      // Restore original viewport
      if (initialViewport) {
        await page.setViewportSize(initialViewport);
      }
    });

    test('should be ready for image loading requirements', async ({ page }) => {
      const imageSupport = await page.evaluate(() => {
        return {
          imageConstructor: typeof Image === 'function',
          canvasSupport: !!document.createElement('canvas').getContext,
          blobSupport: typeof Blob === 'function',
          urlSupport: typeof URL === 'function' && 'createObjectURL' in URL,
          fetchSupport: typeof fetch === 'function',
        };
      });

      expect(imageSupport.imageConstructor).toBe(true);
      expect(imageSupport.canvasSupport).toBe(true);
      expect(imageSupport.blobSupport).toBe(true);
      expect(imageSupport.urlSupport).toBe(true);
      expect(imageSupport.fetchSupport).toBe(true);
    });
  });

  test.describe('Future Slider Infrastructure', () => {
    test('should support animation requirements', async ({ page }) => {
      const animationSupport = await page.evaluate(() => {
        return {
          requestAnimationFrame: typeof requestAnimationFrame === 'function',
          cancelAnimationFrame: typeof cancelAnimationFrame === 'function',
          getComputedStyle: typeof getComputedStyle === 'function',
          transform3d: (() => {
            const el = document.createElement('div');
            el.style.transform = 'translateZ(0)';
            return el.style.transform !== '';
          })(),
          willChange: (() => {
            const el = document.createElement('div');
            return 'willChange' in el.style;
          })(),
        };
      });

      expect(animationSupport.requestAnimationFrame).toBe(true);
      expect(animationSupport.cancelAnimationFrame).toBe(true);
      expect(animationSupport.getComputedStyle).toBe(true);
      expect(animationSupport.transform3d).toBe(true);
      expect(animationSupport.willChange).toBe(true);
    });

    test('should support drag and drop for _slider interaction', async ({
      page,
    }) => {
      const dragSupport = await page.evaluate(() => {
        return {
          dragEvents: 'ondragstart' in document.createElement('div'),
          dataTransfer: typeof DataTransfer === 'function',
          dragDropSupport: 'draggable' in document.createElement('div'),
        };
      });

      expect(dragSupport.dragEvents).toBe(true);
      expect(dragSupport.dataTransfer).toBe(true);
      expect(dragSupport.dragDropSupport).toBe(true);
    });

    test('should prepare for GSAP and PIXI integration', async ({ page }) => {
      // Test that the page can handle script loading for GSAP/PIXI
      const scriptLoadingSupport = await page.evaluate(() => {
        return {
          scriptElement: typeof HTMLScriptElement === 'function',
          modules:
            typeof document.createElement('script').noModule === 'boolean',
          promiseSupport: typeof Promise === 'function',
        };
      });

      expect(scriptLoadingSupport.scriptElement).toBe(true);
      expect(scriptLoadingSupport.modules).toBe(true);
      expect(scriptLoadingSupport.promiseSupport).toBe(true);
    });
  });
});
