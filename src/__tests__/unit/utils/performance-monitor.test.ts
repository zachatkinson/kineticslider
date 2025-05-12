/**
 * Unit tests for PerformanceMonitor
 *
 * This test file focuses on non-browser aspects of the PerformanceMonitor:
 * - Basic initialization
 * - Method existence
 * - Data processing logic (metrics and benchmarks)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PerformanceMonitor } from "../../../utils/performance-monitor";

// Mock dependencies for unit testing
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

describe("PerformanceMonitor - Unit Tests", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create minimal mocks to allow instantiation without browser APIs
    global.performance = { now: vi.fn(() => 0) } as any;

    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize properly", () => {
    expect(monitor).toBeInstanceOf(PerformanceMonitor);
  });

  it("should have basic tracking methods", () => {
    expect(typeof monitor.trackFPS).toBe("function");
    expect(typeof monitor.trackMemory).toBe("function");
    expect(typeof monitor.cleanup).toBe("function");
  });

  it("should calculate benchmark summaries from metrics", () => {
    // Record some test metrics directly (no browser APIs needed)
    monitor.recordMetric({
      name: "Test Metric",
      value: 10,
      timestamp: new Date(),
      duration: 0,
      metricType: 0,
      implementation: 0,
      unit: "ms",
    });

    monitor.recordMetric({
      name: "Test Metric",
      value: 20,
      timestamp: new Date(),
      duration: 0,
      metricType: 0,
      implementation: 0,
      unit: "ms",
    });

    // Get benchmarks
    const benchmarks = monitor.getBenchmarks();

    // Check benchmark calculations (pure data processing logic)
    expect(benchmarks.length).toBe(1);
    expect(benchmarks[0].name).toBe("Test Metric");
    expect(benchmarks[0].summary.min).toBe(10);
    expect(benchmarks[0].summary.max).toBe(20);
    expect(benchmarks[0].summary.avg).toBe(15);
    expect(benchmarks[0].summary.count).toBe(2);
  });

  it("should add and execute cleanup tasks", () => {
    // Test the cleanup task mechanism (pure logic, no browser resources)
    const cleanupTask = vi.fn();
    monitor.addCleanupTask(cleanupTask);

    // Execute cleanup
    monitor.cleanup();

    // Verify cleanup task was executed
    expect(cleanupTask).toHaveBeenCalled();
  });

  it("should record and retrieve metrics correctly", () => {
    // Add several different metrics
    monitor.recordMetric({
      name: "First Metric",
      value: 42,
      timestamp: new Date(),
      duration: 100,
      metricType: 1,
      implementation: 2,
      unit: "ms",
    });

    monitor.recordMetric({
      name: "Second Metric",
      value: 99,
      timestamp: new Date(),
      duration: 50,
      metricType: 0,
      implementation: 1,
      unit: "fps",
    });

    // Get metrics
    const metrics = monitor.getMetrics();

    // Verify metric storage and retrieval
    expect(metrics.length).toBe(2);
    expect(metrics[0].name).toBe("First Metric");
    expect(metrics[0].value).toBe(42);
    expect(metrics[1].name).toBe("Second Metric");
    expect(metrics[1].value).toBe(99);
  });
});
