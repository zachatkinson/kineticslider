/**
 * Mock implementations for browser APIs
 */
import { vi } from "vitest";

// Mock ResizeObserver
/**
 * A mock implementation of the ResizeObserver interface.
 *
 * @example
 * const observer = new MockResizeObserver();
 * observer.observe(element);
 */
export class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Mock IntersectionObserver
/**
 * A mock implementation of the IntersectionObserver interface.
 *
 * @example
 * const observer = new MockIntersectionObserver(callback);
 * observer.observe(element);
 */
export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  /**
   * Constructor for the MockIntersectionObserver.
   *
   * @param _callback - The callback function to be called when intersection changes.
   *
   * @param _options - Optional configuration for the observer.
   *
   */
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

// Mock matchMedia
export const mockMatchMedia = (matches: boolean = false): void => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Setup all browser API mocks
export const setupBrowserApiMocks = (): void => {
  global.ResizeObserver = MockResizeObserver;
  global.IntersectionObserver = MockIntersectionObserver;
  mockMatchMedia();
};

/**
 * Mock implementation for browser APIs.
 *
 * @returns {Object} A mock browser APIs object.
 *
 */
export const createBrowserAPIsMock = (): Record<string, unknown> => {
  // Implementation of createBrowserAPIsMock function
  return {};
};

/**
 * Mock function for browser API cleanup.
 *
 * @returns {void}
 *
 */
export const cleanupBrowserAPIs = (): void => {
  // Implementation of cleanupBrowserAPIs function
};

/**
 * Mock function for browser API initialization.
 *
 * @returns {void}
 *
 */
export const initBrowserAPIs = (): void => {
  // Implementation of initBrowserAPIs function
};
