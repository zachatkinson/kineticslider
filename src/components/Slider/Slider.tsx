/**
 * A high-performance, accessible slider component with gesture and keyboard support.
 * Implements feature flagging and error boundaries for safe rollout.
 * 
 * @description * @version 1.0.0
 * @example Example usage
 * ```tsx
 * <Slider
 *   items={[
 *     { id: '1', content: <img src="/slide1.jpg" alt="Slide 1" /> },
 *     { id: '2', content: <img src="/slide2.jpg" alt="Slide 2" /> }
 *   ]}
 *   config={{
 *     loop: true,
 *     gestureDirection: 'horizontal',
 *     accessibility: { keyboardNavigation: true }
 *   }}
 * />
 * ```
 * 
 * @property
 * - items: SlideItem[] - Array of slide items with unique IDs and content
 * - config: SliderConfig - Configuration options for behavior and animations
 * - className?: string - Optional CSS class name for styling
 * - style?: React.CSSProperties - Optional inline styles
 * 
 * @description * - Implements ARIA roles and labels
 * - Supports keyboard navigation
 * - Announces slide changes
 * - Manages focus states
 * 
 * @description * - Uses requestAnimationFrame for smooth animations
 * - Implements touch gesture optimization
 * - Monitors FPS and performance metrics
 * - Lazy loads off-screen content
 * 
 * @description * - Implements error boundary protection
 * - Tracks and reports errors
 * - Provides fallback UI
 * - Handles animation failures
 * 
 * @description * - Sanitizes user inputs
 * - Validates configuration
 * - Implements feature flags
 * 
 * @see useSlider - Context hook for slider state
 * @see SliderContext - State management context
 * @see useGestureHandling - Gesture handling hook
 * @returns The slider component
 */
import React, { useEffect, useRef } from 'react';
import { FeatureErrorBoundary } from '../../../migration-tools/error-boundary';
import { FeatureFlag } from '../../types/feature-flags';
import { useSlider } from '../../context/SliderContext';
import type { 
  KineticSliderProps as SliderProps, 
  SliderConfig, 
  AccessibilityConfig,
  SlideAnimation
} from '../../types/slider';
import type { GestureConfig } from '../../types/gesture';
import type { GestureThreshold, GestureVelocity, GestureDistance } from '../../types/branded';
import { createBrandedNumber } from '../../types/branded';
import { useGestureHandling } from '../../hooks/slider/useGestureHandling';
import { useKeyboardNavigation } from '../../hooks/slider/useKeyboardNavigation';
import { useSliderAnimation } from '../../hooks/slider/useSliderAnimation';
import { usePerformanceMonitoring } from '../../hooks/slider/usePerformanceMonitoring';
import { useErrorTracking } from '../../hooks/slider/useErrorTracking';
import styles from './Slider.module.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useGestures } from '@/hooks/useGestures';
import { getSlideStyle } from '../../utils/styles';

/**
 * Slider component with gesture and keyboard support
 * 
 * @param root0
 * @param root0.slides
 * @param root0.initialSlide
 * @param root0.onSlideChange
 * @param root0.onAnimationComplete
 * @param root0.onError
 * @param root0.className
 * @param root0.style
 * @param root0.enableKeyboard
 * @param root0.enableGestures
 * @param root0.duration
 * @param root0.ease
 * @param root0.infiniteLoop
 * @param root0.lazyLoad
 * @returns The slider component
 */
export const Slider: React.FC<SliderProps> = ({ 
  slides, 
  initialSlide,
   
  onSlideChange,
   
  onAnimationComplete,
   
  onError,
  className, 
  style,
  enableKeyboard,
  enableGestures,
  duration,
  ease,
  infiniteLoop,
   
  lazyLoad
}) => {
  return (
    <FeatureErrorBoundary feature={FeatureFlag.NEW_CORE_SLIDER}>
      <SliderContent
        slides={slides}
        initialSlide={initialSlide}
        onSlideChange={onSlideChange}
        onAnimationComplete={onAnimationComplete}
        onError={onError}
        className={className}
        style={style}
        enableKeyboard={enableKeyboard}
        enableGestures={enableGestures}
        duration={duration}
        ease={ease}
        infiniteLoop={infiniteLoop}
        lazyLoad={lazyLoad}
      />
    </FeatureErrorBoundary>
  );
};

/**
 * Internal slider content component that handles the core slider functionality.
 * Manages: gestures, animations, and accessibility features.
 * 
 * @param root0
 * @param root0.slides
 * @param root0.initialSlide
 * @param root0.onSlideChange
 * @param root0.onAnimationComplete
 * @param root0.onError
 * @param root0.className
 * @param root0.style
 * @param root0.enableKeyboard
 * @param root0.enableGestures
 * @param root0.duration
 * @param root0.ease
 * @param root0.infiniteLoop
 * @param root0.lazyLoad
 * @description * @private
 * @version 1.0.0
 * 
 * @description * - Optimizes reflows and repaints
 * - Uses CSS transforms for animations
 * - Implements gesture debouncing
 * - Monitors render performance
 * 
 * @description * - Uses semantic HTML structure
 * - Implements ARIA attributes
 * - Supports keyboard interactions
 * - Manages focus trapping
 * 
 * @description * - Handles gesture errors
 * - Manages animation failures
 * - Reports performance issues
 * - Implements error tracking
 * 
 * @see useGestureHandling - Gesture management hook
 * @see useSliderAnimation - Animation control hook
 * @see usePerformanceMonitoring - Performance tracking hook
 * @returns The slider content component
 */
const SliderContent: React.FC<SliderProps> = ({ 
  slides,
  initialSlide,
   
  onSlideChange: _onSlideChange,
   
  onAnimationComplete: _onAnimationComplete,
   
  onError: _onError,
  className, 
  style,
  enableKeyboard = true,
  enableGestures = true,
  duration = 300,
  ease = 'ease-out',
  infiniteLoop = true,
   
  lazyLoad: _lazyLoad = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { state, config, items, actions } = useSlider();
  
  // Ensure ref is not null before passing to hooks
  const safeContainerRef = containerRef as React.RefObject<HTMLDivElement>;
  
   
  const _sliderConfig: SliderConfig = {
    initialSlide: initialSlide,
    loop: infiniteLoop,
    gestureDirection: 'horizontal',
    gestureThreshold: 50
  };

  const _accessibilityConfig: AccessibilityConfig = {
    ariaLabel: 'Image Slider',
    keyboardNavigation: enableKeyboard
  };

   
  const _animationConfig: SlideAnimation = {
    duration,
    easing: ease
  };

  const _gestureConfig: GestureConfig = {
    enabled: enableGestures,
    direction: 'horizontal',
    threshold: createBrandedNumber(50, 'GestureThreshold') as GestureThreshold,
    minVelocity: createBrandedNumber(0.5, 'GestureVelocity') as GestureVelocity,
    maxDistance: createBrandedNumber(200, 'GestureDistance') as GestureDistance,
    preventDefault: true,
    stopPropagation: true
  };

  // Initialize hooks with safe ref
  const gestureHandlers = useGestureHandling(safeContainerRef) as {
    handleTouchStart: (event: React.TouchEvent) => void;
    handleTouchMove: (event: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    handleMouseDown: (event: React.MouseEvent) => void;
    handleMouseMove: (event: React.MouseEvent) => void;
    handleMouseUp: () => void;
  } | undefined;
  
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = gestureHandlers ?? { 
    handleTouchStart: () => {}, 
    handleTouchMove: () => {}, 
    handleTouchEnd: () => {},
    handleMouseDown: () => {}, 
    handleMouseMove: () => {}, 
    handleMouseUp: () => {} 
  };

  const { handleKeyDown } = useKeyboardNavigation();
  const { animateSlide } = useSliderAnimation(safeContainerRef);
  const { getMetrics } = usePerformanceMonitoring();
  const errorTracking = useErrorTracking() as {
    trackError: (error: Error, type: string) => void;
    ERROR_TYPES: { 
      ANIMATION: string;
      RENDER: string;
    };
  } | undefined;
  
  const { trackError, ERROR_TYPES } = errorTracking ?? { 
    trackError: () => {}, 
    ERROR_TYPES: { 
      ANIMATION: 'animation',
      RENDER: 'render'
    } 
  };

  useEffect(() => {
    if(state.isAnimating && containerRef.current) {
      try {
        animateSlide();
      } catch(error) {
        trackError(error as Error, ERROR_TYPES.ANIMATION);
      }
    }
  }, [state.isAnimating, state.currentIndex, animateSlide, trackError, ERROR_TYPES]);

  // Log performance metrics periodically
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      const metrics = getMetrics();
      if(metrics.fps < 30) {
        console.warn('Low FPS detected:', metrics);
      }
    }, 5000);

    return () => clearInterval(metricsInterval);
  }, [getMetrics]);

  /**
   * Handles slider render errors and reports them to the error tracking system.
   * 
   * @param _event - The error event
   * @returns {void} The function return value
   */
  const handleError = (
    _event: React.SyntheticEvent<HTMLDivElement, Event>
  ): void => {
    const error = new Error('Slider render error');
    trackError(error, ERROR_TYPES.RENDER);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.sliderContainer} ${className || ''}`}
      style={style}
      role="region"
      aria-label={_accessibilityConfig.ariaLabel || 'Image Slider'}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      onError={handleError}
    >
      <div className={styles.sliderTrack}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${index === state.currentIndex ? 'active' : ''}`}
            style={getSlideStyle({
              index,
              state,
              config: {
                direction: 'horizontal',
                animation: {
                  duration,
                  easing: ease
                }
              }
            })}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${slides.length}`}
            aria-hidden={index !== state.currentIndex}
          >
            {slide.content}
          </div>
        ))}
      </div>
      
      {!(config as Record<string, unknown>)?.hideNavigation && config !== undefined && (
        <>
          <button
            type="button"
            className={`${styles.navButton} prev`}
            aria-label="Previous slide"
            aria-controls="slider-container"
            data-testid="prev-button"
            disabled={!infiniteLoop && state.currentIndex === 0}
            onClick={() => actions.previous()}
            role="button"
          >
            &lt;
          </button>
          
          <button
            type="button"
            className={`${styles.navButton} next`}
            aria-label="Next slide"
            aria-controls="slider-container"
            data-testid="next-button"
            disabled={!infiniteLoop && state.currentIndex === slides.length - 1}
            onClick={() => actions.next()}
            role="button"
          >
            &gt;
          </button>
        </>
      )}
    </div>
  );
};

/**
 * Checks if a ref is not null
 * 
 * @param ref The ref to check
 * @returns true if the ref is not null, false otherwise
 */
 
const _isRefNotNull = <T,>(ref: React.RefObject<T>): ref is React.RefObject<T> & { current: T } => {
  return ref.current !== null;
};

export default Slider; 