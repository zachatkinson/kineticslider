/**
 * Event utility helper functions
 *
 * Utilities for creating and manipulating events for testing and development
 *
 * @module EventHelpers
 * @version 1.0.0
 */

import type { GestureEvent } from "../types/gestures";

/**
 * Create a pointer event for testing or simulation
 *
 * @param type - The type of pointer event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new PointerEvent with the specified type and properties
 *
 * @example
 * ```ts
 * const pointerDown = createPointerEvent("pointerdown", {
 *   clientX: 100,
 *   clientY: 200,
 *   pointerId: 1
 * });
 * ```
 */
export function createPointerEvent(
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

/**
 * Create a touch event for testing or simulation
 *
 * @param type - The type of touch event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new TouchEvent with the specified type and properties
 *
 * @example
 * ```ts
 * const touchStart = createTouchEvent("touchstart", {
 *   touches: customTouchList
 * });
 * ```
 */
export function createTouchEvent(
  type: string,
  overrides: Partial<TouchEvent> = {},
): TouchEvent {
  // Full TouchList mock with required array methods as no-ops
  const touch: Touch = { clientX: 0, clientY: 0 } as Touch;
  const touchList = {
    0: touch,
    length: 1,
    item: (index: number) => (index === 0 ? touch : null),
    [Symbol.iterator]: function* () {
      yield touch;
    },
    // Array methods as no-ops to satisfy TS
    pop: () => undefined,
    push: () => 1,
    concat: () => [],
    join: () => "",
    reverse: () => [],
    shift: () => undefined,
    slice: () => [],
    sort: () => [],
    splice: () => [],
    unshift: () => 1,
    indexOf: () => -1,
    lastIndexOf: () => -1,
    every: () => true,
    some: () => false,
    forEach: () => {},
    map: () => [],
    filter: () => [],
    reduce: () => undefined,
    reduceRight: () => undefined,
    find: () => undefined,
    findIndex: () => -1,
    fill: () => [],
    copyWithin: () => [],
    includes: () => false,
    entries: function* () {},
    keys: function* () {},
    values: function* () {},
    flat: () => [],
    flatMap: () => [],
    toLocaleString: () => "",
    toString: () => "",
    at: () => undefined,
  } as unknown as TouchList;

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    // @ts-expect-error: TouchList cannot be fully mocked in TS, this is safe for tests
    touches: touchList,
    ...overrides,
  });
}

/**
 * Create a gesture event for testing or simulation
 *
 * @param type - The type of gesture event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new GestureEvent with the specified type and properties
 *
 * @example
 * ```ts
 * const panGesture = createGestureEvent("pan", {
 *   center: { x: 150, y: 250 },
 *   target: myElement
 * });
 * ```
 */
export function createGestureEvent(
  type: string,
  overrides: Partial<GestureEvent> = {},
): GestureEvent {
  return {
    type: "pan",
    originalEvent: new MouseEvent(type, {
      clientX: 0,
      clientY: 0,
      bubbles: true,
      cancelable: true,
    }),
    target: document.createElement("div"),
    center: {
      x: 0,
      y: 0,
    },
    startTime: Date.now(),
    ...overrides,
  } as GestureEvent;
}

/**
 * Create a keyboard event for testing or simulation
 *
 * @param key - The key to simulate in the keyboard event
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new KeyboardEvent with the specified key and properties
 *
 * @example
 * ```ts
 * const enterKey = createKeyboardEvent("Enter", {
 *   ctrlKey: true,
 *   target: inputElement
 * });
 * ```
 */
export function createKeyboardEvent(
  key: string,
  overrides: Partial<KeyboardEvent> = {},
): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...overrides,
  });
}

/**
 * Create a mouse event for testing or simulation
 *
 * @param type - The type of mouse event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new MouseEvent with the specified type and properties
 *
 * @example
 * ```ts
 * const click = createMouseEvent("click", {
 *   clientX: 100,
 *   clientY: 200,
 *   button: 0
 * });
 * ```
 */
export function createMouseEvent(
  type: string,
  overrides: Partial<MouseEvent> = {},
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    button: 0,
    ...overrides,
  });
}

/**
 * Create a wheel event for testing or simulation
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new WheelEvent with the specified properties
 *
 * @example
 * ```ts
 * const wheelUp = createWheelEvent({
 *   deltaY: -100,
 *   clientX: 150,
 *   clientY: 250
 * });
 * ```
 */
export function createWheelEvent(
  overrides: Partial<WheelEvent> = {},
): WheelEvent {
  return new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaY: 0,
    deltaX: 0,
    deltaZ: 0,
    ...overrides,
  });
}

/**
 * Create a focus event for testing or simulation
 *
 * @param type - The type of focus event to create ("focus", "blur", etc.)
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new FocusEvent with the specified type and properties
 *
 * @example
 * ```ts
 * const focusIn = createFocusEvent("focusin", {
 *   target: inputElement,
 *   relatedTarget: previousElement
 * });
 * ```
 */
export function createFocusEvent(
  type: string,
  overrides: Partial<FocusEvent> = {},
): FocusEvent {
  return new FocusEvent(type, {
    bubbles: true,
    cancelable: true,
    ...overrides,
  });
}

/**
 * Dispatch an event on a target element
 *
 * @param target - The element to dispatch the event on
 *
 * @param event - The event to dispatch
 *
 * @returns True if the event was not cancelled, false otherwise
 *
 * @example
 * ```ts
 * const button = document.querySelector('button');
 * const clickEvent = createMouseEvent('click');
 * const wasHandled = dispatchEvent(button, clickEvent);
 * ```
 */
export function dispatchEvent(target: EventTarget, event: Event): boolean {
  return target.dispatchEvent(event);
}

/**
 * Create and dispatch an event in one call
 *
 * @param target - The element to dispatch the event on
 *
 * @param type - The type of event to create and dispatch
 *
 * @param eventCreator - Function to create the event
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns True if the event was not cancelled, false otherwise
 *
 * @example
 * ```ts
 * const button = document.querySelector('button');
 * const wasHandled = createAndDispatchEvent(
 *   button,
 *   'click',
 *   createMouseEvent,
 *   { clientX: 100, clientY: 200 }
 * );
 * ```
 */
export function createAndDispatchEvent<T extends Event>(
  target: EventTarget,
  type: string,
  eventCreator: (type: string, overrides?: Record<string, unknown>) => T,
  overrides: Record<string, unknown> = {},
): boolean {
  const event = eventCreator(type, overrides);
  return target.dispatchEvent(event);
} 