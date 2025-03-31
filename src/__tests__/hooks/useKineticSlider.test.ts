import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKineticSlider } from './useKineticSlider';
import type { Slide } from '@/types/slider';
import type { SlideId } from '@/types/branded';

// Helper function to create branded SlideId
const createSlideId = (id: string): SlideId => id as SlideId;

describe('useKineticSlider', () => {
  const mockSlides: Slide[] = [
    { id: createSlideId('1'), title: 'Slide 1', image: '/slide1.jpg', alt: 'Slide 1 description' },
    { id: createSlideId('2'), title: 'Slide 2', image: '/slide2.jpg', alt: 'Slide 2 description' },
    { id: createSlideId('3'), title: 'Slide 3', image: '/slide3.jpg', alt: 'Slide 3 description' },
  ];

  const defaultProps = {
    slides: mockSlides,
    duration: 0.5,
    ease: 'power2.out',
    onSlideChange: vi.fn(),
    onAnimationComplete: vi.fn(),
    initialSlide: 0,
    infiniteLoop: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.metrics).toEqual({
      currentIndex: 0,
      totalSlides: mockSlides.length,
      progress: 0,
      direction: 'forward',
      isAnimating: false,
    });
  });

  it('handles next slide navigation', async () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    await act(async () => {
      result.current.next();
    });

    expect(result.current.currentSlide).toBe(1);
    expect(defaultProps.onSlideChange).toHaveBeenCalledWith(1);
  });

  it('handles previous slide navigation', async () => {
    const { result } = renderHook(() => useKineticSlider({
      ...defaultProps,
      initialSlide: 1,
    }));

    await act(async () => {
      result.current.prev();
    });

    expect(result.current.currentSlide).toBe(0);
    expect(defaultProps.onSlideChange).toHaveBeenCalledWith(0);
  });

  it('handles infinite loop when enabled', async () => {
    const { result } = renderHook(() => useKineticSlider({
      ...defaultProps,
      infiniteLoop: true,
    }));

    // Go to last slide from first slide
    await act(async () => {
      result.current.prev();
    });

    expect(result.current.currentSlide).toBe(mockSlides.length - 1);

    // Go to first slide from last slide
    await act(async () => {
      result.current.next();
    });

    expect(result.current.currentSlide).toBe(0);
  });

  it('prevents navigation during animation', async () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    await act(async () => {
      result.current.next();
      // Try to navigate while animating
      result.current.next();
    });

    // Should only navigate once
    expect(defaultProps.onSlideChange).toHaveBeenCalledTimes(1);
  });

  it('handles gesture events', async () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    await act(async () => {
      result.current.handleGesture({
        type: 'touchend',
        clientX: 100,
        clientY: 0,
        startX: 500,
        startY: 0,
      });
    });

    // Should navigate to next slide due to left swipe
    expect(result.current.currentSlide).toBe(1);
    expect(defaultProps.onSlideChange).toHaveBeenCalledWith(1);
  });

  it('calls onAnimationComplete after slide transition', async () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    await act(async () => {
      result.current.next();
    });

    expect(defaultProps.onAnimationComplete).toHaveBeenCalled();
  });
}); 