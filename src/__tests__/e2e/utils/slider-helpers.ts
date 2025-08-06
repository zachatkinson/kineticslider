import { Page } from '@playwright/test';
import type { ISliderEngine } from '../../../core/types';

/**
 * Get current slider state information
 */
export async function getSliderState(page: Page): Promise<{
  currentIndex: number;
  totalSlides: number;
  isPlaying: boolean;
}> {
  return await page.evaluate(() => {
    const engine = window.kineticSlider?.engine as
      | ISliderEngine
      | undefined;
    return {
      currentIndex: engine?.getCurrentIndex?.() || 0,
      totalSlides: engine?.getTotalSlides?.() || 0,
      isPlaying: engine?.isPlaying?.() || false,
    };
  });
}

/**
 * Get just the current slide index
 */
export async function getCurrentSlideIndex(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const engine = window.kineticSlider?.engine as
      | ISliderEngine
      | undefined;
    return engine?.getCurrentIndex?.() || 0;
  });
}

/**
 * Get total number of slides
 */
export async function getTotalSlides(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const engine = window.kineticSlider?.engine as
      | ISliderEngine
      | undefined;
    return engine?.getTotalSlides?.() || 0;
  });
}

/**
 * Navigate to a specific slide index
 */
export async function goToSlide(page: Page, index: number): Promise<void> {
  await page.evaluate((targetIndex) => {
    const engine = window.kineticSlider?.engine as
      | ISliderEngine
      | undefined;
    return engine?.goToSlide?.(targetIndex);
  }, index);
}

/**
 * Navigate to the last slide
 */
export async function goToLastSlide(page: Page): Promise<void> {
  const totalSlides = await getTotalSlides(page);
  if (totalSlides > 0) {
    await goToSlide(page, totalSlides - 1);
  }
}

/**
 * Navigate to the first slide
 */
export async function goToFirstSlide(page: Page): Promise<void> {
  await goToSlide(page, 0);
}

/**
 * Wait for slide transition to complete and get stable index
 */
export async function waitForStableSlideIndex(
  page: Page,
  maxAttempts: number = 3,
  delayMs: number = 200
): Promise<number> {
  let stableIndex: number | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    const currentIndex = await getCurrentSlideIndex(page);

    if (stableIndex === null) {
      stableIndex = currentIndex;
    } else if (stableIndex !== currentIndex) {
      // Index still changing, wait more
      await page.waitForTimeout(delayMs);
      stableIndex = currentIndex;
    } else {
      // Index is stable
      break;
    }
  }

  return stableIndex || 0;
}
