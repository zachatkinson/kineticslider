/**
 * Slide utility helper functions
 *
 * Functions for managing slide rendering, preloading, and calculations
 */

import type { SliderGestureEvent } from "../types/hooks";

/**
 * Calculate if a slide should be preloaded based on lazy loading settings
 *
 * @param index - The slide index
 *
 * @param currentSlide - The current active slide index
 *
 * @param totalSlides - Total number of slides
 *
 * @param lazyLoad - Whether lazy loading is enabled
 *
 * @returns Whether the slide should be preloaded
 *
 */
export function shouldPreloadSlide(
  index: number,
  currentSlide: number,
  totalSlides: number,
  lazyLoad: boolean,
): boolean {
  if (!lazyLoad) return true;
  
  return (
    index === currentSlide ||
    index === (currentSlide + 1) % totalSlides ||
    index === (currentSlide - 1 + totalSlides) % totalSlides
  );
}

/**
 * Create a gesture event object for slider interactions
 *
 * @param type - The event type
 *
 * @param clientX - The X coordinate
 *
 * @param clientY - The Y coordinate
 *
 * @param startX - The starting X coordinate
 *
 * @param startY - The starting Y coordinate
 *
 * @param preventDefault - Optional preventDefault function
 *
 * @returns A formatted SliderGestureEvent
 *
 */
export function createSliderGestureEvent(
  type: string,
  clientX: number,
  clientY: number,
  startX: number,
  startY: number,
  preventDefault?: () => void,
): SliderGestureEvent {
  return {
    type,
    clientX,
    clientY,
    startX,
    startY,
    preventDefault,
  };
}

/**
 * Calculate slide transform based on index and current slide
 *
 * @param index - The slide index
 *
 * @param currentSlide - The current active slide index
 *
 * @returns The transform percentage
 *
 */
export function calculateSlideTransform(
  index: number,
  currentSlide: number,
): number {
  return (index - currentSlide) * 100;
}

/**
 * Generate slide aria label
 *
 * @param index - The slide index (0-based)
 *
 * @param totalSlides - Total number of slides
 *
 * @param title - Optional slide title
 *
 * @returns The aria label string
 *
 */
export function generateSlideAriaLabel(
  index: number,
  totalSlides: number,
  title?: string,
): string {
  const slideNumber = index + 1;
  const baseLabel = `Slide ${slideNumber} of ${totalSlides}`;
  return title ? `${baseLabel}: ${title}` : baseLabel;
}

/**
 * Calculate next slide index with infinite loop support
 *
 * @param currentIndex - Current slide index
 *
 * @param totalSlides - Total number of slides
 *
 * @param infiniteLoop - Whether infinite loop is enabled
 *
 * @returns Next slide index or null if at end without infinite loop
 *
 */
export function calculateNextSlideIndex(
  currentIndex: number,
  totalSlides: number,
  infiniteLoop: boolean,
): number | null {
  if (currentIndex >= totalSlides - 1) {
    return infiniteLoop ? 0 : null;
  }
  return currentIndex + 1;
}

/**
 * Calculate previous slide index with infinite loop support
 *
 * @param currentIndex - Current slide index
 *
 * @param totalSlides - Total number of slides
 *
 * @param infiniteLoop - Whether infinite loop is enabled
 *
 * @returns Previous slide index or null if at beginning without infinite loop
 *
 */
export function calculatePreviousSlideIndex(
  currentIndex: number,
  totalSlides: number,
  infiniteLoop: boolean,
): number | null {
  if (currentIndex <= 0) {
    return infiniteLoop ? totalSlides - 1 : null;
  }
  return currentIndex - 1;
} 