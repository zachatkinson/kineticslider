import { useState, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import type { Slide } from '@/types';

interface UseKineticSliderProps {
  slides: Slide[];
  duration?: number;
  ease?: string;
  onSlideChange?: (index: number) => void;
  onAnimationComplete?: () => void;
}

export const useKineticSlider = ({
  slides,
  duration = 0.5,
  ease = 'power2.out',
  onSlideChange,
  onAnimationComplete,
}: UseKineticSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    if (isAnimating || currentSlide >= slides.length - 1) return;
    setIsAnimating(true);
    
    gsap.to(sliderRef.current, {
      x: -(currentSlide + 1) * 100,
      duration,
      ease,
      onComplete: () => {
        setCurrentSlide(prev => prev + 1);
        setIsAnimating(false);
        onSlideChange?.(currentSlide + 1);
        onAnimationComplete?.();
      }
    });
  }, [currentSlide, duration, ease, isAnimating, onAnimationComplete, onSlideChange, slides.length]);

  const prev = useCallback(() => {
    if (isAnimating || currentSlide <= 0) return;
    setIsAnimating(true);
    
    gsap.to(sliderRef.current, {
      x: -(currentSlide - 1) * 100,
      duration,
      ease,
      onComplete: () => {
        setCurrentSlide(prev => prev - 1);
        setIsAnimating(false);
        onSlideChange?.(currentSlide - 1);
        onAnimationComplete?.();
      }
    });
  }, [currentSlide, duration, ease, isAnimating, onAnimationComplete, onSlideChange]);

  const handleGesture = useCallback((_event: { clientX: number; clientY: number; type: string }) => {
    // Implement gesture handling logic here
    // This is a placeholder for the test
  }, []);

  return {
    currentSlide,
    isAnimating,
    next,
    prev,
    handleGesture,
    sliderRef,
  };
}; 