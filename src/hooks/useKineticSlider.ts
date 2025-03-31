import { gsap } from 'gsap';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useGestures } from '@/hooks/useGestures';
import type {
  UseKineticSliderProps,
  UseKineticSliderReturn,
  SliderGestureEvent,
  SliderMetrics,
  SliderAnalyticsData,
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
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const { attach } = useGestures({ threshold: 50, minVelocity: 0.5 });

  // Memoize slider metrics for performance
  const metrics = useMemo<SliderMetrics>(() => ({
    currentIndex: currentSlide,
    totalSlides: slides.length,
    progress: currentSlide / (slides.length - 1),
    direction: 'forward',
    isAnimating,
  }), [currentSlide, slides.length, isAnimating]);

  // Cleanup animation on unmount or when animation parameters change
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [duration, ease]);

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

  const animateSlide = useCallback((targetSlide: number, options: { immediate?: boolean } = {}) => {
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
        onSlideChange?.(targetSlide);
        onAnimationComplete?.();
        animationRef.current = null;
      },
    });
  }, [duration, ease, isAnimating, onAnimationComplete, onSlideChange]);

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

  const handleGesture = useCallback(
    (event: SliderGestureEvent) => {
      if (isAnimating) return;

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
    [next, prev, isAnimating]
  );

  return {
    currentSlide,
    isAnimating,
    next,
    prev,
    handleGesture,
    sliderRef,
    metrics,
  };
};
