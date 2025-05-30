import React, {
  MouseEvent as _MouseEvent,
  TouchEvent as _TouchEvent,
  memo,
  useCallback,
  useEffect,
  useState,
  Suspense as _Suspense,
  useRef,
} from "react";
import _gsap from "gsap";

import { useKineticSlider } from "../../hooks/useKineticSlider";
import { useTouchGestures } from "../../hooks/useTouchGestures";
import { useImagePreloading } from "../../hooks/useImagePreloading";
import { useContainerResize } from "../../hooks/useContainerResize";
import type { KineticSliderProps, Slide as _Slide } from "../../types/slider";
import type {
  SliderAnalyticsData as _SliderAnalyticsData,
  SlideChangeAnalytics,
  AnimationCompleteAnalytics,
  GestureAnalytics,
} from "../../types/analytics";
import type {
  BaseSliderEvent as _BaseSliderEvent,
  SliderEventHandler as _SliderEventHandler,
  KeyboardEventHandler as _KeyboardEventHandler,
} from "../../types/events";
import { ErrorBoundary } from "../ErrorBoundary";
import { FocusManager } from "../FocusManager";
import { Loading } from "../Loading/Loading";
import { createBrandedNumber } from "../../utils/branded-helpers";
import type { SlideIndex } from "../../types/branded";
import { ErrorType as _ErrorType } from "../../types/error";
import type {
  ImageAnalyticsData as _ImageAnalyticsData,
} from "../../types/image";
import { animateSlide } from "../../utils/animation";
import { trackInteraction as _trackInteraction } from "../../utils/analytics";
import type { SliderGestureEvent } from "../../types/hooks";
import {
  shouldPreloadSlide,
  calculateSlideTransform,
  generateSlideAriaLabel,
} from "../../utils/slide-helpers";
import {
  generateNavigationAnnouncement,
} from "../../utils/navigation-helpers";

/**
 * A high-performance kinetic slider component with smooth animations and gesture support.
 *
 * @description
 * @example Example usage
 * ```tsx
 * <KineticSlider
 *   infinite
 *   enableGestures />
 *   onChange={(index) => console.log(`Active slide: ${index}`)}
 * >
 *   <div>Slide 1</div>
 *   <div>Slide 2</div>
 *   <div>Slide 3</div>
 * </KineticSlider>
 * ```
 *
 * @description - Uses GSAP for optimized animations
 * - Implements debounced resize handling
 * - Utilizes ResizeObserver for efficient layout updates
 * - Employs transform3d for hardware acceleration
 *
 * @description - Supports keyboard navigation (←/→ arrows)
 * - Maintains focus management within slides
 * - Implements ARIA attributes for slides and controls
 * - Provides live region updates for slide changes
 * - Supports screen reader announcements
 *
 * @description - Manages slide position and animation state
 * - Handles gesture interactions
 * - Controls keyboard navigation
 * - Manages lazy loading of slides
 *
 * @event onChange
 * - onSlideChange: Fired when active slide changes
 * - onAnimationComplete: Fired when slide transition completes
 * - onError: Fired when an error occurs
 *
 * @description - Supports custom classNames and styles
 * - Uses CSS transforms for smooth animations
 * - Implements responsive design patterns
 * - Handles touch and mouse interactions
 *
 * @description - Implements error boundaries for graceful failure
 * - Provides error reporting through onError callback
 * - Handles animation and gesture errors
 * - Manages state recovery after errors
 *
 * @see {@link useKineticSlider} For the hook implementation
 * @see {@link SlideContainer} For the slide container component
 * @see {@link SlideControls} For the navigation controls component
 * @returns The KineticSlider component
 *
 */
export const KineticSlider = memo(
  ({
    slides,
    initialSlide = createBrandedNumber(0, "SlideIndex"),
    onSlideChange,
    onAnimationComplete,
    onError,
    className = "",
    style = {},
    enableKeyboard = true,
    enableGestures = true,
    duration = 0.5,
    ease = "power2.out",
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
      goToSlide,
    } = useKineticSlider({
      slides,
      initialSlide,
      onSlideChange: (index: SlideIndex) => {
        const _analyticsData: SlideChangeAnalytics = {
          eventType: "slide_change",
          timestamp: new Date().toISOString(),
          fromIndex: createBrandedNumber(currentSlide, "SlideIndex"),
          toIndex: index,
          slideId: slides[index]?.id,
          isAutoplay: false,
        };
        onSlideChange?.(index);
      },
      onAnimationComplete: () => {
        const analyticsData: AnimationCompleteAnalytics = {
          eventType: "animation_complete",
          timestamp: new Date().toISOString(),
          duration: duration * 1000,
          direction: "forward",
        };

        console.warn("Animation complete:", analyticsData);
        onAnimationComplete?.();
      },
      duration,
      ease,
      infiniteLoop,
    });

    const [liveRegion, setLiveRegion] = useState("");
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Use container resize hook
    const { containerWidth } = useContainerResize(sliderRef, {
      debounceDelay: 200,
      trackWidth: true,
      trackHeight: false,
      initialWidth: "100%",
    });

    // Use image preloading hook
    const { preloadedImages, loadingStates: _loadingStates, preloadImagesForSlide } = useImagePreloading({
      lazyLoad,
      onError,
      onAnalytics: () => {
        // Handle analytics
      },
    });

    const trackUserInteraction = useCallback((gestureType: string): void => {
      const analyticsData: GestureAnalytics = {
        eventType: "gesture_detected",
        timestamp: new Date().toISOString(),
        gestureType,
        direction: "horizontal",
        distance: 0,
        velocity: 0,
      };
      // eslint-disable-next-line no-console
      console.debug("Slider interaction:", analyticsData);
    }, []);

    /**
     * Handle gesture events for the slider
     *
     * @param event - The slider gesture event
     *
     * @returns {void}
     *
     */
    const handleGestureEvent = useCallback(
      (event: SliderGestureEvent): void => {
        // Handle gesture event
        handleGesture(event);
        trackUserInteraction(event.type);
      },
      [handleGesture, trackUserInteraction],
    );

    // Use touch gestures hook
    const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
      threshold: 50,
      enabled: enableGestures,
      onInteraction: trackUserInteraction,
      onGestureEvent: handleGestureEvent,
      onNext: next,
      onPrev: prev,
    });

    // Setup keyboard navigation and focus management
    useEffect(() => {
      if (!enableKeyboard) return undefined;

      const handleKeyDown = (e: KeyboardEvent): void => {
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            next();
            setLiveRegion(
              generateNavigationAnnouncement(currentSlide + 1, slides.length),
            );
            break;
          case "ArrowLeft":
            e.preventDefault();
            prev();
            setLiveRegion(
              generateNavigationAnnouncement(currentSlide - 1, slides.length),
            );
            break;
          case "Home":
            e.preventDefault();
            if (currentSlide !== 0) {
              goToSlide(0);
              setLiveRegion(generateNavigationAnnouncement(0, slides.length, "first"));
            }
            break;
          case "End":
            e.preventDefault();
            if (currentSlide !== slides.length - 1) {
              goToSlide(slides.length - 1);
              setLiveRegion(generateNavigationAnnouncement(slides.length - 1, slides.length, "last"));
            }
            break;
          default:
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [enableKeyboard, next, prev, currentSlide, slides.length, goToSlide]);

    /**
     * Update the useEffect that handles animation
     *
     * @returns {void}
     *
     */
    useEffect(() => {
      if (isAnimating) {
        const direction =
          currentSlide > (currentSlide - 1 + slides.length) % slides.length
            ? "next"
            : "prev";
        animateSlide(sliderRef, currentSlide, direction, duration, ease, () => {
          const analyticsData: AnimationCompleteAnalytics = {
            eventType: "animation_complete",
            timestamp: new Date().toISOString(),
            duration: duration * 1000,
            direction: direction === "next" ? "forward" : "backward",
          };

          console.warn("Animation complete:", analyticsData);
          onAnimationComplete?.();
        });
      }
    }, [
      currentSlide,
      isAnimating,
      slides.length,
      duration,
      ease,
      onAnimationComplete,
      sliderRef,
    ]);

    // Preload adjacent images using the hook
    useEffect(() => {
      const cleanup = preloadImagesForSlide(currentSlide, slides);
      return cleanup;
    }, [currentSlide, slides, preloadImagesForSlide]);

    /**
     * Render slides for the slider
     *
     * @returns {React.ReactElement[]} The rendered slides
     *
     */
    const renderSlides = (): React.ReactElement[] => {
      return slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const shouldPreload = shouldPreloadSlide(index, currentSlide, slides.length, lazyLoad);

        return (
          <div
            key={slide.id}
            className={`kinetic-slider__slide ${isActive ? "active" : ""} ${slide.className || ""}`}
            style={{
              transform: `translateX(${calculateSlideTransform(index, currentSlide)}%)`,
              opacity: isActive ? 1 : 0.5,
              zIndex: isActive ? 1 : 0,
              ...slide.style,
            }}
            aria-hidden={!isActive}
            data-slide-index={index}
            role="group"
            aria-label={generateSlideAriaLabel(index, slides.length, slide.title)}
          >
            <FocusManager active={isActive} restorePrevious={previousFocusRef}>
              {shouldPreload ? (
                <React.Fragment>
                  {slide.image && !preloadedImages.has(slide.image) ? (
                    <div className="kinetic-slider__loading">
                      <Loading />
                      <span className="kinetic-slider__loading-text">Loading image...</span>
                    </div>
                  ) : (
                    <div
                      className="kinetic-slider__slide-content"
                      style={slide.contentStyle}
                    >
                      {slide.render ? slide.render() : null}
                      {slide.image && (
                        <img
                          src={slide.image}
                          alt={slide.imageAlt || `Slide ${index + 1}`}
                          className="kinetic-slider__slide-image"
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "auto",
                            ...slide.imageStyle,
                          }}
                          loading={shouldPreload ? "eager" : "lazy"}
                        />
                      )}
                      {slide.content}
                    </div>
                  )}
                </React.Fragment>
              ) : null}
            </FocusManager>
          </div>
        );
      });
    };

    /**
     * Handle errors from the error boundary
     *
     * @param _error - The error that occurred
     *
     * @param _errorInfo - Information about the error
     *
     * @returns {void}
     *
     */
    const handleErrorBoundary = (
      _error: Error,
      _errorInfo: React.ErrorInfo,
    ): void => {
      // Error boundary handling
    };

    return (
      <ErrorBoundary
        fallback={<div>Error loading slider. Please try again.</div>}
        onError={handleErrorBoundary}
      >
        <div
          className={`kinetic-slider ${className}`}
          style={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            maxWidth: containerWidth,
            ...(style || {}),
          }}
          ref={sliderRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Image slider"
          onTouchStart={enableGestures ? handleTouchStart : undefined}
          onTouchMove={enableGestures ? handleTouchMove : undefined}
          onTouchEnd={enableGestures ? handleTouchEnd : undefined}
        >
          <div
            className="kinetic-slider__track"
            style={{
              display: "flex",
              transition: isAnimating
                ? `transform ${duration}s ${ease}`
                : "none",
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {renderSlides()}
          </div>

          <div className="kinetic-slider__controls">
            <button
              type="button"
              className="kinetic-slider__control kinetic-slider__control--prev"
              onClick={prev}
              aria-label="Previous slide"
              disabled={!infiniteLoop && currentSlide === 0}
            >
              &larr;
            </button>

            <button
              type="button"
              className="kinetic-slider__control kinetic-slider__control--next"
              onClick={next}
              aria-label="Next slide"
              disabled={!infiniteLoop && currentSlide === slides.length - 1}
            >
              &rarr;
            </button>
          </div>

          <div
            aria-live="polite"
            aria-atomic="true"
            className="kinetic-slider__live-region visually-hidden"
          >
            {liveRegion}
          </div>
        </div>
      </ErrorBoundary>
    );
  },
);

KineticSlider.displayName = "KineticSlider";
