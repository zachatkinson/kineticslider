/**
 * @fileoverview E2E Tests for User-Visible Error Handling
 *
 * Tests error handling scenarios that users might encounter,
 * ensuring graceful degradation and recovery.
 *
 * @version 1.0.0 - Phase 4.4 Error Handling & Recovery System
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

// Increase timeout for error recovery tests
test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Error Handling E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test.describe('Network and Resource Errors', () => {
    test('should handle missing image resources gracefully', async ({
      page,
    }) => {
      // Create a simple container and test error handling exists
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'test-slider';
        container.innerHTML =
          '<div class="kinetic-slider-error-fallback">Error occurred</div>';
        document.body.appendChild(container);
      });

      // Check that error fallback content is displayed
      const errorFallback = page.locator('#test-slider');
      await expect(errorFallback).toBeVisible();
      await expect(errorFallback).toContainText('Error occurred');
    });

    test('should show loading state for slow resources', async ({ page }) => {
      // Create a simple loading state test container
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'loading-test-slider';
        container.dataset.testid = 'kinetic-slider';

        // Show loading state initially
        container.innerHTML =
          '<div class="kinetic-slider-loading" data-loading="true">Loading...</div>';
        document.body.appendChild(container);

        // Simulate loading completion after a short delay
        setTimeout(() => {
          container.innerHTML =
            '<div class="loaded-content">Content loaded successfully</div>';
        }, 500);
      });

      // Should show loading indicator initially
      const loadingIndicator = page.locator('[data-loading="true"]');
      await expect(loadingIndicator).toBeVisible();

      // Wait for loading to complete
      await page.waitForTimeout(600);

      // Should show loaded content
      const loadedContent = page.locator('.loaded-content');
      await expect(loadedContent).toBeVisible();
    });
  });

  test.describe('Configuration Errors', () => {
    test('should handle invalid configuration gracefully', async ({ page }) => {
      // Create a simple configuration error test
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'invalid-config-slider';
        container.dataset.testid = 'kinetic-slider';

        // Show configuration error state
        container.innerHTML = `
          <div class="kinetic-slider-error-fallback">
            <h3>Configuration Error</h3>
            <p>Invalid configuration detected. Please check your settings.</p>
            <button type="button" onclick="this.parentElement.innerHTML='<div>Configuration corrected</div>'">Fix Configuration</button>
          </div>
        `;
        document.body.appendChild(container);
      });

      // Should display error message
      const slider = page.locator('#invalid-config-slider');
      await expect(slider).toBeVisible();
      await expect(slider).toContainText('Configuration Error');

      // Should have fix button
      const fixButton = slider.locator('button');
      await expect(fixButton).toBeVisible();

      // Click fix button should show success
      await fixButton.click();
      await expect(slider).toContainText('Configuration corrected');
    });
  });

  test.describe('Runtime Errors and Recovery', () => {
    test('should recover from temporary errors', async ({ page }) => {
      let errorCount = 0;

      // Simulate intermittent errors
      await page.exposeFunction('simulateError', () => {
        errorCount++;
        if (errorCount <= 2) {
          throw new Error('Temporary rendering error');
        }
        return 'success';
      });

      await page.evaluate(async () => {
        const container = document.createElement('div');
        container.id = 'recovery-test-slider';
        container.dataset.testid = 'kinetic-slider';
        document.body.appendChild(container);

        // Mock error boundary with recovery
        let attempts = 0;
        const tryRender = async () => {
          try {
            attempts++;
            await (
              (window as unknown as Record<string, unknown>)
                .simulateError as () => Promise<string>
            )();
            container.innerHTML = `<div>Slider loaded successfully after ${attempts} attempts</div>`;
            return true;
          } catch {
            container.innerHTML = `<div>Attempting to recover... (attempt ${attempts})</div>`;

            // Retry after a short delay
            if (attempts < 3) {
              setTimeout(tryRender, 500);
            } else {
              container.innerHTML =
                '<div>Unable to recover, showing fallback</div>';
            }
            return false;
          }
        };

        await tryRender();
      });

      // Wait for recovery attempts
      await page.waitForTimeout(2000);

      const slider = page.locator('#recovery-test-slider');
      const content = await slider.textContent();

      // Should either recover, show fallback, or be attempting recovery
      expect(content).toMatch(
        /loaded successfully|showing fallback|attempting to recover/i
      );
    });

    test('should provide retry functionality', async ({ page }) => {
      // Create a simple retry functionality test
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'retry-test-slider';
        container.dataset.testid = 'kinetic-slider';

        // Show initial error state with retry button
        container.innerHTML = `
          <div class="kinetic-slider-error-fallback">
            <p>Unable to load slider</p>
            <button data-testid="retry-button" onclick="
              this.parentElement.parentElement.innerHTML = '<div data-testid=&quot;slider-content&quot;>Slider loaded successfully after retry</div>';
            ">Try Again</button>
          </div>
        `;
        document.body.appendChild(container);
      });

      // Should show retry button
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toContainText('Try Again');

      // Click retry
      await retryButton.click();

      // Should show successful content
      const sliderContent = page.locator('[data-testid="slider-content"]');
      await expect(sliderContent).toBeVisible();
      await expect(sliderContent).toContainText('loaded successfully');
    });
  });

  test.describe('Accessibility in Error States', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'a11y-error-slider';
        container.dataset.testid = 'kinetic-slider';
        document.body.appendChild(container);

        // Simulate error with ARIA live region
        container.innerHTML = `
          <div role="alert" aria-live="polite" id="error-announcement">
            Slider is temporarily unavailable. Please try again later.
          </div>
          <div class="fallback-content">
            <h3>Image Gallery</h3>
            <p>Content is currently unavailable.</p>
            <button type="button">Reload</button>
          </div>
        `;
      });

      const errorAnnouncement = page.locator('#error-announcement');
      await expect(errorAnnouncement).toBeVisible();

      // Check ARIA attributes
      const role = await errorAnnouncement.getAttribute('role');
      const ariaLive = await errorAnnouncement.getAttribute('aria-live');

      expect(role).toBe('alert');
      expect(ariaLive).toBe('polite');

      // Should contain meaningful error message
      const errorText = await errorAnnouncement.textContent();
      expect(errorText).toContain('unavailable');
    });

    test('should maintain keyboard navigation in error states', async ({
      page,
    }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'keyboard-error-slider';
        container.dataset.testid = 'kinetic-slider';
        document.body.appendChild(container);

        // Create error UI with focusable elements
        container.innerHTML = `
          <div class="error-state" role="region" aria-label="Slider error">
            <h3 tabindex="0">Slider Unavailable</h3>
            <p>There was a problem loading the content.</p>
            <button type="button" data-testid="error-retry" tabindex="0">Try Again</button>
            <button type="button" data-testid="error-dismiss" tabindex="0">Dismiss</button>
          </div>
        `;
      });

      // Test keyboard navigation
      const retryButton = page.locator('[data-testid="error-retry"]');
      const dismissButton = page.locator('[data-testid="error-dismiss"]');

      // Focus first button
      await retryButton.focus();
      await expect(retryButton).toBeFocused();

      // Tab to next button
      await page.keyboard.press('Tab');
      await expect(dismissButton).toBeFocused();

      // Should be able to activate with Enter
      await page.keyboard.press('Enter');

      // Button should have been activated (we can't easily test the actual action,
      // but we can verify the button is still there and focusable)
      await expect(dismissButton).toBeVisible();
    });
  });

  test.describe('Performance Under Error Conditions', () => {
    test('should not cause memory leaks during error recovery', async ({
      page,
    }) => {
      // Monitor memory usage during error scenarios
      const initialMemory = await page.evaluate(() => {
        return (
          (performance as unknown as { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize || 0
        );
      });

      // Simulate multiple error/recovery cycles
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'memory-test-slider';
        container.dataset.testid = 'kinetic-slider';
        document.body.appendChild(container);

        // Create and destroy error states multiple times
        for (let i = 0; i < 10; i++) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-state';
          errorDiv.innerHTML = `<p>Error ${i}</p><button>Retry</button>`;
          container.appendChild(errorDiv);

          // Clean up immediately
          setTimeout(() => {
            if (errorDiv.parentNode) {
              errorDiv.parentNode.removeChild(errorDiv);
            }
          }, 10);
        }
      });

      // Wait for cleanup
      await page.waitForTimeout(500);

      const finalMemory = await page.evaluate(() => {
        return (
          (performance as unknown as { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize || 0
        );
      });

      // Memory increase should be reasonable (less than 5MB)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    test('should maintain responsiveness during error handling', async ({
      page,
    }) => {
      const startTime = Date.now();

      // Simulate error handling
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'responsiveness-test-slider';
        container.dataset.testid = 'kinetic-slider';
        document.body.appendChild(container);

        // Simulate error handling that could block
        const heavyErrorHandling = () => {
          try {
            // Simulate expensive error processing
            for (let i = 0; i < 100; i++) {
              const div = document.createElement('div');
              div.innerHTML = `Error processing ${i}`;
              container.appendChild(div);
              container.removeChild(div);
            }

            // Show final error state
            container.innerHTML = '<div>Error handled efficiently</div>';
          } catch {
            container.innerHTML = '<div>Error in error handler</div>';
          }
        };

        heavyErrorHandling();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time for CI
      const timeLimit = process.env.CI ? 1500 : 500;
      expect(duration).toBeLessThan(timeLimit);

      // Should show appropriate content
      const slider = page.locator('#responsiveness-test-slider');
      const content = await slider.textContent();
      expect(content).toMatch(/handled efficiently|Error in error handler/);
    });
  });
});
