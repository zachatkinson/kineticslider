/**
 * Navigation utility helper functions
 *
 * Functions for handling slider navigation logic
 */

/**
 * Calculate next slide index with infinite loop support
 *
 * @param currentIndex - Current slide index
 *
 * @param totalSlides - Total number of slides
 *
 * @param infiniteLoop - Whether infinite loop is enabled
 *
 * @returns Next slide index or current index if at end without infinite loop
 *
 */
export function calculateNextIndex(
  currentIndex: number,
  totalSlides: number,
  infiniteLoop: boolean,
): number {
  if (currentIndex >= totalSlides - 1) {
    return infiniteLoop ? 0 : currentIndex;
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
 * @returns Previous slide index or current index if at beginning without infinite loop
 *
 */
export function calculatePreviousIndex(
  currentIndex: number,
  totalSlides: number,
  infiniteLoop: boolean,
): number {
  if (currentIndex <= 0) {
    return infiniteLoop ? totalSlides - 1 : currentIndex;
  }
  return currentIndex - 1;
}

/**
 * Validate slide index is within bounds
 *
 * @param index - The slide index to validate
 *
 * @param totalSlides - Total number of slides
 *
 * @returns Clamped index within valid range
 *
 */
export function validateSlideIndex(
  index: number,
  totalSlides: number,
): number {
  return Math.max(0, Math.min(index, totalSlides - 1));
}

/**
 * Check if navigation is possible in a given direction
 *
 * @param currentIndex - Current slide index
 *
 * @param totalSlides - Total number of slides
 *
 * @param direction - Navigation direction
 *
 * @param infiniteLoop - Whether infinite loop is enabled
 *
 * @returns Whether navigation is possible
 *
 */
export function canNavigate(
  currentIndex: number,
  totalSlides: number,
  direction: "next" | "previous",
  infiniteLoop: boolean,
): boolean {
  if (infiniteLoop) return true;
  
  if (direction === "next") {
    return currentIndex < totalSlides - 1;
  } else {
    return currentIndex > 0;
  }
}

/**
 * Generate live region announcement for navigation
 *
 * @param newIndex - The new slide index (0-based)
 *
 * @param totalSlides - Total number of slides
 *
 * @param direction - Navigation direction
 *
 * @returns Accessibility announcement string
 *
 */
export function generateNavigationAnnouncement(
  newIndex: number,
  totalSlides: number,
  direction?: "next" | "previous" | "first" | "last",
): string {
  const slideNumber = newIndex + 1;
  
  switch (direction) {
    case "first":
      return "Moving to first slide";
    case "last":
      return "Moving to last slide";
    default:
      return `Moving to slide ${slideNumber} of ${totalSlides}`;
  }
} 