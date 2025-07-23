/**
 * @fileoverview E2E Tests for Configuration System
 *
 * End-to-end tests verifying that the enhanced configuration system works
 * properly in a real browser environment with proper validation and defaults.
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

test.describe('Configuration System E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('Configuration Processing', () => {
    test('should process and validate configuration on initialization', async ({
      page,
    }) => {
      // Initialize slider with enhanced configuration
      const result = await page.evaluate(async () => {
        const { ConfigurationSystem } = window.kineticSliderConfig!;

        const userConfig = {
          slides: [
            { id: 'slide1', src: 'image1.jpg', alt: 'First slide' },
            { id: 'slide2', src: 'image2.jpg', alt: 'Second slide' },
            { id: 'slide3', src: 'image3.jpg', alt: 'Third slide' },
          ],
          autoPlay: true,
          autoPlayInterval: 2000,
          duration: 500,
          loop: true,
          pauseOnHover: false,
          physics: {
            transitionDuration: 0.6,
            swipeThreshold: 80,
          },
          rendering: {
            width: 800,
            height: 600,
          },
          accessibility: {
            screenReader: true,
            keyboardNavigation: true,
          },
        };

        try {
          const processedConfig = ConfigurationSystem.processConfig(userConfig);
          return {
            success: true,
            config: processedConfig,
            error: null,
          };
        } catch (error) {
          return {
            success: false,
            config: null,
            error: (error as Error).message,
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config!.slides).toHaveLength(3);
      expect(result.config!.autoPlay).toBe(true);
      expect(result.config!.autoPlayInterval).toBe(2000);

      // Defaults should be applied
      expect(result.config!.easing).toBeDefined();
      expect(result.config!.input).toBeDefined();
      expect(result.config!.effects).toBeDefined();
    });

    test('should validate invalid configuration and provide errors', async ({
      page,
    }) => {
      const result = await page.evaluate(async () => {
        const { ConfigurationSystem } = window.kineticSliderConfig!;

        const invalidConfig = {
          // Missing slides
          duration: -500, // Invalid duration
          preloadCount: -10, // Invalid preload count
          physics: {
            transitionDuration: -1, // Invalid
            scaleIntensity: 2.0, // Out of range
          },
        };

        try {
          ConfigurationSystem.processConfig(invalidConfig);
          return {
            shouldHaveFailed: true,
            error: null,
          };
        } catch (error) {
          return {
            shouldHaveFailed: false,
            error: (error as Error).message,
            hasValidationErrors: (error as Error).message.includes(
              'Configuration validation failed'
            ),
          };
        }
      });

      expect(result.shouldHaveFailed).toBe(false);
      expect(result.hasValidationErrors).toBe(true);
      expect(result.error).toContain('Configuration validation failed');
    });

    test('should handle warnings without failing', async ({ page }) => {
      // Mock console.warn to capture warnings
      const warnings: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });

      const result = await page.evaluate(async () => {
        const { ConfigurationSystem } = window.kineticSliderConfig!;

        const configWithWarnings = {
          images: [{ id: 'slide1', src: 'image1.jpg' }], // Deprecated property
          slides: [{ id: 'slide1', src: 'image1.jpg' }], // Also provide new format
          preloadCount: 15, // High preload count (performance warning)
          easing: 'customUnknownEasing', // Unknown easing function
        };

        try {
          const processedConfig =
            ConfigurationSystem.processConfig(configWithWarnings);
          return {
            success: true,
            hasSlides: processedConfig.slides.length > 0,
          };
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.hasSlides).toBe(true);

      // Should have logged warnings
      expect(warnings.length).toBeGreaterThan(0);
      const hasDeprecationWarning = warnings.some((w) =>
        w.includes('deprecated')
      );
      expect(hasDeprecationWarning).toBe(true);
    });
  });

  test.describe('Legacy Compatibility', () => {
    test('should convert legacy images configuration to slides', async ({
      page,
    }) => {
      const result = await page.evaluate(async () => {
        const { ConfigurationSystem } = window.kineticSliderConfig!;

        const legacyConfig = {
          images: [
            { id: 'img1', src: 'image1.jpg', alt: 'First' },
            { id: 'img2', src: 'image2.jpg', title: 'Second' },
          ],
          autoPlay: true,
        };

        const processedConfig = ConfigurationSystem.processConfig(legacyConfig);

        return {
          slidesLength: processedConfig.slides.length,
          firstSlide: processedConfig.slides[0],
          secondSlide: processedConfig.slides[1],
          autoPlay: processedConfig.autoPlay,
          hasImagesProperty: 'images' in processedConfig,
        };
      });

      expect(result.slidesLength).toBe(2);
      expect(result.firstSlide.id).toBe('img1');
      expect(result.firstSlide.alt).toBe('First');
      expect(result.secondSlide.id).toBe('img2');
      expect(result.secondSlide.title).toBe('Second');
      expect(result.autoPlay).toBe(true);
      expect(result.hasImagesProperty).toBe(false); // Should be removed
    });
  });

  test.describe('Defaults Management', () => {
    test('should apply intelligent defaults', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { DefaultsManager } = window.kineticSliderConfig!;

        const manager = DefaultsManager.getInstance();

        // Test minimal config gets full defaults
        const minimalConfig = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
        };

        const mergedConfig = manager.mergeWithDefaults(minimalConfig);

        return {
          hasDefaults: {
            autoPlay: typeof mergedConfig.autoPlay === 'boolean',
            duration: typeof mergedConfig.duration === 'number',
            easing: typeof mergedConfig.easing === 'string',
            physics: typeof mergedConfig.physics === 'object',
            rendering: typeof mergedConfig.rendering === 'object',
            input: typeof mergedConfig.input === 'object',
            accessibility: typeof mergedConfig.accessibility === 'object',
          },
          values: {
            autoPlay: mergedConfig.autoPlay,
            duration: mergedConfig.duration,
            slidesLength: mergedConfig.slides.length,
          },
        };
      });

      // Should have all default categories
      expect(result.hasDefaults.autoPlay).toBe(true);
      expect(result.hasDefaults.duration).toBe(true);
      expect(result.hasDefaults.easing).toBe(true);
      expect(result.hasDefaults.physics).toBe(true);
      expect(result.hasDefaults.rendering).toBe(true);
      expect(result.hasDefaults.input).toBe(true);
      expect(result.hasDefaults.accessibility).toBe(true);

      // Should have sensible default values
      expect(result.values.autoPlay).toBe(false); // Default is false
      expect(result.values.duration).toBeGreaterThan(0);
      expect(result.values.slidesLength).toBe(1);
    });

    test('should handle large slide sets intelligently', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { DefaultsManager } = window.kineticSliderConfig!;

        const manager = DefaultsManager.getInstance();

        // Create large slide set (should trigger virtualization)
        const manySlides = Array.from({ length: 60 }, (_, i) => ({
          id: `slide${i}`,
          src: `image${i}.jpg`,
        }));

        const configWithManySlides = {
          slides: manySlides,
          // Don't specify enableVirtualization
        };

        const mergedConfig = manager.mergeWithDefaults(configWithManySlides);

        return {
          slidesLength: mergedConfig.slides.length,
          virtualizationEnabled: mergedConfig.enableVirtualization,
          preloadCount: mergedConfig.preloadCount,
        };
      });

      expect(result.slidesLength).toBe(60);
      expect(result.virtualizationEnabled).toBe(true); // Should be auto-enabled
      expect(result.preloadCount).toBeDefined();
    });
  });

  test.describe('Responsive Configuration', () => {
    test('should apply responsive defaults based on viewport', async ({
      page,
    }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileResult = await page.evaluate(async () => {
        const { DefaultsManager } = window.kineticSliderConfig!;

        const manager = DefaultsManager.getInstance();
        manager.clearCache(); // Ensure fresh responsive calculation

        const config = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          responsive: { enabled: true },
        };

        const mergedConfig = manager.mergeWithDefaults(config);

        return {
          renderingWidth: mergedConfig.rendering?.width,
          swipeThreshold: mergedConfig.input?.swipeThreshold,
        };
      });

      // Should have mobile-optimized settings
      expect(mobileResult.renderingWidth).toBeLessThan(800);
      expect(mobileResult.swipeThreshold).toBeLessThan(50); // Reduced for mobile

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      const desktopResult = await page.evaluate(async () => {
        const { DefaultsManager } = window.kineticSliderConfig!;

        const manager = DefaultsManager.getInstance();
        manager.clearCache(); // Ensure fresh responsive calculation

        const config = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          responsive: { enabled: true },
        };

        const mergedConfig = manager.mergeWithDefaults(config);

        return {
          renderingWidth: mergedConfig.rendering?.width,
          swipeThreshold: mergedConfig.input?.swipeThreshold,
        };
      });

      // Should have desktop-optimized settings
      expect(desktopResult.renderingWidth).toBeGreaterThan(1000);
    });
  });

  test.describe('Accessibility Integration', () => {
    test('should respect reduced motion preferences', async ({ page }) => {
      // Mock matchMedia for reduced motion BEFORE navigation
      await page.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          configurable: true,
          value: (query: string) => {
            const result = {
              matches: query === '(prefers-reduced-motion: reduce)',
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => {},
            };
            return result;
          },
        });
      });

      // Navigate after mock is set up
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      const result = await page.evaluate(async () => {
        const { DefaultsManager } = window.kineticSliderConfig!;

        const manager = DefaultsManager.getInstance();
        manager.clearCache(); // Ensure fresh calculation

        const config = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          duration: 1000,
        };

        const mergedConfig = manager.mergeWithDefaults(config);

        return {
          reduceMotion: mergedConfig.accessibility?.reduceMotion,
          duration: mergedConfig.duration,
          originalDuration: 1000,
        };
      });

      expect(result.reduceMotion).toBe(true);
      expect(result.duration).toBeLessThan(result.originalDuration); // Should be reduced
    });
  });

  test.describe('Error Reporting', () => {
    test('should provide detailed error information', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { ConfigValidator } = window.kineticSliderConfig!;

        const validator = new ConfigValidator();

        const invalidConfig = {
          slides: [
            {
              id: '', // Missing required ID
              src: 'invalid-url', // Invalid URL
              effects: {
                opacity: 2.0, // Out of range
              },
            },
          ],
          duration: -100, // Invalid duration
        };

        const validationResult = validator.validateConfig(invalidConfig);

        return {
          isValid: validationResult.isValid,
          errorCount: validationResult.errors.length,
          errors: validationResult.errors.map(
            (e: {
              code: string;
              message: string;
              path: string;
              expected?: unknown;
              actual?: unknown;
            }) => ({
              code: e.code,
              message: e.message,
              path: e.path,
              hasExpected: !!e.expected,
              hasActual: e.actual !== undefined,
            })
          ),
        };
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);

      // Should have detailed error information
      result.errors.forEach(
        (error: {
          code: string;
          message: string;
          path: string;
          hasExpected: boolean;
          hasActual: boolean;
        }) => {
          expect(error.code).toBeDefined();
          expect(error.message).toBeDefined();
          expect(error.path).toBeDefined();
        }
      );

      // Should include errors for different validation issues
      const errorPaths = result.errors.map((e: { path: string }) => e.path);
      expect(errorPaths).toContain('config.duration');
    });
  });

  test.describe('Performance Validation', () => {
    test('should handle configuration processing efficiently', async ({
      page,
    }) => {
      const result = await page.evaluate(async () => {
        const { ConfigurationSystem } = window.kineticSliderConfig!;

        // Create large configuration
        const largeConfig = {
          slides: Array.from({ length: 100 }, (_, i) => ({
            id: `slide${i}`,
            src: `image${i}.jpg`,
            metadata: {
              priority: i % 10,
              tags: [`tag${i}`, `category${i % 5}`],
            },
            effects: {
              opacity: 0.8 + (i % 3) * 0.1,
            },
            timing: {
              duration: 500 + (i % 5) * 100,
            },
          })),
          responsive: {
            breakpoints: Array.from({ length: 10 }, (_, i) => ({
              name: `breakpoint${i}`,
              minWidth: i * 100,
              maxWidth: (i + 1) * 100 - 1, // Avoid overlap by subtracting 1
              config: {
                rendering: { width: (i + 1) * 200 },
              },
            })),
          },
        };

        const startTime = performance.now();
        const processedConfig = ConfigurationSystem.processConfig(largeConfig);
        const endTime = performance.now();

        return {
          processingTime: endTime - startTime,
          slidesProcessed: processedConfig.slides.length,
          breakpointsProcessed: processedConfig.responsive?.breakpoints?.length,
        };
      });

      expect(result.slidesProcessed).toBe(100);
      expect(result.breakpointsProcessed).toBe(10);
      expect(result.processingTime).toBeLessThan(1000); // Should be under 1 second
    });
  });
});
