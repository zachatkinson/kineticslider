import { test, expect } from '@playwright/test';

test.describe('KineticSlider Basic Functionality', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/KineticSlider/);

    // Check for basic page structure
    const main = page.locator('main, #root, [data-testid="app"]').first();
    await expect(main).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Check for description meta tag
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content');
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    const h1 = page.locator('h1').first();
    if ((await h1.count()) > 0) {
      await expect(h1).toBeVisible();
    }

    // Check for skip links or main landmark
    const main = page.locator('main, [role="main"]').first();
    if ((await main.count()) > 0) {
      await expect(main).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focused = page.locator(':focus');
    if ((await focused.count()) > 0) {
      await expect(focused).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow for responsive adjustments

    const main = page.locator('main, #root, [data-testid="app"]').first();
    await expect(main).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await expect(main).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await expect(main).toBeVisible();
  });
});
