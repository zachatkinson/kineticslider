import React, { useState, useCallback } from "react";
import type { KineticSliderHookProps, KineticSliderHookResult } from "../../types/hooks";
import { useErrorTracking } from "./useErrorTracking";
import { createBrandedNumber } from "../../types/branded";

/**
 * A hook for creating touch and draggable slider functionality with momentum effects
 *
 * This hook provides a complete API for implementing kinetic sliders with touch
 * and mouse gesture support. It includes options for customizing animation
 * behavior, custom gestures, and handling transitions between slides.
 *
 * @example
 * ```tsx
 * import { useKineticSlider } from 'hooks/slider/useKineticSlider';
 *
 * const MySlider = () => {
 *   const slides = ['Slide 1', 'Slide 2', 'Slide 3'];
 *   const {
 *     sliderRef,
 *     currentSlide,
 *     next,
 *     prev,
 *     metrics
 *   } = useKineticSlider({
 *     slides,
 *     duration: 0.8,
 *     ease: 'power3.out',
 *     infiniteLoop: true,
 *     onSlideChange: (index) => console.log(`Slide changed to ${index}`)
 *   });
 *
 *   return (
 *     <div>
 *       <div ref={sliderRef} className="slider-container">
 *         {slides.map((slide, index) => (
 *           <div key={index} className="slide">{slide}</div>
 *         ))}
 *       </div>
 *       <button onClick={prev}>Previous</button>
 *       <button onClick={next}>Next</button>
 *       <div>Current slide: {currentSlide + 1} of {metrics.totalSlides}</div>
 *     </div>
 *   );
 * };
 */

/**
 * A hook for controlling a kinetic slider
 *
 * @param props - The props object
 *
 * @param props.slides - The slides to display
 *
 * @param props.initialSlide - The initial slide index
 *
 * @param props.onSlideChange - Callback when slide changes
 *
 * @param props.onAnimationComplete - Callback when animation completes
 *
 * @param props.infiniteLoop - Whether to loop infinitely
 *
 * @returns The slider state and controls
 *
 * @example
 * ```tsx
 * // Basic usage with minimal props
 * const { currentSlide, next, prev, sliderRef } = useKineticSlider({
 *   slides: slideData,
 *   initialSlide: createBrandedNumber(0, 'SlideIndex'),
 *   infiniteLoop: true
 * });
 * ```
 */
const useKineticSlider = ({
  slides,
  initialSlide,
  onSlideChange,
  onAnimationComplete,
  infiniteLoop = false,
}: KineticSliderHookProps): KineticSliderHookResult => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isAnimating, setIsAnimating] = useState(false);
  const { trackError, ERROR_TYPES } = useErrorTracking();

  const next = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    try {
      const nextSlide = infiniteLoop
        ? (currentSlide + 1) % slides.length
        : Math.min(currentSlide + 1, slides.length - 1);

      setCurrentSlide(createBrandedNumber(nextSlide, "SlideIndex"));
      if (onSlideChange) {
        onSlideChange(createBrandedNumber(nextSlide, "SlideIndex"));
      }
    } catch (error) {
      trackError(error as Error, ERROR_TYPES.NAVIGATION);
    } finally {
      setIsAnimating(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  }, [
    currentSlide,
    isAnimating,
    infiniteLoop,
    slides.length,
    onSlideChange,
    onAnimationComplete,
    trackError,
    ERROR_TYPES,
  ]);

  const prev = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    try {
      const prevSlide = infiniteLoop
        ? (currentSlide - 1 + slides.length) % slides.length
        : Math.max(currentSlide - 1, 0);

      setCurrentSlide(createBrandedNumber(prevSlide, "SlideIndex"));
      if (onSlideChange) {
        void onSlideChange(createBrandedNumber(prevSlide, "SlideIndex"));
      }
    } catch (error) {
      trackError(error as Error, ERROR_TYPES.NAVIGATION);
    } finally {
      setIsAnimating(false);
      if (onAnimationComplete) {
        void onAnimationComplete();
      }
    }
  }, [
    currentSlide,
    isAnimating,
    infiniteLoop,
    slides.length,
    onSlideChange,
    onAnimationComplete,
    trackError,
    ERROR_TYPES,
  ]);

  const handleGesture = useCallback(
    (direction: string) => {
      if (direction === "left") {
        void next();
      } else if (direction === "right") {
        void prev();
      }
    },
    [next, prev],
  );

  // Reference to the slider element
  const sliderRef = React.useRef<HTMLDivElement>(null);

  return {
    currentSlide,
    isAnimating,
    next,
    prev,
    handleGesture,
    sliderRef,
  };
};

export { useKineticSlider };
