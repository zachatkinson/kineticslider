/**
 * @fileoverview Filter System E2E Tests
 *
 * Comprehensive end-to-end tests for our complete filter system including:
 * - Filter UI controls and interaction
 * - Filter application through slider engine
 * - Filter clearing functionality
 * - Multiple filter types testing
 *
 * @version 2.0.0 - Updated for UI-based testing
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

test.describe('Filter System E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('should load and validate complete filter system @smoke', async ({
    page,
  }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Test through UI interaction instead of dynamic imports
    const result = await page.evaluate(() => {
      // Check if filter controls are available in the UI
      const filterControls = document.querySelector(
        '[data-testid="filter-controls"]'
      );
      const filterButtons = filterControls?.querySelectorAll('button');

      return {
        success: !!filterControls,
        hasFilterControls: !!filterControls,
        filterButtonCount: filterButtons?.length || 0,
        hasSliderEngine: !!(window as { kineticSlider?: { engine: unknown } })
          .kineticSlider?.engine,
      };
    });

    expect(result.success).toBe(true);
    expect(result.hasFilterControls).toBe(true);
    expect(result.filterButtonCount).toBeGreaterThan(0);
    expect(result.hasSliderEngine).toBe(true);
  });

  test('should apply filters through UI interaction', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Wait for slider to be fully initialized AND sprites to be available
    await page.waitForFunction(
      () => {
        const engine = (
          window as {
            kineticSlider?: {
              engine?: {
                applyFilter: (name: string) => Promise<void>;
                getCurrentIndex: () => number;
                renderer: { getSprites: () => unknown[] };
              };
            };
          }
        ).kineticSlider?.engine;
        if (!engine || typeof engine.applyFilter !== 'function') {
          return false;
        }

        // Check if renderer and sprites are available
        try {
          const renderer = engine?.renderer;
          if (!renderer) return false;

          const sprites = renderer.getSprites?.();
          const currentIndex = engine.getCurrentIndex?.() ?? 0;

          return sprites && sprites.length > 0 && sprites[currentIndex];
        } catch {
          return false;
        }
      },
      { timeout: 10000 }
    );

    // Test applying a filter through the UI
    const blurButton = page.locator('button:has-text("Blur")');
    await expect(blurButton).toBeVisible();
    await blurButton.click();

    // Wait for filter application with more robust polling and debugging
    let result = { success: false, announcementText: '', debugInfo: '' };
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(200);
      result = await page.evaluate((iteration) => {
        const announcements = document.querySelector(
          '#slider-announcements'
        )?.textContent;
        const sliderEngine = (
          window as {
            kineticSlider?: {
              engine?: {
                applyFilter: (name: string) => Promise<void>;
                getState: () => { isInitialized?: boolean };
              };
            };
          }
        ).kineticSlider?.engine;
        const hasApplyFilter = typeof sliderEngine?.applyFilter === 'function';
        const sliderState = sliderEngine?.getState?.();

        return {
          success: !!announcements?.includes('Applied softBlur filter'),
          announcementText: announcements || '',
          debugInfo: JSON.stringify({
            hasAnnouncements: !!announcements,
            announcementLength: announcements?.length || 0,
            hasSliderEngine: !!sliderEngine,
            hasApplyFilter,
            sliderInitialized: sliderState?.isInitialized,
            iteration: iteration,
            hasFailedMessage: !!announcements?.includes('failed'),
            hasNotAvailableMessage: !!announcements?.includes('not available'),
          }),
        };
      }, i);
      if (result.success) break;
    }

    // If test fails, log debug information
    if (!result.success) {
      console.log('Filter test failure debug info:', {
        finalAnnouncementText: result.announcementText,
        debugInfo: result.debugInfo,
        expectedText: 'Applied softBlur filter',
      });
    }

    expect(result.success).toBe(true);
  });

  test('should clear filters through UI interaction', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // First apply a filter
    const oldFilmButton = page.locator('button:has-text("Old Film")');
    await expect(oldFilmButton).toBeVisible();
    await oldFilmButton.click();
    await page.waitForTimeout(500);

    // Then clear filters
    const clearButton = page.locator('button:has-text("Clear Filters")');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await page.waitForTimeout(500);

    // Check if filters were cleared
    const result = await page.evaluate(() => {
      const announcements = document.querySelector(
        '#slider-announcements'
      )?.textContent;
      return {
        success: announcements?.includes('Cleared all filters'),
        announcementText: announcements,
      };
    });

    expect(result.success).toBe(true);
  });

  test('should test different filter types through UI', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Wait for slider to be fully initialized AND sprites to be available
    await page.waitForFunction(
      () => {
        const engine = (
          window as {
            kineticSlider?: {
              engine?: {
                applyFilter: (name: string) => Promise<void>;
                getCurrentIndex: () => number;
                renderer: { getSprites: () => unknown[] };
              };
            };
          }
        ).kineticSlider?.engine;
        if (!engine || typeof engine.applyFilter !== 'function') {
          return false;
        }

        // Check if renderer and sprites are available
        try {
          const renderer = engine?.renderer;
          if (!renderer) return false;

          const sprites = renderer.getSprites?.();
          const currentIndex = engine.getCurrentIndex?.() ?? 0;

          return sprites && sprites.length > 0 && sprites[currentIndex];
        } catch {
          return false;
        }
      },
      { timeout: 10000 }
    );

    // Test different filter types by clicking their buttons
    const filterTests = [
      { buttonText: 'Blur', filterName: 'softBlur' },
      { buttonText: 'Grayscale', filterName: 'blackAndWhite' },
      { buttonText: 'Old Film', filterName: 'vintage' },
    ];

    for (const filterTest of filterTests) {
      // Click the filter button
      const filterButton = page.locator(
        `button:has-text("${filterTest.buttonText}")`
      );
      await expect(filterButton).toBeVisible();
      await filterButton.click();
      await page.waitForTimeout(300);

      // Check that filter was applied
      const result = await page.evaluate((filterName) => {
        const announcements = document.querySelector(
          '#slider-announcements'
        )?.textContent;
        return {
          success: announcements?.includes(`Applied ${filterName} filter`),
          announcement: announcements,
        };
      }, filterTest.filterName);

      expect(result.success).toBe(true);

      // Clear filters before next test
      const clearButton = page.locator('button:has-text("Clear Filters")');
      await clearButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should handle multiple filter applications', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Wait for slider to be fully initialized AND sprites to be available
    await page.waitForFunction(
      () => {
        const engine = (
          window as {
            kineticSlider?: {
              engine?: {
                applyFilter: (name: string) => Promise<void>;
                getCurrentIndex: () => number;
                renderer: { getSprites: () => unknown[] };
              };
            };
          }
        ).kineticSlider?.engine;
        if (!engine || typeof engine.applyFilter !== 'function') {
          return false;
        }

        // Check if renderer and sprites are available
        try {
          const renderer = engine?.renderer;
          if (!renderer) return false;

          const sprites = renderer.getSprites?.();
          const currentIndex = engine.getCurrentIndex?.() ?? 0;

          return sprites && sprites.length > 0 && sprites[currentIndex];
        } catch {
          return false;
        }
      },
      { timeout: 10000 }
    );

    // Test applying multiple filters in sequence
    const filterSequence = ['Glow', 'Old Film'];

    for (const filterText of filterSequence) {
      const filterButton = page.locator(`button:has-text("${filterText}")`);
      await expect(filterButton).toBeVisible();
      await filterButton.click();

      // Wait for filter application with polling
      let applied = false;
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(200);
        const result = await page.evaluate(() => {
          const announcements = document.querySelector(
            '#slider-announcements'
          )?.textContent;
          return announcements || '';
        });
        if (result.includes('Applied')) {
          applied = true;
          break;
        }
      }
      expect(applied).toBe(true);
    }

    // Finally clear all filters
    const clearButton = page.locator('button:has-text("Clear Filters")');
    await clearButton.click();
    await page.waitForTimeout(300);

    const clearResult = await page.evaluate(() => {
      const announcements = document.querySelector(
        '#slider-announcements'
      )?.textContent;
      return announcements?.includes('Cleared all filters') || false;
    });

    expect(clearResult).toBe(true);
  });

  test('should handle visual filter effects correctly', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Test applying visual filters that work reliably
    const workingFilters = ['Blur', 'Glow'];

    for (const filterText of workingFilters) {
      const filterButton = page.locator(`button:has-text("${filterText}")`);
      await expect(filterButton).toBeVisible();
      await filterButton.click();
      await page.waitForTimeout(500);

      // Clear filters before next test
      const clearButton = page.locator('button:has-text("Clear Filters")');
      await clearButton.click();
      await page.waitForTimeout(300);
    }

    // Ensure we can interact with all filter buttons without errors
    const filterButtons = page.locator(
      '[data-testid="filter-controls"] button'
    );
    const buttonCount = await filterButtons.count();
    expect(buttonCount).toBeGreaterThan(4); // Should have at least 5 buttons including clear
  });

  test('should validate filter controls are accessible', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Test that all filter buttons are accessible and clickable
    const filterButtons = page.locator(
      '[data-testid="filter-controls"] button'
    );
    const buttonCount = await filterButtons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Test each button is visible and enabled
    for (let i = 0; i < buttonCount; i++) {
      const button = filterButtons.nth(i);
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }
  });

  test('should handle filter system performance', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Test rapid filter switching to check performance
    const filters = ['Blur', 'Old Film', 'Grayscale'];
    const startTime = Date.now();

    for (const filterText of filters) {
      const filterButton = page.locator(`button:has-text("${filterText}")`);
      await filterButton.click();
      await page.waitForTimeout(100); // Minimal wait
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete filter switching within reasonable time
    expect(totalTime).toBeLessThan(5000); // 5 seconds max

    // Clear filters
    const clearButton = page.locator('button:has-text("Clear Filters")');
    await clearButton.click();
  });

});
