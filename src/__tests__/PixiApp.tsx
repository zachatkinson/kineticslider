import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';

export interface PixiSlide {
  image: string;
  title: string;
  alt: string;
}

export interface PixiSliderProps {
  width: number;
  height: number;
  slides: PixiSlide[];
  initialSlide?: number;
  onSlideChange?: (index: number) => void;
  onError?: (error: Error) => void;
  enableKeyboardNavigation?: boolean;
  infiniteLoop?: boolean;
}

export const PixiSlider: React.FC<PixiSliderProps> = ({
  width = 800,
  height = 600,
  slides,
  initialSlide = 0,
  onSlideChange,
  onError,
  enableKeyboardNavigation = true,
  infiniteLoop = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [ariaMessage, setAriaMessage] = useState('');

  const announceSlideChange = useCallback((index: number): void => {
    if (index >= 0 && index < slides.length) {
      setAriaMessage(`Showing slide ${index + 1} of ${slides.length}: ${slides[index].title}`);
    }
  }, [slides]);

  const navigateToSlide = useCallback((index: number): void => {
    let newIndex = index;

    // Handle bounds
    if (index < 0) {
      newIndex = infiniteLoop ? slides.length - 1 : 0;
    } else if (index >= slides.length) {
      newIndex = infiniteLoop ? 0 : slides.length - 1;
    }

    if (newIndex !== currentSlide) {
      setCurrentSlide(newIndex);
      if (onSlideChange) onSlideChange(newIndex);
      announceSlideChange(newIndex);
    }
  }, [currentSlide, infiniteLoop, slides, onSlideChange, announceSlideChange]);

  useEffect(() => {
    // Check if slides array is empty
    if (!slides || slides.length === 0) {
      const error = new Error('No slides provided');
      if (onError) onError(error);
      return;
    }

    try {
      // Initialize PIXI application
      appRef.current = new PIXI.Application({
        width,
        height,
        backgroundColor: 0x000000,
        antialias: true,
        autoDensity: true
      });

      if (containerRef.current) {
        // Clear previous content
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(appRef.current.view as HTMLCanvasElement);
        
        // Set accessibility attributes for the canvas
        const canvas = appRef.current.view as HTMLCanvasElement;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `Image Slider with ${slides.length} slides`);
        canvas.setAttribute('tabindex', '0');
        canvas.setAttribute('aria-roledescription', 'interactive image slider');
      }

      // Load all slide images
      slides.forEach(slide => {
        // Use void to explicitly ignore the Promise
        void PIXI.Assets.load(slide.image).catch(err => {
          if (onError) onError(err);
        });
      });

      // Announce the initial slide
      announceSlideChange(initialSlide);
    } catch (error) {
      if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize PixiSlider'));
    }

    return () => {
      // Cleanup PIXI application
      if (appRef.current) {
        appRef.current.destroy(true);
      }
    };
  }, [width, height, slides, initialSlide, onError, announceSlideChange]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowRight') {
        navigateToSlide(currentSlide + 1);
      } else if (event.key === 'ArrowLeft') {
        navigateToSlide(currentSlide - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, enableKeyboardNavigation, navigateToSlide]);

  return (
    <div 
      ref={containerRef} 
      className="pixi-slider-container"
      data-testid="pixi-slider"
      style={{ width, height, position: 'relative' }}
    >
      {/* Canvas will be appended here by PIXI */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {ariaMessage}
      </div>
      <div className="pixi-controls" role="group" aria-label="Slider controls">
        <button
          onClick={() => navigateToSlide(currentSlide - 1)} 
          disabled={!infiniteLoop && currentSlide === 0}
          aria-label="Previous slide"
          className="pixi-prev-button"
        >
          Previous
        </button>
        <button
          onClick={() => navigateToSlide(currentSlide + 1)} 
          disabled={!infiniteLoop && currentSlide === slides.length - 1}
          aria-label="Next slide"
          className="pixi-next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PixiSlider; 