import React, { useEffect, useRef } from 'react';

import { useKeyboard } from '../hooks/useKeyboard';
import { FocusManagerProps } from '../types/accessibility';
import { FocusTrapOptions } from '../types/keyboard';

/**
 * FocusManager component for managing focus within a container
 *
 * This component can:
 * 1. Trap focus within a container (for modals, dialogs, etc.)
 * 2. Auto-focus the first focusable element or a specific element on mount
 * 3. Restore focus to a previous element when unmounted
 * 4. Handle keyboard navigation
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
