import "./setup";
import { vi } from "vitest";

// Mock requestAnimationFrame for browser tests
let rafId = 0;
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafId++;
  setTimeout(() => callback(performance.now()), 0);
  return rafId;
});

global.cancelAnimationFrame = vi.fn((_id: number) => {
  // No-op for tests
});

// Mock performance.now() for consistent timing in tests
let mockTime = 0;
performance.now = vi.fn(() => {
  mockTime += 16.67; // Simulate ~60fps
  return mockTime;
});

// Reset mock time between tests
beforeEach(() => {
  mockTime = 0;
  vi.clearAllMocks();
});
