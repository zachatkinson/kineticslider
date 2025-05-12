import { useCallback, useEffect, useRef, useState } from "react";

import {
  FocusTrapOptions,
  KeyboardOptions,
  UseKeyboardReturn,
} from "../types/keyboard";
import {
  _handleKeyboardEvent as handleKeyboardEvent,
  _setupFocusTrap as setupFocusTrap,
  _handleTabInFocusTrap as handleTabInFocusTrap,
  _createKeyboardHandlers as createKeyboardHandlers,
  _attachKeyboardListener as attachKeyboardListener,
} from "../utils/keyboard-helpers";

/**
 * Hook for handling keyboard navigation and accessibility
 *
 * @param options - Configuration with keyboard event handlers
 *
 * @returns Keyboard controller methods
 *
 */
export function useKeyboard(options: KeyboardOptions = {}): UseKeyboardReturn {
  const {
    onLeft,
    onRight,
    onUp,
    onDown,
    onEnter,
    onSpace,
    onEscape,
    onTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isFocusTrapped, setIsFocusTrapped] = useState(false);
  const trapOptionsRef = useRef<FocusTrapOptions>({
    returnFocusOnDeactivate: true,
    escapeDeactivates: true,
  });
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  // Create keyboard handlers map
  const handlersRef = useRef(
    createKeyboardHandlers({
      onLeft,
      onRight,
      onUp,
      onDown,
      onEnter,
      onSpace,
      onEscape,
      onTab,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
    }),
  );

  // Update handlers when props change
  useEffect(() => {
    handlersRef.current = createKeyboardHandlers({
      onLeft,
      onRight,
      onUp,
      onDown,
      onEnter,
      onSpace,
      onEscape,
      onTab,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
    });
  }, [
    onLeft,
    onRight,
    onUp,
    onDown,
    onEnter,
    onSpace,
    onEscape,
    onTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
  ]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!enabled) return;

      if (isFocusTrapped && event.key === "Tab") {
        handleTabInFocusTrap(event, focusableElementsRef.current);
        return;
      }

      handleKeyboardEvent(event, handlersRef.current, {
        preventDefault,
        stopPropagation,
      });
    },
    [enabled, isFocusTrapped, preventDefault, stopPropagation],
  );

  // Set up focus trap
  const trapFocus = useCallback(
    (
      container: HTMLElement | null,
      options: FocusTrapOptions = {},
    ): (() => void) | undefined => {
      if (!container) return;

      // Store previous focus if needed
      if (options.returnFocusOnDeactivate !== false) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }

      // Update trap options
      trapOptionsRef.current = {
        ...trapOptionsRef.current,
        ...options,
      };

      // Set up focus trap
      const { focusableElements } = setupFocusTrap(
        container,
        trapOptionsRef.current,
      );
      focusableElementsRef.current = focusableElements;

      // Activate the trap
      setIsFocusTrapped(true);
      trapOptionsRef.current.onActivate?.();

      // Add event listener to the container
      const cleanup = attachKeyboardListener(container, handleKeyDown);
      elementRef.current = container;
      return cleanup;
    },
    [handleKeyDown],
  );

  // Release focus trap
  const releaseFocus = useCallback((): void => {
    setIsFocusTrapped(false);
    trapOptionsRef.current.onDeactivate?.();

    if (
      trapOptionsRef.current.returnFocusOnDeactivate !== false &&
      previousFocusRef.current &&
      previousFocusRef.current instanceof HTMLElement
    ) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener("keydown", handleKeyDown);
        elementRef.current = null;
      }
    };
  }, [handleKeyDown]);

  return {
    trapFocus,
    releaseFocus,
    isFocusTrapped,
  };
}
