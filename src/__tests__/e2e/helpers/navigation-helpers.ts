/**
 * Navigation helpers for E2E tests
 * Provides consistent navigation functionality across all tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Page } from '@playwright/test';
import { E2EErrorHandler } from './error-handler';
import { StateSynchronizer } from './state-sync-helpers';
import { getTimeoutConfig } from './timeout-config';
import { BrowserStrategyFactory } from './browser-strategies';
import type { SliderEngine } from './types';

export class NavigationHelpers {
  /**
   * Navigate to a specific slide and wait for transition
   */
  static async navigateToSlide(
    page: Page,
    targetIndex: number,
    options?: {
      method?: 'keyboard' | 'button' | 'api';
      waitForTransition?: boolean;
      timeoutMs?: number;
    }
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const method = options?.method || 'keyboard';
    const waitForTransition = options?.waitForTransition !== false;
    const timeout = options?.timeoutMs || config.navigation;

    try {
      // Get current state
      const currentState = await StateSynchronizer.getEngineState(page);
      if (!currentState) return false;

      // Already at target
      if (currentState.currentIndex === targetIndex) {
        return true;
      }

      // Navigate based on method
      let navigationSuccess = false;

      switch (method) {
        case 'keyboard':
          navigationSuccess = await this.navigateViaKeyboard(page, targetIndex);
          break;
        case 'button':
          navigationSuccess = await this.navigateViaButton(page, targetIndex);
          break;
        case 'api':
          navigationSuccess = await this.navigateViaAPI(page, targetIndex);
          break;
      }

      if (!navigationSuccess) return false;

      // Wait for transition if requested
      if (waitForTransition) {
        return await StateSynchronizer.waitForSlideTransition(
          page,
          targetIndex,
          timeout
        );
      }

      return true;
    } catch (error) {
      console.error('[NavigationHelpers] Navigation failed:', error);
      return false;
    }
  }

  /**
   * Navigate using keyboard shortcuts
   */
  private static async navigateViaKeyboard(
    page: Page,
    targetIndex: number
  ): Promise<boolean> {
    const browserName =
      page.context().browser()?.browserType?.()?.name() || 'chromium';
    const strategy = BrowserStrategyFactory.create(browserName);

    return await strategy.navigateToSlide(page, targetIndex);
  }

  /**
   * Navigate using navigation buttons
   */
  private static async navigateViaButton(
    page: Page,
    targetIndex: number
  ): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        // Try slide indicator button
        const indicatorButton = page.locator(
          `[data-slide-index="${targetIndex}"]`
        );
        if (await indicatorButton.isVisible({ timeout: 1000 })) {
          await indicatorButton.click();
          return true;
        }

        // Try numbered button
        const numberedButton = page.locator(
          `button:has-text("${targetIndex + 1}")`
        );
        if (await numberedButton.isVisible({ timeout: 1000 })) {
          await numberedButton.click();
          return true;
        }

        return false;
      },
      false
    );
    return result || false;
  }

  /**
   * Navigate using slider API
   */
  private static async navigateViaAPI(
    page: Page,
    targetIndex: number
  ): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate((index) => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;
          if (engine?.goToSlide) {
            engine.goToSlide(index);
            return true;
          }
          return false;
        }, targetIndex);
      },
      false
    );
    return result || false;
  }

  /**
   * Navigate to next slide
   */
  static async navigateNext(
    page: Page,
    options?: {
      waitForTransition?: boolean;
      method?: 'keyboard' | 'button' | 'api';
    }
  ): Promise<boolean> {
    const state = await StateSynchronizer.getEngineState(page);
    if (!state) return false;

    const nextIndex = (state.currentIndex + 1) % state.totalSlides;
    return this.navigateToSlide(page, nextIndex, {
      waitForTransition: options?.waitForTransition,
      method: options?.method,
    });
  }

  /**
   * Navigate to previous slide
   */
  static async navigatePrevious(
    page: Page,
    options?: {
      waitForTransition?: boolean;
      method?: 'keyboard' | 'button' | 'api';
    }
  ): Promise<boolean> {
    const state = await StateSynchronizer.getEngineState(page);
    if (!state) return false;

    const prevIndex =
      state.currentIndex > 0 ? state.currentIndex - 1 : state.totalSlides - 1;

    return this.navigateToSlide(page, prevIndex, {
      waitForTransition: options?.waitForTransition,
      method: options?.method,
    });
  }

  /**
   * Navigate to first slide
   */
  static async navigateToFirst(
    page: Page,
    options?: {
      waitForTransition?: boolean;
      method?: 'keyboard' | 'button' | 'api';
    }
  ): Promise<boolean> {
    return this.navigateToSlide(page, 0, {
      waitForTransition: options?.waitForTransition,
      method: options?.method,
    });
  }

  /**
   * Navigate to last slide
   */
  static async navigateToLast(
    page: Page,
    options?: {
      waitForTransition?: boolean;
      method?: 'keyboard' | 'button' | 'api';
    }
  ): Promise<boolean> {
    const state = await StateSynchronizer.getEngineState(page);
    if (!state || state.totalSlides === 0) return false;

    return this.navigateToSlide(page, state.totalSlides - 1, {
      waitForTransition: options?.waitForTransition,
      method: options?.method,
    });
  }

  /**
   * Navigate and wait for complete page load
   * Compatible with original navigateAndWait behavior - uses baseURL from playwright config
   */
  static async navigateAndWait(
    page: Page,
    path: string = '/',
    options?: {
      waitForSlider?: boolean;
      expectedTitle?: string;
      timeoutMs?: number;
    }
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = options?.timeoutMs || config.navigation;

    try {
      // Navigate to path (uses baseURL from playwright config)
      await page.goto(path, {
        waitUntil: 'domcontentloaded',
        timeout,
      });

      // Check title if provided
      if (options?.expectedTitle) {
        await page.waitForFunction(
          (title) => document.title.includes(title),
          options.expectedTitle,
          { timeout: config.verification }
        );
      }

      // Wait for slider if requested
      if (options?.waitForSlider !== false) {
        // Wait for slider element
        await page.waitForSelector('[data-testid="kinetic-slider"]', {
          state: 'visible',
          timeout: config.selector,
        });

        // Wait for engine initialization
        await StateSynchronizer.waitForEngineInitialization(
          page,
          config.stateSync
        );
      }

      return true;
    } catch (error) {
      console.error('[NavigationHelpers] Page navigation failed:', error);
      return false;
    }
  }

  /**
   * Perform rapid navigation for stress testing
   */
  static async performRapidNavigation(
    page: Page,
    count: number,
    delayMs: number = 100
  ): Promise<boolean> {
    try {
      for (let i = 0; i < count; i++) {
        const success = await this.navigateNext(page, {
          waitForTransition: false,
        });
        if (!success) return false;

        await page.waitForTimeout(delayMs);
      }

      // Wait for final state to stabilize
      const finalIndex = await StateSynchronizer.waitForStableSlideIndex(page);
      return finalIndex !== null;
    } catch (error) {
      console.error('[NavigationHelpers] Rapid navigation failed:', error);
      return false;
    }
  }
}
