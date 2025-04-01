/**
 * Keyboard utility functions for accessibility and navigation
 */

import { FocusTrapOptions, KeyboardHandlers } from '../types/keyboard';
import { hasFocusFunction, hasInitialFocusFunction } from './type-guards';

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableElements = container.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(focusableElements).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
}

/**
 * Handle keyboard event based on provided handlers
 */
export function handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: KeyboardHandlers,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
): void {
  const { preventDefault = true, stopPropagation = false } = options;
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
 */
export function setupFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): {
  focusableElements: HTMLElement[];
  initialElement: HTMLElement | null;
} {
  const focusableElements = getFocusableElements(container);
  let initialElement: HTMLElement | null = null;

  if (options.autoFocus !== false) {
    if (options.initialFocus) {
      if (typeof options.initialFocus === 'string') {
        const foundElement = container.querySelector(options.initialFocus);
        initialElement = foundElement instanceof HTMLElement ? foundElement : null;
      } else if (options.initialFocus instanceof HTMLElement) {
        initialElement = options.initialFocus;
      } else if (hasInitialFocusFunction(options)) {
        try {
          const funcResult = options.initialFocus();
          initialElement = funcResult instanceof HTMLElement ? funcResult : null;
        } catch (error) {
          console.error('Error calling initialFocus function:', error);
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
 */
export function handleTabInFocusTrap(
  event: KeyboardEvent,
  focusableElements: HTMLElement[]
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
 */
export function createKeyboardHandlers(options: {
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
}): KeyboardHandlers {
  return {
    ArrowLeft: options.onLeft,
    ArrowRight: options.onRight,
    ArrowUp: options.onUp,
    ArrowDown: options.onDown,
    Enter: options.onEnter,
    ' ': options.onSpace,
    Escape: options.onEscape,
    Tab: options.onTab,
    Home: options.onHome,
    End: options.onEnd,
    PageUp: options.onPageUp,
    PageDown: options.onPageDown,
  };
}

/**
 * Attach keyboard event listener to element
 */
export function attachKeyboardListener(
  element: HTMLElement,
  handler: (event: KeyboardEvent) => void
): () => void {
  element.addEventListener('keydown', handler);
  return () => {
    element.removeEventListener('keydown', handler);
  };
} 