/**
 * Mock implementations for performance monitoring
 */
import { vi } from "vitest";

export const createMockPerformanceMonitor = (): Record<string, any> => {
  const metrics: Array<{
    name: string;
    value: number;
    timestamp: Date;
    duration: number;
    metricType: number;
    implementation: number;
    unit: string;
  }> = [];

  const observers = new Set<ResizeObserver | IntersectionObserver>();
  const cleanupTasks: Array<() => void> = [];
  let rafId: number | null = null;
  let memoryInterval: number | null = null;

  return {
    metrics,
    observers,
    cleanupTasks,
    trackFPS: vi.fn().mockImplementation(() => {
      const stopTracking = vi.fn();
      cleanupTasks.push(stopTracking);
      return stopTracking;
    }),
    trackMemory: vi.fn().mockImplementation(() => {
      const stopTracking = vi.fn();
      cleanupTasks.push(stopTracking);
      return stopTracking;
    }),
    recordMetric: vi.fn().mockImplementation((metric: any) => {
      metrics.push(metric);
      if (metrics.length > 1000) {
        metrics.splice(0, metrics.length - 1000);
      }
    }),
    getMetrics: vi.fn().mockReturnValue(metrics),
    getBenchmarks: vi.fn().mockReturnValue([]),
    addCleanupTask: vi.fn().mockImplementation((task: () => void) => {
      cleanupTasks.push(task);
    }),
    cleanup: vi.fn().mockImplementation(() => {
      cleanupTasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.error("Error during cleanup task:", error);
        }
      });
      cleanupTasks.length = 0;

      observers.forEach((observer) => {
        try {
          observer.disconnect();
        } catch (error) {
          console.error("Error disconnecting observer:", error);
        }
      });
      observers.clear();

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (memoryInterval !== null) {
        clearInterval(memoryInterval);
        memoryInterval = null;
      }
      metrics.length = 0;
    }),
  };
};
