/**
 * Tests for resource management mocks
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  WorkerPool,
  ResourcePool,
  mockTerminate,
} from "../../mocks";

describe("Resource Management Mocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WorkerPool", () => {
    it("should initialize with default options", () => {
      const workerPool = new WorkerPool();
      expect(workerPool).toBeDefined();
    });

    it("should initialize with custom options", () => {
      const options = {
        maxWorkers: 4,
        initialWorkers: 2,
        timeout: 5000,
        errorHandler: vi.fn(),
      };
      const workerPool = new WorkerPool(options);
      expect(workerPool).toBeDefined();
    });

    it("should have a terminate method", () => {
      const workerPool = new WorkerPool();

      expect(workerPool.terminate).toBeDefined();
      expect(typeof workerPool.terminate).toBe("function");

      workerPool.terminate();
      expect(mockTerminate).toHaveBeenCalled();
    });

    it("execute returns a promise that resolves with the task result", async () => {
      const workerPool = new WorkerPool();
      const result = await workerPool.execute(() => "test result");
      expect(result).toBe("test result");
    });

    it("handles errors in execute", async () => {
      const errorHandler = vi.fn();
      const workerPool = new WorkerPool({ errorHandler });
      const testError = new Error("Test error");

      try {
        await workerPool.execute(() => {
          throw testError;
        });
      } catch {
        // Expected to throw
      }

      // Allow the error handler to be called (it's called via setTimeout)
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorHandler).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({ taskId: expect.any(String) }),
      );
    });

    it("provides worker pool statistics", () => {
      const workerPool = new WorkerPool({ maxWorkers: 2 });
      const stats = workerPool.getStatistics();

      expect(stats).toHaveProperty("totalWorkers");
      expect(stats).toHaveProperty("availableWorkers");
      expect(stats).toHaveProperty("busyWorkers");
      expect(stats).toHaveProperty("queueSize");
      expect(stats).toHaveProperty("errorCount");
      expect(stats).toHaveProperty("errorStats");
      expect(stats).toHaveProperty("errorTrends");
      expect(stats).toHaveProperty("taskStartTimes");
      expect(stats).toHaveProperty("taskCompletionTimes");
      expect(stats).toHaveProperty("peakQueueSize");
      expect(stats).toHaveProperty("avgWaitTime");
      expect(stats).toHaveProperty("queueSizeHistory");
      expect(stats).toHaveProperty("lastResetTime");
    });

    it("processes tasks in queue order", async () => {
      const workerPool = new WorkerPool();
      const results: number[] = [];

      await Promise.all([
        workerPool.execute(() => {
          results.push(1);
          return 1;
        }),
        workerPool.execute(() => {
          results.push(2);
          return 2;
        }),
        workerPool.execute(() => {
          results.push(3);
          return 3;
        }),
      ]);

      expect(results).toEqual([1, 2, 3]);
    });

    it("tracks task timing and queue statistics", async () => {
      const workerPool = new WorkerPool();

      await workerPool.execute(() => "test");
      const stats = workerPool.getStatistics();

      expect(Object.keys(stats.taskStartTimes).length).toBeGreaterThan(0);
      expect(Object.keys(stats.taskCompletionTimes).length).toBeGreaterThan(0);
      expect(stats.queueSizeHistory.length).toBeGreaterThan(0);
      expect(stats.peakQueueSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe("ResourcePool", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should initialize with default options", () => {
      const pool = new ResourcePool();
      expect(pool).toBeDefined();
    });

    it("should initialize with custom options", () => {
      const options = {
        maxResources: 5,
        timeout: 5000,
      };
      const pool = new ResourcePool(options);
      expect(pool).toBeDefined();
    });

    it("should have acquire and release methods", () => {
      const pool = new ResourcePool();

      expect(pool.acquire).toBeDefined();
      expect(typeof pool.acquire).toBe("function");
      expect(pool.release).toBeDefined();
      expect(typeof pool.release).toBe("function");
    });

    it("acquire returns a promise that resolves with a resource", async () => {
      const pool = new ResourcePool();
      const _resource = await pool.acquire();

      expect(_resource).toBeDefined();
      expect(typeof _resource).toBe("object");
    });

    it("release returns a promise that resolves", async () => {
      const pool = new ResourcePool();
      const _resource = await pool.acquire();

      await expect(pool.release(_resource)).resolves.toBeUndefined();
    });

    it("maintains a count of active resources", async () => {
      const pool = new ResourcePool();

      expect(pool.activeCount).toBe(0);

      const _resource1 = await pool.acquire();
      expect(pool.activeCount).toBe(1);

      const _resource2 = await pool.acquire();
      expect(pool.activeCount).toBe(2);

      await pool.release(_resource1);
      expect(pool.activeCount).toBe(1);

      await pool.release(_resource2);
      expect(pool.activeCount).toBe(0);
    });

    it("enforces maximum resource limit", async () => {
      const pool = new ResourcePool({ maxResources: 2 });

      const _resource1 = await pool.acquire();
      const _resource2 = await pool.acquire();

      await expect(pool.acquire()).rejects.toThrow("Resource pool exhausted");

      await pool.release(_resource1);
      await pool.release(_resource2);
    });

    it("prevents releasing non-existent resources", async () => {
      const pool = new ResourcePool();
      const _resource = await pool.acquire();

      await pool.release(_resource);
      await expect(pool.release(_resource)).rejects.toThrow(
        "Resource not found in pool",
      );
    });

    it("automatically releases resources after timeout", async () => {
      vi.useFakeTimers();

      const pool = new ResourcePool({ timeout: 100 });

      const _resource = await pool.acquire();
      expect(pool.activeCount).toBe(1);

      vi.advanceTimersByTime(150);

      expect(pool.activeCount).toBe(0);
    });
  });
});
