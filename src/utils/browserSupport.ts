/**
 * Browser support utilities for KineticSlider
 */
import {
  AddEventListenerOptions,
  FrameRequestCallback,
  NormalizedPointerEvent,
  ResizeObserverCallback,
} from "../types/browser";

// Check for ResizeObserver support
export const hasResizeObserver = typeof ResizeObserver !== "undefined";

// Check for passive event listener support
export const _supportsPassiveEvents = (() => {
  let passiveSupported = false;

  try {
    // Need to define an empty handler to avoid TypeScript errors
    const noop = (): void => {};
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      },
    } as AddEventListenerOptions;

    window.addEventListener("testPassive", noop, options);
    window.removeEventListener("testPassive", noop, options);
  } catch {
    passiveSupported = false;
  }

  return passiveSupported;
})();

// Check for touch events support
export const _hasTouchEvents =
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Check for pointer events support
export const _hasPointerEvents = window.PointerEvent !== undefined;

// Check for requestAnimationFrame support
export const hasRAF = typeof requestAnimationFrame === "function";

// Fallback for requestAnimationFrame
export const requestFrame = (callback: FrameRequestCallback): number => {
  if (hasRAF) {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 1000 / 60) as unknown as number;
};

// Fallback for cancelAnimationFrame
export const cancelFrame = (handle: number): void => {
  if (hasRAF) {
    cancelAnimationFrame(handle);
  } else {
    clearTimeout(handle);
  }
};

// Fallback for ResizeObserver
/**
 * Fallback implementation of ResizeObserver for browsers that don't support it natively.
 * Provides similar API to the native ResizeObserver with observe, unobserve, and disconnect methods.
 *
 * @example Example usage
 */
export class ResizeObserverFallback {
  private elements: Set<Element>;
  private callback: ResizeObserverCallback;
  private rafId: number | null;
  private sizes: Map<Element, { width: number; height: number }>;

  /**
   *
   */
  constructor(callback: ResizeObserverCallback) {
    this.elements = new Set();
    this.callback = callback;
    this.rafId = null;
    this.sizes = new Map();
    this.checkSizes = this.checkSizes.bind(this);
  }

  /**
   *
   * @param element
   *
   */
  observe(element: Element): void {
    if (this.elements.has(element)) return;

    this.elements.add(element);
    this.sizes.set(element, {
      width: element.clientWidth,
      height: element.clientHeight,
    });

    if (this.elements.size === 1) {
      this.startObserving();
    }
  }

  /**
   *
   * @param element
   *
   */
  unobserve(element: Element): void {
    this.elements.delete(element);
    this.sizes.delete(element);

    if (this.elements.size === 0) {
      this.stopObserving();
    }
  }

  /**
   *
   */
  disconnect(): void {
    this.elements.clear();
    this.sizes.clear();
    this.stopObserving();
  }

  private startObserving(): void {
    this.checkSizes();
    window.addEventListener("resize", this.checkSizes);
  }

  private stopObserving(): void {
    if (this.rafId !== null) {
      cancelFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener("resize", this.checkSizes);
  }

  private checkSizes(): void {
    if (this.rafId !== null) {
      cancelFrame(this.rafId);
    }

    this.rafId = requestFrame(() => {
      const entries: ResizeObserverEntry[] = [];

      this.elements.forEach((element) => {
        const oldSize = this.sizes.get(element);
        if (!oldSize) return;

        const newSize = {
          width: element.clientWidth,
          height: element.clientHeight,
        };

        if (
          oldSize.width !== newSize.width ||
          oldSize.height !== newSize.height
        ) {
          this.sizes.set(element, newSize);
          entries.push({
            target: element,
            contentRect: element.getBoundingClientRect(),
            borderBoxSize: [
              {
                blockSize: newSize.height,
                inlineSize: newSize.width,
              },
            ],
            contentBoxSize: [
              {
                blockSize: newSize.height,
                inlineSize: newSize.width,
              },
            ],
            devicePixelContentBoxSize: [
              {
                blockSize: newSize.height,
                inlineSize: newSize.width,
              },
            ],
          } as ResizeObserverEntry);
        }
      });

      if (entries.length > 0) {
        this.callback(entries, this as unknown as ResizeObserver);
      }

      this.rafId = null;
    });
  }
}

// Get the appropriate ResizeObserver implementation
export const _getResizeObserver = (
  callback: ResizeObserverCallback,
): ResizeObserver => {
  return hasResizeObserver
    ? new ResizeObserver(callback)
    : (new ResizeObserverFallback(callback) as unknown as ResizeObserver);
};

// Touch event normalization
export const _normalizePointerEvent = (
  event: TouchEvent | MouseEvent | PointerEvent,
): NormalizedPointerEvent => {
  if ("touches" in event) {
    const touch = event.touches[0] || event.changedTouches[0];
    if (!touch) {
      return {
        clientX: 0,
        clientY: 0,
        type: event.type,
        target: event.target,
        preventDefault: () => event.preventDefault(),
      };
    }
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      type: event.type,
      target: event.target,
      preventDefault: () => event.preventDefault(),
    };
  }
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    type: event.type,
    target: event.target,
    preventDefault: () => event.preventDefault(),
  };
};
