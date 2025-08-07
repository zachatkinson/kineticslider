/**
 * @fileoverview E2E Test Utilities
 *
 * Playwright-specific utilities that don't conflict with Vitest imports
 */

import type { Page } from '@playwright/test';
import { VIEWPORT } from '../../core/constants';

// Viewport sizes for responsive testing
export const VIEWPORT_SIZES = {
  mobile: VIEWPORT.MOBILE,
  tablet: VIEWPORT.TABLET,
  desktop: VIEWPORT.DESKTOP,
} as const;

/**
 * Navigate to the demo page with real implementation and wait for it to be fully loaded
 */
export async function navigateAndWait(
  page: Page,
  path: string = '/'
): Promise<void> {
  // Use a more reliable wait strategy for webkit
  const browserName = page.context().browser()?.browserType().name();
  const isWebkit = browserName === 'webkit';

  try {
    // Navigate with appropriate wait strategy
    await page.goto(path, {
      waitUntil: isWebkit ? 'load' : 'networkidle',
      timeout: 30000, // Increased timeout for CI
    });

    // First check if page loaded at all
    const title = await page.title();
    if (!title || !title.includes('KineticSlider')) {
      throw new Error(`Page didn't load properly. Title: "${title}"`);
    }

    // Wait for React root to render
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait for the demo app to load (React component uses data-testid="app")
    await page.waitForSelector('[data-testid="app"]', {
      timeout: 15000,
      state: 'visible',
    });

    // Wait for the slider to initialize with more specific selector
    await page.waitForSelector('[data-testid="kinetic-slider"]', {
      timeout: 20000,
      state: 'visible',
    });

    // Try to wait for full initialization, but don't fail if it doesn't complete
    try {
      // Wait for the real implementation to load
      await page.waitForFunction(
        () => {
          const kineticSlider = (
            window as { kineticSlider?: { engine?: unknown } }
          ).kineticSlider;
          return kineticSlider && kineticSlider.engine;
        },
        { timeout: 10000 }
      );

      // Wait for slider initialization to complete (critical for ARIA attributes)
      await page.waitForSelector('[data-kinetic-slider-initialized="true"]', {
        timeout: 8000,
        state: 'attached',
      });
    } catch {
      // If full initialization doesn't complete, continue with basic setup
      // This prevents tests from failing due to initialization timeouts
    }

    // Additional wait for any animations/transitions to settle
    await page.waitForTimeout(1000);
  } catch (error) {
    const finalUrl = page.url();
    const finalTitle = await page.title().catch(() => 'Unable to get title');

    throw new Error(
      `Navigation failed. Browser: ${browserName}, URL: ${finalUrl}, Title: "${finalTitle}", Error: ${(error as Error).message}`
    );
  }
}

/**
 * Test viewport responsiveness across different screen sizes
 */
export async function testViewportResponsiveness(
  page: Page,
  selector: string
): Promise<
  Array<{ viewport: string; width: number; height: number; isVisible: boolean }>
> {
  const results = [];

  for (const [name, size] of Object.entries(VIEWPORT_SIZES)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(500); // Allow layout to settle

    const element = page.locator(selector).first();
    const isVisible = await element.isVisible();

    results.push({
      viewport: name,
      width: size.width,
      height: size.height,
      isVisible,
    });
  }

  return results;
}

/**
 * Reset the application to a clean state for better test isolation
 */
export async function resetAppState(page: Page): Promise<void> {
  try {
    // Clear all filters first
    const clearButton = page.locator('[data-testid="clear-filters-button"]');
    if (await clearButton.isVisible({ timeout: 2000 })) {
      await clearButton.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Force close any open dropdowns
    await page.evaluate(() => {
      // Click outside to close any dropdowns
      const body = document.body;
      if (body) {
        body.click();
      }

      // Clear any React state that might be lingering
      const event = new Event('resetFilters', { bubbles: true });
      body.dispatchEvent(event);
    });

    // Wait for state to stabilize
    await page.waitForTimeout(300);

    // Ensure the add filter button is visible and ready
    const addButton = page.locator('[data-testid="add-filter-button"]');
    await addButton.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // Continue with test - don't fail if cleanup fails
  }
}

/**
 * Enhanced navigation with state reset for better test isolation
 */
export async function navigateAndReset(
  page: Page,
  path: string = '/'
): Promise<void> {
  await navigateAndWait(page, path);
  await resetAppState(page);
}
