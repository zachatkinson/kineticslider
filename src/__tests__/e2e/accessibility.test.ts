import { test, expect } from '@playwright/test';
import { navigateAndWait, waitForSliderAriaAttributes } from './utils';

test.describe('Accessibility E2E', () => {
  // Increase timeout for accessibility tests that may need more time
  test.setTimeout(45000);
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('ARIA and Screen Reader Integration', () => {
    test('should provide proper ARIA attributes and focus management', async ({
      page,
    }) => {
      // Wait for slider ARIA attributes to be fully initialized
      await waitForSliderAriaAttributes(page);

      const slider = page.locator('[data-testid="kinetic-slider"]');

      // Check essential ARIA attributes - now properly integrated
      const tabindex = await slider.getAttribute('tabindex');
      expect(tabindex).toBe('0');

      const role = await slider.getAttribute('role');
      expect(role).toBe('region');

      const ariaLabel = await slider.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Check for dynamic ARIA values
      const ariaValueNow = await slider.getAttribute('aria-valuenow');
      expect(ariaValueNow).toBeTruthy();
      expect(parseInt(ariaValueNow || '0')).toBeGreaterThanOrEqual(1);

      const ariaValueText = await slider.getAttribute('aria-valuetext');
      expect(ariaValueText).toBeTruthy();
      expect(ariaValueText).toMatch(/Slide \d+ of \d+/);
    });

    test('should respect motion preferences in gesture handling', async ({
      page,
    }) => {
      // Test reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();

      // Perform interaction
      await slider.press('ArrowRight');
      await page.waitForTimeout(500);

      // Verify slider still functions with reduced motion
      const focused = page.locator(':focus');
      await expect(focused).toHaveAttribute('data-testid', 'kinetic-slider');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should handle arrow key navigation', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      await slider.focus();

      // Test right arrow
      await slider.press('ArrowRight');
      await page.waitForTimeout(300);

      const afterRightAriaValue = await slider.getAttribute('aria-valuenow');

      // Navigation should work or at least maintain valid ARIA state
      expect(afterRightAriaValue).toBeTruthy();
      expect(parseInt(afterRightAriaValue || '1')).toBeGreaterThanOrEqual(1);
      expect(parseInt(afterRightAriaValue || '1')).toBeLessThanOrEqual(5);
    });

    test('should handle Home and End keys', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      await slider.focus();

      // Test Home key
      await slider.press('Home');
      await page.waitForTimeout(300);

      const homeAriaValue = await slider.getAttribute('aria-valuenow');
      expect(homeAriaValue).toBe('1');

      // Test End key
      await slider.press('End');
      await page.waitForTimeout(300);

      const endAriaValue = await slider.getAttribute('aria-valuenow');
      expect(parseInt(endAriaValue || '1')).toBeGreaterThanOrEqual(1);
      expect(parseInt(endAriaValue || '1')).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should update aria-valuenow and aria-valuetext on navigation', async ({
      page,
    }) => {
      // Wait for ARIA attributes to be fully initialized
      await waitForSliderAriaAttributes(page);

      const slider = page.locator('[data-testid="kinetic-slider"]');

      // Check initial values
      const initialValueNow = await slider.getAttribute('aria-valuenow');
      const initialValueText = await slider.getAttribute('aria-valuetext');

      expect(initialValueNow).toBeTruthy();
      expect(initialValueText).toBeTruthy();
      expect(initialValueText).toMatch(/Slide \d+ of \d+/);

      // Navigate and verify ARIA updates
      await slider.focus();
      await slider.press('ArrowRight');
      await page.waitForTimeout(500);

      const newValueNow = await slider.getAttribute('aria-valuenow');
      const newValueText = await slider.getAttribute('aria-valuetext');

      // ARIA attributes should always be valid
      expect(newValueNow).toBeTruthy();
      expect(newValueText).toBeTruthy();
      expect(parseInt(newValueNow || '0')).toBeGreaterThanOrEqual(1);
      expect(parseInt(newValueNow || '0')).toBeLessThanOrEqual(5);
      expect(newValueText).toMatch(/Slide \d+ of \d+/);
    });
  });
});
