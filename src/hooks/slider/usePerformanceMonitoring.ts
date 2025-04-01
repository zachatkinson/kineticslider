import { useEffect, useRef } from 'react';
import { useSlider } from '../../context/SliderContext';
import { createPerformanceMonitor } from '../../utils/performance';
import type { PerformanceMetrics } from '../../types/performance';
import type { FPS, Milliseconds, ByteSize } from '../../types/branded';

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
    const monitor = createPerformanceMonitor((newMetrics) => {
      metricsRef.current = {
        ...metricsRef.current,
        ...newMetrics,
      };
    });

    return () => {
      monitor.stop();
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