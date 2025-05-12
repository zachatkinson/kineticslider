import React, {
  MouseEvent as _MouseEvent,
  TouchEvent,
  memo,
  useCallback,
  useEffect,
  useState,
  Suspense,
  useRef,
} from "react";
import _gsap from "gsap";

import { useKineticSlider } from "../hooks/useKineticSlider";
import type { KineticSliderProps, Slide as _Slide } from "../types/slider";
import type {
  SliderAnalyticsData as _SliderAnalyticsData,
  SlideChangeAnalytics,
  AnimationCompleteAnalytics,
  GestureAnalytics,
  ErrorAnalytics as _ErrorAnalytics,
} from "../types/analytics";
import type {
  BaseSliderEvent as _BaseSliderEvent,
  SliderEventHandler as _SliderEventHandler,
  KeyboardEventHandler as _KeyboardEventHandler,
} from "../types/events";
import { ErrorBoundary } from "./ErrorBoundary";
import { debounce } from "../utils/performance";
import { FocusManager } from "./FocusManager";
import { preloadImage } from "../utils/image";
import { Loading } from "./Loading/Loading";
import { createBrandedNumber } from "../types/branded";
import type { SlideIndex } from "../types/branded";
import { ErrorType as _ErrorType } from "../types/error";
import type { ImageError, ImageAnalyticsData } from "../types/image";
import { animateSlide } from "../utils/animation";
import { trackInteraction as _trackInteraction } from "../utils/analytics";

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
    enableGestures: _enableGestures = true,
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
      goToSlide,
      handleGesture: _handleGesture,
      sliderRef,
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

    const [containerWidth, setContainerWidth] = useState("100%");
    const [liveRegion, setLiveRegion] = useState("");
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
      {},
    );
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(
      new Set(),
    );

    // Track user interactions
    const trackInteraction = useCallback((gestureType: string): void => {
      const analyticsData: GestureAnalytics = {
        eventType: "gesture_detected",
        timestamp: new Date().toISOString(),
        gestureType,
        direction: "horizontal",
        distance: 0,
        velocity: 0,
      };
      console.warn("Slider interaction:", analyticsData);
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
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [sliderRef]);

    // Setup keyboard navigation and focus management
    useEffect(() => {
      if (!enableKeyboard) return undefined;

      const handleKeyDown = (e: KeyboardEvent): void => {
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            next();
            setLiveRegion(
              `Moving to slide ${currentSlide + 2} of ${slides.length}`,
            );
            break;
          case "ArrowLeft":
            e.preventDefault();
            prev();
            setLiveRegion(
              `Moving to slide ${currentSlide} of ${slides.length}`,
            );
            break;
          case "Home":
            e.preventDefault();
            if (currentSlide !== 0) {
              goToSlide(0);
              setLiveRegion("Moving to first slide");
            }
            break;
          case "End":
            e.preventDefault();
            if (currentSlide !== slides.length - 1) {
              goToSlide(slides.length - 1);
              setLiveRegion("Moving to last slide");
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

    // Handle touch events
    const handleTouchStart = useCallback(
      (_e: TouchEvent<HTMLDivElement>): void => {
        // Handle touch start event
        trackInteraction("touch_start");
      },
      [trackInteraction],
    );

    // Update the useEffect that handles animation
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

    // Preload adjacent images
    useEffect(() => {
      // Preload current and adjacent slides
      const slidesToPreload = [
        slides[currentSlide]?.image,
        slides[(currentSlide + 1) % slides.length]?.image,
        slides[(currentSlide - 1 + slides.length) % slides.length]?.image,
      ].filter(Boolean) as string[];

      const cleanupFns = slidesToPreload.map((src) =>
        preloadImage(src, {
          onLoad: () => {
            setPreloadedImages((prev) => new Set([...prev, src]));
            setLoadingStates((prev) => ({ ...prev, [src]: false }));
          },
          onError: (error: ImageError) => {
            setLoadingStates((prev) => ({ ...prev, [src]: false }));
            const _index = slides.findIndex((slide) => slide.image === src);
            onError?.(error);
          },
          onAnalytics: (data: ImageAnalyticsData) => {
            console.warn("Image analytics:", data);
          },
        }),
      );

      return () => {
        cleanupFns.forEach((cleanup) => cleanup());
      };
    }, [currentSlide, slides, preloadedImages, onError]);

    // Handle mouse events
    const _handleMouseDown = (): void => {
      // Mouse handling here
    };

    // Handle error reporting
    const handleError = (
      _error: React.SyntheticEvent<HTMLImageElement, Event>,
    ): void => {
      // Error handling here
    };

    // Update renderSlides to include loading states
    const renderSlides = (): React.ReactNode => {
      return slides.map((slide, _index) => (
        <div
          key={slide.id}
          className="kinetic-slider-slide"
          role="tabpanel"
          aria-roledescription="slide"
          aria-label={slide.title}
          aria-hidden={currentSlide !== _index}
          tabIndex={currentSlide === _index ? 0 : -1}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: currentSlide === _index ? 1 : 0,
          }}
        >
          {lazyLoad && !preloadedImages.has(slide.image) && (
            <div className="kinetic-slider-loading-container">
              {loadingStates[slide.image] && <Loading text="Loading..." />}
            </div>
          )}
          <img
            src={slide.image}
            alt={slide.alt}
            loading={lazyLoad && _index !== currentSlide ? "lazy" : "eager"}
            onError={handleError}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: loadingStates[slide.image] ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          />
          {slide.description && (
            <div
              className="kinetic-slider-description"
              aria-hidden="false"
              style={{
                opacity: loadingStates[slide.image] ? 0 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {slide.description}
            </div>
          )}
        </div>
      ));
    };

    const _renderLoading = (_src: string): React.ReactNode => (
      <div className="kinetic-slider-loader">
        <Loading text="Loading slide..." />
      </div>
    );

    const handleErrorBoundary = (
      _error: Error,
      _errorInfo: React.ErrorInfo,
    ): void => {
      // Error boundary handling
    };

    return (
      <Suspense fallback={<Loading />}>
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
            onError={handleErrorBoundary}
          >
            <div
              ref={sliderRef}
              className={`slider ${className}`}
              style={{
                width: containerWidth,
                overflow: "hidden",
                position: "relative",
                ...style,
              }}
              onTouchStart={handleTouchStart}
              aria-live="polite"
              aria-atomic="true"
              role="region"
              aria-label="Slideshow"
              aria-roledescription="slider"
            >
              <div className="slider-track">{renderSlides()}</div>

              <div className="slider-controls">
                <button
                  onClick={prev}
                  disabled={
                    isAnimating || (!infiniteLoop && currentSlide === 0)
                  }
                  aria-label="Previous slide"
                >
                  Previous
                </button>
                <button
                  onClick={next}
                  disabled={
                    isAnimating ||
                    (!infiniteLoop && currentSlide === slides.length - 1)
                  }
                  aria-label="Next slide"
                >
                  Next
                </button>
              </div>

              {/* Live region for accessibility */}
              <div aria-live="assertive" className="visually-hidden">
                {liveRegion}
              </div>
            </div>
          </ErrorBoundary>
        </FocusManager>
      </Suspense>
    );
  },
);

// Default export with display name for better debugging
KineticSlider.displayName = "KineticSlider";
