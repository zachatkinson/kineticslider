import { vi } from "vitest";
import type { GestureOptions } from "@/types/gestures";

// Centralized mock for useGestures
export const attachMock = vi.fn(
  (_element: HTMLElement, _options: GestureOptions) => {
    // Simulate attaching gesture handlers
    // Return a cleanup function
    return vi.fn();
  },
);

export const useGesturesMock = vi.fn(() => ({
  attach: attachMock,
}));

/**
 * Resets all gesture-related mocks to their initial state.
 *
 * @returns {void}
 *
 */
export function resetGesturesMocks(): void {
  attachMock.mockClear();
  useGesturesMock.mockClear();
}

const _setupGestures = (_element: HTMLElement, _options: any): void => {
  // Implementation of setupGestures
};

const _cleanupGestures = (): void => {
  // Implementation of cleanupGestures
};
