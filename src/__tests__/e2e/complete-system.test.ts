import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

test.describe('Complete System E2E - User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('User-Facing Accessibility Workflows', () => {
    test('should provide accessible slider interface for screen reader users', async ({ page }) => {
      // Test accessibility from user perspective
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // Check user-facing ARIA attributes
      await expect(slider).toHaveAttribute('role', 'region');
      await expect(slider).toHaveAttribute('aria-label', 'Interactive image slider');
      await expect(slider).toHaveAttribute('aria-valuenow');
      await expect(slider).toHaveAttribute('aria-valuemin', '1');
      await expect(slider).toHaveAttribute('aria-valuemax', '5');
      
      // Verify main content area exists for navigation
      const mainElement = page.locator('main[role="main"]');
      await expect(mainElement).toBeVisible();
    });

    test('should handle keyboard navigation from user perspective', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // Focus the slider as a keyboard user would
      await slider.focus();
      
      // Get initial ARIA value for comparison
      const initialAriaValue = await slider.getAttribute('aria-valuenow');
      
      // Navigate using arrow keys as a user would
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      
      // Verify navigation from user perspective
      const newAriaValue = await slider.getAttribute('aria-valuenow');
      expect(newAriaValue).not.toBe(initialAriaValue);
    });

    test('should support play/pause toggle via keyboard for users', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // Focus and get initial UI state
      await slider.focus();
      const initialStatusText = await page.locator('#play-status').textContent();
      
      // Toggle play/pause using space bar as user would
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      
      // Verify UI feedback for user
      const newStatusText = await page.locator('#play-status').textContent();
      expect(newStatusText).not.toBe(initialStatusText);
      expect(newStatusText).toMatch(/Playing|Paused/);
    });
  });

  test.describe('Touch and Mouse User Workflows', () => {
    test('should handle swipe gestures from user perspective', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // Get initial slide indicator for user feedback
      const initialSlideText = await page.locator('#current-slide').textContent();
      const initialSlideNumber = parseInt(initialSlideText || '1');
      
      // Perform swipe gesture as user would - ensure we exceed 50px threshold
      const box = await slider.boundingBox();
      if (box) {
        // Start from far right to ensure we exceed threshold distance
        await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2);
        await page.mouse.down();
        // Drag to far left to ensure we exceed 50px threshold
        await page.mouse.move(box.x + box.width * 0.15, box.y + box.height / 2, { steps: 5 });
        await page.mouse.up();
      }
      
      // Wait for animation to complete from user perspective
      await page.waitForTimeout(1000);
      
      // Verify user sees slide change
      const newSlideText = await page.locator('#current-slide').textContent();
      const newSlideNumber = parseInt(newSlideText || '1');
      expect(newSlideNumber).not.toBe(initialSlideNumber);
    });

    test('should handle precise mouse interactions', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // Get initial state from user interface
      const initialAriaValue = await slider.getAttribute('aria-valuenow');
      
      // Perform precise mouse DRAG interaction (not just click)
      // Our implementation requires dragging, not clicking
      const box = await slider.boundingBox();
      if (box) {
        // Start drag from center-right
        await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
        await page.mouse.down();
        // Drag left by more than threshold (50px)
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 5 });
        await page.mouse.up();
      }
      
      await page.waitForTimeout(500);
      
      // Verify user interface updated
      const newAriaValue = await slider.getAttribute('aria-valuenow');
      expect(newAriaValue).not.toBe(initialAriaValue);
    });
  });

  test.describe('Complete User Journey Integration', () => {
    test('should handle complete user interaction workflow', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // Start of user journey
      const initialAriaValue = await slider.getAttribute('aria-valuenow');
      
      // User focuses slider
      await slider.focus();
      
      // User navigates with keyboard
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
      
      // Verify user sees change
      const afterKeyboardAriaValue = await slider.getAttribute('aria-valuenow');
      expect(afterKeyboardAriaValue).not.toBe(initialAriaValue);
      
      // User then uses mouse
      const box = await slider.boundingBox();
      if (box) {
        // Ensure drag distance exceeds 50px threshold
        await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 3 });
        await page.mouse.up();
      }
      
      await page.waitForTimeout(1000);
      
      // Verify final state from user perspective
      const finalAriaValue = await slider.getAttribute('aria-valuenow');
      expect(finalAriaValue).not.toBe(afterKeyboardAriaValue);
    });

    test('should maintain usability during rapid user interactions', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      const startTime = Date.now();
      
      // Simulate rapid user interactions
      const box = await slider.boundingBox();
      if (box) {
        for (let i = 0; i < 5; i++) {
          // Ensure each drag exceeds 50px threshold
          await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
          await page.mouse.up();
          await page.waitForTimeout(100);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should remain responsive for user (performance requirement)
      expect(duration).toBeLessThan(5000);
      
      // Slider should still be interactive
      await slider.focus();
      await page.keyboard.press('ArrowLeft');
      
      // Should still respond to user input
      const isSliderResponsive = await slider.isVisible();
      expect(isSliderResponsive).toBe(true);
    });
  });

  test.describe('User Experience Error Recovery', () => {
    test('should maintain usability during error conditions', async ({ page }) => {
      // Monitor errors from user perspective
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // User interacts with slider
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // User attempts interaction
      await slider.focus();
      await page.keyboard.press('ArrowRight');
      
      // From user perspective, slider should remain functional
      const isStillUsable = await slider.isVisible();
      expect(isStillUsable).toBe(true);
      
      // User should be able to continue using the slider
      await page.keyboard.press('ArrowLeft');
      const ariaValue = await slider.getAttribute('aria-valuenow');
      expect(ariaValue).toBeTruthy();
    });

    test('should gracefully handle edge case user interactions', async ({ page }) => {
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await expect(slider).toBeVisible();
      
      // User performs edge case interactions
      await slider.focus();
      
      // Rapid keyboard presses
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(10);
      }
      
      // User should still see consistent interface
      const ariaValue = await slider.getAttribute('aria-valuenow');
      expect(ariaValue).toBeTruthy();
      
      // Interface should remain accessible
      await expect(slider).toHaveAttribute('role', 'region');
    });
  });
}); 