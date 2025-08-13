/**
 * @fileoverview E2E Test Utilities
 *
 * Playwright-specific utilities that don't conflict with Vitest imports
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { VIEWPORT } from '../../core/constants';

// Viewport sizes for responsive testing
export const VIEWPORT_SIZES = {
  mobile: VIEWPORT.MOBILE,
  tablet: VIEWPORT.TABLET,
  desktop: VIEWPORT.DESKTOP,
} as const;

/**
 * Navigate to the demo page with real implementation and wait for it to be fully loaded
 * Optimized for CI reliability with reduced cumulative timeouts
 */
export async function navigateAndWait(
  page: Page,
  path: string = '/'
): Promise<void> {
  const browserName = page.context().browser()?.browserType().name();
  const isWebkit = browserName === 'webkit';
  const isCI = process.env.CI === 'true';

  // Adjust timeouts for CI environment
  const timeouts = {
    navigation: isCI ? 20000 : 30000,
    selector: isCI ? 8000 : 15000,
    initialization: isCI ? 5000 : 10000,
    finalWait: isCI ? 500 : 1000,
  };

  try {
    // Navigate with browser-specific wait strategy
    await page.goto(path, {
      waitUntil: isWebkit ? 'load' : 'domcontentloaded', // Changed from 'networkidle' for speed
      timeout: timeouts.navigation,
    });

    // Configure PIXI for headless/CI environments if needed
    if (isCI) {
      await page.evaluate(async () => {
        // Auto-configure PIXI adapter for headless environments
        if (typeof window !== 'undefined' && window.kineticSlider) {
          // Add a flag to indicate we're in a test environment
          (window as { testEnvironment?: boolean }).testEnvironment = true;
        }

        // Configure PIXI testing adapter for filter compatibility
        try {
          // Import and configure the PIXI testing adapter
          const { autoConfigurePixiAdapter } = await import(
            '../../testing/pixi-testing-adapter.js'
          );
          autoConfigurePixiAdapter();
        } catch (error) {
          console.log('PIXI testing adapter configuration skipped:', error);
        }
      });
    }

    // Quick title check
    const title = await page.title();
    if (!title || !title.includes('KineticSlider')) {
      throw new Error(`Page didn't load properly. Title: "${title}"`);
    }

    // Essential elements only - reduced timeout chain
    await page.waitForSelector('#root', { timeout: timeouts.selector });
    await page.waitForSelector('[data-testid="app"]', {
      timeout: timeouts.selector,
      state: 'visible',
    });

    // Core slider element
    await page.waitForSelector('[data-testid="kinetic-slider"]', {
      timeout: timeouts.selector,
      state: 'visible',
    });

    // Simplified initialization check - single condition
    try {
      await page.waitForFunction(
        () => {
          const kineticSlider = (
            window as {
              kineticSlider?: { engine?: { getCurrentIndex?: () => number } };
            }
          ).kineticSlider;
          // More specific check - ensure engine has basic functionality
          return (
            kineticSlider?.engine &&
            typeof kineticSlider.engine.getCurrentIndex === 'function'
          );
        },
        { timeout: timeouts.initialization }
      );
    } catch {
      // Fallback: Just ensure the slider element exists and is interactive
      await page.waitForFunction(
        () => {
          const slider = document.querySelector(
            '[data-testid="kinetic-slider"]'
          ) as HTMLElement | null;
          return slider && slider.offsetHeight > 0; // Ensure it's rendered
        },
        { timeout: timeouts.initialization }
      );
    }

    // Minimal settle time
    await page.waitForTimeout(timeouts.finalWait);
  } catch (error) {
    const finalUrl = page.url();
    const finalTitle = await page.title().catch(() => 'Unable to get title');

    throw new Error(
      `Navigation failed. Browser: ${browserName}, CI: ${isCI}, URL: ${finalUrl}, Title: "${finalTitle}", Error: ${(error as Error).message}`
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

/**
 * Wait for slider ARIA attributes to be fully initialized
 * This addresses the timing issue where tests check attributes before they're set
 */
export async function waitForSliderAriaAttributes(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  const slider = page.locator('[data-testid="kinetic-slider"]');

  // Wait for the slider to be visible first
  await expect(slider).toBeVisible({ timeout });

  // Wait for essential ARIA attributes to be set
  await page.waitForFunction(
    () => {
      const sliderElement = document.querySelector(
        '[data-testid="kinetic-slider"]'
      );
      if (!sliderElement) return false;

      // Check for essential ARIA attributes that should always be present
      const hasTabIndex = sliderElement.getAttribute('tabindex') === '0';
      const hasRole = sliderElement.getAttribute('role') === 'region';
      const hasAriaLabel = !!sliderElement.getAttribute('aria-label');
      const hasAriaValueNow = !!sliderElement.getAttribute('aria-valuenow');
      const hasAriaValueMin = !!sliderElement.getAttribute('aria-valuemin');
      const hasAriaValueMax = !!sliderElement.getAttribute('aria-valuemax');

      return (
        hasTabIndex &&
        hasRole &&
        hasAriaLabel &&
        hasAriaValueNow &&
        hasAriaValueMin &&
        hasAriaValueMax
      );
    },
    { timeout }
  );
}

/**
 * Wait for slider focus to be properly established
 * This addresses focus management timing issues in tests
 */
export async function waitForSliderFocus(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  const slider = page.locator('[data-testid="kinetic-slider"]');

  // Ensure slider is ready for focus
  await waitForSliderAriaAttributes(page, timeout);

  // Focus the slider
  await slider.focus();

  // Wait for focus to be established
  await page.waitForFunction(
    () => {
      const sliderElement = document.querySelector(
        '[data-testid="kinetic-slider"]'
      );
      return sliderElement && document.activeElement === sliderElement;
    },
    { timeout: 3000 }
  );
}
