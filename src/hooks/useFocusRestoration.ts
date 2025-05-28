import { useEffect, useRef, useCallback } from "react";

/**
 * Options for configuring focus restoration behavior
 *
 * @example
 * ```typescript
 * const options: UseFocusRestorationOptions = {
 *   enabled: true,
 *   restoreOnUnmount: true,
 *   returnFocusTo: '#main-content'
 * };
 * ```
 */
export interface UseFocusRestorationOptions {
  /** Whether focus restoration is enabled */
  enabled?: boolean;
  /** Whether to restore focus when the component unmounts */
  restoreOnUnmount?: boolean;
  /** Element or selector to restore focus to */
  returnFocusTo?: HTMLElement | string | (() => HTMLElement | null) | null;
}

/**
 * Return type for the useFocusRestoration hook
 *
 * @example
 * ```typescript
 * const { previousFocusRef, restoreFocus, storeFocus } = useFocusRestoration({
 *   enabled: true,
 *   restoreOnUnmount: true
 * });
 * ```
 */
export interface UseFocusRestorationReturn {
  /** Reference to store the previously focused element */
  previousFocusRef: React.MutableRefObject<HTMLElement | null>;
  /** Function to manually restore focus */
  restoreFocus: () => void;
  /** Function to store the current focus */
  storeFocus: () => void;
}

/**
 * Custom hook for managing focus restoration in components
 *
 * @param options - Configuration options for focus restoration
 *
 * @returns Object containing focus restoration utilities
 *
 * @example
 * ```tsx
 * const { previousFocusRef, restoreFocus, storeFocus } = useFocusRestoration({
 *   enabled: true,
 *   restoreOnUnmount: true,
 *   returnFocusTo: '#main-content'
 * });
 * 
 * // Store focus when opening a modal
 * const openModal = () => {
 *   storeFocus();
 *   setIsModalOpen(true);
 * };
 * 
 * // Restore focus when closing
 * const closeModal = () => {
 *   setIsModalOpen(false);
 *   restoreFocus();
 * };
 * ```
 */
export function useFocusRestoration(options: UseFocusRestorationOptions = {}): UseFocusRestorationReturn {
  const {
    enabled = true,
    restoreOnUnmount = true,
    returnFocusTo,
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(null);

  const storeFocus = useCallback((): void => {
    if (enabled && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }
  }, [enabled]);

  const restoreFocus = useCallback((): void => {
    if (!enabled) return;

    let elementToFocus: HTMLElement | null = null;

    if (returnFocusTo) {
      if (typeof returnFocusTo === "string") {
        elementToFocus = document.querySelector(returnFocusTo) as HTMLElement;
      } else if (returnFocusTo instanceof HTMLElement) {
        elementToFocus = returnFocusTo;
      } else if (typeof returnFocusTo === "function") {
        elementToFocus = returnFocusTo();
      }
    } else if (previousFocusRef.current) {
      elementToFocus = previousFocusRef.current;
    }

    if (elementToFocus && typeof elementToFocus.focus === "function") {
      try {
        elementToFocus.focus();
      } catch (error) {
        console.warn("Failed to restore focus:", error);
      }
    }
  }, [enabled, returnFocusTo]);

  // Store focus when component mounts
  useEffect(() => {
    if (enabled) {
      storeFocus();
    }
  }, [enabled, storeFocus]);

  // Restore focus on unmount if enabled
  useEffect(() => {
    if (enabled && restoreOnUnmount) {
      return () => {
        restoreFocus();
      };
    }
    return undefined;
  }, [enabled, restoreOnUnmount, restoreFocus]);

  return {
    previousFocusRef,
    restoreFocus,
    storeFocus,
  };
} 