/**
 * Auto-play helpers for E2E tests
 * Provides reliable auto-play control functionality
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Page } from '@playwright/test';
import { E2EErrorHandler } from './error-handler';
import { StateSynchronizer } from './state-sync-helpers';
import { getTimeoutConfig } from './timeout-config';
import { BrowserStrategyFactory } from './browser-strategies';
import type { SliderEngine } from './types';

export class AutoPlayHelpers {
  private static readonly PLAY_BUTTON_SELECTORS = [
    '#play-pause-btn',
    '[data-testid="play-button"]',
    '[data-testid="play-pause-button"]',
    '[aria-label*="play" i]',
    '[aria-label*="pause" i]',
    'button:has-text("Play")',
    '.play-button',
    '.play-pause-button',
  ];

  /**
   * Start auto-play with multiple strategies and enhanced validation
   * Follows SOLID principles: Open/Closed (extensible strategies), Single Responsibility
   */
  static async startAutoPlay(
    page: Page,
    options?: {
      verifyStart?: boolean;
      timeoutMs?: number;
      method?: 'button' | 'api' | 'auto';
    }
  ): Promise<boolean> {
    const verifyStart = options?.verifyStart !== false;
    const method = options?.method || 'auto';

    try {
      // STEP 1: Enhanced page and context validation before auto-play
      if (page.isClosed()) {
        console.warn('[AutoPlayHelpers] Page is closed');
        return false;
      }

      await page.waitForSelector('[data-testid="kinetic-slider"]', {
        state: 'visible',
        timeout: 5000,
      });

      // Wait for slider to be fully ready before attempting auto-play
      await StateSynchronizer.waitForEngineInitialization(page, 3000);
      await page.waitForTimeout(300); // Additional settling time

      // STEP 2: Try specified method or auto-detect (Strategy Pattern)
      let started = false;

      if (method === 'api' || method === 'auto') {
        console.info('[AutoPlayHelpers] Attempting API method...');
        started = await this.startViaAPI(page);
      }

      if (!started && (method === 'button' || method === 'auto')) {
        console.info('[AutoPlayHelpers] Attempting button method...');
        started = await this.startViaButton(page);
      }

      if (!started) {
        console.warn('[AutoPlayHelpers] All start methods failed');
        return false;
      }

      // STEP 3: Enhanced verification using StateSynchronizer (follows SOLID principles)
      if (verifyStart) {
        console.info('[AutoPlayHelpers] Verifying auto-play start...');

        // Wait for engine state to synchronize with extended timeout and retries
        await page.waitForTimeout(200); // Allow state to settle

        const stateVerified = await StateSynchronizer.waitForEngineState(
          page,
          (state) => state.isPlaying === true,
          3000 // Extended timeout for state sync
        );

        if (stateVerified) {
          console.info('[AutoPlayHelpers] Auto-play verified via engine state');
          return true;
        }

        // Fallback: check button state for backward compatibility
        await page.waitForTimeout(100);
        const playButton = page.locator('[data-testid="play-button"]');
        const dataPlaying = await playButton.getAttribute('data-playing');

        if (dataPlaying === 'true') {
          console.info('[AutoPlayHelpers] Auto-play verified via button state');
          return true;
        }

        console.warn(
          '[AutoPlayHelpers] Auto-play verification failed on both engine and button state'
        );
        // Return false to indicate verification failure - this is critical for test reliability
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AutoPlayHelpers] Start auto-play failed:', error);
      return false;
    }
  }

  /**
   * Stop auto-play
   */
  static async stopAutoPlay(
    page: Page,
    options?: {
      verifyStop?: boolean;
      timeoutMs?: number;
      method?: 'button' | 'api' | 'auto';
    }
  ): Promise<boolean> {
    const method = options?.method || 'auto';
    const verifyStop = options?.verifyStop !== false;

    try {
      // Try specified method or auto-detect
      let stopped = false;

      if (method === 'api' || method === 'auto') {
        stopped = await this.stopViaAPI(page);
      }

      if (!stopped && (method === 'button' || method === 'auto')) {
        stopped = await this.stopViaButton(page);
      }

      if (!stopped) {
        console.warn('[AutoPlayHelpers] Failed to stop auto-play');
        return false;
      }

      // Enhanced verification using StateSynchronizer (follows SOLID principles)
      if (verifyStop) {
        console.info('[AutoPlayHelpers] Verifying auto-play stop...');

        // Wait for engine state to synchronize with extended timeout and retries
        await page.waitForTimeout(200); // Allow state to settle

        const stateVerified = await StateSynchronizer.waitForEngineState(
          page,
          (state) => state.isPlaying === false,
          3000 // Extended timeout for state sync
        );

        if (stateVerified) {
          console.info(
            '[AutoPlayHelpers] Auto-play stop verified via engine state'
          );
          return true;
        }

        // Fallback: check button state for backward compatibility
        await page.waitForTimeout(100);
        const playButton = page.locator('[data-testid="play-button"]');
        const dataPlaying = await playButton.getAttribute('data-playing');

        if (dataPlaying === 'false') {
          console.info(
            '[AutoPlayHelpers] Auto-play stop verified via button state'
          );
          return true;
        }

        console.warn(
          '[AutoPlayHelpers] Auto-play stop verification failed on both engine and button state'
        );
        // Return false to indicate verification failure - this is critical for test reliability
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AutoPlayHelpers] Stop auto-play failed:', error);
      return false;
    }
  }

  /**
   * Toggle auto-play state
   */
  static async toggleAutoPlay(
    page: Page,
    options?: {
      verifyToggle?: boolean;
      timeoutMs?: number;
    }
  ): Promise<boolean> {
    const currentState = await StateSynchronizer.getEngineState(page);
    if (!currentState) return false;

    if (currentState.isPlaying) {
      return this.stopAutoPlay(page, options);
    } else {
      return this.startAutoPlay(page, options);
    }
  }

  /**
   * Start auto-play via API with enhanced validation
   * Follows SOLID principle: Single Responsibility (validates prerequisites)
   */
  private static async startViaAPI(page: Page): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;

          // Validate engine exists and is initialized
          if (!engine) {
            console.warn('[startViaAPI] Engine not found');
            return false;
          }

          // Check if engine is ready for auto-play (DRY principle - reuse validation logic)
          if (
            typeof engine.isInitialized === 'function' &&
            !engine.isInitialized()
          ) {
            console.warn('[startViaAPI] Engine not initialized');
            return false;
          }

          // Validate essential methods exist before attempting to call them
          const hasPlayMethod = typeof engine.play === 'function';
          const hasToggleMethod = typeof engine.togglePlayPause === 'function';

          if (!hasPlayMethod && !hasToggleMethod) {
            console.warn('[startViaAPI] No play methods available on engine');
            return false;
          }

          // Check if already playing to avoid duplicate calls
          const isCurrentlyPlaying =
            typeof engine.isPlaying === 'function' ? engine.isPlaying() : false;

          if (isCurrentlyPlaying) {
            console.info('[startViaAPI] Engine already playing');
            return true;
          }

          // Try primary method first - SliderCore.play()
          if (hasPlayMethod) {
            try {
              engine.play();
              console.info('[startViaAPI] Successfully called engine.play()');
              return true;
            } catch (error) {
              console.warn('[startViaAPI] engine.play() failed:', error);
            }
          }

          // Fallback to toggle method if not already playing
          if (hasToggleMethod && !isCurrentlyPlaying) {
            try {
              engine.togglePlayPause();
              console.info(
                '[startViaAPI] Successfully called engine.togglePlayPause()'
              );
              return true;
            } catch (error) {
              console.warn(
                '[startViaAPI] engine.togglePlayPause() failed:',
                error
              );
            }
          }

          return false;
        });
      },
      false
    );
    return result || false;
  }

  /**
   * Stop auto-play via API
   */
  private static async stopViaAPI(page: Page): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;
          if (!engine) {
            return false;
          }

          // Check if already paused to avoid duplicate calls
          const isCurrentlyPlaying =
            typeof engine.isPlaying === 'function' ? engine.isPlaying() : true; // Assume playing if we can't check

          if (!isCurrentlyPlaying) {
            console.info('[stopViaAPI] Engine already paused');
            return true;
          }

          // Try pause method (SliderCore.pause())
          if (typeof engine.pause === 'function') {
            try {
              engine.pause();
              console.info('[stopViaAPI] Successfully called engine.pause()');
              return true;
            } catch (error) {
              console.warn('[stopViaAPI] engine.pause() failed:', error);
            }
          }

          // Fallback to toggle if currently playing
          if (
            typeof engine.togglePlayPause === 'function' &&
            isCurrentlyPlaying
          ) {
            try {
              engine.togglePlayPause();
              console.info(
                '[stopViaAPI] Successfully called engine.togglePlayPause()'
              );
              return true;
            } catch (error) {
              console.warn(
                '[stopViaAPI] engine.togglePlayPause() failed:',
                error
              );
            }
          }

          return false;
        });
      },
      false
    );
    return result || false;
  }

  /**
   * Start auto-play via button click
   */
  private static async startViaButton(page: Page): Promise<boolean> {
    const browserName =
      page.context().browser()?.browserType?.()?.name() || 'chromium';
    const strategy = BrowserStrategyFactory.create(browserName);

    // Try browser-specific strategy first
    const browserResult = await strategy.startAutoPlay(page);
    if (browserResult) return true;

    // Fallback to generic button search
    for (const selector of this.PLAY_BUTTON_SELECTORS) {
      const clicked = await E2EErrorHandler.safeClick(page, selector, {
        timeout: 1000,
      });
      if (clicked) {
        // Give it a moment to register
        await page.waitForTimeout(100);
        return true;
      }
    }

    return false;
  }

  /**
   * Stop auto-play via button click
   */
  private static async stopViaButton(page: Page): Promise<boolean> {
    // Same button typically toggles play/pause
    return this.startViaButton(page);
  }

  /**
   * Set auto-play interval
   */
  static async setAutoPlayInterval(
    page: Page,
    intervalMs: number
  ): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate((interval) => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;
          if (!engine) {
            return false;
          }

          // SliderCore uses updateConfig to change auto-play interval
          if (typeof engine.updateConfig === 'function') {
            try {
              engine.updateConfig({ autoPlayInterval: interval });
              console.info(
                `[setAutoPlayInterval] Successfully set interval to ${interval}ms`
              );
              return true;
            } catch (error) {
              console.warn(
                '[setAutoPlayInterval] engine.updateConfig() failed:',
                error
              );
            }
          }

          // Fallback - try direct config access (less reliable)
          if (engine.config && typeof engine.config === 'object') {
            try {
              (engine.config as any).autoPlayInterval = interval;
              console.info(
                `[setAutoPlayInterval] Set interval via config to ${interval}ms`
              );
              return true;
            } catch (error) {
              console.warn(
                '[setAutoPlayInterval] Direct config access failed:',
                error
              );
            }
          }

          return false;
        }, intervalMs);
      },
      false
    );
    return result || false;
  }

  /**
   * Wait for auto-play to complete a full cycle
   * Enhanced cycle detection that's more robust against timing issues
   */
  static async waitForAutoPlayCycle(
    page: Page,
    options?: {
      expectedCycles?: number;
      timeoutMs?: number;
    }
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const expectedCycles = options?.expectedCycles || 1;
    const timeout = options?.timeoutMs || config.navigation * 10;

    try {
      const initialState = await StateSynchronizer.getEngineState(page);
      if (!initialState || !initialState.isPlaying) return false;

      const startIndex = initialState.currentIndex;
      const totalSlides = initialState.totalSlides;
      let cyclesCompleted = 0;
      let hasSeenLastSlide = false;
      let hasSeenFirstSlide = startIndex === 0; // Track if we started at first slide

      const startTime = Date.now();

      console.info(
        `[AutoPlayHelpers] Starting cycle detection from index ${startIndex} of ${totalSlides} slides`
      );

      while (Date.now() - startTime < timeout) {
        // Use shorter polling interval for better detection accuracy
        await page.waitForTimeout(config.shortPause);

        const currentState = await StateSynchronizer.getEngineState(page);
        if (!currentState || !currentState.isPlaying) {
          console.warn(
            '[AutoPlayHelpers] Auto-play stopped or state unavailable during cycle wait'
          );
          return false;
        }

        const currentIndex = currentState.currentIndex;

        // Track when we've seen the last slide
        if (currentIndex === totalSlides - 1) {
          if (!hasSeenLastSlide) {
            console.info(
              `[AutoPlayHelpers] Reached last slide (${currentIndex})`
            );
          }
          hasSeenLastSlide = true;
        }

        // Detect cycle completion: we've seen the last slide and now we're at first slide
        if (hasSeenLastSlide && currentIndex === 0) {
          if (!hasSeenFirstSlide) {
            cyclesCompleted++;
            hasSeenFirstSlide = true;
            console.info(
              `[AutoPlayHelpers] Cycle ${cyclesCompleted} completed (looped back to first slide)`
            );

            if (cyclesCompleted >= expectedCycles) {
              console.info(
                `[AutoPlayHelpers] All ${expectedCycles} cycles completed successfully`
              );
              return true;
            }

            // Reset for next cycle
            hasSeenLastSlide = false;
          }
        } else if (currentIndex !== 0) {
          // Reset first slide flag when we move away from first slide
          hasSeenFirstSlide = false;
        }
      }

      console.warn(
        `[AutoPlayHelpers] Timeout waiting for ${expectedCycles} cycles (completed: ${cyclesCompleted})`
      );
      return false;
    } catch (error) {
      console.error('[AutoPlayHelpers] Cycle wait failed:', error);
      return false;
    }
  }

  /**
   * Simulate auto-play interruption and recovery
   */
  static async simulateAutoPlayInterruption(
    page: Page,
    interruptionType: 'blur' | 'visibility' | 'pause'
  ): Promise<boolean> {
    try {
      switch (interruptionType) {
        case 'blur':
          await page.evaluate(() => {
            window.dispatchEvent(new Event('blur'));
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => {
            window.dispatchEvent(new Event('focus'));
          });
          break;

        case 'visibility':
          await page.evaluate(() => {
            Object.defineProperty(document, 'hidden', {
              value: true,
              writable: true,
            });
            document.dispatchEvent(new Event('visibilitychange'));
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => {
            Object.defineProperty(document, 'hidden', {
              value: false,
              writable: true,
            });
            document.dispatchEvent(new Event('visibilitychange'));
          });
          break;

        case 'pause':
          await this.stopAutoPlay(page);
          await page.waitForTimeout(500);
          await this.startAutoPlay(page);
          break;
      }

      return true;
    } catch (error) {
      console.error('[AutoPlayHelpers] Interruption simulation failed:', error);
      return false;
    }
  }
}
