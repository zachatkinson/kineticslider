/**
 * Keyboard utility functions for accessibility and navigation
 */

import { FocusTrapOptions, KeyboardHandlers } from "../types/keyboard";
import {
  _hasFocusFunction as hasFocusFunction,
  _hasInitialFocusFunction as hasInitialFocusFunction,
} from "./type-guards";

/**
 * Get all focusable elements within a container
 *
 * @param container - The container element to search within
 *
 * @returns Array of focusable elements
 *
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableElements = container.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(focusableElements).filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
}

/**
 * Handle keyboard event based on provided handlers
 *
 * @param event - The keyboard event
 *
 * @param handlers - Map of key codes to handler functions
 *
 * @param _options - Configuration options
 *
 * @param _options.preventDefault
 *
 * @param _options.stopPropagation
 *
 */
export function _handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: KeyboardHandlers,
  _options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {},
): void {
  const { preventDefault = true, stopPropagation = false } = _options;
  const handler = handlers[event.key];

  if (handler) {
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }
    handler(event);
  }
}

/**
 * Set up focus trap in a container
 *
 * @param container - The container element to trap focus within
 *
 * @param _options - Configuration options
 *
 * @returns Object containing focusable elements and initial focus element
 *
 */
export function _setupFocusTrap(
  container: HTMLElement,
  _options: FocusTrapOptions = {},
): {
  focusableElements: HTMLElement[];
  initialElement: HTMLElement | null;
} {
  const focusableElements = getFocusableElements(container);
  let initialElement: HTMLElement | null = null;

  if (_options.autoFocus !== false) {
    if (_options.initialFocus) {
      if (typeof _options.initialFocus === "string") {
        const foundElement = container.querySelector(_options.initialFocus);
        initialElement =
          foundElement instanceof HTMLElement ? foundElement : null;
      } else if (_options.initialFocus instanceof HTMLElement) {
        initialElement = _options.initialFocus;
      } else if (hasInitialFocusFunction(_options)) {
        try {
          const funcResult = _options.initialFocus();
          initialElement =
            funcResult instanceof HTMLElement ? funcResult : null;
        } catch (error) {
          console.error("Error calling initialFocus function:", error);
        }
      }
    }

    if (!initialElement && focusableElements.length > 0) {
      initialElement = focusableElements[0];
    }

    if (initialElement && hasFocusFunction(initialElement)) {
      initialElement.focus();
    }
  }

  return { focusableElements, initialElement };
}

/**
 * Handle tab key in a focus trap
 *
 * @param event - The keyboard event
 *
 * @param focusableElements - Array of focusable elements
 *
 */
export function _handleTabInFocusTrap(
  event: KeyboardEvent,
  focusableElements: HTMLElement[],
): void {
  if (focusableElements.length === 0) return;

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === firstFocusableElement) {
      lastFocusableElement.focus();
      event.preventDefault();
    }
  } else {
    if (document.activeElement === lastFocusableElement) {
      firstFocusableElement.focus();
      event.preventDefault();
    }
  }
}

/**
 * Create keyboard event handlers map
 *
 * @param _options - Configuration options with handler functions
 *
 * @param _options.onLeft
 *
 * @param _options.onRight
 *
 * @param _options.onUp
 *
 * @param _options.onDown
 *
 * @param _options.onEnter
 *
 * @param _options.onSpace
 *
 * @param _options.onEscape
 *
 * @param _options.onTab
 *
 * @param _options.onHome
 *
 * @param _options.onEnd
 *
 * @param _options.onPageUp
 *
 * @param _options.onPageDown
 *
 * @returns Map of key codes to handler functions
 *
 */
export function _createKeyboardHandlers(
  _options: {
    onLeft?: () => void;
    onRight?: () => void;
    onUp?: () => void;
    onDown?: () => void;
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onTab?: (event: KeyboardEvent) => void;
    onHome?: () => void;
    onEnd?: () => void;
    onPageUp?: () => void;
    onPageDown?: () => void;
  } = {},
): KeyboardHandlers {
  return {
    ArrowLeft: _options.onLeft,
    ArrowRight: _options.onRight,
    ArrowUp: _options.onUp,
    ArrowDown: _options.onDown,
    Enter: _options.onEnter,
    " ": _options.onSpace,
    Escape: _options.onEscape,
    Tab: _options.onTab,
    Home: _options.onHome,
    End: _options.onEnd,
    PageUp: _options.onPageUp,
    PageDown: _options.onPageDown,
  };
}

/**
 * Attach keyboard event listener to element
 *
 * @param element - The element to attach the listener to
 *
 * @param handler - The event handler function
 *
 * @returns Cleanup function to remove the listener
 *
 */
export function _attachKeyboardListener(
  element: HTMLElement,
  handler: (event: KeyboardEvent) => void,
): () => void {
  element.addEventListener("keydown", handler);
  return () => {
    element.removeEventListener("keydown", handler);
  };
}
