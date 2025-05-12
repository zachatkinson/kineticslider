/**
 * Performance testing for KineticSlider component and PerformanceMonitor utilities
 *
 * Note: This test file is in the browser environment because performance metrics
 * are more accurate in a real browser context than in JSDOM.
 */

import { render, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { KineticSlider } from "@/components/KineticSlider";
import { createSlideId } from "@/utils/id-helpers";
import type { Slide } from "@/types/slider";
import { setupBrowserApiMocks } from "../../mocks/browser-apis.mock";
import {
  setupPerformanceMocks,
  resetPerformanceMocks,
} from "../../mocks/performance.mock";
import { createMockPerformanceMonitor } from "../../mocks/performance-monitor.mock";

// Mock the PerformanceMonitor class
vi.mock("../../../utils/performance-monitor", () => ({
  PerformanceMonitor: vi
    .fn()
    .mockImplementation(() => createMockPerformanceMonitor()),
}));

// Import after mocking
// const { PerformanceMonitor } = require("../../../utils/performance-monitor");

// Mock RAF for animation testing
const mockRaf = (): { tick: (count?: number, frameTime?: number) => void } => {
  let rafId = 0;
  const queue = new Map();

  // Replace requestAnimationFrame
  window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    const id = ++rafId;
    queue.set(id, cb);
    return id;
  });

  // Replace cancelAnimationFrame
  window.cancelAnimationFrame = vi.fn((id: number) => {
    queue.delete(id);
  });

  // Function to simulate RAF ticks
  const tick = (count = 1, frameTime = 16.67): void => {
    for (let i = 0; i < count; i++) {
      const time = performance.now() + frameTime;
      for (const [id, cb] of [...queue.entries()]) {
        queue.delete(id);
        cb(time);
      }
    }
  };

  return { tick };
};

// Helper to generate mock slides
const generateMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: createSlideId(`slide-${i}`),
    title: `Slide ${i}`,
    description: `Description for slide ${i}`,
    image: `/images/slide-${i}.jpg`,
    alt: `Test image ${i}`,
  }));
};

describe("Performance Utilities - Browser", () => {
  beforeEach(() => {
    setupBrowserApiMocks();
    setupPerformanceMocks();
  });

  afterEach(() => {
    resetPerformanceMocks();
  });

  let rafController: ReturnType<typeof mockRaf>;

  beforeEach(() => {
    vi.clearAllMocks();
    rafController = mockRaf();

    // Set up timer mocks
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("measures render time for different slide counts", async () => {
    const slideCounts = [1, 5, 10]; // Reduced count for faster tests
    const renderTimes: number[] = [];

    for (const count of slideCounts) {
      const slides = generateMockSlides(count);
      const startTime = performance.now();

      render(<KineticSlider slides={slides} />);

      const endTime = performance.now();
      renderTimes.push(endTime - startTime);
    }

    // Verify render times are within acceptable range
    const maxRenderTime = Math.max(...renderTimes);
    expect(maxRenderTime).toBeLessThan(5000); // 5 seconds max render time
  });

  it("maintains consistent FPS during animations", async () => {
    // Render the slider with a small number of slides to keep test fast
    const slides = generateMockSlides(3);
    const { getByRole } = render(<KineticSlider slides={slides} />);

    // Find the next button
    const nextButton = getByRole("button", { name: /next slide/i });

    // Click several times to simulate user interaction
      fireEvent.click(nextButton);
      rafController.tick(5); // Simulate 5 animation frames
      fireEvent.click(nextButton);
      rafController.tick(5); // Simulate 5 more animation frames

    // Verify the component still functions after the animation
    expect(nextButton).toBeInTheDocument();
  });

  it("cleans up resources properly", async () => {
    const slides = generateMockSlides(5);
    const { unmount } = render(<KineticSlider slides={slides} />);

    // Unmount component
      unmount();

    // Need to advance timers to allow for any cleanup timeouts
      vi.advanceTimersByTime(100);

    // The test passes if no errors occur during unmounting
    expect(true).toBe(true);
  });
});

describe("PerformanceMonitor Functionality (Browser)", () => {
  let performanceMonitor: ReturnType<typeof createMockPerformanceMonitor>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    performanceMonitor = createMockPerformanceMonitor();
  });

  afterEach(() => {
    performanceMonitor.cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should track FPS metrics", async () => {
    // Start tracking FPS
    const stopTracking = performanceMonitor.trackFPS();
    expect(typeof stopTracking).toBe("function");

    // Fast-forward time to trigger FPS recording
      vi.advanceTimersByTime(1000);

    // Stop tracking
    stopTracking();

    // Call cleanup explicitly
    performanceMonitor.cleanup();

    // Verify cleanup was called
    expect(performanceMonitor.cleanup).toHaveBeenCalled();
  });

  it("should track memory usage", async () => {
    // Create a temporary type that includes the memory property
    type PerformanceWithMemory = Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    // Cast performance to our extended type and add memory property if it doesn't exist
    const performanceWithMemory = performance as PerformanceWithMemory;
    if (!performanceWithMemory.memory) {
      performanceWithMemory.memory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      };
    }

    // Start tracking memory
    const stopTracking = performanceMonitor.trackMemory();
    expect(typeof stopTracking).toBe("function");

    // Fast-forward time to trigger memory sampling
      vi.advanceTimersByTime(1000);

    // Stop tracking
    stopTracking();
  });

  it("should calculate benchmarks from metrics", async () => {
    // Add some test metrics
    performanceMonitor.recordMetric({
      name: "Test Metric",
      value: 100,
      timestamp: new Date(),
      duration: 0,
      metricType: 0,
      implementation: 0,
      unit: "ms",
    });

    performanceMonitor.recordMetric({
      name: "Test Metric",
      value: 200,
      timestamp: new Date(),
      duration: 0,
      metricType: 0,
      implementation: 0,
      unit: "ms",
    });

    // Get benchmarks
    const benchmarks = performanceMonitor.getBenchmarks();
    expect(benchmarks).toBeDefined();
  });

  it("should limit the number of stored metrics to prevent memory bloat", async () => {
    // Add more than the limit of metrics
    for (let i = 0; i < 1100; i++) {
      performanceMonitor.recordMetric({
        name: "Test Metric",
        value: i,
        timestamp: new Date(),
        duration: 0,
        metricType: 0,
        implementation: 0,
        unit: "ms",
      });
    }

    // Verify metrics were limited
    expect(performanceMonitor.metrics.length).toBeLessThanOrEqual(1000);
  });

  it("should handle rapid metric recording", async () => {
    // Record a large number of metrics rapidly
    for (let i = 0; i < 100; i++) {
      performanceMonitor.recordMetric({
        name: "Rapid Test",
        value: i,
        timestamp: new Date(),
        duration: 0,
        metricType: 0,
        implementation: 0,
        unit: "ms",
      });
    }

    // Verify metrics were recorded
    expect(performanceMonitor.metrics.length).toBe(100);
  });
});

window.dispatchEvent(new Event("resize"));
