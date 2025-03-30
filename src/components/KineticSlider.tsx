import React, { MouseEvent, TouchEvent } from 'react';

import { useKineticSlider } from '../hooks/useKineticSlider';
import type { KineticSliderProps, Slide } from '../types/slider';
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
  onAnimationComplete,
  duration = 0.5,
  ease = 'power2.out',
}) => {
  const { currentSlide, isAnimating, next, prev, handleGesture, sliderRef } =
    useKineticSlider({
      slides,
      duration,
      ease,
      initialSlide,
      onSlideChange: onSlideChange || undefined,
      onAnimationComplete: onAnimationComplete || undefined,
    });

  // Convert DOM events to format expected by handleGesture
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>): void => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (touch) {
        handleGesture({
          clientX: touch.clientX,
          clientY: touch.clientY,
          type: 'touchmove',
        });
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>): void => {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      if (touch) {
        handleGesture({
          clientX: touch.clientX,
          clientY: touch.clientY,
          type: 'touchend',
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    handleGesture({
      clientX: e.clientX,
      clientY: e.clientY,
      type: 'mousemove',
    });
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>): void => {
    handleGesture({
      clientX: e.clientX,
      clientY: e.clientY,
      type: 'mouseup',
    });
  };

  const renderSlide = (slide: Slide): JSX.Element => (
    <div key={slide.id} className="kinetic-slider__slide">
      <img
        src={slide.image}
        alt={slide.alt}
        className="kinetic-slider__image"
      />
      <div className="kinetic-slider__content">
        <h2 className="kinetic-slider__title">{slide.title}</h2>
        <p className="kinetic-slider__description">{slide.description}</p>
      </div>
    </div>
  );

  if (!slides?.length) return null;

  return (
    <ErrorBoundary>
      <div
        className="kinetic-slider"
        role="region"
        aria-roledescription="carousel"
        aria-label="Image slider"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="kinetic-slider__controls">
          <button
            className="kinetic-slider__control kinetic-slider__control--prev"
            onClick={prev}
            disabled={isAnimating || currentSlide <= 0}
            aria-label="Previous slide"
          >
            &lt;
          </button>
          <button
            className="kinetic-slider__control kinetic-slider__control--next"
            onClick={next}
            disabled={isAnimating || currentSlide >= slides.length - 1}
            aria-label="Next slide"
          >
            &gt;
          </button>
        </div>
        <div
          ref={sliderRef}
          className="kinetic-slider__container"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {slides.map(renderSlide)}
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Default export with display name for better debugging
KineticSlider.displayName = 'KineticSlider';
