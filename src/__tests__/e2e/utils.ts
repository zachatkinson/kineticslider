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

  // Retry logic for flaky navigation
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      // Navigate with appropriate wait strategy
      await page.goto(path, {
        waitUntil: isWebkit ? 'load' : 'networkidle',
        timeout: 20000, // Increased timeout for CI
      });

      // First check if page loaded at all
      const title = await page.title();
      if (!title || !title.includes('KineticSlider')) {
        throw new Error(`Page didn't load properly. Title: "${title}"`);
      }

      // Wait for React root to render
      await page.waitForSelector('#root', { timeout: 10000 });

      // Wait for the demo container to load
      await page.waitForSelector('.demo-container', {
        timeout: 10000,
        state: 'visible',
      });

      // Wait for the slider to initialize with more specific selector
      await page.waitForSelector('[data-testid="kinetic-slider"]', {
        timeout: 15000,
        state: 'visible',
      });

      // Wait for the real implementation to load with better error handling
      await page.waitForFunction(
        () => {
          const kineticSlider = (
            window as { kineticSlider?: { engine?: unknown } }
          ).kineticSlider;
          return kineticSlider && kineticSlider.engine;
        },
        { timeout: 15000 }
      );

      // Additional wait for any animations/transitions to settle
      await page.waitForTimeout(500);

      // Success - return early
      return;
    } catch (error) {
      lastError = error as Error;

      // Log detailed error information for debugging
      const url = page.url();
      const title = await page.title().catch(() => 'Unable to get title');

      console.error(`Navigation attempt ${attempt} failed:`, {
        browser: browserName,
        url,
        title,
        error: lastError.message,
        path,
      });

      // If not the last attempt, wait progressively longer before retrying
      if (attempt < 5) {
        await page.waitForTimeout(attempt * 1000);
      }
    }
  }

  // All attempts failed - provide comprehensive error info
  const finalUrl = page.url();
  const finalTitle = await page.title().catch(() => 'Unable to get title');

  throw new Error(
    `Failed to navigate after 5 attempts. Browser: ${browserName}, URL: ${finalUrl}, Title: "${finalTitle}", Last error: ${lastError?.message}`
  );
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
