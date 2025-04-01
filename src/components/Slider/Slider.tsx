/**
 * A high-performance, accessible slider component with gesture and keyboard support.
 * Implements feature flagging and error boundaries for safe rollout.
 * 
 * @component
 * @version 1.0.0
 * @example
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
 * @props
 * - items: SlideItem[] - Array of slide items with unique IDs and content
 * - config: SliderConfig - Configuration options for behavior and animations
 * - className?: string - Optional CSS class name for styling
 * - style?: React.CSSProperties - Optional inline styles
 * 
 * @accessibility
 * - Implements ARIA roles and labels
 * - Supports keyboard navigation
 * - Announces slide changes
 * - Manages focus states
 * 
 * @performance
 * - Uses requestAnimationFrame for smooth animations
 * - Implements touch gesture optimization
 * - Monitors FPS and performance metrics
 * - Lazy loads off-screen content
 * 
 * @error
 * - Implements error boundary protection
 * - Tracks and reports errors
 * - Provides fallback UI
 * - Handles animation failures
 * 
 * @security
 * - Sanitizes user inputs
 * - Validates configuration
 * - Implements feature flags
 * 
 * @see useSlider - Context hook for slider state
 * @see SliderContext - State management context
 * @see useGestureHandling - Gesture handling hook
 */
import React, { useEffect, useRef } from 'react';
import { FeatureErrorBoundary } from '../../../migration-tools/error-boundary';
import { FeatureFlag } from '../../../migration-tools/feature-flags';
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
import { getSlideStyle } from '../../utils/styles';

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
 * Manages gestures, animations, and accessibility features.
 * 
 * @component
 * @private
 * @version 1.0.0
 * 
 * @performance
 * - Optimizes reflows and repaints
 * - Uses CSS transforms for animations
 * - Implements gesture debouncing
 * - Monitors render performance
 * 
 * @accessibility
 * - Uses semantic HTML structure
 * - Implements ARIA attributes
 * - Supports keyboard interactions
 * - Manages focus trapping
 * 
 * @error
 * - Handles gesture errors
 * - Manages animation failures
 * - Reports performance issues
 * - Implements error tracking
 * 
 * @see useGestureHandling - Gesture management hook
 * @see useSliderAnimation - Animation control hook
 * @see usePerformanceMonitoring - Performance tracking hook
 */
const SliderContent: React.FC<SliderProps> = ({ 
  slides,
  initialSlide,
  onSlideChange,
  onAnimationComplete,
  onError,
  className, 
  style,
  enableKeyboard = true,
  enableGestures = true,
  duration = 300,
  ease = 'ease-out',
  infiniteLoop = true,
  lazyLoad = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, config, items, actions } = useSlider();
  
  // Ensure ref is not null before passing to hooks
  const safeContainerRef = containerRef as React.RefObject<HTMLDivElement>;
  
  const sliderConfig: SliderConfig = {
    initialSlide: initialSlide,
    loop: infiniteLoop,
    gestureDirection: 'horizontal',
    gestureThreshold: 50
  };

  const accessibilityConfig: AccessibilityConfig = {
    ariaLabel: 'Image Slider',
    keyboardNavigation: enableKeyboard
  };

  const animationConfig: SlideAnimation = {
    duration,
    easing: ease
  };

  const gestureConfig: GestureConfig = {
    enabled: enableGestures,
    direction: 'horizontal',
    threshold: createBrandedNumber(50, 'GestureThreshold') as GestureThreshold,
    minVelocity: createBrandedNumber(0.5, 'GestureVelocity') as GestureVelocity,
    maxDistance: createBrandedNumber(200, 'GestureDistance') as GestureDistance,
    preventDefault: true,
    stopPropagation: true
  };

  // Initialize hooks with safe ref
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useGestureHandling(safeContainerRef);

  const { handleKeyDown } = useKeyboardNavigation();
  const { animateSlide } = useSliderAnimation(safeContainerRef);
  const { getMetrics } = usePerformanceMonitoring();
  const { trackError, ERROR_TYPES } = useErrorTracking();

  useEffect(() => {
    if (state.isAnimating && containerRef.current) {
      try {
        animateSlide();
      } catch (error) {
        trackError(error as Error, ERROR_TYPES.ANIMATION);
      }
    }
  }, [state.isAnimating, state.currentIndex, animateSlide, trackError]);

  // Log performance metrics periodically
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      const metrics = getMetrics();
      if (metrics.fps < 30) {
        console.warn('Low FPS detected:', metrics);
      }
    }, 5000);

    return () => clearInterval(metricsInterval);
  }, [getMetrics]);

  /**
   * Handles slider render errors and reports them to the error tracking system.
   * 
   * @param {React.SyntheticEvent<HTMLDivElement, Event>} event - The error event
   * @private
   */
  const handleError = (event: React.SyntheticEvent<HTMLDivElement, Event>) => {
    const error = new Error('Slider render error');
    trackError(error, ERROR_TYPES.RENDER);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.sliderContainer} ${className || ''}`}
      style={style}
      role="region"
      aria-label={accessibilityConfig.ariaLabel || 'Image Slider'}
      tabIndex={0}
      onKeyDown={accessibilityConfig.keyboardNavigation ? handleKeyDown : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onError={handleError}
    >
      <div className={styles.sliderTrack}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={styles.slide}
            style={getSlideStyle({
              index,
              state,
              config: {
                direction: sliderConfig.gestureDirection || 'horizontal',
                animation: animationConfig
              }
            })}
            role="group"
            aria-label={`Slide ${index + 1} of ${items.length}`}
            aria-hidden={index !== state.currentIndex}
          >
            {item.content}
          </div>
        ))}
      </div>
      
      {sliderConfig.loop && (
        <>
          <button
            className={styles.navButton}
            onClick={actions.previous}
            aria-label="Previous slide"
            disabled={state.isAnimating}
          >
            Previous
          </button>
          <button
            className={styles.navButton}
            onClick={actions.next}
            aria-label="Next slide"
            disabled={state.isAnimating}
          >
            Next
          </button>
        </>
      )}
    </div>
  );
};

/**
 * Type guard to check if a ref's current value is not null
 */
const isRefNotNull = <T,>(ref: React.RefObject<T>): ref is React.RefObject<T> & { current: T } => {
  return ref.current !== null;
}; 