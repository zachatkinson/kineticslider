import { useEffect, useRef } from "react";
import type { UseSliderAccessibilityProps } from "../../types/accessibility";

/**
 * Hook to handle accessibility features for slider components
 *
 * @param root0 - The props object
 *
 * @param root0.totalSlides - Total number of slides
 *
 * @param root0.currentIndex - Current slide index
 *
 * @param root0.onNext - Function to go to next slide
 *
 * @param root0.onPrev - Function to go to previous slide
 *
 * @param root0.isAnimating - Whether the slider is currently animating
 *
 * @returns Accessibility utilities for the slider
 *
 */
export function useSliderAccessibility({
  totalSlides,
  currentIndex,
  onNext,
  onPrev,
  isAnimating,
}: UseSliderAccessibilityProps): { announceSlide: (message: string) => void } {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region for screen readers
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.style.position = "absolute";
    liveRegion.style.width = "1px";
    liveRegion.style.height = "1px";
    liveRegion.style.padding = "0";
    liveRegion.style.overflow = "hidden";
    liveRegion.style.clip = "rect(0, 0, 0, 0)";
    liveRegion.style.whiteSpace = "nowrap";
    liveRegion.style.border = "0";
    document.body.appendChild(liveRegion);

    liveRegionRef.current = liveRegion;

    return () => {
      document.body.removeChild(liveRegion);
    };
  }, []);

  // Update live region when slide changes
  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Showing slide ${currentIndex + 1} of ${totalSlides}`;
    }
  }, [currentIndex, totalSlides]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isAnimating) return;

      switch (e.key) {
        case "ArrowLeft":
          onPrev();
          break;
        case "ArrowRight":
          onNext();
          break;
        case "Home":
          // Navigate to first slide
          if (currentIndex !== 0) {
            onPrev();
          }
          break;
        case "End":
          // Navigate to last slide
          if (currentIndex !== totalSlides - 1) {
            onNext();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalSlides, onNext, onPrev, isAnimating]);

  return {
    announceSlide: (message: string): void => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    },
  };
}
