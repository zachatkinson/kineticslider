import { gsap } from 'gsap';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useGestures } from '@/hooks/useGestures';
import type {
  UseKineticSliderProps,
  UseKineticSliderReturn,
  SliderGestureEvent,
} from '@/types/slider';
import type { SwipeDirection } from '@/types/gestures';

export const useKineticSlider = ({
  slides,
  duration = 0.5,
  ease = 'power2.out',
  onSlideChange,
  onAnimationComplete,
  initialSlide = 0,
  infiniteLoop = false,
}: UseKineticSliderProps): UseKineticSliderReturn => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const gestureCleanupRef = useRef<(() => void) | null>(null);
  const { attach } = useGestures({ threshold: 50, minVelocity: 0.5 });

  // Attach gesture handling when slider reference is available
  useEffect(() => {
    if (sliderRef.current) {
      gestureCleanupRef.current = attach(sliderRef.current, {
        onSwipe: (direction: SwipeDirection) => {
          if (direction === 'left') {
            next();
          } else if (direction === 'right') {
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
  }, [sliderRef, attach]);

  const next = useCallback(() => {
    if (isAnimating) return;
    
    // Check if we're at the last slide
    if (currentSlide >= slides.length - 1) {
      // If infinite loop is enabled, loop to the first slide
      if (infiniteLoop) {
        setIsAnimating(true);
        
        gsap.to(sliderRef.current, {
          x: -(slides.length) * 100, // Move beyond the last slide
          duration: duration / 2,
          ease,
          onComplete: () => {
            // Jump to first slide without animation
            gsap.set(sliderRef.current, { x: 0 });
            setCurrentSlide(0);
            setIsAnimating(false);
            onSlideChange?.(0);
            onAnimationComplete?.();
          },
        });
      }
      // Otherwise, do nothing
      return;
    }
    
    setIsAnimating(true);

    gsap.to(sliderRef.current, {
      x: -(currentSlide + 1) * 100,
      duration,
      ease,
      onComplete: () => {
        setCurrentSlide((prev: number) => prev + 1);
        setIsAnimating(false);
        onSlideChange?.(currentSlide + 1);
        onAnimationComplete?.();
      },
    });
  }, [
    currentSlide,
    duration,
    ease,
    isAnimating,
    onAnimationComplete,
    onSlideChange,
    slides.length,
    infiniteLoop,
  ]);

  const prev = useCallback(() => {
    if (isAnimating) return;
    
    // Check if we're at the first slide
    if (currentSlide <= 0) {
      // If infinite loop is enabled, loop to the last slide
      if (infiniteLoop) {
        setIsAnimating(true);
        
        gsap.to(sliderRef.current, {
          x: 100, // Move before the first slide
          duration: duration / 2,
          ease,
          onComplete: () => {
            // Jump to last slide without animation
            gsap.set(sliderRef.current, { x: -((slides.length - 1) * 100) });
            setCurrentSlide(slides.length - 1);
            setIsAnimating(false);
            onSlideChange?.(slides.length - 1);
            onAnimationComplete?.();
          },
        });
      }
      // Otherwise, do nothing
      return;
    }
    
    setIsAnimating(true);

    gsap.to(sliderRef.current, {
      x: -(currentSlide - 1) * 100,
      duration,
      ease,
      onComplete: () => {
        setCurrentSlide((prev: number) => prev - 1);
        setIsAnimating(false);
        onSlideChange?.(currentSlide - 1);
        onAnimationComplete?.();
      },
    });
  }, [
    currentSlide,
    duration,
    ease,
    isAnimating,
    onAnimationComplete,
    onSlideChange,
    slides.length,
    infiniteLoop,
  ]);

  const handleGesture = useCallback(
    (event: SliderGestureEvent) => {
      // Manual gesture handling for touch events
      if (event.type === 'touchmove') {
        // Prevent default to avoid page scrolling during swipe
        event.preventDefault?.();
      } else if (event.type === 'touchend') {
        // For touchend events, determine direction based on start/end positions
        const touchEndX = event.clientX;
        const touchStartX = event.startX || 0;
        const deltaX = touchEndX - touchStartX;
        
        if (Math.abs(deltaX) > 50) { // Only trigger if swipe distance is significant
          if (deltaX > 0) {
            prev(); // Swipe right
          } else {
            next(); // Swipe left
          }
        }
      }
    },
    [next, prev]
  );

  return {
    currentSlide,
    isAnimating,
    next,
    prev,
    handleGesture,
    sliderRef,
  };
};
