import { vi } from "vitest";
import type { KeyboardOptions } from "@/types/keyboard";

export const mockTrapFocus = vi.fn();
export const mockReleaseFocus = vi.fn();
export let escapeCallback: (() => void) | undefined = undefined;

export const useKeyboardMock = vi.fn((options: KeyboardOptions | undefined) => {
  escapeCallback = options?.onEscape;
  return {
    trapFocus: mockTrapFocus,
    releaseFocus: mockReleaseFocus,
  };
});

/**
 * Resets all keyboard-related mocks to their initial state.
 *
 * @returns {void}
 *
 */
export function resetKeyboardMocks(): void {
  mockTrapFocus.mockClear();
  mockReleaseFocus.mockClear();
  useKeyboardMock.mockClear();
  escapeCallback = undefined;
}
