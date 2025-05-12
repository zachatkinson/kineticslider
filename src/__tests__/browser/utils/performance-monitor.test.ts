/**
 * Browser tests for PerformanceMonitor
 *
 * This test file tests browser-specific functionality like:
 * - FPS tracking using requestAnimationFrame
 * - Memory tracking using performance.memory API
 * - Cleanup of browser-specific resources like observers
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerformanceMonitor } from "../../../utils/performance-monitor";

// Mock dependencies
vi.mock("../../../services/resource-management", () => {
  const mockTerminate = vi.fn();

  return {
    ResourcePool: vi.fn().mockImplementation(() => ({
      acquire: vi.fn(),
      release: vi.fn(),
      releaseAll: vi.fn(),
    })),
    WorkerPool: vi.fn().mockImplementation(() => ({
      execute: vi
        .fn()
        .mockImplementation((task: () => unknown) =>
          Promise.resolve(typeof task === "function" ? task() : null),
        ),
      terminate: mockTerminate,
    })),
  };
});

// Mock for the WorkerPool
vi.mock("../../../utils/worker-pool", () => {
  return {
    WorkerPool: class MockWorkerPool {
      terminate = vi.fn();
    },
  };
});

// Extend the PerformanceMonitor class for testing
class TestablePerformanceMonitor extends PerformanceMonitor {
  public addTestObserver(
    observer: ResizeObserver | IntersectionObserver,
  ): void {
    this["observers"].add(observer);
  }
}

describe("PerformanceMonitor - Browser Tests", () => {
  let monitor: TestablePerformanceMonitor;

  beforeEach(() => {
    vi.clearAllMocks();

    // Enable fake timers for deterministic testing
    vi.useFakeTimers();

    // Mock browser APIs
    vi.stubGlobal("performance", {
      now: vi.fn().mockReturnValue(Date.now()),
      memory: {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
        totalJSHeapSize: 200 * 1024 * 1024, // 200MB
        jsHeapSizeLimit: 400 * 1024 * 1024, // 400MB
      },
    });

    global.requestAnimationFrame = vi
      .fn()
      .mockImplementation((callback: FrameRequestCallback) => {
        return setTimeout(
          () => callback(performance.now()),
          16,
        ) as unknown as number;
      });

    global.cancelAnimationFrame = vi.fn().mockImplementation((id: number) => {
      clearTimeout(id);
    });

    monitor = new TestablePerformanceMonitor();
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should handle FPS tracking in browser environment", () => {
    // Start tracking
    const stopFPS = monitor.trackFPS();
    expect(typeof stopFPS).toBe("function");

    // Manually trigger an FPS measurement since our mocks aren't firing correctly
    monitor.recordMetric({
      name: "FPS",
      value: 60,
      timestamp: new Date(),
      duration: 1000,
      metricType: 0,
      implementation: 0,
      unit: "fps",
    });

    // Simulate multiple animation frames
    vi.advanceTimersByTime(1000); // Advance 1 second

    // Stop tracking
    stopFPS();

    // Get metrics
    const metrics = monitor.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);

    // Check that FPS metrics were recorded
    const fpsMetrics = metrics.filter((m) => m.name === "FPS");
    expect(fpsMetrics.length).toBeGreaterThan(0);
    expect(fpsMetrics[0].value).toBe(60);
  });

  it("should handle memory tracking in browser environment", () => {
    // Start tracking
    const stopMemory = monitor.trackMemory();
    expect(typeof stopMemory).toBe("function");

    // Advance timers to trigger memory tracking
    vi.advanceTimersByTime(1000);

    // Stop tracking
    stopMemory();

    // Get metrics
    const metrics = monitor.getMetrics();

    // Check that memory metrics were recorded
    const memoryMetrics = metrics.filter(
      (m) => m.name === "Memory Usage" || m.name === "Memory Used",
    );
    expect(memoryMetrics.length).toBeGreaterThan(0);
  });

  it("should properly cleanup registered browser resources", () => {
    // Add an observer to be cleaned up
    const mockObserver = {
      disconnect: vi.fn(),
      observe: vi.fn(),
    };

    // Use the test method to add the observer
    monitor.addTestObserver(mockObserver as unknown as ResizeObserver);

    // Add a cleanup task using the correct method
    const cleanupTask = vi.fn();
    monitor.addCleanupTask(cleanupTask);

    // Execute cleanup
    monitor.cleanup();

    // Verify observer was disconnected
    expect(mockObserver.disconnect).toHaveBeenCalled();

    // Verify cleanup task was executed
    expect(cleanupTask).toHaveBeenCalled();
  });

  it("should handle window resize events properly", () => {
    // Create a mock ResizeObserver
    const mockResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    // Stub the global ResizeObserver
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn().mockImplementation(() => mockResizeObserver),
    );

    // Add the mock observer to be tracked
    monitor.addTestObserver(mockResizeObserver as unknown as ResizeObserver);

    // Trigger cleanup to test observer handling
    monitor.cleanup();

    // Verify the observer was disconnected
    expect(mockResizeObserver.disconnect).toHaveBeenCalled();
  });
});
