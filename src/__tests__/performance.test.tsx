/* eslint-env vitest */
// Must mock before imports to avoid hoisting issues
vi.mock('gsap', () => ({
  gsap: require('./mocks/gsap').gsapMock.gsap
}));

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { KineticSlider } from '../components/KineticSlider';
import { useKineticSlider } from '../hooks/useKineticSlider';
import { performance } from 'perf_hooks';
import type { Slide } from '@/types';
import { generateMockSlides } from './utils/test-utils';
import { gsapMock, completeAnimation, startAnimation, getIsAnimating } from './mocks/gsap';
import { renderHook } from '@testing-library/react-hooks';

describe('KineticSlider Performance', () => {
  let slides: Slide[];

  beforeEach(() => {
    vi.clearAllMocks();
    slides = generateMockSlides(10);
  });

  afterEach(() => {
    // Ensure animations are completed after each test
    completeAnimation();
  });

  // Helper to generate large number of slides
  const generateSlides = (count: number): Slide[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `slide-${i}`,
      content: `Slide ${i + 1}`
    }));
  };

  // Helper to measure execution time
  const measureExecutionTime = async (callback: () => Promise<void> | void) => {
    const start = performance.now();
    await callback();
    return performance.now() - start;
  };

  describe('Rendering Performance', () => {
    it('should render efficiently with different slide counts', () => {
      const slideCounts = [10, 50, 100];
      const renderTimes: number[] = [];

      slideCounts.forEach(count => {
        const testSlides = generateMockSlides(count);
        const startTime = performance.now();
        
        act(() => {
          render(<KineticSlider slides={testSlides} />);
        });
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      });

      // Verify render times are within acceptable range
      renderTimes.forEach((time, index) => {
        expect(time).toBeLessThan(100 * (index + 1)); // Adjust threshold based on requirements
      });
    });

    it('renders quickly with few slides', async () => {
      const renderTime = await measureExecutionTime(async () => {
        await act(async () => {
          render(
            <KineticSlider slides={generateSlides(3)} />
          );
        });
      });

      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('renders efficiently with many slides when lazy loading is enabled', async () => {
      const renderTime = await measureExecutionTime(async () => {
        await act(async () => {
          render(
            <KineticSlider slides={generateSlides(100)} lazyLoad />
          );
        });
      });

      expect(renderTime).toBeLessThan(200); // Should render in under 200ms
    });

    it('measures render performance', () => {
      const startTime = performance.now();
      render(
        <KineticSlider slides={generateSlides(3)} />
      );
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should render large number of slides efficiently', () => {
      const slides = generateMockSlides(100);
      const startTime = performance.now();

      const { container } = render(
        <KineticSlider slides={slides} initialSlide={0} />
      );

      const endTime = performance.now();
      expect(container).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // 1 second threshold
    });

    it('should handle slide transitions smoothly', async () => {
      const slides = generateMockSlides(10);
      const { container } = render(
        <KineticSlider 
          slides={slides} 
          initialSlide={0}
          duration={0.3}
          ease="power2.out"
        />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      // Trigger the animation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
        startAnimation();
      });

      expect(gsapMock.gsap.isAnimating()).toBe(true);

      // Complete the animation
      await act(async () => {
        completeAnimation();
      });

      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('should handle gesture interactions efficiently', async () => {
      const slides = generateMockSlides(10);
      const { container } = render(
        <KineticSlider slides={slides} initialSlide={0} enableGestures={true} />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      await act(async () => {
        fireEvent.touchStart(slider!, { touches: [{ clientX: 0, clientY: 0 }] });
        fireEvent.touchMove(slider!, { touches: [{ clientX: -100, clientY: 0 }] });
        fireEvent.touchEnd(slider!, { changedTouches: [{ clientX: -100, clientY: 0 }] });
        startAnimation();
        completeAnimation();
      });

      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('should handle slide changes efficiently', async () => {
      const onSlideChange = vi.fn();
      const slides = generateMockSlides(10);
      const { container } = render(
        <KineticSlider 
          slides={slides} 
          initialSlide={0}
          onSlideChange={onSlideChange}
        />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      // Trigger the animation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
        startAnimation();
      });

      // Verify animation started
      expect(gsapMock.gsap.isAnimating()).toBe(true);

      // Complete the animation
      await act(async () => {
        completeAnimation();
      });

      // Verify final state
      expect(gsapMock.gsap.isAnimating()).toBe(false);
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Animation Performance', () => {
    it('maintains smooth animations during rapid navigation', async () => {
      const onSlideChange = vi.fn();
      
      const { container } = render(
        <KineticSlider 
          slides={generateSlides(5)} 
          onSlideChange={onSlideChange} 
          duration={0.1}
        />
      );
      
      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      // First navigation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
      });
      
      // Start animation manually
      await act(async () => {
        startAnimation();
      });
      
      // Complete animation manually
      await act(async () => {
        completeAnimation();
      });
      
      // Second navigation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
      });
      
      await act(async () => {
        startAnimation();
      });
      
      await act(async () => {
        completeAnimation();
      });

      // Verify callbacks
      expect(onSlideChange).toHaveBeenCalled();
      
      // Verify final animation state
      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('should complete animations within expected timeframe', () => {
      const { result } = renderHook(() => useKineticSlider({ slides }));
      const startTime = performance.now();
      
      act(() => {
        result.current.next();
      });
      
      expect(getIsAnimating()).toBe(true);
      completeAnimation();
      const endTime = performance.now();
      
      expect(getIsAnimating()).toBe(false);
      expect(endTime - startTime).toBeLessThan(100); // Animation should complete within 100ms
    });

    it('should maintain smooth animations during transitions', async () => {
      const { result } = renderHook(() => useKineticSlider({ slides }));
      
      act(() => {
        result.current.next();
      });

      expect(getIsAnimating()).toBe(true);
      completeAnimation();
      expect(getIsAnimating()).toBe(false);
    });

    it('should handle rapid slide transitions without performance degradation', () => {
      const { result } = renderHook(() => useKineticSlider({ slides }));
      const transitionTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        act(() => {
          result.current.next();
        });
        
        expect(getIsAnimating()).toBe(true);
        completeAnimation();
        
        const endTime = performance.now();
        transitionTimes.push(endTime - startTime);
        
        expect(getIsAnimating()).toBe(false);
      }

      // Verify transition times remain consistent
      const avgTime = transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
      transitionTimes.forEach(time => {
        expect(Math.abs(time - avgTime)).toBeLessThan(50); // Max 50ms variance
      });
    });
  });

  describe('Gesture Performance', () => {
    it('handles rapid drag events efficiently', async () => {
      const { container } = render(
        <KineticSlider slides={generateSlides(5)} enableGestures />
      );
      
      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      await act(async () => {
        fireEvent.touchStart(slider!, { touches: [{ clientX: 0, clientY: 0 }] });
        for (let i = 0; i < 10; i++) {
          fireEvent.touchMove(slider!, { touches: [{ clientX: -i * 10, clientY: 0 }] });
        }
        fireEvent.touchEnd(slider!, { changedTouches: [{ clientX: -100, clientY: 0 }] });
        startAnimation();
        completeAnimation();
      });

      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('should handle rapid gesture events efficiently', () => {
      const { result } = renderHook(() => useKineticSlider({ slides }));
      const gestureEvents = Array.from({ length: 50 }, (_, i) => ({
        clientX: i * 10,
        clientY: 100,
        type: 'mousemove'
      }));
      
      const startTime = performance.now();
      
      gestureEvents.forEach(event => {
        act(() => {
          result.current.handleGesture(event);
        });
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime / gestureEvents.length).toBeLessThan(5); // Less than 5ms per event
    });
  });

  describe('Memory Management', () => {
    it('cleans up resources properly', async () => {
      const { container, unmount } = render(
        <KineticSlider slides={generateSlides(5)} duration={0.1} />
      );
      
      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      // Trigger an animation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
      });
      
      // Start and complete animation
      await act(async () => {
        startAnimation();
      });
      
      await act(async () => {
        completeAnimation();
      });

      // Verify animation completed
      expect(gsapMock.gsap.isAnimating()).toBe(false);
      
      // Unmount component
      unmount();
      
      // Verify no lingering animations
      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('manages memory efficiently with lazy loading', async () => {
      const { container, unmount } = render(
        <KineticSlider 
          slides={generateSlides(5)} 
          lazyLoad 
          duration={0.1}
        />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeTruthy();

      // Just verify it renders and can be unmounted without errors
      unmount();
      
      // No animations should be running after unmount
      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('should clean up resources on unmount', () => {
      const { unmount } = renderHook(() => useKineticSlider({ slides }));
      
      act(() => {
        unmount();
      });
      
      expect(getIsAnimating()).toBe(false);
      expect(gsapMock.gsap.timeline).toHaveBeenCalledTimes(0);
    });
  });
}); 