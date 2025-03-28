import gsap from 'gsap';
import debounce from 'lodash/debounce';

import React, {
  Children,
  Component,
  CSSProperties,
  ErrorInfo,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Custom error for slider-specific validation
 */
class SliderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SliderError';
  }
}

/**
 * Error types that can occur in the slider
 */
enum SliderErrorType {
  VALIDATION = 'validation',
  ANIMATION = 'animation',
  GESTURE = 'gesture',
  RENDER = 'render',
  MEMORY = 'memory',
}

/**
 * Extended error information for better error handling
 */
interface SliderErrorInfo extends Omit<ErrorInfo, 'componentStack'> {
  errorType?: SliderErrorType;
  componentStack?: string | undefined;
  additionalData?: Record<string, unknown>;
}

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
    if (error instanceof SliderError) {
      return SliderErrorType.VALIDATION;
    }
    if (error.message.includes('animation') || error.message.includes('gsap')) {
      return SliderErrorType.ANIMATION;
    }
    if (error.message.includes('gesture') || error.message.includes('event')) {
      return SliderErrorType.GESTURE;
    }
    if (error.message.includes('memory') || error.message.includes('heap')) {
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

type GsapQuickSetter = ReturnType<typeof gsap.quickSetter>;

interface GsapEventCallback {
  (type: string, callback: () => void): GsapTimeline;
}

interface GsapTimelineDefaults {
  duration?: number;
  ease?: string;
  force3D?: boolean;
  lazy?: boolean;
  clearProps?: string;
  overwrite?: boolean | 'auto';
  immediateRender?: boolean;
  onComplete?: () => void;
}

interface GsapTimeline {
  to: (
    target: HTMLElement | string,
    vars: Record<string, unknown>
  ) => GsapTimeline;
  fromTo: (
    target: HTMLElement | string,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>
  ) => GsapTimeline;
  kill: () => void;
  progress: (value: number) => GsapTimeline;
  pause: () => GsapTimeline;
  resume: () => GsapTimeline;
  eventCallback: GsapEventCallback;
  defaults: GsapTimelineDefaults;
}

interface DragState {
  startX: number;
  currentX: number;
  quickSetter?: GsapQuickSetter;
  timeline?: GsapTimeline | null;
}

/**
 * Performance metrics for monitoring slider behavior
 */
interface PerformanceMetrics {
  /** Time taken for initial render */
  initialRenderTime: number;
  /** Average frame time during animations */
  averageFrameTime: number;
  /** Number of frames dropped during animations */
  droppedFrames: number;
  /** Memory usage during animations */
  memoryUsage: number;
  /** Time taken for gesture processing */
  gestureProcessingTime: number;
}

// Add type declaration for performance.memory
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

/**
 * Analytics event types for slider interactions
 */
enum SliderAnalyticsEvent {
  SLIDE_CHANGE = 'slide_change',
  GESTURE_START = 'gesture_start',
  GESTURE_END = 'gesture_end',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

/**
 * Analytics data structure for slider events
 */
interface SliderAnalyticsData {
  eventType: SliderAnalyticsEvent;
  timestamp: string;
  slideIndex?: number;
  gestureType?: 'touch' | 'mouse' | 'keyboard';
  error?: {
    type: SliderErrorType;
    message: string;
    stack?: string | undefined;
  };
  performance?: PerformanceMetrics;
}

/**
 * Extended performance metrics
 */
interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  /** Time to First Contentful Paint */
  FCP?: number;
  /** Largest Contentful Paint */
  LCP?: number;
  /** First Input Delay */
  FID?: number;
  /** Cumulative Layout Shift */
  CLS?: number;
  /** Time to Interactive */
  TTI?: number;
  /** Total Blocking Time */
  TBT?: number;
}

/**
 * Props for the KineticSlider component.
 */
interface KineticSliderProps {
  /** Array of React nodes or a single node to be rendered as slides */
  children: ReactNode[] | ReactNode;
  /** Optional CSS class name for the slider container */
  className?: string;
  /** Optional inline styles for the slider container */
  style?: CSSProperties;
  /** Whether the slider should loop infinitely */
  infinite?: boolean;
  /** Whether touch and mouse gestures are enabled */
  enableGestures?: boolean;
  /** Whether keyboard navigation is enabled */
  enableKeyboard?: boolean;
  /** Callback fired when the active slide changes */
  onChange?: (index: number) => void;
  /** Whether to lazy load slide content */
  lazyLoad?: boolean;
  /** Duration of slide transitions in seconds */
  duration?: number;
  /** GSAP easing function for animations */
  ease?: string;
  /** Initial active slide index */
  initialIndex?: number;
  /** Optional callback for performance metrics */
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

/**
 * Validates slider props and throws errors for invalid values
 */
const validateProps = (props: KineticSliderProps): void => {
  const { children, initialIndex = 0, duration, ease } = props;
  const slideCount = Children.count(children);

  if (slideCount === 0) {
    throw new SliderError('KineticSlider requires at least one child element');
  }

  if (initialIndex < 0 || initialIndex >= slideCount) {
    throw new SliderError(
      `Invalid initialIndex: ${initialIndex}. Must be between 0 and ${slideCount - 1}`
    );
  }

  if (duration !== undefined && (duration <= 0 || !Number.isFinite(duration))) {
    throw new SliderError(
      `Invalid duration: ${duration}. Must be a positive finite number`
    );
  }

  if (ease && typeof ease !== 'string') {
    throw new SliderError('Invalid ease: Must be a string');
  }
};

interface WindowWithAnalytics extends Window {
  analytics: {
    track: (event: string, data: Record<string, unknown>) => void;
  };
  errorTracker: {
    captureError: (error: Error, context: Record<string, unknown>) => void;
  };
  webVitals: {
    getFCP: (callback: (metric: { value: number }) => void) => void;
    getLCP: (callback: (metric: { value: number }) => void) => void;
    getFID: (callback: (metric: { value: number }) => void) => void;
    getCLS: (callback: (metric: { value: number }) => void) => void;
    getTTI: (callback: (metric: { value: number }) => void) => void;
    getTBT: (callback: (metric: { value: number }) => void) => void;
  };
}

interface GsapInstance {
  globalTimeline?: {
    clear: () => void;
  };
  ticker?: {
    remove: (fn: () => void) => void;
  };
  updateRoot?: () => void;
}

type DragEvent = (TouchEvent | MouseEvent) & {
  touches?: TouchList;
  clientX: number;
};

type DragEventType = TouchEvent | MouseEvent;
type DragEventHandler = (event: DragEventType) => void;

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
export const KineticSlider: React.FC<KineticSliderProps> = (props) => {
  const {
    children,
    className = '',
    style = {},
    infinite = false,
    enableGestures = true,
    enableKeyboard = true,
    onChange,
    lazyLoad = false,
    duration = 0.8,
    ease = 'power3.out',
    initialIndex = 0,
    onMetrics,
  } = props;

  // Validate props on mount and when they change
  useEffect(() => {
    validateProps(props);
  }, [props]);

  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rafRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const slideCount = Children.count(children);
  const slides = Children.toArray(children);

  // Prevent multiple onChange calls during rapid navigation
  const onChangeRef = useRef(onChange);
  const isAnimatingRef = useRef(isAnimating);

  useEffect(() => {
    onChangeRef.current = onChange;
    isAnimatingRef.current = isAnimating;
  }, [onChange, isAnimating]);

  // Replace the existing metricsRef with the extended version
  const metricsRef = useRef<ExtendedPerformanceMetrics>({
    initialRenderTime: 0,
    averageFrameTime: 0,
    droppedFrames: 0,
    memoryUsage: 0,
    gestureProcessingTime: 0,
    FCP: 0,
    LCP: 0,
    FID: 0,
    CLS: 0,
    TTI: 0,
    TBT: 0,
  });

  /**
   * Tracks analytics events
   */
  const trackAnalytics = useCallback((data: SliderAnalyticsData) => {
    if (typeof window !== 'undefined' && 'analytics' in window) {
      (window as unknown as WindowWithAnalytics).analytics.track(
        'KineticSlider',
        {
          ...data,
          component: 'KineticSlider',
          version: '1.0.0',
        }
      );
    }
  }, []);

  /**
   * Tracks web vitals metrics
   */
  const trackWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return;

    if ('webVitals' in window) {
      const { getFCP, getLCP, getFID, getCLS, getTTI, getTBT } = (
        window as unknown as WindowWithAnalytics
      ).webVitals;

      getFCP((metric: { value: number }) => {
        metricsRef.current.FCP = metric.value;
        onMetrics?.(metricsRef.current);
      });

      getLCP((metric: { value: number }) => {
        metricsRef.current.LCP = metric.value;
        onMetrics?.(metricsRef.current);
      });

      getFID((metric: { value: number }) => {
        metricsRef.current.FID = metric.value;
        onMetrics?.(metricsRef.current);
      });

      getCLS((metric: { value: number }) => {
        metricsRef.current.CLS = metric.value;
        onMetrics?.(metricsRef.current);
      });

      getTTI((metric: { value: number }) => {
        metricsRef.current.TTI = metric.value;
        onMetrics?.(metricsRef.current);
      });

      getTBT((metric: { value: number }) => {
        metricsRef.current.TBT = metric.value;
        onMetrics?.(metricsRef.current);
      });
    }
  }, [onMetrics]);

  // Initialize web vitals tracking
  useEffect(() => {
    trackWebVitals();
  }, [trackWebVitals]);

  // Track performance metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      trackAnalytics({
        eventType: SliderAnalyticsEvent.PERFORMANCE,
        timestamp: new Date().toISOString(),
        performance: metricsRef.current,
      });
    }, 60000); // Report every minute

    return () => clearInterval(interval);
  }, [trackAnalytics]);

  /**
   * Updates the current slide index and triggers the onChange callback.
   * Prevents multiple calls during rapid navigation.
   * @param newIndex - The new slide index to set
   */
  const handleStateUpdate = useCallback(
    (newIndex: number) => {
      if (newIndex === currentIndex) return;
      setCurrentIndex(newIndex);
      onChangeRef.current?.(newIndex);

      // Track analytics
      trackAnalytics({
        eventType: SliderAnalyticsEvent.SLIDE_CHANGE,
        timestamp: new Date().toISOString(),
        slideIndex: newIndex,
      });
    },
    [currentIndex, trackAnalytics]
  );

  // Initialize GSAP timeline with optimized settings
  useEffect(() => {
    if (containerRef.current) {
      // Kill any existing animations
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      // Create new timeline with optimized settings
      const timeline = gsap.timeline({
        defaults: {
          duration: 0.8,
          ease: 'power3.out',
          force3D: true,
          lazy: false,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        },
        onComplete: () => {
          handleStateUpdate(currentIndex);
          // Clean up memory
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        },
      });

      // Optimize animation by using transform3d
      if (containerRef.current) {
        const container = containerRef.current as HTMLDivElement;
        timeline.to(container, {
          x: -currentIndex * container.offsetWidth,
          transformPerspective: 1000,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        });
      }

      timelineRef.current = timeline;
    }

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [currentIndex, handleStateUpdate]);

  /**
   * Handles window resize events and updates slide positions.
   * Uses GSAP quickSetter for optimized performance.
   * Debounced to prevent excessive updates.
   */
  const handleResize = useCallback(() => {
    if (!containerRef.current || !slidesRef.current || slideCount === 0) return;

    const containerWidth = containerRef.current.offsetWidth;

    // Update slide positions using quickSetter for better performance
    const slides = slidesRef.current.children;
    gsap.set(slides, {
      width: containerWidth,
      left: (i) => `${i * 100}%`,
      force3D: true,
      lazy: true,
    });

    // Update container position using quickSetter
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = gsap.timeline({
        defaults: {
          duration: 0.8,
          ease: 'power3.out',
        },
        onComplete: () => {
          handleStateUpdate(currentIndex);
          // Clean up memory
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        },
      });
      if (containerRef.current) {
        const container = containerRef.current as HTMLDivElement;
        timelineRef.current?.to(container, {
          x: -currentIndex * container.offsetWidth,
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        });
      }
    }
  }, [currentIndex, slideCount, handleStateUpdate]);

  // Debounced resize handler with increased delay for better performance
  const debouncedResize = useMemo(
    () => debounce(handleResize, 32),
    [handleResize]
  );

  // Initialize ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(debouncedResize);
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      debouncedResize.cancel();
    };
  }, [debouncedResize]);

  // Use layout effect for smoother animations
  useLayoutEffect(() => {
    if (!containerRef.current || !slidesRef.current || slideCount === 0) return;

    // Position all slides with hardware acceleration
    const slides = slidesRef.current.children;
    gsap.set(slides, {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: (i) => `${i * 100}%`,
      force3D: true,
      backfaceVisibility: 'hidden',
      perspective: 1000,
    });

    // Position the container using quickSetter
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = gsap.timeline({
        defaults: {
          duration: 0.8,
          ease: 'power3.out',
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        },
        onComplete: () => {
          handleStateUpdate(currentIndex);
          // Clean up memory
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        },
      });

      if (containerRef.current) {
        const container = containerRef.current as HTMLDivElement;
        timelineRef.current?.to(container, {
          x: -currentIndex * container.offsetWidth,
          force3D: true,
          transformPerspective: 1000,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        });
      }
    }

    return () => {
      gsap.killTweensOf(slides);
      gsap.killTweensOf(slidesRef.current);
    };
  }, [slideCount, currentIndex, handleStateUpdate]);

  /**
   * Animates the slider to a specific slide index.
   * @param targetIndex - The target slide index
   * @param speed - Optional speed multiplier for animation
   */
  const animateToSlide = useCallback(
    (targetIndex: number, speed: number = 1) => {
      if (!containerRef.current || isAnimating) return;

      let finalIndex = targetIndex;
      if (infinite) {
        // Handle infinite scrolling
        if (targetIndex < 0) {
          finalIndex = slideCount - 1;
        } else if (targetIndex >= slideCount) {
          finalIndex = 0;
        }
      } else {
        // Clamp index within bounds
        finalIndex = Math.max(0, Math.min(targetIndex, slideCount - 1));
      }

      const container = containerRef.current;
      const targetX = -finalIndex * container.offsetWidth;

      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      timelineRef.current = gsap.timeline({
        defaults: {
          duration: duration * speed,
          ease,
        },
        onComplete: () => {
          handleStateUpdate(finalIndex);
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        },
      });

      timelineRef.current.to(container, {
        x: targetX,
        force3D: true,
        lazy: true,
        clearProps: 'transform',
        overwrite: true,
        immediateRender: true,
      });
    },
    [duration, ease, handleStateUpdate, infinite, slideCount, isAnimating]
  );

  // Frame throttling for smoother animations
  const throttleFrame = useCallback((callback: () => void) => {
    let ticking = false;
    return () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
      }
    };
  }, []);

  // Optimized RAF handler with throttling and memory management
  const rafDragHandler = useCallback(
    (newPos: number, dragState: DragState) => {
      if (!dragState.quickSetter) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }

      // Batch DOM reads and writes with minimal reflows
      const updateTransform = throttleFrame(() => {
        if (!dragState.quickSetter) return;

        // Read phase - batch all DOM reads
        const container = containerRef.current;
        if (!container) return;

        // Write phase - batch all DOM writes
        dragState.quickSetter(newPos);

        // Use minimal transform properties
        gsap.set(container, {
          x: newPos,
          force3D: true,
          transformPerspective: 1000,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          overwrite: 'auto',
          immediateRender: true,
        });
      });

      rafRef.current = requestAnimationFrame(updateTransform);
    },
    [throttleFrame]
  );

  // Handle drag with optimized performance and memory management
  const handleDrag = useCallback(
    (event: DragEvent) => {
      const startTime = performance.now();
      const dragState = dragRef.current;
      const container = containerRef.current;
      if (
        !enableGestures ||
        !isDragging ||
        !container ||
        !dragState?.quickSetter
      )
        return;

      const clientX = event.touches?.[0]?.clientX ?? event.clientX;
      const deltaX = clientX - (dragState?.currentX || 0);

      // Update velocity with optimized smoothing
      velocityRef.current = deltaX * 0.4 + (velocityRef.current || 0) * 0.6;

      // Calculate new position with bounds checking
      const containerWidth = container.offsetWidth;
      const currentPos = -currentIndex * containerWidth;
      const newPos = Math.max(
        Math.min(currentPos + deltaX, 0),
        -(slideCount - 1) * containerWidth
      );

      // Use RAF for smoother performance
      if (dragState) {
        rafDragHandler(newPos, dragState);
        dragState.currentX = clientX;
      }

      // Create or update timeline for drag animation with minimal properties
      if (!timelineRef.current) {
        const timeline = gsap.timeline({
          defaults: {
            duration: 0.1,
            ease: 'none',
            force3D: true,
            lazy: true,
            clearProps: 'transform',
            overwrite: 'auto',
            immediateRender: true,
          },
          paused: true,
          onComplete: () => {
            if (timelineRef.current) {
              timelineRef.current.kill();
              timelineRef.current = null;
            }
          },
        });

        timeline.to(container, {
          x: newPos,
          force3D: true,
          transformPerspective: 1000,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          immediateRender: true,
        });

        timelineRef.current = timeline;
        timeline.play();
      }

      metricsRef.current.gestureProcessingTime = performance.now() - startTime;
      onMetrics?.(metricsRef.current);
    },
    [
      enableGestures,
      isDragging,
      currentIndex,
      slideCount,
      rafDragHandler,
      onMetrics,
    ]
  );

  // Handle drag start with optimized settings
  const handleDragStart = useCallback(
    (event: DragEvent) => {
      if (!enableGestures || isAnimating) return;

      const clientX = event.touches?.[0]?.clientX ?? event.clientX;
      const container = containerRef.current;
      if (!container) return;

      // Track analytics
      const gestureType = event.touches ? 'touch' : 'mouse';
      trackAnalytics({
        eventType: SliderAnalyticsEvent.GESTURE_START,
        timestamp: new Date().toISOString(),
        gestureType,
      });

      // Create new drag state with optimized settings
      const newDragState: DragState = {
        startX: clientX,
        currentX: clientX,
        quickSetter: gsap.quickSetter(container, 'x', 'px'),
        timeline: null,
      };
      dragRef.current = newDragState;

      setIsDragging(true);
      velocityRef.current = 0;

      // Kill any existing animations
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      // Optimize container for animations
      gsap.set(container, {
        force3D: true,
        transformPerspective: 1000,
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      });
    },
    [enableGestures, isAnimating, trackAnalytics]
  );

  // Gesture handling utilities
  const getPosition = useCallback(() => {
    if (!containerRef.current) return 0;
    const transform = window.getComputedStyle(containerRef.current).transform;
    const matrix = new DOMMatrix(transform);
    return matrix.m41; // Get X translation
  }, []);

  const threshold = useMemo(() => {
    if (!containerRef.current) return 0;
    return containerRef.current.offsetWidth * 0.2; // 20% of container width
  }, []);

  const resetPosition = useCallback(() => {
    if (!containerRef.current || !timelineRef.current) return;
    timelineRef.current.kill();
    gsap.set(containerRef.current, { clearProps: 'transform' });
  }, []);

  const handleGestureEnd = useCallback(() => {
    const currentPos = getPosition();
    const direction = currentPos > 0 ? -1 : 1;
    if (Math.abs(currentPos) > threshold) {
      animateToSlide(
        currentIndex + direction,
        Math.abs(currentPos / threshold)
      );
    } else {
      // Reset to original position if threshold not met
      animateToSlide(currentIndex, 1);
    }
    resetPosition();
  }, [getPosition, threshold, currentIndex, animateToSlide, resetPosition]);

  /**
   * Handles keyboard navigation events.
   * Supports arrow keys and tab navigation.
   * @param e - The keyboard event
   */
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

  // Virtualization window calculation
  const visibleSlides = useMemo(() => {
    if (!lazyLoad) return Children.toArray(children);

    const window = 1; // Load one slide before and after
    const start = Math.max(0, currentIndex - window);
    const end = Math.min(slideCount - 1, currentIndex + window);

    return Children.toArray(children).slice(start, end + 1);
  }, [children, currentIndex, lazyLoad, slideCount]);

  // Memory cleanup on unmount with optimized cleanup
  useEffect(() => {
    return () => {
      // Clean up container
      if (containerRef.current) {
        gsap.killTweensOf(containerRef.current);
        gsap.set(containerRef.current, { clearProps: 'all' });
        containerRef.current = null;
      }
      slidesRef.current = null;

      // Clean up resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      // Clean up GSAP memory safely
      const gsapInstance = gsap as unknown as GsapInstance;
      if (gsapInstance.globalTimeline?.clear) {
        gsapInstance.globalTimeline.clear();
      }
      if (gsapInstance.ticker?.remove && gsapInstance.updateRoot) {
        gsapInstance.ticker.remove(gsapInstance.updateRoot);
      }
    };
  }, []);

  // Optimize event listeners with cleanup and throttle drag events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastDragTime = 0;
    const THROTTLE_MS = 16; // ~60fps

    /**
     * Throttled drag handler for smooth gesture interactions.
     * Uses requestAnimationFrame for optimal performance.
     */
    const throttledDrag: DragEventHandler = (e) => {
      const now = performance.now();
      if (now - lastDragTime >= THROTTLE_MS) {
        handleDrag(e as DragEvent);
        lastDragTime = now;
      }
    };

    const handlers = {
      touchStart: (e: TouchEvent) => handleDragStart(e as DragEvent),
      mouseDown: (e: MouseEvent) => handleDragStart(e as DragEvent),
      touchMove: throttledDrag,
      mouseMove: throttledDrag,
      touchEnd: () => handleGestureEnd(),
      mouseUp: () => handleGestureEnd(),
    };

    // Add event listeners with passive option for better performance
    container.addEventListener('touchstart', handlers.touchStart, {
      passive: true,
    });
    container.addEventListener('mousedown', handlers.mouseDown);
    window.addEventListener('touchmove', handlers.touchMove, { passive: true });
    window.addEventListener('mousemove', handlers.mouseMove);
    window.addEventListener('touchend', handlers.touchEnd);
    window.addEventListener('mouseup', handlers.mouseUp);

    return () => {
      // Remove event listeners
      container.removeEventListener('touchstart', handlers.touchStart);
      container.removeEventListener('mousedown', handlers.mouseDown);
      window.removeEventListener('touchmove', handlers.touchMove);
      window.removeEventListener('mousemove', handlers.mouseMove);
      window.removeEventListener('touchend', handlers.touchEnd);
      window.removeEventListener('mouseup', handlers.mouseUp);
    };
  }, [handleDragStart, handleDrag, handleGestureEnd]);

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());

  /**
   * Updates performance metrics during animations
   */
  const updateMetrics = useCallback(() => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTimeRef.current;

    // Track frame times for average calculation
    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) {
      // Keep last 60 frames
      frameTimesRef.current.shift();
    }

    // Calculate average frame time
    const averageFrameTime =
      frameTimesRef.current.reduce((a, b) => a + b, 0) /
      frameTimesRef.current.length;

    // Count dropped frames (frames taking longer than 16.67ms)
    const droppedFrames = frameTimesRef.current.filter(
      (time) => time > 16.67
    ).length;

    // Update metrics
    metricsRef.current = {
      ...metricsRef.current,
      averageFrameTime,
      droppedFrames,
      memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
    };

    // Report metrics if callback provided
    onMetrics?.(metricsRef.current);

    lastFrameTimeRef.current = currentTime;
  }, [onMetrics]);

  // Track initial render time
  useEffect(() => {
    const renderStart = performance.now();

    return () => {
      metricsRef.current.initialRenderTime = performance.now() - renderStart;
      onMetrics?.(metricsRef.current);
    };
  }, [onMetrics]);

  // Update metrics during animations
  useEffect(() => {
    if (!isAnimating) return;

    const rafCallback = () => {
      updateMetrics();
      rafRef.current = requestAnimationFrame(rafCallback);
    };

    rafRef.current = requestAnimationFrame(rafCallback);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [isAnimating, updateMetrics]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.eventCallback('onStart', () => setIsAnimating(true));
      timelineRef.current.eventCallback('onComplete', () =>
        setIsAnimating(false)
      );
    }
  }, [timelineRef]);

  return (
    <SliderErrorBoundary>
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
            willChange: 'transform',
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
    </SliderErrorBoundary>
  );
};

// Default export with display name for better debugging
KineticSlider.displayName = 'KineticSlider';
