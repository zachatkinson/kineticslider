import { useCallback, useEffect, useRef, useState } from 'react';

import {
  FocusTrapOptions,
  KeyboardOptions,
  UseKeyboardReturn,
} from '../types/keyboard';

/**
 * Hook for handling keyboard navigation and accessibility
 *
 * @param options - Configuration with keyboard event handlers
 * @returns Keyboard controller methods
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

  // Map keyboard event handlers - stored in a ref to avoid dependency issues
  const handlersRef = useRef<
    Record<string, (() => void) | ((event: KeyboardEvent) => void) | undefined>
  >({});

  // Update handlers ref when props change
  useEffect(() => {
    handlersRef.current = {
      ArrowLeft: onLeft,
      ArrowRight: onRight,
      ArrowUp: onUp,
      ArrowDown: onDown,
      Enter: onEnter,
      ' ': onSpace,
      Escape: onEscape,
      Tab: onTab,
      Home: onHome,
      End: onEnd,
      PageUp: onPageUp,
      PageDown: onPageDown,
    };
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

  // Handle Tab key when focus is trapped
  const handleTrappedTabKey = useCallback(
    (event: KeyboardEvent): void => {
      if (!isFocusTrapped || focusableElementsRef.current.length === 0) return;

      const firstFocusableElement = focusableElementsRef.current[0];
      const lastFocusableElement =
        focusableElementsRef.current[focusableElementsRef.current.length - 1];

      if (!firstFocusableElement || !lastFocusableElement) return;

      // If shift + tab, and we're on the first element, cycle to last element
      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        event.preventDefault();
      }
      // If tab and we're on the last element, cycle to first element
      else if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        firstFocusableElement.focus();
        event.preventDefault();
      }
    },
    [isFocusTrapped]
  );

  // Release focus trap
  const releaseFocus = useCallback(() => {
    setIsFocusTrapped(false);

    // Restore focus to the previously focused element
    if (
      trapOptionsRef.current.returnFocusOnDeactivate &&
      previousFocusRef.current &&
      typeof previousFocusRef.current.focus === 'function'
    ) {
      previousFocusRef.current.focus();
    }

    // Reset refs
    previousFocusRef.current = null;
    focusableElementsRef.current = [];
  }, []);

  // Handle key events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!enabled) return;

      const { key } = event;
      const callback = handlersRef.current[key];

      // Special handling for Tab key when focus is trapped
      if (key === 'Tab' && isFocusTrapped) {
        handleTrappedTabKey(event);
        return; // Return early after handling trapped tab
      }

      if (callback) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        if (
          key === 'Escape' &&
          isFocusTrapped &&
          trapOptionsRef.current.escapeDeactivates
        ) {
          releaseFocus();
          trapOptionsRef.current.onDeactivate?.();
        } else if (typeof callback === 'function') {
          if (key === 'Tab') {
            (callback as (event: KeyboardEvent) => void)(event);
          } else {
            (callback as () => void)();
          }
        }
      }
    },
    [
      enabled,
      preventDefault,
      stopPropagation,
      isFocusTrapped,
      handleTrappedTabKey,
      releaseFocus,
    ]
  );

  // Get all focusable elements within a container
  const getFocusableElements = useCallback(
    (container: HTMLElement): HTMLElement[] => {
      const selector =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const elements = container.querySelectorAll(selector);
      return Array.from(elements).filter(
        (el): el is HTMLElement => el instanceof HTMLElement
      );
    },
    []
  );

  // Attach keyboard event to an element
  const attachToElement = useCallback(
    (element: HTMLElement | null) => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('keydown', handleKeyDown);
        elementRef.current = null;
      }

      if (element) {
        element.addEventListener('keydown', handleKeyDown);
        elementRef.current = element;
      }
    },
    [handleKeyDown]
  );

  // Focus a specific element
  const focusElement = useCallback((selector: string | HTMLElement) => {
    let element: HTMLElement | null = null;

    if (typeof selector === 'string') {
      element = document.querySelector(selector) as HTMLElement;
    } else {
      element = selector;
    }

    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  // Trap focus within a container
  const trapFocus = useCallback(
    (container: HTMLElement | null, options: FocusTrapOptions = {}) => {
      if (!container) return;

      // Save current options
      trapOptionsRef.current = {
        active: options.active,
        autoFocus: options.autoFocus ?? true,
        returnFocusOnDeactivate: options.returnFocusOnDeactivate !== false,
        escapeDeactivates: options.escapeDeactivates !== false,
        fallbackFocus: options.fallbackFocus,
        initialFocus: options.initialFocus,
        onActivate: options.onActivate,
        onDeactivate: options.onDeactivate,
      };

      // Get all focusable elements
      focusableElementsRef.current = getFocusableElements(container);

      if (focusableElementsRef.current.length === 0) {
        console.warn('No focusable elements found in the focus trap container');
        return;
      }

      // Save previously focused element
      const activeElement = document.activeElement;
      previousFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;

      // Focus the initial element
      if (trapOptionsRef.current.autoFocus !== false) {
        let initialElement: HTMLElement | null = null;

        if (trapOptionsRef.current.initialFocus) {
          if (typeof trapOptionsRef.current.initialFocus === 'string') {
            const foundElement = container.querySelector(
              trapOptionsRef.current.initialFocus
            );
            initialElement =
              foundElement instanceof HTMLElement ? foundElement : null;
          } else if (
            trapOptionsRef.current.initialFocus instanceof HTMLElement
          ) {
            initialElement = trapOptionsRef.current.initialFocus;
          } else if (
            typeof trapOptionsRef.current.initialFocus === 'function'
          ) {
            try {
              const funcResult = trapOptionsRef.current.initialFocus();
              // Handle different return types including undefined
              initialElement =
                funcResult instanceof HTMLElement ? funcResult : null;
            } catch (error) {
              console.error('Error calling initialFocus function:', error);
            }
          }
        }

        if (!initialElement && focusableElementsRef.current.length > 0) {
          initialElement = focusableElementsRef.current[0] || null;
        }

        if (initialElement && typeof initialElement.focus === 'function') {
          initialElement.focus();
        }
      }

      // Activate the trap
      setIsFocusTrapped(true);
      trapOptionsRef.current.onActivate?.();

      // Add event listener to the container
      attachToElement(container);
    },
    [attachToElement, getFocusableElements]
  );

  // Clean up event listeners
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('keydown', handleKeyDown);
        elementRef.current = null;
      }
    };
  }, [handleKeyDown]);

  return {
    attachToElement,
    focusElement,
    trapFocus,
    releaseFocus,
  };
}
