/**
 * @fileoverview KineticSlider React Component
 *
 * The main React component that users import to use KineticSlider in their applications.
 * This is a clean, reusable component without demo-specific UI.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createKineticSlider, SliderEngine } from '../index';
import type { SliderConfig, AccessibilityConfig } from '../core/types';

export interface KineticSliderProps
  extends Omit<Partial<SliderConfig>, 'images'> {
  /** Array of image sources - can be simple src strings or full SlideData objects */
  images: Array<{ src: string; id?: string; alt?: string; title?: string }>;
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Callback when slide changes */
  onSlideChange?: (data: {
    currentIndex: number;
    previousIndex: number;
  }) => void;
  /** Callback when play state changes */
  onPlayStateChange?: (data: { isPlaying: boolean }) => void;
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
  /** Callback for accessibility events */
  onAccessibilityEvent?: (event: { type: string; data?: unknown }) => void;
  /** Additional props passed to the container */
  [key: string]: unknown;
}

/**
 * KineticSlider React Component
 *
 * A high-performance image slider with physics-based animations.
 *
 * @example
 * ```tsx
 * import { KineticSlider } from 'kinetic-slider';
 *
 * function MyApp() {
 *   const images = [
 *     { src: '/image1.jpg' },
 *     { src: '/image2.jpg' }
 *   ];
 *
 *   return (
 *     <KineticSlider
 *       images={images}
 *       autoPlay={true}
 *       loop={true}
 *       onSlideChange={(data) => console.log('Slide changed:', data)}
 *     />
 *   );
 * }
 * ```
 */
export function KineticSlider({
  images,
  autoPlay = false,
  loop = true,
  autoPlayInterval = 3000,
  physics = {
    transitionDuration: 0.3,
    transitionEase: 'power2.out',
    scaleIntensity: 0.1,
    swipeThreshold: 50,
    momentumDamping: 0.8,
  },
  rendering = { width: 800, height: 400, backgroundColor: 0x000000 },
  accessibility,
  className,
  style,
  onSlideChange,
  onPlayStateChange,
  onAccessibilityEvent,
  ...props
}: KineticSliderProps): React.JSX.Element {
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderEngine = useRef<SliderEngine | null>(null);

  // Handle slider events
  const handleSlideChanged = useCallback(
    (data: { currentIndex: number; previousIndex: number }) => {
      if (onSlideChange) {
        const currentIndex = sliderEngine.current?.getCurrentIndex() || 0;
        const previousIndex = data.previousIndex || 0;
        onSlideChange({ currentIndex, previousIndex });
      }
    },
    [onSlideChange]
  );

  const handlePlayStateChanged = useCallback(
    (...args: unknown[]) => {
      const data = args[0] as { isPlaying: boolean };
      if (onPlayStateChange) {
        onPlayStateChange(data);
      }
    },
    [onPlayStateChange]
  );

  const handleAccessibilityEvent = useCallback(
    (...args: unknown[]) => {
      const event = args[0] as { type: string; data?: unknown };
      if (onAccessibilityEvent) {
        onAccessibilityEvent(event);
      }
    },
    [onAccessibilityEvent]
  );

  // Initialize slider
  useEffect(() => {
    const initializeSlider = async (): Promise<void> => {
      if (!sliderRef.current || !images.length) return;

      try {
        // Create slider instance
        const slider = createKineticSlider();
        sliderEngine.current = slider;

        // Configuration
        const config: SliderConfig = {
          slides: images.map((img, index) => ({
            id: img.id || `slide-${index}`,
            src: img.src,
            alt: img.alt || `Slide ${index + 1}`,
            title: img.title,
          })),
          autoPlay,
          loop,
          duration: autoPlayInterval,
          physics,
          rendering,
          accessibility: accessibility || {
            screenReader: true,
            keyboardNavigation: true,
            focusManagement: {
              autoFocus: true,
              trapFocus: false,
            },
            ariaLabels: {
              sliderLabel: `Image carousel with ${images.length} slides`,
              slideLabel: 'Slide {index} of {total}',
            },
          },
        };

        // Set up event listeners
        slider.on('slideChanged', (...args: unknown[]) => {
          const data = args[0] as {
            currentIndex: number;
            previousIndex: number;
          };
          handleSlideChanged(data);
        });
        slider.on('playStateChanged', (...args: unknown[]) =>
          handlePlayStateChanged(...args)
        );

        // Set up accessibility event listeners
        const accessibilityEvents = [
          'accessibilityInitialized',
          'accessibilityKeyboardEvent',
          'accessibilitySlideAnnounced',
          'accessibilityMotionReduced',
          'accessibilityFocusChanged',
        ];

        accessibilityEvents.forEach((eventName) => {
          slider.on(eventName, (...args: unknown[]) => {
            handleAccessibilityEvent({ type: eventName, data: args[0] });
          });
        });

        // Initialize slider
        await slider.initialize(config, sliderRef.current);
      } catch {
        // Slider initialization failed - component will render empty container
      }
    };

    initializeSlider();

    return (): void => {
      if (sliderEngine.current) {
        sliderEngine.current.destroy();
        sliderEngine.current = null;
      }
    };
  }, [
    images,
    autoPlay,
    loop,
    autoPlayInterval,
    physics,
    rendering,
    accessibility,
    handleSlideChanged,
    handlePlayStateChanged,
    handleAccessibilityEvent,
  ]);

  return (
    <div
      ref={sliderRef}
      className={className}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
        outline: 'none',
        ...style,
      }}
      role="region"
      aria-label={
        accessibility?.ariaLabels?.sliderLabel ||
        `Image carousel with ${images.length} slides`
      }
      tabIndex={0}
      {...props}
    />
  );
}

export default KineticSlider;
