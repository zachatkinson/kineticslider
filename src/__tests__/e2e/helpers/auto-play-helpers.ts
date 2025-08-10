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
   * Start auto-play with multiple strategies
   */
  static async startAutoPlay(
    page: Page,
    options?: {
      verifyStart?: boolean;
      timeoutMs?: number;
      method?: 'button' | 'api' | 'auto';
    }
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const verifyStart = options?.verifyStart !== false;
    const timeout = options?.timeoutMs || config.verification;
    const method = options?.method || 'auto';

    try {
      // Check if already playing
      const currentState = await StateSynchronizer.getEngineState(page);
      if (currentState?.isPlaying) {
        return true;
      }

      // Try specified method or auto-detect
      let started = false;

      if (method === 'api' || method === 'auto') {
        started = await this.startViaAPI(page);
      }

      if (!started && (method === 'button' || method === 'auto')) {
        started = await this.startViaButton(page);
      }

      if (!started) {
        console.warn('[AutoPlayHelpers] Failed to start auto-play');
        return false;
      }

      // Verify if requested
      if (verifyStart) {
        return await StateSynchronizer.waitForAutoPlayStart(page, timeout);
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
    const config = getTimeoutConfig();
    const verifyStop = options?.verifyStop !== false;
    const timeout = options?.timeoutMs || config.verification;
    const method = options?.method || 'auto';

    try {
      // Check if already stopped
      const currentState = await StateSynchronizer.getEngineState(page);
      if (!currentState?.isPlaying) {
        return true;
      }

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

      // Verify if requested
      if (verifyStop) {
        return await StateSynchronizer.waitForAutoPlayStop(page, timeout);
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
   * Start auto-play via API
   */
  private static async startViaAPI(page: Page): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;
          if (engine?.play) {
            engine.play();
            return true;
          }
          if (engine?.startAutoPlay) {
            engine.startAutoPlay();
            return true;
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
          if (engine?.pause) {
            engine.pause();
            return true;
          }
          if (engine?.stopAutoPlay) {
            engine.stopAutoPlay();
            return true;
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
          if (engine?.setAutoPlayInterval) {
            engine.setAutoPlayInterval(interval);
            return true;
          }
          if (engine?.config) {
            engine.config.autoPlayInterval = interval;
            return true;
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
      let lastIndex = startIndex;

      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        await page.waitForTimeout(config.mediumPause);

        const currentState = await StateSynchronizer.getEngineState(page);
        if (!currentState || !currentState.isPlaying) return false;

        const currentIndex = currentState.currentIndex;

        // Detect cycle completion
        if (lastIndex === totalSlides - 1 && currentIndex === 0) {
          cyclesCompleted++;
          if (cyclesCompleted >= expectedCycles) {
            return true;
          }
        }

        lastIndex = currentIndex;
      }

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
