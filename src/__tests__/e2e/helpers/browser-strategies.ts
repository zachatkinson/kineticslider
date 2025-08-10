/**
 * Browser-specific strategy pattern for E2E tests
 * Handles browser-specific behaviors and workarounds
 */

import { Page } from '@playwright/test';
import { TimeoutConfig, getTimeoutConfig } from './timeout-config';

export abstract class BrowserStrategy {
  protected browserName: string;
  protected timeoutConfig: TimeoutConfig;

  constructor(browserName: string) {
    this.browserName = browserName;
    this.timeoutConfig = getTimeoutConfig(browserName);
  }

  /**
   * Get browser-specific timeout configuration
   */
  getTimeouts(): TimeoutConfig {
    return this.timeoutConfig;
  }

  /**
   * Handle browser-specific context closure scenarios
   */
  abstract handleContextClosure(page: Page): Promise<boolean>;

  /**
   * Browser-specific auto-play start strategy
   */
  abstract startAutoPlay(page: Page): Promise<boolean>;

  /**
   * Browser-specific navigation strategy
   */
  abstract navigateToSlide(page: Page, index: number): Promise<boolean>;

  /**
   * Check if browser supports specific feature
   */
  abstract supportsFeature(feature: string): boolean;
}

export class ChromiumStrategy extends BrowserStrategy {
  constructor() {
    super('chromium');
  }

  async handleContextClosure(page: Page): Promise<boolean> {
    if (page.isClosed()) return false;

    try {
      // Chromium-specific recovery attempt
      await page.waitForTimeout(100);
      return !page.isClosed();
    } catch {
      return false;
    }
  }

  async startAutoPlay(page: Page): Promise<boolean> {
    const selectors = [
      '#play-pause-btn',
      '[data-testid="play-button"]',
      '[aria-label*="play" i]',
      'button:has-text("Play")',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  async navigateToSlide(page: Page, index: number): Promise<boolean> {
    try {
      await page.keyboard.press(`Digit${index + 1}`);
      return true;
    } catch {
      return false;
    }
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['webgl', 'workers', 'offscreencanvas'];
    return supportedFeatures.includes(feature.toLowerCase());
  }
}

export class WebkitStrategy extends BrowserStrategy {
  constructor() {
    super('webkit');
  }

  async handleContextClosure(page: Page): Promise<boolean> {
    if (page.isClosed()) return false;

    try {
      // Webkit needs longer recovery time
      await page.waitForTimeout(200);

      // Verify page is still accessible
      await page.evaluate(() => true);
      return true;
    } catch {
      return false;
    }
  }

  async startAutoPlay(page: Page): Promise<boolean> {
    // Webkit may need different approach for button interaction
    try {
      const result = await page.evaluate(() => {
        const button = document.querySelector(
          '#play-pause-btn'
        ) as HTMLButtonElement;
        if (button) {
          button.click();
          return true;
        }
        return false;
      });

      if (result) return true;

      // Fallback to standard approach
      return await new ChromiumStrategy().startAutoPlay(page);
    } catch {
      return false;
    }
  }

  async navigateToSlide(page: Page, index: number): Promise<boolean> {
    try {
      // Webkit sometimes needs focus before keyboard events
      await page.locator('[data-testid="kinetic-slider"]').focus();
      await page.keyboard.press(`Digit${index + 1}`);
      return true;
    } catch {
      return false;
    }
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['webgl', 'workers'];
    // Webkit has limited offscreencanvas support
    return supportedFeatures.includes(feature.toLowerCase());
  }
}

export class FirefoxStrategy extends BrowserStrategy {
  constructor() {
    super('firefox');
  }

  async handleContextClosure(page: Page): Promise<boolean> {
    if (page.isClosed()) return false;

    try {
      // Firefox needs specific handling for context recovery
      await page.waitForTimeout(150);

      // Check if page context is still valid
      const isValid = await page.evaluate(() => {
        return typeof window !== 'undefined';
      });

      return isValid;
    } catch {
      return false;
    }
  }

  async startAutoPlay(page: Page): Promise<boolean> {
    // Firefox may need force click for certain elements
    try {
      await page.locator('#play-pause-btn').click({ force: true });
      return true;
    } catch {
      // Fallback to evaluate
      return await page.evaluate(() => {
        const button = document.querySelector(
          '#play-pause-btn'
        ) as HTMLButtonElement;
        if (button) {
          const event = new MouseEvent('click', { bubbles: true });
          button.dispatchEvent(event);
          return true;
        }
        return false;
      });
    }
  }

  async navigateToSlide(page: Page, index: number): Promise<boolean> {
    try {
      // Firefox keyboard events are reliable
      await page.keyboard.press(`Digit${index + 1}`);
      return true;
    } catch {
      return false;
    }
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['webgl', 'workers', 'offscreencanvas'];
    return supportedFeatures.includes(feature.toLowerCase());
  }
}

export class MobileChromeStrategy extends BrowserStrategy {
  constructor() {
    super('Mobile Chrome');
  }

  async handleContextClosure(page: Page): Promise<boolean> {
    if (page.isClosed()) return false;

    try {
      // Mobile browsers need longer recovery
      await page.waitForTimeout(300);

      // Mobile context is more fragile
      const isValid = await page.evaluate(() => {
        return document.readyState === 'complete';
      });

      return isValid;
    } catch {
      return false;
    }
  }

  async startAutoPlay(page: Page): Promise<boolean> {
    // Mobile needs tap events
    try {
      const button = page.locator('#play-pause-btn');
      await button.tap();
      return true;
    } catch {
      // Fallback to touch simulation
      return await page.evaluate(() => {
        const button = document.querySelector(
          '#play-pause-btn'
        ) as HTMLButtonElement;
        if (button) {
          const touch = new TouchEvent('touchstart', { bubbles: true });
          button.dispatchEvent(touch);
          button.click();
          return true;
        }
        return false;
      });
    }
  }

  async navigateToSlide(page: Page, index: number): Promise<boolean> {
    // Mobile doesn't have keyboard, use touch gestures or buttons
    try {
      const navButton = page.locator(`[data-slide-index="${index}"]`);
      if (await navButton.isVisible({ timeout: 1000 })) {
        await navButton.tap();
        return true;
      }

      // Fallback to swipe gestures
      return false;
    } catch {
      return false;
    }
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['webgl', 'workers'];
    // Mobile has limited capabilities
    return supportedFeatures.includes(feature.toLowerCase());
  }
}

/**
 * Factory to create appropriate browser strategy
 */
export class BrowserStrategyFactory {
  static create(browserName: string): BrowserStrategy {
    const normalizedName = browserName.toLowerCase();

    if (
      normalizedName.includes('webkit') ||
      normalizedName.includes('safari')
    ) {
      return new WebkitStrategy();
    }

    if (normalizedName.includes('firefox')) {
      return new FirefoxStrategy();
    }

    if (normalizedName.includes('mobile')) {
      return new MobileChromeStrategy();
    }

    // Default to Chromium
    return new ChromiumStrategy();
  }
}
