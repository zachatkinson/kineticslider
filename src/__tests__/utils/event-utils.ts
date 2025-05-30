/**
 * Utility functions for creating and manipulating events in tests
 * 
 * @deprecated Use src/utils/event-helpers.ts instead
 */

// Re-export from centralized event helpers
export {
  createPointerEvent,
  createTouchEvent,
  createGestureEvent,
  createKeyboardEvent,
  createMouseEvent,
  createWheelEvent,
  createFocusEvent,
  dispatchEvent,
  createAndDispatchEvent,
} from "../../utils/event-helpers";
