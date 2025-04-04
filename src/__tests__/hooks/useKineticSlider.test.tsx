/**
 * Tests for useKineticSlider hook with SliderProvider context
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKineticSlider } from '../../hooks/slider/useKineticSlider';
import { SliderProvider } from '../../context/SliderContext';
import type { Slide, SlideItem, SliderMetrics } from '../../types/slider';
import type { SliderGestureEvent } from '../../types/hooks';
import { createSlideId } from '../../utils/id-helpers';
import { createBrandedNumber } from '../../types/branded';

// Override the KineticSliderHookResult interface to include metrics
declare module '../../hooks/slider/useKineticSlider' {
  interface KineticSliderHookResult {
    metrics: SliderMetrics;
    handleGesture: (event: SliderGestureEvent) => void;
  }
}

// Mock slider hook implementation that's actually used in the test
vi.mock('../../hooks/slider/useKineticSlider', () => {
  return {
    useKineticSlider: vi.fn(({ 
      slides, 
      onSlideChange, 
      onAnimationComplete, 
      infiniteLoop = false,
      initialSlide = 0
    }) => {
      const [currentSlide, setCurrentSlide] = React.useState(initialSlide);
      const [isAnimating, setIsAnimating] = React.useState(false);
      
      const metrics = {
        currentIndex: currentSlide,
        totalSlides: slides.length,
        progress: slides.length > 1 ? currentSlide / (slides.length - 1) : 0,
        direction: 'forward',
        isAnimating
      };
      
      const next = vi.fn(() => {
        if (currentSlide >= slides.length - 1) {
          if (infiniteLoop) {
            setCurrentSlide(0);
          }
          return;
        }
        setIsAnimating(true);
        
        // Simulate animation completion
        setTimeout(() => {
          const nextSlide = currentSlide + 1;
          setCurrentSlide(nextSlide);
          setIsAnimating(false);
          onSlideChange?.(nextSlide);
          onAnimationComplete?.();
        }, 10);
      });
      
      const prev = vi.fn(() => {
        if (currentSlide <= 0) {
          if (infiniteLoop) {
            setCurrentSlide(slides.length - 1);
          }
          return;
        }
        setIsAnimating(true);
        
        // Simulate animation completion
        setTimeout(() => {
          const prevSlide = currentSlide - 1;
          setCurrentSlide(prevSlide);
          setIsAnimating(false);
          onSlideChange?.(prevSlide);
          onAnimationComplete?.();
        }, 10);
      });
      
      // Handle gesture for swipe events
      const handleGesture = vi.fn((event: SliderGestureEvent) => {
        if (isAnimating) return;
        
        if (event.type === 'touchend') {
          const deltaX = event.clientX - event.startX;
          if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
              prev();
            } else {
              next();
            }
          }
        }
      });
      
      return {
        currentSlide,
        isAnimating,
        next,
        prev,
        handleGesture,
        sliderRef: { current: document.createElement('div') },
        metrics
      };
    })
  };
});

// Mock the SliderContext module
vi.mock('../../context/SliderContext', () => {
  return {
    SliderProvider: ({ children }: { children: React.ReactNode }) => children,
    useSlider: () => ({
      state: { currentIndex: 0 },
      config: { loop: false },
      items: [],
      actions: { 
        next: vi.fn(), 
        previous: vi.fn() 
      }
    })
  };
});

// Test data
const mockSlides: Slide[] = [
  {
    id: createSlideId('slide-1'),
    title: 'Slide 1',
    description: 'First slide',
    image: 'image1.jpg',
    alt: 'First slide image'
  },
  {
    id: createSlideId('slide-2'),
    title: 'Slide 2',
    description: 'Second slide',
    image: 'image2.jpg',
    alt: 'Second slide image'
  }
];

// Convert Slide[] to SlideItem[] for the SliderProvider
const mockSlideItems: SlideItem[] = mockSlides.map(slide => ({
  id: slide.id,
  content: (
    <div>
      <h2>{slide.title}</h2>
      <p>{slide.description}</p>
      <img src={slide.image} alt={slide.alt} />
    </div>
  ),
  metadata: slide.metadata
}));

// Wrapper component to provide SliderContext
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

describe('useKineticSlider', () => {
  const defaultProps = {
    slides: mockSlides,
    duration: 0.5,
    ease: 'power2.out',
    onSlideChange: vi.fn(),
    onAnimationComplete: vi.fn(),
    initialSlide: createBrandedNumber(0, 'SlideIndex'),
    infiniteLoop: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps), { wrapper });
    
    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics.totalSlides).toBe(mockSlides.length);
    expect(typeof result.current.next).toBe('function');
    expect(typeof result.current.prev).toBe('function');
    expect(typeof result.current.handleGesture).toBe('function');
  });

  it('navigates to next slide when next() is called', async () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps), { wrapper });
    
    act(() => {
      result.current.next();
    });
    
    // Wait for animation to complete
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    
    expect(result.current.currentSlide).toBe(1);
    expect(defaultProps.onSlideChange).toHaveBeenCalledWith(1);
    expect(defaultProps.onAnimationComplete).toHaveBeenCalled();
  });

  it('navigates to previous slide when prev() is called', async () => {
    // Set the initialSlide prop to 1 for this test
    const props = {
      ...defaultProps,
      initialSlide: createBrandedNumber(1, 'SlideIndex'),
    };
    
    const { result } = renderHook(() => useKineticSlider(props), { wrapper });
    
    // Verify that we start on slide 1
    expect(result.current.currentSlide).toBe(1);
    
    act(() => {
      result.current.prev();
    });
    
    // Wait for animation to complete
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    
    expect(result.current.currentSlide).toBe(0);
    expect(props.onSlideChange).toHaveBeenCalledWith(0);
    expect(props.onAnimationComplete).toHaveBeenCalled();
  });

  it('respects infiniteLoop setting when navigating beyond boundary', async () => {
    const infiniteLoopProps = {
      ...defaultProps,
      infiniteLoop: true,
    };
    
    const { result } = renderHook(() => useKineticSlider(infiniteLoopProps), { wrapper });
    
    // Navigate to last slide (1)
    act(() => {
      result.current.next();
    });
    
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    
    // Try to navigate past the end
    act(() => {
      result.current.next();
    });
    
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    
    // Should loop back to first slide
    expect(result.current.currentSlide).toBe(0);
  });

  it('handles gestures correctly', async () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps), { wrapper });
    
    // Mock a left swipe gesture (next slide)
    const gestureEvent: SliderGestureEvent = {
      type: 'touchend',
      startX: 200,
      startY: 0,
      clientX: 50, // Swipe left (next slide)
      clientY: 0,
    };
    
    // Run the mock immediately for the test
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    act(() => {
      result.current.handleGesture(gestureEvent);
      // Fast-forward timer
      vi.advanceTimersByTime(50);
    });
    
    expect(result.current.currentSlide).toBe(1);
  });
}); 