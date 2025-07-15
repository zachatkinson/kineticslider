/**
 * @fileoverview E2E Test Utilities
 *
 * Playwright-specific utilities that don't conflict with Vitest imports
 */

import type { Page } from '@playwright/test';
import { VIEWPORT, TEST_TIMING, WAIT_STRATEGIES } from '../../core/constants';

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
  path: string = '/demo.html'
): Promise<void> {
  await page.goto(path, {
    waitUntil: WAIT_STRATEGIES.NETWORK_IDLE,
    timeout: TEST_TIMING.E2E_TIMEOUT,
  });

  // Wait for the slider to initialize
  await page.waitForSelector('[data-testid="kinetic-slider"]');

  // Wait for the real implementation to load
  await page.waitForFunction(
    () => {
      return (window as { kineticSlider?: { engine?: unknown } }).kineticSlider
        ?.engine;
    },
    { timeout: 10000 }
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
