/**
 * Browser support types for KineticSlider
 */

/**
 * Options for addEventListener
 *
 * @example Example usage
 */
export interface AddEventListenerOptions {
  passive?: boolean;
  once?: boolean;
  capture?: boolean;
}

/**
 * Callback for requestAnimationFrame
 */
export type FrameRequestCallback = (time: number) => void;

/**
 * Callback for ResizeObserver
 */
export type ResizeObserverCallback = (
  entries: ResizeObserverEntry[],
  observer: ResizeObserver,
) => void;

/**
 * Normalized pointer event interface to handle: touch, mouse and pointer events uniformly
 *
 * @example Example usage
 */
export interface NormalizedPointerEvent {
  clientX: number;
  clientY: number;
  type: string;
  target: EventTarget | null;
  preventDefault: () => void;
}
