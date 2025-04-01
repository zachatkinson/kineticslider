import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPerformanceMonitor,
  trackInteraction,
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
    trackInteraction
  };
};
