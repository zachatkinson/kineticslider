import * as React from "react";
import { useSlider } from "../../context/SliderContext";
import type { SliderAnimationHook } from "../../types/hooks";

/**
 * Custom hook for slider animation functionality
 *
 * @param containerRef
 *
 * @returns Animation control functions
 *
 */
export function useSliderAnimation(
  containerRef: React.RefObject<HTMLDivElement>,
): SliderAnimationHook {
  const { state, config: _config } = useSlider();

  const animateToSlide = React.useCallback(async (slideIndex: number): Promise<void> => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const track = container.querySelector(
      '[class*="sliderTrack"]',
    ) as HTMLElement;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const targetSlide = slides[slideIndex];
    if (!targetSlide) return;

    // Use default animation values if not provided in config
    const animation = {
      duration: 300, // Default duration
      easing: "ease-out", // Default easing
      delay: 0, // Default delay
    };

    return new Promise<void>((resolve) => {
      // Apply animation to target slide
      targetSlide.style.transition = `transform ${animation.duration}ms ${animation.easing} ${animation.delay}ms`;
      targetSlide.style.transform = "translateX(0)";

      // Apply animation to other slides
      slides.forEach((slide, index) => {
        if (index !== slideIndex) {
          slide.style.transition = `transform ${animation.duration}ms ${animation.easing} ${animation.delay}ms`;
          slide.style.transform = index < slideIndex ? "translateX(-100%)" : "translateX(100%)";
        }
      });

      // Reset animation state after transition
      const cleanup = (): void => {
        slides.forEach(slide => {
          slide.style.transition = "";
        });
        targetSlide.removeEventListener("transitionend", cleanup);
        resolve();
      };

      targetSlide.addEventListener("transitionend", cleanup);
    });
  }, [containerRef]);

  return { 
    animateToSlide,
    isAnimating: false, // This would need to be tracked properly in a real implementation
    currentSlide: state.currentIndex as number,
    duration: 300,
    easing: "ease-out"
  };
}
