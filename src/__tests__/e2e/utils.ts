/**
 * @fileoverview E2E Test Utilities
 *
 * Playwright-specific utilities that don't conflict with Vitest imports
 */

import type { Page } from '@playwright/test';
import { VIEWPORT, WAIT_STRATEGIES } from '../../core/constants';

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
  const isWebkit = page.context().browser()?.browserType().name() === 'webkit';

  // Retry logic for flaky navigation
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(path, {
        waitUntil: isWebkit
          ? WAIT_STRATEGIES.LOAD
          : WAIT_STRATEGIES.NETWORK_IDLE,
        timeout: 15000, // Shorter timeout per attempt
      });

      // Wait for the _slider to initialize
      await page.waitForSelector('[data-testid="kinetic-slider"]', {
        timeout: 5000,
      });

      // Wait for the real implementation to load
      await page.waitForFunction(
        () => {
          return (window as { kineticSlider?: { engine?: unknown } })
            .kineticSlider?.engine;
        },
        { timeout: 5000 }
      );

      // Success - return early
      return;
    } catch (error) {
      lastError = error as Error;

      // If not the last attempt, wait a bit before retrying
      if (attempt < 3) {
        await page.waitForTimeout(1000);
      }
    }
  }

  // All attempts failed
  throw new Error(
    `Failed to navigate after 3 attempts. Last error: ${lastError?.message}`
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
