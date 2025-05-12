import React, { useEffect, useRef } from "react";

import { useKeyboard } from "../hooks/useKeyboard";
import { FocusManagerProps } from "../types/accessibility";
import { FocusTrapOptions } from "../types/keyboard";

/**
 * A component that manages focus within a container, providing focus trapping, auto-focus,
 * and keyboard navigation capabilities.
 *
 * @param root0
 *
 * @param root0.children
 *
 * @param root0.trapFocus
 *
 * @param root0.trapOptions
 *
 * @param root0.initialFocus
 *
 * @param root0.returnFocusTo
 *
 * @param root0.restoreFocus
 *
 * @param root0.autoFocus
 *
 * @param root0.escapeDeactivates
 *
 * @param root0.onActivate
 *
 * @param root0.onDeactivate
 *
 * @param root0.onEscape
 *
 * @description * @example Example usage
 * ```tsx
 * <FocusManager
 *   trapFocus
 *   autoFocus
 *   escapeDeactivates
 *   onEscape={() => setIsOpen(false)}
 * >
 *   <div role="dialog">
 *     <button>First focusable</button>
 *     <button>Second focusable</button>
 *   </div>
 * </FocusManager>
 * ```
 *
 * @description * - Traps keyboard focus within container
 * - Supports initial focus management
 * - Restores focus on unmount
 * - Handles keyboard navigation (Tab/Shift+Tab)
 * - Supports escape key for deactivation
 *
 * @description * - Manages focus state within container
 * - Tracks previously focused element
 * - Handles focus trap activation/deactivation
 *
 * @event onChange
 * - onActivate: Fired when focus trap is activated
 * - onDeactivate: Fired when focus trap is deactivated
 * - onEscape: Fired when escape key is pressed
 *
 * @description * - Uses refs for DOM access
 * - Implements cleanup on unmount
 * - Optimizes focus event handling
 *
 * @description * - Handles missing focusable elements
 * - Manages focus restoration failures
 * - Provides fallback behaviors
 *
 * @returns A div component that manages focus for its children
 *
 * @see {@link: useKeyboard} For keyboard event handling
 * @see {@link: FocusTrapOptions} For configuration options
 */
export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  trapFocus = false,
  trapOptions = {},
  initialFocus,
  returnFocusTo,
  restoreFocus = true,
  autoFocus = true,
  escapeDeactivates = true,
  onActivate,
  onDeactivate,
  onEscape,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus: setFocusTrap, releaseFocus } = useKeyboard({
    onEscape: onEscape,
  });

  // Set up focus trap
  useEffect(() => {
    const container = containerRef.current;

    if (container && trapFocus) {
      const options: FocusTrapOptions = {
        ...trapOptions,
        autoFocus: autoFocus,
        escapeDeactivates: escapeDeactivates,
        returnFocusOnDeactivate: restoreFocus,
        onActivate: onActivate,
        onDeactivate: onDeactivate,
      };

      // Set initial focus if provided
      if (initialFocus) {
        options.initialFocus = initialFocus;
      }

      setFocusTrap(container, options);

      return () => {
        releaseFocus();
      };
    }

    return undefined;
  }, [
    trapFocus,
    autoFocus,
    escapeDeactivates,
    initialFocus,
    onActivate,
    onDeactivate,
    restoreFocus,
    setFocusTrap,
    releaseFocus,
    trapOptions,
  ]);

  // Handle focus restoration on unmount if not using focus trap
  useEffect(() => {
    if (!trapFocus && returnFocusTo && restoreFocus) {
      return () => {
        try {
          // Handle different types for returnFocusTo
          let elementToFocus: HTMLElement | null = null;

          if (typeof returnFocusTo === "string") {
            // If it's a selector, use querySelector
            elementToFocus = document.querySelector(
              returnFocusTo,
            ) as HTMLElement;
          } else if (returnFocusTo instanceof HTMLElement) {
            // If it's an HTMLElement, use directly
            elementToFocus = returnFocusTo;
          } else if (typeof returnFocusTo === "function") {
            // If it's a function, call it
            elementToFocus = returnFocusTo();
          }

          if (elementToFocus && typeof elementToFocus.focus === "function") {
            elementToFocus.focus();
          }
        } catch (e) {
          console.warn("Failed to restore focus:", e);
        }
      };
    }

    return undefined;
  }, [trapFocus, returnFocusTo, restoreFocus]);

  return (
    <div ref={containerRef} className="focus-manager">
      {children}
    </div>
  );
};

export default FocusManager;
