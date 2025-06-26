import { test, expect } from '@playwright/test';
import { navigateAndWait, testViewportResponsiveness } from './utils';
import { CSS_SELECTORS } from '../../core/constants';

test.describe('KineticSlider Basic Functionality', () => {
  test('should load the application', async ({ page }) => {
    await navigateAndWait(page);

    // Check that the page title is correct
    await expect(page).toHaveTitle(/KineticSlider/);

    // Check for basic page structure
    const main = page.locator(CSS_SELECTORS.MAIN_SELECTORS).first();
    await expect(main).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await navigateAndWait(page);

    // Check for viewport meta tag
    const viewport = page.locator(CSS_SELECTORS.VIEWPORT_META);
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Check for description meta tag
    const description = page.locator(CSS_SELECTORS.DESCRIPTION_META);
    await expect(description).toHaveAttribute('content');
  });

  test('should be accessible', async ({ page }) => {
    await navigateAndWait(page);

    // Check for proper heading structure
    const h1 = page.locator('h1').first();
    if ((await h1.count()) > 0) {
      await expect(h1).toBeVisible();
    }

    // Check for skip links or main landmark
    const main = page.locator(CSS_SELECTORS.MAIN_ROLE).first();
    if ((await main.count()) > 0) {
      await expect(main).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await navigateAndWait(page);

    // Test tab navigation
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focused = page.locator(':focus');
    if ((await focused.count()) > 0) {
      await expect(focused).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    await navigateAndWait(page);

    // Test all viewport sizes
    const results = await testViewportResponsiveness(
      page,
      CSS_SELECTORS.MAIN_SELECTORS
    );

    // Verify all viewports show content
    results.forEach((result, _index) => {
      expect(result.isVisible).toBe(true);
    });
  });

  test('should display image meta title', async ({ page }) => {
    await navigateAndWait(page);

    const text = (await page.textContent('.image-meta title')) || '';
    expect(text).toMatch(/Image \d+ of \d+/);
  });
});
