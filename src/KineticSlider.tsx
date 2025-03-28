import debounce from 'lodash/debounce';

import React, {
  Children,
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { useAnimation } from './hooks/useAnimation';
import type {
  KineticSliderProps,
  SliderErrorInfo,
  WindowWithAnalytics,
} from './types';
import { SliderErrorType } from './types';

/**
 * Error boundary component for handling slider-specific errors
 */
export class SliderErrorBoundary extends Component<
  { children: ReactNode },
  {
    hasError: boolean;
    error: Error | null;
    errorInfo: SliderErrorInfo | null;
    retryCount: number;
  }
> {
  private readonly MAX_RETRIES = 3;
  private errorLog: Array<{ error: Error; info: SliderErrorInfo }> = [];

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Determine error type
    let sliderErrorInfo: SliderErrorInfo = {
      ...errorInfo,
      errorType: this.determineErrorType(error),
      additionalData: this.gatherAdditionalData(),
      componentStack: errorInfo.componentStack || undefined,
    };

    // Log error with additional context
    console.error('KineticSlider Error:', {
      error,
      errorInfo: sliderErrorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Store error for analysis
    this.errorLog.push({ error, info: sliderErrorInfo });

    // Update state with error info
    this.setState({ errorInfo: sliderErrorInfo });

    // Report error to error tracking service if available
    this.reportError(error, sliderErrorInfo);
  }

  /**
   * Determines the type of error that occurred
   */
  private determineErrorType(error: Error): SliderErrorType {
    if (error.message.includes('validation')) {
      return SliderErrorType.VALIDATION;
    } else if (error.message.includes('animation')) {
      return SliderErrorType.ANIMATION;
    } else if (error.message.includes('gesture')) {
      return SliderErrorType.GESTURE;
    } else if (error.message.includes('memory')) {
      return SliderErrorType.MEMORY;
    }
    return SliderErrorType.RENDER;
  }

  /**
   * Gathers additional context data for error reporting
   */
  private gatherAdditionalData(): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
      errorCount: this.errorLog.length,
      retryCount: this.state.retryCount,
    };
  }

  /**
   * Reports error to error tracking service
   */
  private reportError(error: Error, errorInfo: SliderErrorInfo): void {
    if (typeof window !== 'undefined' && 'errorTracker' in window) {
      (window as unknown as WindowWithAnalytics).errorTracker.captureError(
        error,
        {
          ...errorInfo,
          component: 'KineticSlider',
          errorLog: this.errorLog,
        }
      );
    }
  }

  /**
   * Attempts to recover from error
   */
  private handleRetry = (): void => {
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= this.MAX_RETRIES) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
    } else {
      // If max retries exceeded, show permanent error state
      this.setState({
        errorInfo: {
          ...this.state.errorInfo,
          additionalData: {
            ...this.state.errorInfo?.additionalData,
            maxRetriesExceeded: true,
          },
        },
      });
    }
  };

  /**
   * Resets the error boundary state
   */
  private handleReset = (): void => {
    this.errorLog = [];
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  override render() {
    const { hasError, error, errorInfo, retryCount } = this.state;

    if (hasError) {
      const errorType = errorInfo?.errorType || SliderErrorType.RENDER;
      const maxRetriesExceeded = retryCount >= this.MAX_RETRIES;

      return (
        <div
          role="alert"
          className="kinetic-slider-error"
          style={{
            padding: '1rem',
            color: 'red',
            border: '1px solid red',
            borderRadius: '4px',
            margin: '1rem',
          }}
        >
          <h2>Something went wrong with the slider</h2>
          <p>{error?.message}</p>
          {errorType !== SliderErrorType.VALIDATION && (
            <p>Error type: {errorType}</p>
          )}
          {maxRetriesExceeded ? (
            <>
              <p>Maximum retry attempts exceeded. Please refresh the page.</p>
              <button
                onClick={() => window.location.reload()}
                className="kinetic-slider-error-button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid red',
                  borderRadius: '4px',
                  color: 'red',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Refresh Page
              </button>
            </>
          ) : (
            <>
              <p>
                Retry attempt {retryCount + 1} of {this.MAX_RETRIES}
              </p>
              <button
                onClick={this.handleRetry}
                className="kinetic-slider-error-button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid red',
                  borderRadius: '4px',
                  color: 'red',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="kinetic-slider-error-button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid red',
                  borderRadius: '4px',
                  color: 'red',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </>
          )}
          {typeof process !== 'undefined' &&
            process.env &&
            process.env['NODE_ENV'] === 'development' && (
              <pre style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                {errorInfo?.componentStack}
              </pre>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

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
  children,
  className = '',
  style = {},
  duration = 0.5,
  ease = 'power2.out',
  enableGestures = true,
  enableKeyboard = true,
  onChange,
  initialIndex = 0,
  infinite = true,
  lazyLoad = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [_isDragging, setIsDragging] = useState(false);
  const slideCount = Children.count(children);
  const slides = Children.toArray(children);

  const {
    animateToSlide,
    setupContainer,
    setupSlides,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleResize: handleAnimationResize,
  } = useAnimation({
    duration,
    ease,
    infinite,
    onAnimationStart: () => setIsDragging(true),
    onAnimationComplete: (index) => {
      setCurrentIndex(index);
      setIsDragging(false);
      onChange?.(index);
    },
  });

  const _handleResize = useCallback(
    debounce(() => {
      if (!containerRef.current || !slidesRef.current) return;
      handleAnimationResize();
    }, 32),
    [handleAnimationResize]
  );

  const _handleGesture = useCallback(
    (e: PointerEvent) => {
      if (!enableGestures || !containerRef.current) return;

      switch (e.type) {
        case 'pointerdown':
          handleDragStart(e.clientX);
          break;
        case 'pointermove':
          handleDragMove(e.clientX);
          break;
        case 'pointerup':
        case 'pointercancel':
          handleDragEnd();
          break;
      }
    },
    [enableGestures, handleDragStart, handleDragMove, handleDragEnd]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enableKeyboard) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          requestAnimationFrame(() => animateToSlide(currentIndex - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          requestAnimationFrame(() => animateToSlide(currentIndex + 1));
          break;
      }
    },
    [enableKeyboard, currentIndex, animateToSlide]
  );

  // Keyboard navigation
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Initialize container and slides with gesture handling
  useEffect(() => {
    if (!containerRef.current || !slidesRef.current) return undefined;

    setupContainer(containerRef.current);
    setupSlides(Array.from(slidesRef.current.children) as HTMLElement[]);

    // Setup gesture handling
    if (enableGestures) {
      const container = containerRef.current;
      container.addEventListener('pointerdown', _handleGesture);
      container.addEventListener('pointermove', _handleGesture);
      container.addEventListener('pointerup', _handleGesture);
      container.addEventListener('pointercancel', _handleGesture);

      return () => {
        container.removeEventListener('pointerdown', _handleGesture);
        container.removeEventListener('pointermove', _handleGesture);
        container.removeEventListener('pointerup', _handleGesture);
        container.removeEventListener('pointercancel', _handleGesture);
      };
    }
    return undefined;
  }, [setupContainer, setupSlides, enableGestures, _handleGesture]);

  // Setup resize observer
  useEffect(() => {
    const resizeObserver = new ResizeObserver(_handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [_handleResize]);

  // Virtualization window calculation
  const visibleSlides = useMemo(() => {
    if (!lazyLoad) return Children.toArray(children);

    const window = 1; // Load one slide before and after
    const start = Math.max(0, currentIndex - window);
    const end = Math.min(slideCount - 1, currentIndex + window);

    return Children.toArray(children).slice(start, end + 1);
  }, [children, currentIndex, lazyLoad, slideCount]);

  return (
    <ErrorBoundary>
      <div
        ref={containerRef}
        className={`kinetic-slider ${className}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          touchAction: 'pan-y pinch-zoom',
          ...style,
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Image slider"
        aria-atomic="true"
        aria-live="polite"
      >
        <div
          ref={slidesRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {visibleSlides.map((slide, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              aria-hidden={index !== currentIndex}
              aria-current={index === currentIndex}
              tabIndex={index === currentIndex ? 0 : -1}
              className="kinetic-slider-slide"
              style={{
                opacity: lazyLoad && Math.abs(index - currentIndex) > 1 ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {lazyLoad ? (
                <Suspense
                  fallback={
                    <div
                      role="progressbar"
                      aria-label="Loading slide content"
                      className="kinetic-slider-loading"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      Loading...
                    </div>
                  }
                >
                  {index === currentIndex ||
                  index === currentIndex - 1 ||
                  index === currentIndex + 1
                    ? slide
                    : null}
                </Suspense>
              ) : (
                slide
              )}
            </div>
          ))}
        </div>
        <div
          role="group"
          aria-label="Slider controls"
          className="kinetic-slider-controls"
          style={{
            position: 'absolute',
            bottom: '1rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => animateToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
              className={`kinetic-slider-dot ${index === currentIndex ? 'active' : ''}`}
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                border: 'none',
                background: index === currentIndex ? '#000' : '#ccc',
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Default export with display name for better debugging
KineticSlider.displayName = 'KineticSlider';
