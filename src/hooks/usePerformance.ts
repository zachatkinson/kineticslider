import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPerformanceMonitor,
  trackInteraction as performanceTrackInteraction,
  trackRenderTime,
  createPerformanceComponentId
} from '../utils/performance';
import type {
  PerformanceMetrics,
  UsePerformanceOptions,
  UsePerformanceReturn
} from '../types/performance';
import type { FPS, ByteSize, Milliseconds } from '../types/branded';

/**
 * Custom hook for measuring and reporting performance metrics.
 * 
 * @param options - Configuration options for performance monitoring
 * @param options.debug - Enable debug mode to log additional details
 * @param options.logToConsole - Output metrics to console when updated
 * @param options.trackMemory - Collect memory usage metrics if available
 * @param options.includeWebVitals - Include web vitals metrics when available
 * @param options.updateInterval - How often to update metrics (in milliseconds)
 * @param options.onMetricsUpdate - Optional callback when metrics are updated
 * 
 * @returns Performance monitoring utilities and current metrics
 * @returns {Object} metrics - The current performance metrics
 * @returns {FPS} metrics.fps - Current frames per second
 * @returns {ByteSize} metrics.memoryUsage - Current memory usage in bytes
 * @returns {Milliseconds} metrics.transitionDuration - Duration of transitions
 * @returns {Milliseconds} metrics.gestureLatency - Latency of gesture responses
 * @returns {Function} trackRender - Track render time for the component
 * @returns {Function} trackInteraction - Track interaction time for events
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { metrics, trackRender } = usePerformance({
 *     logToConsole: true,
 *     onMetricsUpdate: (metrics) => {
 *       analytics.track('performance', metrics);
 *     }
 *   });
 *   
 *   // Track render time automatically
 *   useEffect(() => {
 *     trackRender('initial');
 *   }, []);
 *   
 *   return (
 *     <div>
 *       <p>Current FPS: {metrics.fps.toFixed(1)}</p>
 *       <p>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const usePerformance = (
  options: UsePerformanceOptions = {}
): UsePerformanceReturn => {
  const {
    debug = false,
    logToConsole = false,
    trackMemory = true,
    includeWebVitals = false,
    updateInterval = 1000,
    onMetricsUpdate,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0 as FPS,
    memoryUsage: 0 as ByteSize,
    transitionDuration: 0 as Milliseconds,
    gestureLatency: 0 as Milliseconds,
    renderTime: [],
    interactionTime: [],
  });

  // Store render start time to calculate render duration
  const renderStartTime = useRef<number>(performance.now());

  // Store component ID for tracking multiple instances
  const componentId = useRef<string>(createPerformanceComponentId());

  // Method to track render time
  const trackRender = useCallback(
    (label?: string) => {
      const time = trackRenderTime(
        renderStartTime.current,
        componentId.current,
        label,
        logToConsole
      );

      setMetrics((prev) => ({
        ...prev,
        renderTime: prev.renderTime ? [...prev.renderTime, time] : [time],
      }));

      renderStartTime.current = performance.now();
    },
    [logToConsole]
  );
  
  // Wrap trackInteraction to match the expected type
  const wrappedTrackInteraction = useCallback(<T extends (...args: unknown[]) => void>(fn: T): T => {
    return ((...args: unknown[]) => {
      const startTime = performance.now();
      const result = fn(...args);
      const duration = performance.now() - startTime;
      
      performanceTrackInteraction('interaction', duration as Milliseconds, {
        component: componentId.current
      });
      
      return result;
    }) as T;
  }, []);

  // Set up performance monitoring
  useEffect(() => {
    const cleanup = createPerformanceMonitor({
      onMetricsUpdate: (newMetrics) => {
        setMetrics((prev) => ({ ...prev, ...newMetrics }));
        onMetricsUpdate?.(newMetrics);
      },
      trackMemory,
      includeWebVitals,
      updateInterval,
      debug,
      logToConsole
    });

    return cleanup;
  }, [
    trackMemory,
    includeWebVitals,
    updateInterval,
    debug,
    logToConsole,
    onMetricsUpdate
  ]);

  return {
    metrics,
    trackRender,
    trackInteraction: wrappedTrackInteraction
  };
};
