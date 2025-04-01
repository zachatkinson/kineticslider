import { useEffect, useRef } from 'react';
import { useSlider } from '../../context/SliderContext';
import { createPerformanceMonitor } from '../../utils/performance';
import type { PerformanceMetrics } from '../../types/performance';
import type { FPS, Milliseconds, ByteSize } from '../../types/branded';

/**
 * Custom hook for monitoring performance metrics in a slider component.
 * 
 * This hook automatically tracks key performance metrics during slider interactions:
 * - FPS (frames per second) monitoring
 * - Transition duration measurement
 * - Gesture latency calculation
 * - Memory usage tracking
 * 
 * It integrates with the slider context to accurately measure timings for
 * animations and user interactions.
 * 
 * @returns {Object} An object containing the getMetrics function.
 * @returns {Function} getMetrics - Returns a copy of the current performance metrics.
 * @returns {PerformanceMetrics} getMetrics.return - The current performance metrics object.
 * 
 * @example
 * ```tsx
 * function SliderComponent() {
 *   const { getMetrics } = usePerformanceMonitoring();
 *   
 *   // Log metrics when needed
 *   const logPerformance = () => {
 *     console.log('Performance metrics:', getMetrics());
 *   };
 *   
 *   return <div>Slider content</div>;
 * }
 * ```
 */
export function usePerformanceMonitoring() {
  const { state } = useSlider();
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 0 as FPS,
    transitionDuration: 0 as Milliseconds,
    gestureLatency: 0 as Milliseconds,
    memoryUsage: 0 as ByteSize,
  });

  // Start performance monitoring
  useEffect(() => {
    const monitor = createPerformanceMonitor({
      onMetricsUpdate: (newMetrics) => {
        metricsRef.current = {
          ...metricsRef.current,
          ...newMetrics,
        };
      },
      trackMemory: true,
      updateInterval: 1000
    });

    return () => {
      monitor();
    };
  }, []);

  // Track transition duration
  useEffect(() => {
    if (state.isAnimating) {
      const startTime = performance.now();

      return () => {
        metricsRef.current.transitionDuration = (performance.now() - startTime) as Milliseconds;
      };
    }
  }, [state.isAnimating]);

  // Track gesture latency
  useEffect(() => {
    if (state.isDragging) {
      const startTime = performance.now();

      return () => {
        metricsRef.current.gestureLatency = (performance.now() - startTime) as Milliseconds;
      };
    }
  }, [state.isDragging]);

  return {
    getMetrics: () => ({ ...metricsRef.current }),
  };
} 