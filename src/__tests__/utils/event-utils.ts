/**
 * Utility functions for creating and manipulating events in tests
 */
import type { GestureEvent } from "@/types/gestures";

/**
 * Create a pointer event for testing
 *
 * @param type - The type of pointer event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new PointerEvent with the specified type and properties
 *
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
 * Create a touch event for testing
 *
 * @param type - The type of touch event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new TouchEvent with the specified type and properties
 *
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
 * Create a gesture event for testing
 *
 * @param type - The type of gesture event to create
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new GestureEvent with the specified type and properties
 *
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
 * Create a keyboard event for testing
 *
 * @param key - The key to simulate in the keyboard event
 *
 * @param overrides - Optional overrides for the event properties
 *
 * @returns A new KeyboardEvent with the specified key and properties
 *
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
