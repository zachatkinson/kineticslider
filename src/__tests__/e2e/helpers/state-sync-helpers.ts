/**
 * State synchronization helpers for E2E tests
 * Ensures proper state transitions and synchronization
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Page } from '@playwright/test';
import { E2EErrorHandler } from './error-handler';
import { getTimeoutConfig } from './timeout-config';
import type { SliderEngine } from './types';

export interface EngineState {
  currentIndex: number;
  totalSlides: number;
  isPlaying: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  loopEnabled?: boolean;
  loopMode?: string;
}

export class StateSynchronizer {
  /**
   * Wait for engine to be fully initialized
   */
  static async waitForEngineInitialization(
    page: Page,
    timeoutMs?: number
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = timeoutMs || config.stateSync;

    return E2EErrorHandler.waitForCondition(
      page,
      async () => {
        const state = await this.getEngineState(page);
        return state?.isInitialized === true;
      },
      timeout
    );
  }

  /**
   * Wait for specific engine state condition
   */
  static async waitForEngineState(
    page: Page,
    predicate: (state: EngineState) => boolean,
    timeoutMs?: number
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = timeoutMs || config.stateSync;

    return E2EErrorHandler.waitForCondition(
      page,
      async () => {
        const state = await this.getEngineState(page);
        return state ? predicate(state) : false;
      },
      timeout
    );
  }

  /**
   * Get current engine state safely
   */
  static async getEngineState(page: Page): Promise<EngineState | null> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;

          if (!engine) {
            return null;
          }

          return {
            currentIndex: engine.getCurrentIndex?.() || 0,
            totalSlides: engine.getTotalSlides?.() || 0,
            isPlaying: engine.isPlaying?.() || false,
            isLoading: engine.isLoading?.() || false,
            isInitialized: engine.isInitialized?.() || false,
            loopEnabled: engine.loopManager?.isEnabled?.() || false,
            loopMode: engine.loopManager?.getMode?.() || 'none',
          };
        });
      },
      null
    );
    return result || null;
  }

  /**
   * Wait for slide transition to complete
   */
  static async waitForSlideTransition(
    page: Page,
    targetIndex: number,
    timeoutMs?: number
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = timeoutMs || config.navigation;

    return this.waitForEngineState(
      page,
      (state) => state.currentIndex === targetIndex && !state.isLoading,
      timeout
    );
  }

  /**
   * Wait for auto-play to start
   */
  static async waitForAutoPlayStart(
    page: Page,
    timeoutMs?: number
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = timeoutMs || config.verification;

    // First wait for playing state
    const isPlaying = await this.waitForEngineState(
      page,
      (state) => state.isPlaying === true,
      timeout
    );

    if (!isPlaying) return false;

    // Then verify slide progression
    const initialState = await this.getEngineState(page);
    if (!initialState) return false;

    await page.waitForTimeout(config.mediumPause);

    const finalState = await this.getEngineState(page);
    if (!finalState) return false;

    // Check if slide has progressed or looped
    return (
      finalState.currentIndex !== initialState.currentIndex ||
      (initialState.currentIndex === initialState.totalSlides - 1 &&
        finalState.currentIndex === 0)
    );
  }

  /**
   * Wait for auto-play to stop
   */
  static async waitForAutoPlayStop(
    page: Page,
    timeoutMs?: number
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = timeoutMs || config.verification;

    return this.waitForEngineState(
      page,
      (state) => state.isPlaying === false,
      timeout
    );
  }

  /**
   * Wait for loop manager configuration
   */
  static async waitForLoopConfiguration(
    page: Page,
    enabled: boolean,
    mode?: string,
    timeoutMs?: number
  ): Promise<boolean> {
    const config = getTimeoutConfig();
    const timeout = timeoutMs || config.stateSync;

    return this.waitForEngineState(
      page,
      (state) => {
        const loopMatch = state.loopEnabled === enabled;
        const modeMatch = mode ? state.loopMode === mode : true;
        return loopMatch && modeMatch;
      },
      timeout
    );
  }

  /**
   * Synchronize state after configuration change
   */
  static async syncAfterConfigChange(
    page: Page,
    operation: () => Promise<void>,
    expectedState?: Partial<EngineState>
  ): Promise<boolean> {
    try {
      // Perform the operation
      await operation();

      // Wait a moment for state to propagate
      const config = getTimeoutConfig();
      await page.waitForTimeout(config.shortPause);

      // If expected state provided, wait for it
      if (expectedState) {
        return await this.waitForEngineState(page, (state) => {
          for (const [key, value] of Object.entries(expectedState)) {
            if ((state as any)[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }

      return true;
    } catch (error) {
      console.error('[StateSynchronizer] Config change failed:', error);
      return false;
    }
  }

  /**
   * Wait for stable slide index (no transitions)
   */
  static async waitForStableSlideIndex(
    page: Page,
    maxAttempts: number = 3,
    delayMs?: number
  ): Promise<number | null> {
    const config = getTimeoutConfig();
    const delay = delayMs || config.shortPause;

    let stableIndex: number | null = null;
    let previousIndex: number | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      const state = await this.getEngineState(page);

      if (!state) return null;

      const currentIndex = state.currentIndex;

      if (previousIndex === null) {
        previousIndex = currentIndex;
      } else if (previousIndex === currentIndex) {
        // Index is stable
        stableIndex = currentIndex;
        break;
      } else {
        // Index changed, reset
        previousIndex = currentIndex;
      }

      if (i < maxAttempts - 1) {
        await page.waitForTimeout(delay);
      }
    }

    return stableIndex;
  }
}
