/**
 * Mock test helper functions and utilities
 */
import { vi } from "vitest";
import React from "react";

/**
 * Create mock React ref with optional element
 *
 * @param element Optional HTML element to assign to ref
 *
 * @returns React ref object
 *
 */
export const createMockRef = <T extends HTMLElement>(
  element: T | null = null
): React.RefObject<T | null> => ({
  current: element,
});

/**
 * Create mock HTML element with getBoundingClientRect
 *
 * @param width Element width
 *
 * @param height Element height
 *
 * @param additionalProps Additional properties for the element
 *
 * @returns Mock HTML element
 *
 */
export const createMockElement = (
  width: number,
  height: number,
  additionalProps?: Partial<HTMLElement>
): HTMLElement => ({
  getBoundingClientRect: (): DOMRect => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: (): void => {},
  }),
  ...additionalProps,
} as HTMLElement);

/**
 * Create mock button element with focus method
 *
 * @param id Optional button ID
 *
 * @returns Mock button element
 *
 */
export const createMockButton = (id?: string): HTMLButtonElement => {
  const button = document.createElement("button");
  if (id) button.id = id;
  button.focus = vi.fn();
  return button;
};

/**
 * Setup browser API mocks that aren't in the main browser-apis.mock.ts
 *
 * @returns void
 *
 */
export const setupBrowserApiMocks = (): void => {
  // Mock ResizeObserver if not already mocked
  if (!window.ResizeObserver) {
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock IntersectionObserver if not already mocked
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }
};

/**
 * Create mock function with typed return value
 *
 * @param implementation Optional implementation function
 *
 * @returns Mock function
 *
 */
export const createMockFunction = <T extends (...args: any[]) => any>(
  implementation?: T
): ReturnType<typeof vi.fn> & T => {
  return implementation ? vi.fn(implementation) : vi.fn();
};

/**
 * Create async mock function that resolves with value
 *
 * @param value Value to resolve with
 *
 * @returns Mock function that resolves
 *
 */
export const createAsyncMock = <T>(value: T): ReturnType<typeof vi.fn> => {
  return vi.fn().mockResolvedValue(value);
};

/**
 * Create async mock function that rejects with error
 *
 * @param error Error to reject with
 *
 * @returns Mock function that rejects
 *
 */
export const createAsyncErrorMock = (error: Error): ReturnType<typeof vi.fn> => {
  return vi.fn().mockRejectedValue(error);
};

/**
 * Mock setTimeout/clearTimeout for testing
 *
 * @returns Object with mock timer functions
 *
 */
export const mockTimers = (): {
  setTimeout: ReturnType<typeof vi.fn>;
  clearTimeout: ReturnType<typeof vi.fn>;
  triggerTimeout: (id: number) => void;
  triggerAllTimeouts: () => void;
} => {
  const timeouts = new Map<number, () => void>();
  let timeoutId = 0;
  
  const mockSetTimeout = vi.fn((callback: () => void, _delay: number): number => {
    const id = ++timeoutId;
    timeouts.set(id, callback);
    return id;
  });
  
  const mockClearTimeout = vi.fn((id: number): void => {
    timeouts.delete(id);
  });
  
  return {
    setTimeout: mockSetTimeout,
    clearTimeout: mockClearTimeout,
    triggerTimeout: (id: number): void => {
      const callback = timeouts.get(id);
      if (callback) {
        callback();
        timeouts.delete(id);
      }
    },
    triggerAllTimeouts: (): void => {
      timeouts.forEach((callback, id) => {
        callback();
        timeouts.delete(id);
      });
    },
  };
}; 