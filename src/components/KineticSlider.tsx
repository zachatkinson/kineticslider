import React, { MouseEvent, TouchEvent, memo, useCallback, useEffect, useState, Suspense, useRef } from 'react';
import gsap from 'gsap';

import { useKineticSlider } from '../hooks/useKineticSlider';
import type { KineticSliderProps, Slide } from '../types/slider';
import type { SliderAnalyticsData, SlideChangeAnalytics, AnimationCompleteAnalytics, GestureAnalytics, ErrorAnalytics } from '../types/analytics';
import type { BaseSliderEvent, SliderEventHandler, KeyboardEventHandler } from '../types/events';
import { ErrorBoundary } from './ErrorBoundary';
import { debounce } from '../utils/performance';
import { FocusManager } from './FocusManager';
import { preloadImage } from '../utils/image';
import { Loading, LoadingIndicator } from './Loading/Loading';
import { createBrandedNumber } from '../types/branded';
import type { SlideIndex } from '../types/branded';
import type { ErrorType } from '../types/slider';
import { animateSlide } from '../utils/animation';
import { trackInteraction } from '../utils/analytics';

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
 * - Supports keyboard navigation (←/→ arrows)
 * - Maintains focus management within slides
 * - Implements ARIA attributes for slides and controls
 * - Provides live region updates for slide changes
 * - Supports screen reader announcements
 *
 * @state
 * - Manages slide position and animation state
 * - Handles gesture interactions
 * - Controls keyboard navigation
 * - Manages lazy loading of slides
 *
 * @events
 * - onSlideChange: Fired when active slide changes
 * - onAnimationComplete: Fired when slide transition completes
 * - onError: Fired when an error occurs
 *
 * @styling
 * - Supports custom classNames and styles
 * - Uses CSS transforms for smooth animations
 * - Implements responsive design patterns
 * - Handles touch and mouse interactions
 *
 * @error
 * - Implements error boundaries for graceful failure
 * - Provides error reporting through onError callback
 * - Handles animation and gesture errors
 * - Manages state recovery after errors
 *
 * @see {@link useKineticSlider} For the hook implementation
 * @see {@link SlideContainer} For the slide container component
 * @see {@link SlideControls} For the navigation controls component
 */
export const KineticSlider = memo(
  ({
    slides,
    initialSlide = createBrandedNumber(0, 'SlideIndex'),
    onSlideChange,
    onAnimationComplete,
    onError,
    className = '',
    style = {},
    enableKeyboard = true,
    enableGestures = true,
    duration = 0.5,
    ease = 'power2.out',
    infiniteLoop = false,
    lazyLoad = true,
  }: KineticSliderProps) => {
    const {
      currentSlide,
      isAnimating,
      next,
      prev,
      handleGesture,
      sliderRef,
    } = useKineticSlider({
      slides,
      initialSlide,
      onSlideChange: (index: SlideIndex) => {
        const analyticsData: SlideChangeAnalytics = {
          eventType: 'slide_change',
          timestamp: new Date().toISOString(),
          fromIndex: createBrandedNumber(currentSlide, 'SlideIndex'),
          toIndex: index,
          slideId: slides[index]?.id,
          isAutoplay: false
        };
        onSlideChange?.(index);
      },
      onAnimationComplete: () => {
        const analyticsData: AnimationCompleteAnalytics = {
          eventType: 'animation_complete',
          timestamp: new Date().toISOString(),
          duration: duration * 1000,
          direction: 'forward'
        };
        console.debug('Animation complete:', analyticsData);
        onAnimationComplete?.();
      },
      duration,
      ease,
      infiniteLoop,
    });

    const [containerWidth, setContainerWidth] = useState('100%');
    const [liveRegion, setLiveRegion] = useState('');
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

    // Track user interactions
    const trackInteraction = useCallback((gestureType: string) => {
      const analyticsData: GestureAnalytics = {
        eventType: 'gesture_detected',
        timestamp: new Date().toISOString(),
        gestureType,
        direction: 'horizontal',
        distance: 0,
        velocity: 0
      };
      console.debug('Slider interaction:', analyticsData);
    }, []);

    // Handle window resize to maintain slider proportions
    useEffect(() => {
      const handleResize = debounce(() => {
        if (sliderRef.current?.parentElement) {
          const width = sliderRef.current.parentElement.offsetWidth;
          setContainerWidth(`${width}px`);
        }
      }, 200);

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [sliderRef]);

    // Setup keyboard navigation and focus management
    useEffect(() => {
      if (!enableKeyboard) return undefined;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            next();
            setLiveRegion(`Moving to slide ${currentSlide + 2} of ${slides.length}`);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            prev();
            setLiveRegion(`Moving to slide ${currentSlide} of ${slides.length}`);
            break;
          case 'Home':
            e.preventDefault();
            if (currentSlide !== 0) {
              next();
              setLiveRegion('Moving to first slide');
            }
            break;
          case 'End':
            e.preventDefault();
            if (currentSlide !== slides.length - 1) {
              prev();
              setLiveRegion('Moving to last slide');
            }
            break;
          default:
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [enableKeyboard, next, prev, currentSlide, slides.length]);

    // Event handlers for touch and mouse interactions
    const handleTouchStart = useCallback(
      (e: TouchEvent) => {
        if (!enableGestures) return;
        const touch = e.touches[0];
        if (touch) {
          trackInteraction('touch_start');
          handleGesture({
            clientX: touch.clientX,
            clientY: touch.clientY,
            type: 'touchstart',
            startX: touch.clientX,
            startY: touch.clientY,
          } as BaseSliderEvent);
        }
      },
      [enableGestures, handleGesture, trackInteraction],
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!enableGestures) return;
        const touch = e.touches[0];
        if (touch) {
          handleGesture({
            clientX: touch.clientX,
            clientY: touch.clientY,
            type: 'touchmove',
            preventDefault: () => e.preventDefault(),
          });
        }
      },
      [enableGestures, handleGesture],
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (!enableGestures) return;
        const touch = e.changedTouches[0];
        if (touch) {
          handleGesture({
            clientX: touch.clientX,
            clientY: touch.clientY,
            type: 'touchend',
          });
        }
      },
      [enableGestures, handleGesture],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!enableGestures) return;
        handleGesture({
          clientX: e.clientX,
          clientY: e.clientY,
          type: 'mousedown',
          startX: e.clientX,
          startY: e.clientY,
        });
      },
      [enableGestures, handleGesture],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!enableGestures) return;
        handleGesture({
          clientX: e.clientX,
          clientY: e.clientY,
          type: 'mousemove',
          preventDefault: () => e.preventDefault(),
        });
      },
      [enableGestures, handleGesture],
    );

    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        if (!enableGestures) return;
        handleGesture({
          clientX: e.clientX,
          clientY: e.clientY,
          type: 'mouseup',
        });
      },
      [enableGestures, handleGesture],
    );

    // Update the useEffect that handles animation
    useEffect(() => {
      if (isAnimating) {
        const direction = currentSlide > (currentSlide - 1 + slides.length) % slides.length
          ? 'next'
          : 'prev';
        animateSlide(
          sliderRef,
          currentSlide,
          direction,
          duration,
          ease,
          () => {
            const analyticsData: AnimationCompleteAnalytics = {
              eventType: 'animation_complete',
              timestamp: new Date().toISOString(),
              duration: duration * 1000,
              direction: direction === 'next' ? 'forward' : 'backward'
            };
            console.debug('Animation complete:', analyticsData);
            onAnimationComplete?.();
          }
        );
      }
    }, [currentSlide, isAnimating, slides.length, duration, ease, onAnimationComplete]);

    // Preload adjacent images
    useEffect(() => {
      // Preload current and adjacent slides
      const slidesToPreload = [
        slides[currentSlide]?.image,
        slides[(currentSlide + 1) % slides.length]?.image,
        slides[(currentSlide - 1 + slides.length) % slides.length]?.image
      ].filter(Boolean) as string[];

      const cleanupFns = slidesToPreload.map(src => 
        preloadImage(src, {
          onLoad: () => {
            setPreloadedImages(prev => new Set([...prev, src]));
            setLoadingStates(prev => ({ ...prev, [src]: false }));
          },
          onError: (error) => {
            setLoadingStates(prev => ({ ...prev, [src]: false }));
            const index = slides.findIndex(slide => slide.image === src);
            onError?.(error);
          },
          onAnalytics: (data) => {
            if (data.eventType === 'error') {
              console.error('Preload error:', data);
            }
          }
        })
      );

      return () => {
        cleanupFns.forEach(cleanup => cleanup());
      };
    }, [currentSlide, slides, preloadedImages, onError]);

    // Update renderSlides to include loading states
    const renderSlides = () => {
      return slides.map((slide, index) => (
        <div
          key={slide.id}
          className="kinetic-slider-slide"
          role="tabpanel"
          aria-roledescription="slide"
          aria-label={slide.title}
          aria-hidden={currentSlide !== index}
          tabIndex={currentSlide === index ? 0 : -1}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: currentSlide === index ? 1 : 0,
          }}
        >
          {loadingStates[slide.image] && <LoadingIndicator />}
          <img
            src={slide.image}
            alt={slide.alt}
            loading={lazyLoad && index !== currentSlide ? 'lazy' : 'eager'}
            onError={() => {
              const error = new Error(`Failed to load image: ${slide.image}`);
              const analyticsData: ErrorAnalytics = {
                eventType: 'error',
                timestamp: new Date().toISOString(),
                error,
                errorType: 'IMAGE_LOAD_ERROR' as ErrorType,
                componentInfo: {
                  currentIndex: createBrandedNumber(currentSlide, 'SlideIndex'),
                  isAnimating,
                  isDragging: false
                }
              };
              console.error('Slider error:', analyticsData);
              onError?.(error);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loadingStates[slide.image] ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          />
          {slide.description && (
            <div 
              className="kinetic-slider-description" 
              aria-hidden="false"
              style={{
                opacity: loadingStates[slide.image] ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
            >
              {slide.description}
            </div>
          )}
        </div>
      ));
    };

    return (
      <FocusManager
        trapFocus
        autoFocus
        escapeDeactivates={false}
        onActivate={() => {
          previousFocusRef.current = document.activeElement as HTMLElement;
        }}
        onDeactivate={() => {
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          }
        }}
      >
        <ErrorBoundary
          fallback={<div>Error loading slider. Please try again.</div>}
          onError={(error: Error, errorInfo: React.ErrorInfo) => {
            onError?.(error);
          }}
        >
          <div
            className={`kinetic-slider-container ${className}`}
            style={{ width: containerWidth, ...style }}
            role="region"
            aria-label="Image carousel"
          >
            <div
              className="kinetic-slider-track"
              ref={sliderRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              role="tablist"
              aria-orientation="horizontal"
              aria-live="polite"
              aria-atomic="true"
              aria-relevant="additions text"
            >
              <Suspense fallback={<Loading />}>
                {renderSlides()}
              </Suspense>
            </div>
            
            <div
              className="kinetic-slider-controls"
              role="group"
              aria-label="Carousel controls"
            >
              <button
                type="button"
                onClick={prev}
                disabled={!infiniteLoop && currentSlide === 0}
                aria-label="Previous slide"
                className="kinetic-slider-prev"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!infiniteLoop && currentSlide === slides.length - 1}
                aria-label="Next slide"
                className="kinetic-slider-next"
              >
                Next
              </button>
            </div>

            <div
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
              role="status"
            >
              {liveRegion}
            </div>
          </div>
        </ErrorBoundary>
      </FocusManager>
    );
  }
);

// Default export with display name for better debugging
KineticSlider.displayName = 'KineticSlider';
