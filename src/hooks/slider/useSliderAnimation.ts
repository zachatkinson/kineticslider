import React from 'react';
import { useSlider } from '../../context/SliderContext';

export function useSliderAnimation(containerRef: React.RefObject<HTMLDivElement>): {
  animateSlide: () => void;
};

export function useSliderAnimation(containerRef: React.RefObject<HTMLDivElement>) {
  const { state, config } = useSlider();

  const animateSlide = React.useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const track = container.querySelector('[class*="sliderTrack"]') as HTMLElement;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const currentSlide = slides[state.currentIndex];
    if (!currentSlide) return;

    // Calculate the animation duration based on config
    const duration = config.animation.duration;
    const easing = config.animation.easing;
    const delay = config.animation.delay || 0;

    // Apply animation to current slide
    currentSlide.style.transition = `transform ${duration}ms ${easing} ${delay}ms`;
    currentSlide.style.transform = 'translateX(0)';

    // Apply animation to adjacent slides
    const prevSlide = slides[state.currentIndex - 1];
    const nextSlide = slides[state.currentIndex + 1];

    if (prevSlide) {
      prevSlide.style.transition = `transform ${duration}ms ${easing} ${delay}ms`;
      prevSlide.style.transform = 'translateX(-100%)';
    }

    if (nextSlide) {
      nextSlide.style.transition = `transform ${duration}ms ${easing} ${delay}ms`;
      nextSlide.style.transform = 'translateX(100%)';
    }

    // Reset animation state after transition
    const cleanup = () => {
      currentSlide.style.transition = '';
      if (prevSlide) prevSlide.style.transition = '';
      if (nextSlide) nextSlide.style.transition = '';
      
      currentSlide.removeEventListener('transitionend', cleanup);
    };

    currentSlide.addEventListener('transitionend', cleanup);
  }, [state.currentIndex, config.animation]);

  return { animateSlide };
} 