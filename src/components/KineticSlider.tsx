import React, { MouseEvent, TouchEvent, memo, useCallback, useEffect, useState } from 'react';

import { useKineticSlider } from '../hooks/useKineticSlider';
import type { KineticSliderProps, Slide } from '../types/slider';
import { ErrorBoundary } from './ErrorBoundary';
import { debounce } from '../utils/performance';

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
export const KineticSlider = memo(
  ({
    slides,
    initialSlide = 0,
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
      onSlideChange,
      onAnimationComplete,
      duration,
      ease,
      infiniteLoop,
    });

    const [containerWidth, setContainerWidth] = useState('100%');

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

    // Setup keyboard navigation
    useEffect(() => {
      if (!enableKeyboard) return undefined;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          next();
        } else if (e.key === 'ArrowLeft') {
          prev();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [enableKeyboard, next, prev]);

    // Event handlers for touch and mouse interactions
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        if (!enableGestures) return;
        const touch = e.touches[0];
        if (touch) {
          handleGesture({
            clientX: touch.clientX,
            clientY: touch.clientY,
            type: 'touchstart',
            startX: touch.clientX,
            startY: touch.clientY,
          });
        }
      },
      [enableGestures, handleGesture],
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

    // Render slides
    const renderSlides = () => {
      return slides.map((slide, index) => (
        <div
          key={slide.id}
          className="kinetic-slider-slide"
          aria-hidden={currentSlide !== index}
          style={{
            width: containerWidth,
            opacity: currentSlide === index ? 1 : 0.5,
          }}
        >
          <img src={slide.image} alt={slide.alt} draggable={false} />
          <div className="kinetic-slider-content">
            <h2>{slide.title}</h2>
            {slide.description && <p>{slide.description}</p>}
          </div>
        </div>
      ));
    };

    if (!slides?.length) return null;

    return (
      <ErrorBoundary>
        <div
          className={`kinetic-slider ${className}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Image slider"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="kinetic-slider__controls">
            <button
              className="kinetic-slider__control kinetic-slider__control--prev"
              onClick={prev}
              disabled={!infiniteLoop && (isAnimating || currentSlide <= 0)}
              aria-label="Previous slide"
            >
              &lt;
            </button>
            <button
              className="kinetic-slider__control kinetic-slider__control--next"
              onClick={next}
              disabled={!infiniteLoop && (isAnimating || currentSlide >= slides.length - 1)}
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
              ...style,
            }}
          >
            {renderSlides()}
          </div>
        </div>
      </ErrorBoundary>
    );
  }
);

// Default export with display name for better debugging
KineticSlider.displayName = 'KineticSlider';
