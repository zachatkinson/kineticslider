/**
 * Performance testing for KineticSlider component
 * 
 * @internal
 * This file contains performance tests for the KineticSlider component
 * and is not part of the public API documentation.
 */

/* eslint-env vitest */
import '@testing-library/jest-dom/vitest';
import { render, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KineticSlider } from '../../components/KineticSlider';
import type { KineticSliderProps, Slide } from '../../types';
import { createSlideId } from '../../utils/id-helpers';
import { PerformanceMonitor } from '../../utils/performance-monitor';
import type { PerformanceMetrics } from '../../types/performance';
import './unit/mocks/gsap.mock';

// Setup mocks for browser APIs
vi.stubGlobal(
  'ResizeObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

vi.stubGlobal(
  'IntersectionObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

// Mock analytics and error tracking
vi.stubGlobal('analytics', {
  track: vi.fn(),
});

vi.stubGlobal('errorTracker', {
  captureError: vi.fn(),
});

// Helper to generate mock slides
const generateMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: createSlideId(`slide-${i}`),
    title: `Slide ${i}`,
    description: `Description for slide ${i}`,
    image: `/images/slide-${i}.jpg`,
    alt: `Test image ${i}`,
  }));
};

describe('KineticSlider Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor = new PerformanceMonitor();
  });

  it('measures render time for different slide counts', async () => {
    const slideCounts = [1, 10, 50, 100];
    const renderTimes: number[] = [];

    for (const count of slideCounts) {
      const slides = generateMockSlides(count);
      const startTime = performance.now();

      render(<KineticSlider slides={slides} />);
      
      const endTime = performance.now();
      renderTimes.push(endTime - startTime);
      
      // Track render time
      performanceMonitor.track('renderTime', endTime - startTime);
    }

    // Verify render times are within acceptable range
    const maxRenderTime = Math.max(...renderTimes);
    expect(maxRenderTime).toBeLessThan(1000); // 1 second max render time
  });

  it('measures memory usage during intensive operations', async () => {
    if ('memory' in performance) {
      const getMemoryUsage = () => {
        const memory = (performance as any).memory;
        return memory ? memory.usedJSHeapSize : 0;
      };

      const initialMemory = getMemoryUsage();
      const slides = generateMockSlides(100);

      // Perform intensive operations
      for (let i = 0; i < 10; i++) {
        render(<KineticSlider slides={slides} key={i} />);
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Track memory increase
      performanceMonitor.track('memoryUsage', memoryIncrease);

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max increase
    }
  });

  it('maintains consistent FPS during animations', async () => {
    const slides = generateMockSlides(10);
    const { rerender } = render(<KineticSlider slides={slides} />);

    // Track FPS during rapid updates
    const fpsReadings: number[] = [];
    let lastTime = performance.now();
    let frames = 0;

    // Simulate 1 second of animation
    for (let i = 0; i < 60; i++) {
      act(() => {
        rerender(<KineticSlider slides={slides} initialSlide={i % slides.length} />);
      });

      frames++;
      const now = performance.now();
      
      if (now >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        fpsReadings.push(fps);
        performanceMonitor.track('fps', fps);
        frames = 0;
        lastTime = now;
      }

      // Simulate frame timing
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
    }

    // Verify FPS stays above threshold
    const minFps = Math.min(...fpsReadings);
    expect(minFps).toBeGreaterThan(30); // Should maintain at least 30fps
  });

  it('handles rapid slide transitions efficiently', async () => {
    const slides = generateMockSlides(10);
    const { rerender } = render(<KineticSlider slides={slides} />);

    const transitionTimes: number[] = [];

    // Perform rapid transitions
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      act(() => {
        rerender(<KineticSlider slides={slides} initialSlide={i % slides.length} />);
      });

      const endTime = performance.now();
      transitionTimes.push(endTime - startTime);
      performanceMonitor.track('transitionTime', endTime - startTime);

      // Small delay to simulate rapid user interaction
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Verify transition times are consistent
    const avgTransitionTime = transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
    const maxDeviation = Math.max(...transitionTimes.map(t => Math.abs(t - avgTransitionTime)));
    
    expect(maxDeviation).toBeLessThan(100); // Max 100ms deviation
  });

  it('handles window resize events efficiently', async () => {
    const slides = generateMockSlides(10);
    render(<KineticSlider slides={slides} />);

    const resizeTimes: number[] = [];

    // Simulate multiple resize events
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const endTime = performance.now();
      resizeTimes.push(endTime - startTime);
      performanceMonitor.track('resizeTime', endTime - startTime);

      // Small delay between resizes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verify resize handling is efficient
    const maxResizeTime = Math.max(...resizeTimes);
    expect(maxResizeTime).toBeLessThan(50); // Max 50ms for resize handling
  });

  it('cleans up resources properly', () => {
    const slides = generateMockSlides(10);
    const { unmount } = render(<KineticSlider slides={slides} />);

    const initialMemory = (performance as any).memory?.usedJSHeapSize;
    
    // Unmount and measure cleanup
    unmount();

    const finalMemory = (performance as any).memory?.usedJSHeapSize;
    
    if (initialMemory && finalMemory) {
      const memoryDiff = Math.abs(finalMemory - initialMemory);
      performanceMonitor.track('cleanupMemory', memoryDiff);
      
      // Verify no significant memory leak
      expect(memoryDiff).toBeLessThan(1024 * 1024); // Max 1MB difference
    }
  });
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    monitor.cleanup();
  });

  describe('Basic Functionality', () => {
    it('tracks metrics correctly', () => {
      monitor.track('renderTime', 100);
      const summary = monitor.getMetricSummary('renderTime');
      
      expect(summary).toBeDefined();
      expect(summary?.avg).toBe(100);
      expect(summary?.count).toBe(1);
    });

    it('handles multiple metric updates', () => {
      const values = [100, 150, 200];
      values.forEach(v => monitor.track('renderTime', v));
      
      const summary = monitor.getMetricSummary('renderTime');
      expect(summary?.avg).toBe(150);
      expect(summary?.count).toBe(3);
    });
  });

  describe('Memory Leak Detection', () => {
    it('detects memory leaks during cleanup', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 1024 * 1024, // 1MB
        jsHeapSizeLimit: 2048 * 1024, // 2MB
      };
      
      Object.defineProperty(performance, 'memory', {
        get: () => mockMemory,
        configurable: true,
      });

      // Create some artificial memory usage
      const largeArray = new Array(1000000).fill(0);
      monitor.registerCleanup(() => {
        monitor.track('cleanupMemory', mockMemory.usedJSHeapSize);
      });

      // Cleanup should track memory usage
      monitor.cleanup();
      
      const summary = monitor.getMetricSummary('cleanupMemory');
      expect(summary).toBeDefined();
      expect(summary?.count).toBe(1);
    });

    it('handles observer cleanup correctly', () => {
      const mockObserver = {
        disconnect: vi.fn(),
        observe: vi.fn(),
      };

      monitor.registerObserver(mockObserver as unknown as ResizeObserver);
      monitor.cleanup();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Load Testing', () => {
    it('handles high frequency metric updates', () => {
      const updateCount = 1000;
      const startTime = performance.now();

      // Simulate rapid metric updates
      for (let i = 0; i < updateCount; i++) {
        monitor.track('renderTime', Math.random() * 100);
      }

      const endTime = performance.now();
      const summary = monitor.getMetricSummary('renderTime');

      expect(summary?.count).toBe(updateCount);
      // Ensure processing time is reasonable (less than 1ms per update)
      expect(endTime - startTime).toBeLessThan(updateCount);
    });

    it('handles concurrent metric updates', async () => {
      const metrics: Array<keyof PerformanceMetrics> = ['renderTime', 'transitionTime', 'resizeTime'];
      const promises = metrics.map(metric => 
        Promise.all(
          Array(100).fill(0).map(() => 
            Promise.resolve(monitor.track(metric, Math.random() * 100))
          )
        )
      );

      await Promise.all(promises);

      metrics.forEach(metric => {
        const summary = monitor.getMetricSummary(metric);
        expect(summary?.count).toBe(100);
      });
    });
  });

  describe('Browser API Fallbacks', () => {
    it('handles missing performance.memory API', () => {
      // Remove performance.memory
      const originalMemory = performance.memory;
      delete (performance as any).memory;

      monitor.trackMemory();
      vi.advanceTimersByTime(10000);

      const summary = monitor.getMetricSummary('memoryUsage');
      expect(summary).toBeNull();

      // Restore performance.memory
      Object.defineProperty(performance, 'memory', {
        get: () => originalMemory,
        configurable: true,
      });
    });

    it('handles requestAnimationFrame fallback', () => {
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => setTimeout(cb, 16));

      monitor.trackFPS();
      vi.advanceTimersByTime(1000);

      const summary = monitor.getMetricSummary('fps');
      expect(summary).toBeDefined();
      expect(summary?.avg).toBeGreaterThan(0);

      window.requestAnimationFrame = originalRAF;
    });
  });

  describe('Error Conditions', () => {
    it('handles invalid metric values', () => {
      const consoleWarn = vi.spyOn(console, 'warn');
      
      monitor.track('renderTime', -1);
      monitor.track('renderTime', Infinity);
      monitor.track('renderTime', NaN);

      const summary = monitor.getMetricSummary('renderTime');
      expect(summary?.count).toBe(0);
      expect(consoleWarn).toHaveBeenCalled();
    });

    it('handles cleanup during active measurements', () => {
      monitor.trackFPS();
      monitor.trackMemory();

      // Should not throw when cleaning up during active measurements
      expect(() => monitor.cleanup()).not.toThrow();
    });
  });
});
