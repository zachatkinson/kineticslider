/**
 * Browser tests for WorkerPool implementation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkerPool } from "../../../utils/worker-pool";
import { MockWorker } from "../mocks/mock-worker";

// Mock the Worker constructor for testing
vi.stubGlobal("Worker", MockWorker);

describe("WorkerPool - Browser Tests", () => {
  let workerPool: WorkerPool;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create worker pool with basic options
    workerPool = new WorkerPool({
      workerScript: "./src/__tests__/browser/mocks/mock-worker.js",
      initialWorkers: 1,
      maxWorkers: 2,
    });
  });

  afterEach(async () => {
    // Clean up resources
    if (workerPool) {
      await workerPool.terminate();
    }
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(workerPool).toBeDefined();
  });

  it("should have proper methods", () => {
    expect(typeof workerPool.execute).toBe("function");
    expect(typeof workerPool.terminate).toBe("function");
    expect(typeof workerPool.getStatistics).toBe("function");
  });

  it("should return statistics with expected properties", () => {
    const stats = workerPool.getStatistics();

    expect(stats).toBeDefined();
    expect(typeof stats.totalWorkers).toBe("number");
    expect(typeof stats.availableWorkers).toBe("number");
    expect(typeof stats.busyWorkers).toBe("number");
    expect(typeof stats.queueSize).toBe("number");
  });

  it("should execute a task and return result", async () => {
    const result = await workerPool.execute("test-data");
    expect(result).toBe("test-data");
  });

  it("should handle multiple tasks", async () => {
    const results = await Promise.all([
      workerPool.execute("task1"),
      workerPool.execute("task2"),
      workerPool.execute("task3"),
    ]);

    expect(results).toEqual(["task1", "task2", "task3"]);
  });

  it("should terminate workers", async () => {
    const terminateSpy = vi.spyOn(MockWorker.prototype, "terminate");

    await workerPool.terminate();

    expect(terminateSpy).toHaveBeenCalled();

    const stats = workerPool.getStatistics();
    expect(stats.totalWorkers).toBe(0);
    expect(stats.availableWorkers).toBe(0);
  });

  it("should handle worker creation based on configuration", async () => {
    // Create a worker pool with more initial workers
    const largerPool = new WorkerPool({
      workerScript: "./src/__tests__/browser/mocks/mock-worker.js",
      initialWorkers: 3,
      maxWorkers: 5,
    });

    try {
      const stats = largerPool.getStatistics();
      expect(stats.totalWorkers).toBeGreaterThanOrEqual(3);
    } finally {
      await largerPool.terminate();
    }
  });

  it("should handle errors gracefully", async () => {
    const errorPool = new WorkerPool({
      workerScript: "./src/__tests__/browser/mocks/mock-worker.js",
      initialWorkers: 1,
      maxWorkers: 2,
    });

    // Mock worker.postMessage to throw an error
    MockWorker.prototype.postMessage = vi.fn().mockImplementation(() => {
      throw new Error("Mock error");
    });

    try {
      await errorPool.execute("test-data").catch(() => {
        // Expected to throw
      });

      // Give time for error processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify we can still get statistics after an error
      const stats = errorPool.getStatistics();
      expect(stats).toBeDefined();
    } finally {
      await errorPool.terminate();
    }
  });
});
