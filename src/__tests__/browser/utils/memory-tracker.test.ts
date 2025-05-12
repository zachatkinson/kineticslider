/**
 * Browser tests for memory tracking utilities
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  captureMemoryUsage,
  compareMemorySnapshots,
  measureMemoryUsage,
} from "./memory-tracker";

// Mock performance.memory
const mockMemoryInfo = {
  usedJSHeapSize: 10 * 1024 * 1024,
  totalJSHeapSize: 100 * 1024 * 1024,
  jsHeapSizeLimit: 200 * 1024 * 1024,
};

describe("Memory tracking utilities", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock performance.memory
    vi.stubGlobal("performance", {
      memory: { ...mockMemoryInfo },
      now: vi.fn().mockReturnValue(Date.now()),
    });
  });

  it("should capture memory usage", () => {
    const usage = captureMemoryUsage();

    expect(usage).toEqual(
      expect.objectContaining({
        usedJSHeapSize: mockMemoryInfo.usedJSHeapSize,
        totalJSHeapSize: mockMemoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: mockMemoryInfo.jsHeapSizeLimit,
      }),
    );
  });

  it("should compare memory snapshots correctly", () => {
    const before = {
      usedJSHeapSize: 10 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024,
      usedHeapPercentage: 0.1,
    };

    const after = {
      usedJSHeapSize: 20 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024,
      usedHeapPercentage: 0.2,
    };

    const result = compareMemorySnapshots(before, after);

    expect(result).toEqual(
      expect.objectContaining({
        isClean: false, // Memory increased by 100%, which is above the 5% default threshold
        details: expect.objectContaining({
          usedJSHeapSize: expect.objectContaining({
            before: before.usedJSHeapSize,
            after: after.usedJSHeapSize,
            absoluteChange: after.usedJSHeapSize - before.usedJSHeapSize,
            percentageChange: 1, // 100% increase
            potentialLeak: true,
          }),
        }),
      }),
    );
  });

  it("should measure memory usage before and after an operation", async () => {
    // Mock setTimeout to make tests faster
    vi.spyOn(global, "setTimeout").mockImplementation(
      (callback: TimerHandler) => {
        if (typeof callback === "function") callback();
        return 1 as unknown as number;
      },
    );

    // Execute a simple operation
    const { result, memoryUsage } = await measureMemoryUsage(() => {
      return "test result";
    });

    // Verify the result structure
    expect(result).toBe("test result");
    expect(memoryUsage).toEqual(
      expect.objectContaining({
        isClean: expect.any(Boolean),
        details: expect.any(Object),
      }),
    );
  });

  it("should detect memory leaks in operations that allocate memory", async () => {
    // Mock setTimeout to make tests faster
    vi.spyOn(global, "setTimeout").mockImplementation(
      (callback: TimerHandler) => {
        if (typeof callback === "function") callback();
        return 1 as unknown as number;
      },
    );

    // Mock increasing memory usage between snapshots
    let usedHeapSize = mockMemoryInfo.usedJSHeapSize;
    vi.spyOn(global.performance, "memory", "get").mockImplementation(() => ({
      usedJSHeapSize: usedHeapSize,
      totalJSHeapSize: mockMemoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: mockMemoryInfo.jsHeapSizeLimit,
    }));

    // Test with a function that increases memory usage
    const { memoryUsage } = await measureMemoryUsage(() => {
      // Simulate memory allocation by increasing the tracked heap size
      usedHeapSize += 10 * 1024 * 1024; // Increase by 10MB
      return "operation complete";
    });

    // Verify it detects potential memory leak
    expect(memoryUsage.isClean).toBe(false);
    expect(memoryUsage.details.usedJSHeapSize).toHaveProperty(
      "potentialLeak",
      true,
    );
  });

  it("should not flag memory leaks when usage is within threshold", async () => {
    // Mock setTimeout to make tests faster
    vi.spyOn(global, "setTimeout").mockImplementation(
      (callback: TimerHandler) => {
        if (typeof callback === "function") callback();
        return 1 as unknown as number;
      },
    );

    // Mock stable memory usage between snapshots
    let usedHeapSize = mockMemoryInfo.usedJSHeapSize;
    vi.spyOn(global.performance, "memory", "get").mockImplementation(() => ({
      usedJSHeapSize: usedHeapSize,
      totalJSHeapSize: mockMemoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: mockMemoryInfo.jsHeapSizeLimit,
    }));

    // Test with a function that increases memory only slightly
    const { memoryUsage } = await measureMemoryUsage(() => {
      // Increase by only 1% (less than default 5% threshold)
      usedHeapSize *= 1.01;
      return "operation complete";
    });

    // Verify it doesn't flag a memory leak
    expect(memoryUsage.isClean).toBe(true);
  });
});
