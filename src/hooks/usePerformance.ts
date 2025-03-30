import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  PerformanceMetrics,
  UsePerformanceOptions,
  UsePerformanceReturn,
  WindowWithAnalytics,
} from '../types/performance';

/**
 * Hook for measuring and reporting performance metrics
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
    renderTime: 0,
    interactionTime: 0,
    fps: null,
    memoryUsage: null,
  });

  // Reference to store last update time for FPS calculation
  const lastUpdateTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  // Store render start time to calculate render duration
  const renderStartTime = useRef<number>(performance.now());

  // Track if this is the first render
  const isFirstRender = useRef<boolean>(true);

  // Store component ID for tracking multiple instances
  const componentId = useRef<string>(
    `perf-${Math.random().toString(36).substr(2, 9)}`
  );

  // Function to update FPS count
  const updateFPS = useCallback(() => {
    frameCount.current += 1;
    const now = performance.now();

    // Calculate FPS every second
    if (now - lastUpdateTime.current >= updateInterval) {
      const fps = Math.round(
        (frameCount.current * 1000) / (now - lastUpdateTime.current)
      );

      setMetrics((prev) => ({
        ...prev,
        fps,
      }));

      if (logToConsole && debug) {
        console.warn(`[Performance] ${componentId.current} FPS: ${fps}`);
      }

      // Reset for next interval
      frameCount.current = 0;
      lastUpdateTime.current = now;
    }

    // Continue measuring
    rafId.current = requestAnimationFrame(updateFPS);
  }, [debug, logToConsole, updateInterval]);

  // Start/stop performance monitoring
  useEffect(() => {
    // Start FPS measurement
    rafId.current = requestAnimationFrame(updateFPS);

    // Measure initial render time
    const initialRenderTime = performance.now() - renderStartTime.current;

    // Update metrics with initial render time
    if (isFirstRender.current) {
      setMetrics((prev) => ({
        ...prev,
        initialRenderTime,
      }));

      if (logToConsole) {
        console.warn(
          `[Performance] ${componentId.current} Initial render: ${initialRenderTime.toFixed(2)}ms`
        );
      }

      isFirstRender.current = false;
    }

    // Memory usage tracking
    let memoryInterval: number | null = null;
    if (
      trackMemory &&
      (window.performance as { memory?: { usedJSHeapSize: number } }).memory
    ) {
      memoryInterval = window.setInterval(() => {
        const memory =
          (window.performance as { memory: { usedJSHeapSize: number } }).memory
            .usedJSHeapSize /
          (1024 * 1024);
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: memory,
        }));

        if (logToConsole && debug) {
          console.warn(
            `[Performance] ${componentId.current} Memory: ${memory.toFixed(2)}MB`
          );
        }
      }, updateInterval);
    }

    // Web Vitals tracking
    if (includeWebVitals && typeof window !== 'undefined') {
      const win = window as unknown as WindowWithAnalytics;
      if (win.webVitals && !win.__performanceMonitored) {
        win.__performanceMonitored = true;

        win.webVitals.getFCP(({ value }) => {
          if (logToConsole) console.warn(`[Web Vitals] FCP: ${value}`);
        });

        win.webVitals.getLCP(({ value }) => {
          if (logToConsole) console.warn(`[Web Vitals] LCP: ${value}`);
        });

        win.webVitals.getFID(({ value }) => {
          if (logToConsole) console.warn(`[Web Vitals] FID: ${value}`);
        });

        win.webVitals.getCLS(({ value }) => {
          if (logToConsole) console.warn(`[Web Vitals] CLS: ${value}`);
        });
      }
    }

    // Cleanup
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      if (memoryInterval !== null) {
        clearInterval(memoryInterval);
      }
    };
  }, [
    debug,
    includeWebVitals,
    logToConsole,
    trackMemory,
    updateFPS,
    updateInterval,
  ]);

  // Callback for tracking interaction times
  const trackInteraction = useCallback(
    <T extends (...args: unknown[]) => void>(fn: T) => {
      return ((...args: Parameters<T>) => {
        const startTime = performance.now();
        fn(...args);
        const endTime = performance.now();
        const interactionTime = endTime - startTime;

        setMetrics((prev) => ({
          ...prev,
          interactionTime,
        }));

        if (logToConsole && debug) {
          console.warn(
            `[Performance] ${componentId.current} Interaction: ${interactionTime.toFixed(2)}ms`
          );
        }
      }) as T;
    },
    [debug, logToConsole]
  );

  // Update parent component with metrics when they change
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Method to manually track render time
  const trackRender = useCallback(
    (label?: string): void => {
      const renderTime = performance.now() - renderStartTime.current;

      setMetrics((prev) => ({
        ...prev,
        renderTime,
      }));

      if (logToConsole) {
        console.warn(
          `[Performance] ${componentId.current} ${label ? label + ' ' : ''}Render: ${renderTime.toFixed(2)}ms`
        );
      }

      // Reset render start time for next measurement
      renderStartTime.current = performance.now();
    },
    [logToConsole]
  );

  // Return metrics and tracking methods
  return useMemo(
    () => ({
      metrics,
      trackInteraction,
      trackRender,
    }),
    [metrics, trackInteraction, trackRender]
  );
};
