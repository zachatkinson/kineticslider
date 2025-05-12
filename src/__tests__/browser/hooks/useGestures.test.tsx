import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useGestures } from "@/hooks/useGestures";
import { GestureOptions } from "@/types/gestures";
import { createBrandedNumber } from "@/types/branded";

/**
 * Helper to create pointer events
 *
 * @param type - The type of pointer event
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new pointer event with the specified type and overrides
 *
 */
function createPointerEvent(
  type: string,
  overrides: Partial<PointerEvent> = {},
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    clientX: 0,
    clientY: 0,
    button: 0,
    pointerId: 1,
    ...overrides,
  });
  return event;
}

describe("useGestures Hook", () => {
  // Element to attach gestures to
  let element: HTMLDivElement;
  // Mock handlers
  let onSwipe = vi.fn();
  // Cleanup function
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    // Create and mount element
    element = document.createElement("div");
    document.body.appendChild(element);

    // Mock required methods
    element.setPointerCapture = vi.fn();
    element.releasePointerCapture = vi.fn();
    element.addEventListener = vi.fn(element.addEventListener);
    element.removeEventListener = vi.fn(element.removeEventListener);

    // Reset mock handlers
    onSwipe = vi.fn();
  });

  afterEach(() => {
    // Cleanup
    if (cleanup) {
      cleanup();
    }
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    vi.resetAllMocks();
  });

  describe("Pointer Events", () => {
    it("detects horizontal swipe gestures", async () => {
      const { result } = renderHook(() =>
        useGestures({
          threshold: createBrandedNumber(50, "GestureThreshold"),
          minVelocity: createBrandedNumber(0.5, "GestureVelocity"),
        }),
      );

      const gestureOptions: GestureOptions = {
        onSwipe,
      };
      cleanup = result.current.attach(element, gestureOptions);

      // Start pointer interaction
      await act(async () => {
        const pointerDownEvent = createPointerEvent("pointerdown", {
          clientX: 0,
          clientY: 0,
        });
        element.dispatchEvent(pointerDownEvent);
      });

      // Move pointer
      await act(async () => {
        // This simulates a fast swipe to the right
        const pointerMoveEvent = createPointerEvent("pointermove", {
          clientX: 100,
          clientY: 0,
        });
        element.dispatchEvent(pointerMoveEvent);
      });

      // End pointer interaction
      await act(async () => {
        const pointerUpEvent = createPointerEvent("pointerup", {
          clientX: 100,
          clientY: 0,
        });
        element.dispatchEvent(pointerUpEvent);
      });

      // Verify the swipe handler was called with 'right' direction
      expect(onSwipe).toHaveBeenCalledWith("right");
    });

    it("does not trigger swipe for small movements", async () => {
      const { result } = renderHook(() =>
        useGestures({
          threshold: createBrandedNumber(50, "GestureThreshold"),
          minVelocity: createBrandedNumber(0.5, "GestureVelocity"),
        }),
      );

      const gestureOptions: GestureOptions = {
        onSwipe,
      };
      cleanup = result.current.attach(element, gestureOptions);

      // Start pointer interaction
      await act(async () => {
        const pointerDownEvent = createPointerEvent("pointerdown", {
          clientX: 0,
          clientY: 0,
        });
        element.dispatchEvent(pointerDownEvent);
      });

      // Multiple small move events that shouldn't trigger swipe
      const positions = [10, 20, 30];
      for (const pos of positions) {
        await act(async () => {
          const pointerMoveEvent = createPointerEvent("pointermove", {
            clientX: pos,
            clientY: 0,
          });
          element.dispatchEvent(pointerMoveEvent);
        });
      }

      // End pointer interaction without exceeding threshold
      await act(async () => {
        const pointerUpEvent = createPointerEvent("pointerup", {
          clientX: 30,
          clientY: 0,
        });
        element.dispatchEvent(pointerUpEvent);
      });

      // Verify swipe was not triggered
      expect(onSwipe).not.toHaveBeenCalled();
    });

    it("handles pointer cancellation", async () => {
      const { result } = renderHook(() =>
        useGestures({
          threshold: createBrandedNumber(50, "GestureThreshold"),
          minVelocity: createBrandedNumber(0.5, "GestureVelocity"),
        }),
      );

      const gestureOptions: GestureOptions = {
        onSwipe,
      };
      cleanup = result.current.attach(element, gestureOptions);

      // Start pointer interaction
      await act(async () => {
        const pointerDownEvent = createPointerEvent("pointerdown", {
          clientX: 0,
          clientY: 0,
        });
        element.dispatchEvent(pointerDownEvent);
      });

      // Cancel pointer interaction
      await act(async () => {
        const pointerCancelEvent = createPointerEvent("pointercancel", {
          clientX: 0,
          clientY: 0,
        });
        element.dispatchEvent(pointerCancelEvent);
      });

      // Move after cancel should not trigger swipe
      await act(async () => {
        const pointerMoveEvent = createPointerEvent("pointermove", {
          clientX: 100,
          clientY: 0,
        });
        element.dispatchEvent(pointerMoveEvent);
      });

      // Verify swipe was not triggered
      expect(onSwipe).not.toHaveBeenCalled();
    });
  });

  describe("Event Cleanup", () => {
    it("removes event listeners on cleanup", async () => {
      const { result } = renderHook(() =>
        useGestures({
          threshold: createBrandedNumber(50, "GestureThreshold"),
          minVelocity: createBrandedNumber(0.5, "GestureVelocity"),
        }),
      );

      const gestureOptions: GestureOptions = {
        onSwipe,
      };

      // Attach gestures
      const cleanupFn = result.current.attach(element, gestureOptions);

      // Run cleanup
      await act(async () => {
        cleanupFn();
      });

      // Verify all event listeners are removed
      expect(element.removeEventListener).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
      );
      expect(element.removeEventListener).toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
      expect(element.removeEventListener).toHaveBeenCalledWith(
        "pointerup",
        expect.any(Function),
      );
      expect(element.removeEventListener).toHaveBeenCalledWith(
        "pointercancel",
        expect.any(Function),
      );
    });
  });

  describe("Error Handling", () => {
    it("handles invalid pointer events gracefully", async () => {
      const { result } = renderHook(() =>
        useGestures({
          threshold: createBrandedNumber(50, "GestureThreshold"),
          minVelocity: createBrandedNumber(0.5, "GestureVelocity"),
        }),
      );

      const gestureOptions: GestureOptions = {
        onSwipe,
      };
      cleanup = result.current.attach(element, gestureOptions);

      // Directly dispatch pointermove without a preceding pointerdown
      await act(async () => {
        const invalidPointerEvent = createPointerEvent("pointermove", {
          clientX: 0,
          clientY: 0,
        });
        element.dispatchEvent(invalidPointerEvent);
      });

      // Verify the event was handled without triggering the swipe
      expect(onSwipe).not.toHaveBeenCalled();
    });
  });
});

/**
 * Sets up the gesture handling for testing.
 *
 * @returns {Object} An object containing the element and options for gesture handling.
 *
 */
const _setupGestureHandling = (): void => {
  // Implementation of setupGestureHandling function
};
