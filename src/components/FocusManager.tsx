import React, { useEffect, useRef } from 'react';

import { useKeyboard } from '../hooks/useKeyboard';
import { FocusManagerProps } from '../types/accessibility';
import { FocusTrapOptions } from '../types/keyboard';

/**
 * A component that manages focus within a container, providing focus trapping, auto-focus,
 * and keyboard navigation capabilities.
 *
 * @component
 * @example
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
 * @accessibility
 * - Traps keyboard focus within container
 * - Supports initial focus management
 * - Restores focus on unmount
 * - Handles keyboard navigation (Tab/Shift+Tab)
 * - Supports escape key for deactivation
 *
 * @state
 * - Manages focus state within container
 * - Tracks previously focused element
 * - Handles focus trap activation/deactivation
 *
 * @events
 * - onActivate: Fired when focus trap is activated
 * - onDeactivate: Fired when focus trap is deactivated
 * - onEscape: Fired when escape key is pressed
 *
 * @performance
 * - Uses refs for DOM access
 * - Implements cleanup on unmount
 * - Optimizes focus event handling
 *
 * @error
 * - Handles missing focusable elements
 * - Manages focus restoration failures
 * - Provides fallback behaviors
 *
 * @see {@link useKeyboard} For keyboard event handling
 * @see {@link FocusTrapOptions} For configuration options
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
          const elementToFocus = document.querySelector(
            returnFocusTo
          ) as HTMLElement;
          if (elementToFocus && typeof elementToFocus.focus === 'function') {
            elementToFocus.focus();
          }
        } catch (e) {
          console.warn('Failed to restore focus:', e);
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
