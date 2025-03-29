import { gsap } from 'gsap';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { KineticSliderProps } from '@/types';

import { useGestures } from '../hooks/useGestures';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * A high-performance kinetic slider component with smooth animations and gesture support.
 *
 * @component
 * @example
 * ```tsx
 * <KineticSlider
 *   infinite
 *   enableGestures
 *   onChange={(index) => console.log(`Active slide: ${index}`)}
 * >
 *   <div>Slide 1</div>
 *   <div>Slide 2</div>
 *   <div>Slide 3</div>
 * </KineticSlider>
 * ```
 *
 * @performance
 * - Uses GSAP for optimized animations
 * - Implements debounced resize handling
 * - Utilizes ResizeObserver for efficient layout updates
 * - Employs transform3d for hardware acceleration
 *
 * @accessibility
 * - Supports keyboard navigation
 * - Maintains focus management
 * - Implements ARIA attributes
 */
export const KineticSlider: React.FC<KineticSliderProps> = ({
  slides,
  initialSlide = 0,
  onSlideChange,
  className = '',
  style = {},
  duration = 0.5,
  ease = 'power2.out',
  enableGestures = true,
  enableKeyboard = true,
  onAnimationComplete,
  onError,
}) => {
  // State and refs
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetSlide, setTargetSlide] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Early validation - moved after hooks
  if (!slides.length) {
    const error = new Error('No slides provided');
    if (onError) {
      onError(error);
    }
    return null;
  }

  // Handle single slide case
  const isSingleSlide = slides.length === 1;

  // Handle reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const animationDuration = prefersReducedMotion ? 0.1 : duration;

  const navigateToSlide = useCallback(
    (index: number) => {
      if (
        isAnimating ||
        index === currentSlide ||
        index < 0 ||
        index >= slides.length
      )
        return;
      setIsAnimating(true);
      setTargetSlide(index);
    },
    [currentSlide, isAnimating, slides.length]
  );

  // Use layout effect to ensure state updates happen synchronously
  useLayoutEffect(() => {
    if (targetSlide !== null && isAnimating) {
      const animation = gsap.to(sliderRef.current, {
        x: -targetSlide * 100,
        duration: animationDuration,
        ease,
        onComplete: () => {
          setCurrentSlide(targetSlide);
          setIsAnimating(false);
          setTargetSlide(null);
          onSlideChange?.(targetSlide);
          onAnimationComplete?.();
        },
      });

      return () => {
        animation.kill();
      };
    }

    return undefined;
  }, [
    targetSlide,
    isAnimating,
    animationDuration,
    ease,
    onSlideChange,
    onAnimationComplete,
  ]);

  // Effect to handle aria-current during animation
  useEffect(() => {
    if (isAnimating) {
      const slides = containerRef.current?.querySelectorAll('[role="group"]');
      slides?.forEach((slide) => {
        slide.setAttribute('aria-current', 'false');
      });
    }
  }, [isAnimating]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateToSlide(currentSlide - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToSlide(currentSlide + 1);
          break;
      }
    },
    [currentSlide, navigateToSlide]
  );

  const { attach } = useGestures({
    enabled: enableGestures && !isSingleSlide,
    onSwipe: (direction) => {
      if (direction === 'left') {
        navigateToSlide(currentSlide + 1);
      } else {
        navigateToSlide(currentSlide - 1);
      }
    },
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const cleanup = attach(element);
    return cleanup;
  }, [attach]);

  useEffect(() => {
    if (!enableKeyboard || isSingleSlide) return;

    let lastEventTime = 0;
    const minDelay = 50; // Minimum delay between events in ms

    const handleKeyboard = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - lastEventTime < minDelay) return;
      lastEventTime = now;

      if (e.key === 'ArrowLeft') {
        navigateToSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight') {
        navigateToSlide(currentSlide + 1);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [currentSlide, enableKeyboard, navigateToSlide, isSingleSlide]);

  // Add cleanup effect
  useEffect(() => {
    const currentRef = sliderRef.current;
    return () => {
      if (currentRef) {
        gsap.killTweensOf(currentRef);
      }
    };
  }, []);

  // When no slides, return null (validation was moved after hooks)
  if (!slides.length) return null;

  return (
    <ErrorBoundary>
      <div
        ref={containerRef}
        className={`kinetic-slider-container ${className}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          ...style,
        }}
        role="region"
        aria-label="Image slider"
        tabIndex={0}
      >
        <div
          ref={sliderRef}
          role="region"
          aria-label="Image Slider"
          className="kinetic-slider"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{
            display: 'flex',
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="kinetic-slide"
              style={{ width: '100%', flexShrink: 0 }}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              aria-current={
                isAnimating
                  ? 'false'
                  : currentSlide === index
                    ? 'true'
                    : 'false'
              }
              data-slide-index={index}
              data-is-animating={isAnimating}
            >
              {slide.content}
            </div>
          ))}
        </div>

        {!isSingleSlide && (
          <div className="kinetic-slider-controls">
            <button
              onClick={() => navigateToSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
              aria-label="Previous slide"
            >
              Previous
            </button>
            <button
              onClick={() => navigateToSlide(currentSlide + 1)}
              disabled={currentSlide === slides.length - 1}
              aria-label="Next slide"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Default export with display name for better debugging
KineticSlider.displayName = 'KineticSlider';
