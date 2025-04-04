import * as React from 'react';
import { useSlider } from '../../context/SliderContext';

/**
 * Hook for managing slider animations
 * @param containerRef - Reference to the slider container element
 * @returns Animation control functions
 * @example
 * ```tsx
 * const { animateSlide } = useSliderAnimation(containerRef);
 * ```
 */
export interface SliderAnimationHook {
  animateSlide: () => void;
}

/**
 * Custom hook for slider animation functionality
 * @param containerRef
 * @returns Animation control functions
 */
export function useSliderAnimation(containerRef: React.RefObject<HTMLDivElement>): SliderAnimationHook {
  const { state, config: _config } = useSlider();

  const animateSlide = React.useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const track = container.querySelector('[class*="sliderTrack"]') as HTMLElement;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const currentSlide = slides[state.currentIndex as number];
    if (!currentSlide) return;

    // Use default animation values if not provided in config
    const animation = {
      duration: 300, // Default duration
      easing: 'ease-out', // Default easing
      delay: 0, // Default delay
    };
    
    // Apply animation to current slide
    currentSlide.style.transition = `transform ${animation.duration}ms ${animation.easing} ${animation.delay}ms`;
    currentSlide.style.transform = 'translateX(0)';

    // Apply animation to adjacent slides
    const prevSlide = slides[(state.currentIndex as number) - 1];
    const nextSlide = slides[(state.currentIndex as number) + 1];

    if (prevSlide) {
      prevSlide.style.transition = `transform ${animation.duration}ms ${animation.easing} ${animation.delay}ms`;
      prevSlide.style.transform = 'translateX(-100%)';
    }

    if (nextSlide) {
      nextSlide.style.transition = `transform ${animation.duration}ms ${animation.easing} ${animation.delay}ms`;
      nextSlide.style.transform = 'translateX(100%)';
    }

    // Reset animation state after transition
    const cleanup = (): void => {
      currentSlide.style.transition = '';
      if (prevSlide) prevSlide.style.transition = '';
      if (nextSlide) nextSlide.style.transition = '';
      
      currentSlide.removeEventListener('transitionend', cleanup);
    };

    currentSlide.addEventListener('transitionend', cleanup);
  }, [state.currentIndex, containerRef]);

  return { animateSlide };
} 