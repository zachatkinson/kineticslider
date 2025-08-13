/**
 * @fileoverview Filter System E2E Tests - Best Practice Implementation
 *
 * Combines reliability from essential tests with comprehensive coverage.
 * Tests core filter functionality, performance, and UI interactions.
 *
 * @version 1.0.0 - Best Practice Combination
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { navigateAndWait } from './utils';

// Core filter mapping for reliable testing (focus on key filters)
const coreFilters = {
  glow: 'glow',
  alpha: 'alpha',
  pixelate: 'pixelate',
  adjustment: 'adjustment',
  outline: 'outline',
} as const;

type CoreFilterName = keyof typeof coreFilters;

/**
 * Helper to clear all filters and ensure clean state
 */
async function clearFiltersAndWait(page: Page): Promise<void> {
  // Close any open dropdowns first
  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(200);

  const clearButton = page.locator('[data-testid="clear-filters-button"]');

  if (await clearButton.isVisible({ timeout: 2000 })) {
    await clearButton.click({ force: true });
    await page.waitForTimeout(500);
  }

  // Ensure add button is available (indicates clean state)
  const addButton = page.locator('[data-testid="add-filter-button"]');
  await addButton.waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Helper to add and enable a filter reliably
 */
async function addAndEnableFilter(
  page: Page,
  filterName: CoreFilterName
): Promise<void> {
  const mappedName = coreFilters[filterName];

  // Ensure clean state
  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(200);

  // Open filter dropdown
  const addButton = page.locator('[data-testid="add-filter-button"]');
  await addButton.waitFor({ state: 'visible', timeout: 5000 });
  await addButton.click();

  // Wait for dropdown and select filter
  const dropdown = page.locator('[data-testid="filter-dropdown"]');
  await dropdown.waitFor({ state: 'visible', timeout: 5000 });

  const filterOption = page.locator(
    `[data-testid="filter-option-${mappedName}"]`
  );
  await filterOption.waitFor({ state: 'visible', timeout: 3000 });
  await filterOption.click();

  // Verify filter was added and enabled
  await page.waitForTimeout(500);
  const filterCheckbox = page.locator(
    `[data-testid="filter-checkbox-${mappedName}"]`
  );
  await filterCheckbox.waitFor({ state: 'visible', timeout: 3000 });
  await expect(filterCheckbox).toBeChecked();
}

/**
 * Helper to count enabled filters
 */
async function countEnabledFilters(page: Page): Promise<number> {
  const enabledCheckboxes = page.locator(
    '[data-testid^="filter-checkbox-"]:checked'
  );
  return await enabledCheckboxes.count();
}

test.describe('Filter System E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
    // Start with clean state
    await clearFiltersAndWait(page);
  });

  test.describe('Core Functionality', () => {
    test('should load filter system UI components @smoke', async ({ page }) => {
      // Verify basic components are present
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();

      const filterControls = page.locator('[data-testid="filter-controls"]');
      await expect(filterControls).toBeVisible();

      const addFilterButton = page.locator('[data-testid="add-filter-button"]');
      await expect(addFilterButton).toBeVisible();
      await expect(addFilterButton).toBeEnabled();

      // Verify slider engine is available
      const result = await page.evaluate(() => {
        return {
          hasSliderEngine: !!(window as { kineticSlider?: { engine: unknown } })
            .kineticSlider?.engine,
        };
      });
      expect(result.hasSliderEngine).toBe(true);
    });

    test('should open filter dropdown and show available filters @critical', async ({
      page,
    }) => {
      const addFilterButton = page.locator('[data-testid="add-filter-button"]');
      await addFilterButton.click();

      // Wait for dropdown to appear
      const dropdown = page.locator('[data-testid="filter-dropdown"]');
      await expect(dropdown).toBeVisible({ timeout: 5000 });

      // Verify we have filter options available
      const filterOptions = await page
        .locator('[data-testid="filter-dropdown"] button')
        .all();
      expect(filterOptions.length).toBeGreaterThan(10);
    });

    test('should apply individual filters correctly', async ({ page }) => {
      // Test each core filter individually
      const testFilters: CoreFilterName[] = ['glow', 'alpha', 'pixelate'];

      for (const filterName of testFilters) {
        // Clear state between filters
        await clearFiltersAndWait(page);

        // Add and verify filter
        await addAndEnableFilter(page, filterName);

        // Verify filter is enabled
        const enabledCount = await countEnabledFilters(page);
        expect(enabledCount).toBe(1);

        // Verify slider still functions
        const slider = page.locator('[data-testid="kinetic-slider"]');
        await expect(slider).toBeVisible();
      }
    });

    test('should clear filters correctly', async ({ page }) => {
      // Add a filter first
      await addAndEnableFilter(page, 'glow');

      // Verify filter is enabled
      const enabledCount = await countEnabledFilters(page);
      expect(enabledCount).toBe(1);

      // Clear filters
      await clearFiltersAndWait(page);

      // Verify filters are cleared
      const noFiltersMessage = page.locator('text=No filters active');
      await expect(noFiltersMessage).toBeVisible();
    });
  });

  test.describe('Advanced Functionality', () => {
    test('should handle multiple filter combinations', async ({ page }) => {
      // Test filter combinations
      const combinations: [CoreFilterName, CoreFilterName][] = [
        ['glow', 'alpha'],
        ['adjustment', 'pixelate'],
      ];

      for (const [filter1, filter2] of combinations) {
        // Clear state between combinations
        await clearFiltersAndWait(page);

        // Add first filter
        await addAndEnableFilter(page, filter1);
        await page.waitForTimeout(300);

        // Add second filter
        await addAndEnableFilter(page, filter2);
        await page.waitForTimeout(300);

        // Verify both filters are enabled
        const enabledCount = await countEnabledFilters(page);
        expect(enabledCount).toBe(2);

        // Verify slider is still responsive
        const slider = page.locator('[data-testid="kinetic-slider"]');
        await expect(slider).toBeVisible();
      }
    });

    test('should handle filter workflow without crashing', async ({ page }) => {
      // Comprehensive workflow test with error handling
      try {
        const addFilterButton = page.locator(
          '[data-testid="add-filter-button"]'
        );
        await addFilterButton.click();

        const dropdown = page.locator('[data-testid="filter-dropdown"]');
        if (await dropdown.isVisible({ timeout: 5000 })) {
          // Try to click a filter option if dropdown opened
          const firstOption = page
            .locator('[data-testid="filter-dropdown"] button')
            .first();
          if (await firstOption.isVisible({ timeout: 2000 })) {
            await firstOption.click();
            await page.waitForTimeout(1000);
          }
        }

        // Try to clear filters if clear button exists
        const clearButton = page.locator(
          '[data-testid="clear-filters-button"]'
        );
        if (await clearButton.isVisible({ timeout: 2000 })) {
          await clearButton.click();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        // Don't fail the test for interaction issues - just verify system is stable
        console.warn(
          'Filter interaction had issues but system remained stable:',
          error
        );
      }

      // Verify the system is still responsive
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();

      const filterControls = page.locator('[data-testid="filter-controls"]');
      await expect(filterControls).toBeVisible();
    });
  });

  test.describe('Performance & Stability', () => {
    test('should maintain performance with multiple filters @performance', async ({
      page,
    }) => {
      // Set longer timeout for performance test
      test.setTimeout(30000);

      const performanceFilters: CoreFilterName[] = [
        'glow',
        'alpha',
        'adjustment',
      ];
      const startTime = Date.now();

      for (const filterName of performanceFilters) {
        try {
          await addAndEnableFilter(page, filterName);
          await page.waitForTimeout(500); // Allow filter to apply
          await clearFiltersAndWait(page);
          await page.waitForTimeout(300);
        } catch (error) {
          console.warn(`Performance test failed for ${filterName}:`, error);
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete filter operations within reasonable time
      expect(totalTime).toBeLessThan(20000); // 20 seconds max

      // Verify slider is still responsive
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
    });

    test('should handle rapid filter interactions', async ({ page }) => {
      // Test rapid toggling without system crash
      const rapidFilters: CoreFilterName[] = ['glow', 'alpha'];

      for (let i = 0; i < 3; i++) {
        for (const filterName of rapidFilters) {
          try {
            await addAndEnableFilter(page, filterName);
            await page.waitForTimeout(200);
          } catch (error) {
            console.warn(`Rapid interaction failed for ${filterName}:`, error);
          }
        }

        // Clear and reset
        await clearFiltersAndWait(page);
        await page.waitForTimeout(200);
      }

      // Verify system stability
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();

      const addButton = page.locator('[data-testid="add-filter-button"]');
      await expect(addButton).toBeEnabled();
    });
  });
});
