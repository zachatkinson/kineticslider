import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

test.describe('Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('ARIA and Screen Reader Integration', () => {
    test('should coordinate keyboard navigation with screen reader announcements', async ({
      page,
    }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Focus the real _slider implementation
      await _slider.focus();

      // Use real KeyboardNavigator - Arrow Right
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);

      // Check that proper ARIA attributes are present from real implementation
      const ariaRole = await _slider.getAttribute('role');
      expect(ariaRole).toBe('region');

      const ariaLabel = await _slider.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Test keyboard navigation
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);

      // Verify ARIA live region for announcements
      const liveRegion = page.locator('[aria-live]');
      await expect(liveRegion).toBeVisible();
    });

    test('should provide proper ARIA attributes and focus management', async ({
      page,
    }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Check essential ARIA attributes
      const tabindex = await _slider.getAttribute('tabindex');
      expect(tabindex).toBe('0');

      const role = await _slider.getAttribute('role');
      expect(role).toBe('region');

      const ariaLabel = await _slider.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Test focus management
      await _slider.focus();
      const focused = page.locator(':focus');
      await expect(focused).toHaveAttribute('data-testid', 'kinetic-slider');

      // Check for keyboard instructions
      const ariaDescribedBy = await _slider.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();
    });

    test('should respect motion preferences in gesture handling', async ({
      page,
    }) => {
      // Test reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Perform interaction
      await _slider.focus();
      await page.keyboard.press('ArrowRight');

      // Wait for any animations (should be minimal with reduced motion)
      await page.waitForTimeout(500);

      // Verify _slider still functions with reduced motion
      const focused = page.locator(':focus');
      await expect(focused).toHaveAttribute('data-testid', 'kinetic-slider');
    });

    test('should handle high contrast mode', async ({ page }) => {
      // Test high contrast mode compatibility
      await page.emulateMedia({ colorScheme: 'dark' });

      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Test that focus indicators are still visible
      await _slider.focus();

      // Check that the _slider is still accessible in high contrast
      const computedStyle = await _slider.evaluate((el) => {
        return window.getComputedStyle(el).visibility;
      });

      expect(computedStyle).toBe('visible');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should handle all keyboard interactions', async ({ page }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      await _slider.focus();

      // Test arrow keys
      const initialAriaValue = await _slider.getAttribute('aria-valuenow');

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);

      const afterRightAriaValue = await _slider.getAttribute('aria-valuenow');
      expect(afterRightAriaValue).not.toBe(initialAriaValue);

      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(300);

      const afterLeftAriaValue = await _slider.getAttribute('aria-valuenow');
      expect(afterLeftAriaValue).toBe(initialAriaValue);

      // Test Home/End keys
      await page.keyboard.press('Home');
      await page.waitForTimeout(300);

      const homeAriaValue = await _slider.getAttribute('aria-valuenow');
      expect(homeAriaValue).toBe('1');

      await page.keyboard.press('End');
      await page.waitForTimeout(300);

      const endAriaValue = await _slider.getAttribute('aria-valuenow');
      expect(parseInt(endAriaValue || '1')).toBeGreaterThan(1);
    });

    test('should handle WASD navigation', async ({ page }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      await _slider.focus();

      const initialAriaValue = await _slider.getAttribute('aria-valuenow');

      // Test D key (right)
      await page.keyboard.press('d');
      await page.waitForTimeout(300);

      const afterDAriaValue = await _slider.getAttribute('aria-valuenow');
      expect(afterDAriaValue).not.toBe(initialAriaValue);

      // Test A key (left)
      await page.keyboard.press('a');
      await page.waitForTimeout(300);

      const afterAAriaValue = await _slider.getAttribute('aria-valuenow');
      expect(afterAAriaValue).toBe(initialAriaValue);
    });

    test('should provide keyboard instructions', async ({ page }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Check for keyboard instructions element
      const ariaDescribedBy = await _slider.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();

      if (ariaDescribedBy) {
        const instructionsElement = page.locator(`#${ariaDescribedBy}`);
        await expect(instructionsElement).toBeAttached();

        const instructionsText = await instructionsElement.textContent();
        expect(instructionsText).toContain('arrow keys');
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should provide meaningful announcements', async ({ page }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Check for live region
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeAttached();

      await _slider.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);

      // Live region should exist and be configured properly
      const ariaLive = await liveRegion.getAttribute('aria-live');
      expect(ariaLive).toBe('polite');
    });

    test('should update aria-valuenow and aria-valuetext', async ({ page }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Check initial values
      const initialValueNow = await _slider.getAttribute('aria-valuenow');
      const initialValueText = await _slider.getAttribute('aria-valuetext');

      expect(initialValueNow).toBeTruthy();
      expect(initialValueText).toBeTruthy();

      // Navigate and check values update
      await _slider.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);

      const newValueNow = await _slider.getAttribute('aria-valuenow');
      const newValueText = await _slider.getAttribute('aria-valuetext');

      expect(newValueNow).not.toBe(initialValueNow);
      expect(newValueText).not.toBe(initialValueText);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should work with touch and voice controls', async ({ page }) => {
      // Simulate mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Test touch interaction
      const box = await _slider.boundingBox();
      if (box) {
        await page.touchscreen.tap(
          box.x + box.width / 2,
          box.y + box.height / 2
        );
        await page.waitForTimeout(300);
      }

      // Verify _slider is still accessible
      const ariaLabel = await _slider.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should maintain accessibility in portrait and landscape', async ({
      page,
    }) => {
      const _slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(_slider).toBeVisible();

      // Test portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(_slider).toBeVisible();

      let ariaLabel = await _slider.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Test landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await expect(_slider).toBeVisible();

      ariaLabel = await _slider.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });
  });
});
