import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useGestures } from "./useGestures";
import type { KineticSliderProps, SliderMetrics } from "../types/slider";
import type { SwipeDirection } from "../types/gestures";
import type { UseKineticSliderReturn, SliderGestureEvent } from "../types/hooks";
import type { SlideIndex as _SlideIndex } from "../types/branded";
import { validateSlideIndex } from "../utils/navigation-helpers";
import { createBrandedNumber } from "../utils/branded-helpers";

export const useKineticSlider = ({
  slides,
  duration = 0.5,
  ease = "power2.out",
  onSlideChange,
  onAnimationComplete,
  initialSlide = createBrandedNumber(0, "SlideIndex"),
  infiniteLoop = false,
}: KineticSliderProps): UseKineticSliderReturn => {
  const [currentSlide, setCurrentSlide] = useState<number>(
    initialSlide as unknown as number,
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const gestureCleanupRef = useRef<(() => void) | null>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const { attach } = useGestures({
    threshold: createBrandedNumber(50, "GestureThreshold"),
    minVelocity: createBrandedNumber(0.5, "GestureVelocity"),
  });

  // Memoize slider metrics for performance
  const metrics = useMemo<SliderMetrics>(
    () => ({
      currentIndex: currentSlide,
      totalSlides: slides.length,
      progress: currentSlide / (slides.length - 1),
      direction: "forward",
      isAnimating,
    }),
    [currentSlide, slides.length, isAnimating],
  );

  // Cleanup animation on unmount or when animation parameters change
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [duration, ease]);

  const animateSlide = useCallback(
    (targetSlide: number, options: { immediate?: boolean } = {}) => {
      if (!sliderRef.current || (isAnimating && !options.immediate)) return;

      // Kill any existing animation
      if (animationRef.current) {
        animationRef.current.kill();
      }

      setIsAnimating(true);

      animationRef.current = gsap.to(sliderRef.current, {
        x: -targetSlide * 100,
        duration: options.immediate ? 0 : duration,
        ease,
        onComplete: () => {
          setCurrentSlide(targetSlide);
          setIsAnimating(false);
          onSlideChange?.(createBrandedNumber(targetSlide, "SlideIndex"));
          onAnimationComplete?.();
          animationRef.current = null;
        },
      });
    },
    [duration, ease, isAnimating, onAnimationComplete, onSlideChange],
  );

  const next = useCallback(() => {
    if (isAnimating) return;

    // Check if we're at the last slide
    if (currentSlide >= slides.length - 1) {
      // If infinite loop is enabled, loop to the first slide
      if (infiniteLoop) {
        animateSlide(0, { immediate: true });
      }
      // Otherwise, do nothing
      return;
    }

    animateSlide(currentSlide + 1);
  }, [currentSlide, infiniteLoop, slides.length, animateSlide, isAnimating]);

  const prev = useCallback(() => {
    if (isAnimating) return;

    // Check if we're at the first slide
    if (currentSlide <= 0) {
      // If infinite loop is enabled, loop to the last slide
      if (infiniteLoop) {
        animateSlide(slides.length - 1, { immediate: true });
      }
      // Otherwise, do nothing
      return;
    }

    animateSlide(currentSlide - 1);
  }, [currentSlide, infiniteLoop, slides.length, animateSlide, isAnimating]);

  // Add goToSlide function to allow direct navigation to any slide
  const goToSlide = useCallback(
    (slideIndex: number) => {
      if (isAnimating) return;

      // Validate slide index is within bounds
      const validatedIndex = validateSlideIndex(slideIndex, slides.length);

      // Only animate if we're changing slides
      if (validatedIndex !== currentSlide) {
        animateSlide(validatedIndex);
      }
    },
    [currentSlide, slides.length, animateSlide, isAnimating],
  );

  // Attach gesture handling when slider reference is available
  useEffect(() => {
    if (sliderRef.current) {
      gestureCleanupRef.current = attach(sliderRef.current, {
        onSwipe: (direction: SwipeDirection) => {
          if (direction === "left") {
            next();
          } else if (direction === "right") {
            prev();
          }
        },
      });
    }

    return () => {
      if (gestureCleanupRef.current) {
        gestureCleanupRef.current();
      }
    };
  }, [sliderRef, attach, next, prev]);

  const handleGesture = useCallback(
    (event: SliderGestureEvent) => {
      if (isAnimating) return;

      // Manual gesture handling for touch events
      if (event.type === "touchmove") {
        // Prevent default to avoid page scrolling during swipe
        event.preventDefault?.();
      } else if (event.type === "touchend") {
        // For touchend events, determine direction based on start/end positions
        const touchEndX = event.clientX;
        const touchStartX = event.startX;
        const deltaX = touchEndX - touchStartX;

        if (Math.abs(deltaX) > 50) {
          // Only trigger if swipe distance is significant
          if (deltaX > 0) {
            prev(); // Swipe right
          } else {
            next(); // Swipe left
          }
        }
      }
    },
    [next, prev, isAnimating],
  );

  return {
    currentSlide,
    isAnimating,
    next,
    prev,
    goToSlide,
    handleGesture,
    sliderRef: sliderRef as React.RefObject<HTMLDivElement>,
    metrics,
  };
};
