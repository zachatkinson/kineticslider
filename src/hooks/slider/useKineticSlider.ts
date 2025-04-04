import React, { useState, useCallback } from 'react';
import type { Slide } from '../../types/slider';
import { createBrandedNumber } from '../../types/branded';
import type { SlideIndex } from '../../types/branded';
import type { UseKineticSliderProps as _UseKineticSliderProps } from '../../types/hooks';
import { useErrorTracking } from './useErrorTracking';

/**
 * A hook for creating touch and draggable slider functionality with momentum effects
 * 
 * This hook provides a complete API for implementing kinetic sliders with touch
 * and mouse gesture support. It includes options for customizing animation
 * behavior, custom gestures, and handling transitions between slides.
 * 
 * @example
 * ```tsx
 * import { useKineticSlider } from 'hooks/slider/useKineticSlider';
 * 
 * const MySlider = () => {
 *   const slides = ['Slide 1', 'Slide 2', 'Slide 3'];
 *   const { 
 *     sliderRef, 
 *     currentSlide, 
 *     next, 
 *     prev, 
 *     metrics 
 *   } = useKineticSlider({
 *     slides,
 *     duration: 0.8, 
 *     ease: 'power3.out',
 *     infiniteLoop: true,
 *     onSlideChange: (index) => console.log(`Slide changed to ${index}`)
 *   });
 * 
 *   return (
 *     <div>
 *       <div ref={sliderRef} className="slider-container">
 *         {slides.map((slide, index) => (
 *           <div key={index} className="slide">{slide}</div>
 *         ))}
 *       </div>
 *       <button onClick={prev}>Previous</button>
 *       <button onClick={next}>Next</button>
 *       <div>Current slide: {currentSlide + 1} of {metrics.totalSlides}</div>
 *     </div>
 *   );
 * };
 */

/**
 * A hook for controlling a kinetic slider
 * 
 * @param {Object} props - The props object
 * @param {Slide[]} props.slides - The slides to display
 * @param {SlideIndex} props.initialSlide - The initial slide index
 * @param {Function} props.onSlideChange - Callback when slide changes
 * @param {Function} props.onAnimationComplete - Callback when animation completes
 * @param {number} props.duration - Animation duration
 * @param {string} props.ease - Animation easing function
 * @param {boolean} props.infiniteLoop - Whether to loop infinitely
 * @returns {Object} The slider state and controls
 * @example
 * ```tsx
 * // Basic usage with minimal props
 * const { currentSlide, next, prev, sliderRef } = useKineticSlider({
 *   slides: slideData,
 *   initialSlide: createBrandedNumber(0, 'SlideIndex'),
 *   infiniteLoop: true
 * });
 * ```
 */
interface KineticSliderHookProps {
  slides: Slide[];
  initialSlide: SlideIndex;
  onSlideChange?: (index: SlideIndex) => void;
  onAnimationComplete?: () => void;
  duration?: number;
  ease?: string;
  infiniteLoop?: boolean;
}

interface KineticSliderHookResult {
  currentSlide: SlideIndex;
  isAnimating: boolean;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  handleGesture: (direction: string) => void;
  sliderRef: React.RefObject<HTMLDivElement | null>;
}

const useKineticSlider = ({
    slides,
    initialSlide,
    onSlideChange,
    onAnimationComplete,
    infiniteLoop = false
}: KineticSliderHookProps): KineticSliderHookResult => {
    const [currentSlide, setCurrentSlide] = useState(initialSlide);
    const [isAnimating, setIsAnimating] = useState(false);
    const { trackError, ERROR_TYPES } = useErrorTracking();

    const next = useCallback(async () => {
        if (isAnimating) return;
        setIsAnimating(true);
        
        try {
            const nextSlide = infiniteLoop 
                ? (currentSlide + 1) % slides.length
                : Math.min(currentSlide + 1, slides.length - 1);
            
            setCurrentSlide(createBrandedNumber(nextSlide, 'SlideIndex'));
            if (onSlideChange) {
                onSlideChange(createBrandedNumber(nextSlide, 'SlideIndex'));
            }
        } catch (error) {
            trackError(error as Error, ERROR_TYPES.NAVIGATION);
        } finally {
            setIsAnimating(false);
            if (onAnimationComplete) {
                onAnimationComplete();
            }
        }
    }, [currentSlide, isAnimating, infiniteLoop, slides.length, onSlideChange, onAnimationComplete, trackError, ERROR_TYPES]);

    const prev = useCallback(async () => {
        if (isAnimating) return;
        setIsAnimating(true);
        
        try {
            const prevSlide = infiniteLoop
                ? (currentSlide - 1 + slides.length) % slides.length
                : Math.max(currentSlide - 1, 0);
                
            setCurrentSlide(createBrandedNumber(prevSlide, 'SlideIndex'));
            if (onSlideChange) {
                void onSlideChange(createBrandedNumber(prevSlide, 'SlideIndex'));
            }
        } catch (error) {
            trackError(error as Error, ERROR_TYPES.NAVIGATION);
        } finally {
            setIsAnimating(false);
            if (onAnimationComplete) {
                void onAnimationComplete();
            }
        }
    }, [currentSlide, isAnimating, infiniteLoop, slides.length, onSlideChange, onAnimationComplete, trackError, ERROR_TYPES]);

    const handleGesture = useCallback((direction: string) => {
        if (direction === 'left') {
            void next();
        } else if (direction === 'right') {
            void prev();
        }
    }, [next, prev]);

    // Reference to the slider element
    const sliderRef = React.useRef<HTMLDivElement>(null);

    return {
        currentSlide,
        isAnimating,
        next,
        prev,
        handleGesture,
        sliderRef
    };
};

export { useKineticSlider }; 