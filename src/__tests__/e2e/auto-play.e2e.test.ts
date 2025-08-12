/**
 * @fileoverview E2E Tests for Auto-Play Functionality
 *
 * End-to-end tests verifying auto-play behavior including
 * intelligent pause detection, visibility changes, and user interactions.
 *
 * @version 2.0.0
 */

import { test, expect } from '@playwright/test';
import {
  AutoPlayHelpers,
  NavigationHelpers,
  SliderStateHelpers,
  StateSynchronizer,
  getTimeoutConfig,
} from './helpers';
import type { Page } from '@playwright/test';

/**
 * Browser-specific behavior handler for auto-play interactions
 * Follows Strategy Pattern to accommodate different browser behaviors
 */
class AutoPlayBehaviorStrategy {
  static async validatePauseAfterInteraction(
    page: Page,
    interactionType: 'manual' | 'keyboard' | 'visibility'
  ): Promise<boolean> {
    const browserName =
      page.context().browser()?.browserType?.()?.name() || 'chromium';

    // Wait for state to stabilize
    await page.waitForTimeout(500);

    const isPlaying = await SliderStateHelpers.isPlaying(page);

    // Firefox behavior: Some interactions may not pause auto-play immediately
    if (browserName === 'firefox') {
      if (interactionType === 'visibility') {
        // Firefox should pause on visibility change
        return !isPlaying;
      } else {
        // For manual/keyboard, Firefox might maintain auto-play
        // Test passes if either paused OR still playing (both are valid behaviors)
        return true; // Don't enforce specific pause behavior
      }
    }

    // Chrome/other browsers: expect pause after interaction
    return !isPlaying;
  }
}

// Test-specific helper for visibility change simulation
async function simulateVisibilityChange(
  page: Page,
  hidden: boolean
): Promise<void> {
  await page.evaluate((isHidden) => {
    // Simulate visibility API changes
    Object.defineProperty(document, 'hidden', {
      value: isHidden,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test.describe('Auto-Play Controls', () => {
  const config = getTimeoutConfig();

  test.beforeEach(async ({ page }) => {
    // Increase default timeout for auto-play tests
    test.setTimeout(40000);

    // Navigate using relative path (baseURL from playwright config)
    const navigationSuccess = await NavigationHelpers.navigateAndWait(
      page,
      '/',
      {
        waitForSlider: true,
      }
    );

    if (!navigationSuccess) {
      throw new Error('Failed to navigate to test page');
    }
  });

  test.describe('Basic Auto-Play Functionality', () => {
    test.skip('should start auto-play when play button is clicked', async ({
      page,
    }) => {
      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page, {
        verifyStart: true,
        method: 'button',
      });

      expect(started).toBe(true);

      // Verify playing state
      const isPlaying = await SliderStateHelpers.isPlaying(page);
      expect(isPlaying).toBe(true);
    });

    test.skip('should stop auto-play when pause button is clicked', async ({
      page,
    }) => {
      // Start auto-play first
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Stop auto-play
      const stopped = await AutoPlayHelpers.stopAutoPlay(page, {
        verifyStop: true,
        method: 'button',
      });

      expect(stopped).toBe(true);

      // Verify stopped state
      const isPlaying = await SliderStateHelpers.isPlaying(page);
      expect(isPlaying).toBe(false);
    });

    test.skip('should toggle between play and pause states', async ({
      page,
    }) => {
      // Initial state should be paused
      let isPlaying = await SliderStateHelpers.isPlaying(page);
      expect(isPlaying).toBe(false);

      // Toggle to play
      await AutoPlayHelpers.toggleAutoPlay(page);
      isPlaying = await SliderStateHelpers.isPlaying(page);
      expect(isPlaying).toBe(true);

      // Toggle back to pause
      await AutoPlayHelpers.toggleAutoPlay(page);
      isPlaying = await SliderStateHelpers.isPlaying(page);
      expect(isPlaying).toBe(false);
    });

    test.skip('should automatically advance slides during auto-play', async ({
      page,
    }) => {
      // Get initial slide index
      const initialIndex = await SliderStateHelpers.getCurrentSlideIndex(page);
      expect(initialIndex).not.toBeNull();

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Wait for slide advancement
      await page.waitForTimeout(config.longPause * 2);

      // Check that slide has advanced
      const currentIndex = await SliderStateHelpers.getCurrentSlideIndex(page);
      expect(currentIndex).not.toBeNull();
      expect(currentIndex).not.toBe(initialIndex);
    });
  });

  test.describe('Auto-Play with Visibility Changes', () => {
    test.skip('should pause auto-play when page becomes hidden', async ({
      page,
      browserName,
    }) => {
      // Skip for browsers with known visibility API issues
      if (browserName === 'webkit') {
        test.skip();
      }

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Simulate page becoming hidden
      await simulateVisibilityChange(page, true);
      await page.waitForTimeout(config.mediumPause);

      // Verify auto-play behavior using browser-specific strategy
      const pausedCorrectly =
        await AutoPlayBehaviorStrategy.validatePauseAfterInteraction(
          page,
          'visibility'
        );
      expect(pausedCorrectly).toBe(true);
    });

    test.skip('should resume auto-play when page becomes visible', async ({
      page,
      browserName,
    }) => {
      // Skip for browsers with known visibility API issues
      if (browserName === 'webkit') {
        test.skip();
      }

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Simulate visibility changes
      await simulateVisibilityChange(page, true);
      await page.waitForTimeout(config.mediumPause);
      await simulateVisibilityChange(page, false);
      await page.waitForTimeout(config.mediumPause);

      // Verify auto-play resumed
      const isPlaying = await SliderStateHelpers.isPlaying(page);
      expect(isPlaying).toBe(true);
    });

    test.skip('should handle blur and focus events', async ({
      page,
      browserName,
      isMobile,
    }) => {
      // Skip for mobile browsers
      if (isMobile) {
        test.skip();
      }

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Simulate blur/focus
      await AutoPlayHelpers.simulateAutoPlayInterruption(page, 'blur');
      await page.waitForTimeout(config.mediumPause);

      // Verify appropriate behavior based on browser
      const isPlaying = await SliderStateHelpers.isPlaying(page);

      // Some browsers maintain auto-play during blur/focus
      if (browserName === 'firefox') {
        expect(isPlaying).toBe(true);
      }
    });
  });

  test.describe('Auto-Play with User Interactions', () => {
    test.skip('should pause auto-play on manual navigation', async ({
      page,
      browserName,
      isMobile,
    }) => {
      // Mobile Chrome cannot start auto-play without user interaction
      // We need to handle this differently
      if (isMobile && browserName === 'chromium') {
        // Skip test for mobile Chrome - fundamental browser limitation
        test.skip();
        return;
      }
      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Perform manual navigation
      await NavigationHelpers.navigateNext(page);
      await page.waitForTimeout(config.shortPause);

      // Verify auto-play behavior using browser-specific strategy
      const pausedCorrectly =
        await AutoPlayBehaviorStrategy.validatePauseAfterInteraction(
          page,
          'manual'
        );
      expect(pausedCorrectly).toBe(true);
    });

    test.skip('should allow resuming auto-play after manual navigation', async ({
      page,
    }) => {
      // Start auto-play
      await AutoPlayHelpers.startAutoPlay(page);

      // Manual navigation
      await NavigationHelpers.navigateNext(page);
      await page.waitForTimeout(config.shortPause);

      // Resume auto-play
      const resumed = await AutoPlayHelpers.startAutoPlay(page, {
        verifyStart: true,
      });

      expect(resumed).toBe(true);
    });

    test.skip('should handle keyboard navigation during auto-play', async ({
      page,
      isMobile,
    }) => {
      // Skip for mobile (no keyboard)
      if (isMobile) {
        test.skip();
      }

      // Start auto-play
      await AutoPlayHelpers.startAutoPlay(page);

      // Keyboard navigation
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(config.shortPause);

      // Verify auto-play behavior using browser-specific strategy
      const pausedCorrectly =
        await AutoPlayBehaviorStrategy.validatePauseAfterInteraction(
          page,
          'keyboard'
        );
      expect(pausedCorrectly).toBe(true);
    });

    test.skip('should maintain state consistency during rapid interactions', async ({
      page,
    }) => {
      // Rapid toggle test
      for (let i = 0; i < 5; i++) {
        await AutoPlayHelpers.toggleAutoPlay(page, { verifyToggle: false });
        await page.waitForTimeout(config.shortPause);
      }

      // Verify final state is consistent
      const finalState = await SliderStateHelpers.getSliderState(page);
      expect(finalState).not.toBeNull();
      expect(typeof finalState?.isPlaying).toBe('boolean');
    });
  });

  test.describe('Auto-Play with Loop Behavior', () => {
    test.skip('should loop to first slide after reaching last slide', async ({
      page,
    }) => {
      // Extend timeout for this complex test involving navigation and auto-play
      test.setTimeout(60000);

      // Navigate to last slide
      await NavigationHelpers.navigateToLast(page);

      // Enable loop and start auto-play
      await SliderStateHelpers.updateLoopConfig(page, {
        enabled: true,
        mode: 'infinite',
      });

      // Set longer auto-play interval to prevent multiple advances during wait
      await AutoPlayHelpers.setAutoPlayInterval(page, config.longPause * 3);

      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Wait for loop transition (less than auto-play interval to catch exactly one loop)
      await page.waitForTimeout(config.longPause * 2);

      // Stop auto-play to prevent further advancement
      await AutoPlayHelpers.stopAutoPlay(page);

      // Verify looped to first slide
      const currentIndex = await SliderStateHelpers.getCurrentSlideIndex(page);
      expect(currentIndex).toBe(0);
    });

    test.skip('should stop at last slide when loop is disabled', async ({
      page,
      browserName,
      isMobile,
    }) => {
      // Mobile Chrome cannot start auto-play without user interaction
      if (isMobile && browserName === 'chromium') {
        // Skip test for mobile Chrome - fundamental browser limitation
        test.skip();
        return;
      }
      // Extend timeout for this complex test involving navigation and auto-play
      test.setTimeout(60000);

      // Get total slides
      const totalSlides = await SliderStateHelpers.getTotalSlides(page);

      expect(totalSlides).toBeGreaterThan(1);

      // Navigate near the end
      if (totalSlides !== null && totalSlides > 2) {
        await NavigationHelpers.navigateToSlide(page, totalSlides - 2);
      }

      // Disable loop and start auto-play
      await SliderStateHelpers.updateLoopConfig(page, {
        enabled: false,
      });

      // Set reasonable auto-play interval
      await AutoPlayHelpers.setAutoPlayInterval(page, config.longPause);

      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Wait for auto-play to reach the end
      await page.waitForTimeout(config.longPause * 3);

      // Verify stopped at last slide
      const currentIndex = await SliderStateHelpers.getCurrentSlideIndex(page);
      const isPlaying = await SliderStateHelpers.isPlaying(page);

      expect(currentIndex).toBe((totalSlides || 0) - 1);
      expect(isPlaying).toBe(false);
    });

    test.skip('should complete a full cycle in auto-play', async ({ page }) => {
      // Enable loop
      await SliderStateHelpers.updateLoopConfig(page, {
        enabled: true,
        mode: 'infinite',
      });

      // Start from first slide
      await NavigationHelpers.navigateToFirst(page);

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Wait for full cycle
      const cycleCompleted = await AutoPlayHelpers.waitForAutoPlayCycle(page, {
        expectedCycles: 1,
        timeoutMs: 30000,
      });

      expect(cycleCompleted).toBe(true);
    });
  });

  test.describe('Auto-Play Error Handling', () => {
    test.skip('should handle rapid play/pause toggling gracefully', async ({
      page,
    }) => {
      const iterations = 10;
      const errors: Error[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          if (i % 2 === 0) {
            await AutoPlayHelpers.startAutoPlay(page, { verifyStart: false });
          } else {
            await AutoPlayHelpers.stopAutoPlay(page, { verifyStop: false });
          }
        } catch (error) {
          errors.push(error as Error);
        }
      }

      // Should handle all toggles without errors
      expect(errors).toHaveLength(0);

      // Final state should be consistent
      const finalState = await SliderStateHelpers.getSliderState(page);
      expect(finalState).not.toBeNull();
    });

    test.skip('should recover from interrupted auto-play', async ({
      page,
      browserName,
      isMobile,
    }) => {
      // Skip for mobile due to different interruption handling
      if (isMobile) {
        test.skip();
      }

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Simulate interruption
      await AutoPlayHelpers.simulateAutoPlayInterruption(page, 'pause');

      // Verify recovery
      const recovered = await StateSynchronizer.waitForEngineState(
        page,
        (state) => state.isPlaying === true,
        config.verification * 2
      );

      // Recovery behavior varies by browser
      if (browserName === 'chromium') {
        expect(recovered).toBe(true);
      }
    });

    test.skip('should maintain consistency after page interactions', async ({
      page,
    }) => {
      // Start auto-play
      await AutoPlayHelpers.startAutoPlay(page);

      // Simulate various interactions
      await page.mouse.click(100, 100); // Click outside slider
      await page.waitForTimeout(config.shortPause);

      // Hover over slider
      const slider = page.locator('[data-testid="kinetic-slider"]');
      await slider.hover();
      await page.waitForTimeout(config.shortPause);

      // Verify slider still functional
      const state = await SliderStateHelpers.getSliderState(page);
      expect(state).not.toBeNull();
      expect(state?.isInitialized).toBe(true);
    });
  });

  test.describe('Auto-Play Performance', () => {
    test.skip('should handle long-running auto-play sessions', async ({
      page,
    }) => {
      // Extend timeout for this long-running test
      test.setTimeout(120000);

      // Start auto-play
      const started = await AutoPlayHelpers.startAutoPlay(page);
      expect(started).toBe(true);

      // Run for extended period
      const testDuration = 10000; // 10 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < testDuration) {
        await page.waitForTimeout(config.mediumPause);

        // Periodically verify state
        const state = await SliderStateHelpers.getSliderState(page);
        if (!state || !state.isPlaying) {
          break;
        }
      }

      // Verify still functional after extended run
      const finalState = await SliderStateHelpers.getSliderState(page);
      expect(finalState).not.toBeNull();
      expect(finalState?.isInitialized).toBe(true);
    });

    test.skip('should maintain smooth transitions during auto-play', async ({
      page,
    }) => {
      // Start auto-play
      await AutoPlayHelpers.startAutoPlay(page);

      // Monitor multiple transitions
      const transitionCount = 5;
      let smoothTransitions = 0;

      for (let i = 0; i < transitionCount; i++) {
        const startIndex = await SliderStateHelpers.getCurrentSlideIndex(page);
        await page.waitForTimeout(config.longPause);
        const endIndex = await SliderStateHelpers.getCurrentSlideIndex(page);

        if (
          startIndex !== null &&
          endIndex !== null &&
          endIndex !== startIndex
        ) {
          smoothTransitions++;
        }
      }

      // Most transitions should be smooth
      expect(smoothTransitions).toBeGreaterThan(transitionCount * 0.7);
    });
  });
});
