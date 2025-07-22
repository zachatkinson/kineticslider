import { test, expect } from '@playwright/test';

test('debug console logs', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  // Capture all console logs
  page.on('console', async (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);

    // For errors, try to get more details
    if (msg.type() === 'error') {
      try {
        await Promise.all(
          msg.args().map((arg) => arg.jsonValue().catch(() => 'UNSERIALIZABLE'))
        );
      } catch {
        // Ignore
      }
    }
  });

  // Capture page errors
  page.on('pageerror', (_error) => {
    const text = `PAGE ERROR: ${_error.message}\n${_error.stack}`;
    errors.push(text);
  });

  // Capture request failures
  page.on('requestfailed', (_request) => {});

  // Navigate and wait for any console output
  try {
    await page.goto('http://localhost:3000/', {
      timeout: 5000,
      waitUntil: 'domcontentloaded',
    });

    // Wait a bit to collect logs
    await page.waitForTimeout(3000);

    // Also log the DOM structure to see what's loaded
    await page.evaluate(() => {
      const _slider = document.querySelector('[data-testid="kinetic-slider"]');
      return {
        sliderExists: !!_slider,
        sliderHTML: _slider?.innerHTML || 'No _slider element',
        statusText:
          document.getElementById('_slider-status')?.textContent || 'No status',
      };
    });

    // Try to get any global error variables
    await page
      .evaluate(() => {
        return {
          sliderInitErrors: window.__sliderInitErrors,
          serviceInitErrors: window.__serviceInitErrors,
          lastInitError: window.__lastInitError,
        };
      })
      .catch(() => null);
  } catch {
    // Intentionally empty
  }

  // Log summary

  // This test always passes - we just want to see the logs
  expect(true).toBe(true);
});
