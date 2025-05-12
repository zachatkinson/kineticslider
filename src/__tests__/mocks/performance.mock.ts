/**
 * Mock implementations for performance APIs
 */
import { vi } from "vitest";

// Mock performance.now
export const mockPerformanceNow = vi.fn();
let mockTime = 0;

// Mock requestAnimationFrame
let rafId = 0;
export const mockRequestAnimationFrame = vi.fn(
  (callback: FrameRequestCallback) => {
    rafId++;
    setTimeout(() => callback(performance.now()), 0);
    return rafId;
  },
);

// Mock cancelAnimationFrame
export const mockCancelAnimationFrame = vi.fn((_id: number): void => {
  // No-op for tests
});

// Setup performance mocks
export const setupPerformanceMocks = (): void => {
  // Mock performance.now
  const _originalNow = performance.now;
  performance.now = () => {
    mockTime += 16.67; // Simulate ~60fps
    return mockTime;
  };

  // Mock requestAnimationFrame
  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;
};

// Reset performance mocks
export const resetPerformanceMocks = (): void => {
  mockTime = 0;
  rafId = 0;
  mockPerformanceNow.mockReset();
  mockRequestAnimationFrame.mockReset();
  mockCancelAnimationFrame.mockReset();
};
