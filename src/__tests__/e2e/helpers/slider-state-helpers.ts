/**
 * Slider state helpers for E2E tests
 * Consolidates all slider state query functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Page } from '@playwright/test';
import { E2EErrorHandler } from './error-handler';
import type { SliderEngine } from './types';

export interface SliderState {
  currentIndex: number;
  totalSlides: number;
  isPlaying: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export class SliderStateHelpers {
  /**
   * Get complete slider state
   */
  static async getSliderState(page: Page): Promise<SliderState | null> {
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
          };
        });
      },
      null
    );
    return result || null;
  }

  /**
   * Get current slide index
   */
  static async getCurrentSlideIndex(page: Page): Promise<number | null> {
    const state = await this.getSliderState(page);
    return state?.currentIndex ?? null;
  }

  /**
   * Get total number of slides
   */
  static async getTotalSlides(page: Page): Promise<number | null> {
    const state = await this.getSliderState(page);
    return state?.totalSlides ?? null;
  }

  /**
   * Check if auto-play is active
   */
  static async isPlaying(page: Page): Promise<boolean> {
    const state = await this.getSliderState(page);
    return state?.isPlaying || false;
  }

  /**
   * Check if slider is loading
   */
  static async isLoading(page: Page): Promise<boolean> {
    const state = await this.getSliderState(page);
    return state?.isLoading || false;
  }

  /**
   * Check if slider is initialized
   */
  static async isInitialized(page: Page): Promise<boolean> {
    const state = await this.getSliderState(page);
    return state?.isInitialized || false;
  }

  /**
   * Wait for slider to be ready
   */
  static async waitForSliderReady(
    page: Page,
    timeoutMs: number = 5000
  ): Promise<boolean> {
    return E2EErrorHandler.waitForCondition(
      page,
      async () => {
        const state = await this.getSliderState(page);
        return state?.isInitialized === true && state?.isLoading === false;
      },
      timeoutMs
    );
  }

  /**
   * Get slider engine directly (for advanced operations)
   */
  static async getSliderEngine(page: Page): Promise<any> {
    return E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          return window.kineticSlider?.engine;
        });
      },
      null
    );
  }

  /**
   * Check if slider has specific capability
   */
  static async hasCapability(page: Page, capability: string): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate((cap) => {
          const engine = (window as any).kineticSlider?.engine;
          return typeof engine?.[cap] === 'function';
        }, capability);
      },
      false
    );
    return result || false;
  }

  /**
   * Get slider configuration
   */
  static async getSliderConfig(
    page: Page
  ): Promise<Record<string, unknown> | null> {
    return E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          const engine = (window as any).kineticSlider?.engine;
          return engine?.config || engine?.getConfig?.() || null;
        });
      },
      null
    );
  }

  /**
   * Update slider configuration
   */
  static async updateSliderConfig(
    page: Page,
    config: Record<string, any>
  ): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate((newConfig) => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;

          if (engine?.updateConfig) {
            engine.updateConfig(newConfig);
            return true;
          }

          if (engine?.config) {
            Object.assign(engine.config, newConfig);
            return true;
          }

          return false;
        }, config);
      },
      false
    );
    return result || false;
  }

  /**
   * Get loop manager state
   */
  static async getLoopState(page: Page): Promise<{
    enabled: boolean;
    mode: string;
  } | null> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate(() => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;
          const loopManager = engine?.loopManager;

          if (!loopManager) return null;

          return {
            enabled: loopManager.isEnabled?.() || false,
            mode: loopManager.getMode?.() || 'none',
          };
        });
      },
      null
    );
    return result || null;
  }

  /**
   * Update loop manager configuration
   */
  static async updateLoopConfig(
    page: Page,
    config: { enabled?: boolean; mode?: string }
  ): Promise<boolean> {
    const result = await E2EErrorHandler.withContextProtection(
      page,
      async () => {
        return await page.evaluate((loopConfig) => {
          const engine = (window as any).kineticSlider?.engine as SliderEngine;
          const loopManager = engine?.loopManager;

          if (!loopManager?.updateConfig) return false;

          loopManager.updateConfig(loopConfig);
          return true;
        }, config);
      },
      false
    );
    return result || false;
  }
}
