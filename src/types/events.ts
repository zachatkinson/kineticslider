/**
 * Event types for the KineticSlider component
 */

/** Base event interface for all slider events */
export interface BaseSliderEvent {
  clientX: number;
  clientY: number;
  type: SliderEventType;
  startX: number;
  startY: number;
}

/** Touch event types */
export type TouchEventType = 'touchstart' | 'touchmove' | 'touchend';

/** Mouse event types */
export type MouseEventType = 'mousedown' | 'mousemove' | 'mouseup';

/** Combined event types */
export type SliderEventType = TouchEventType | MouseEventType;

/** Event handler types */
export type SliderEventHandler = (event: BaseSliderEvent) => void;

/** Keyboard event handler type */
export type KeyboardEventHandler = (event: KeyboardEvent) => void;

/** Focus event handler type */
export type FocusEventHandler = (event: FocusEvent) => void; 