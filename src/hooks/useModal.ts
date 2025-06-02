/**
 * Modal State Management Hook
 * 
 * Custom hook for managing modal state with focus restoration and accessibility features.
 * Consolidates modal patterns used across components to reduce duplication.
 * 
 * @module useModal
 * @version 1.0.0
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close, modalProps, triggerProps } = useModal({
 *   restoreFocus: true,
 *   closeOnEscape: true
 * });
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { useFocusRestoration } from './useFocusRestoration';
import type { UseModalOptions, UseModalReturn } from '../types/hooks';

/**
 * Custom hook for managing modal state with accessibility features
 * 
 * @param options - Configuration options for modal behavior
 * 
 * @returns Modal state and control functions
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close, modalProps, triggerProps } = useModal({
 *   restoreFocus: true,
 *   closeOnEscape: true,
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed')
 * });
 * 
 * return (
 *   <>
 *     <button {...triggerProps}>Open Modal</button>
 *     {isOpen && (
 *       <div {...modalProps} className="modal">
 *         <div className="modal-content">
 *           <button onClick={close}>Close</button>
 *           <p>Modal content here</p>
 *         </div>
 *       </div>
 *     )}
 *   </>
 * );
 * ```
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    initialOpen = false,
    restoreFocus = true,
    closeOnEscape = true,
    closeOnOutsideClick = false,
    onOpen,
    onClose,
    onStateChange,
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);

  // Focus restoration hook
  const { storeFocus, restoreFocus: restorePreviousFocus } = useFocusRestoration({
    enabled: restoreFocus,
    restoreOnUnmount: false,
  });

  // Open modal function
  const open = useCallback((): void => {
    if (restoreFocus) {
      storeFocus();
    }
    setIsOpen(true);
    onOpen?.();
    onStateChange?.(true);
  }, [restoreFocus, storeFocus, onOpen, onStateChange]);

  // Close modal function
  const close = useCallback((): void => {
    setIsOpen(false);
    if (restoreFocus) {
      // Delay focus restoration to allow modal to close
      setTimeout(() => {
        restorePreviousFocus();
      }, 0);
    }
    onClose?.();
    onStateChange?.(false);
  }, [restoreFocus, restorePreviousFocus, onClose, onStateChange]);

  // Toggle modal function
  const toggle = useCallback((): void => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeOnEscape, isOpen, close]);

  // Handle outside click
  useEffect(() => {
    if (!closeOnOutsideClick || !isOpen) return;

    const handleOutsideClick = (event: MouseEvent): void => {
      const target = event.target as Element;
      const modal = document.querySelector('[role="dialog"]');
      
      if (modal && !modal.contains(target)) {
        close();
      }
    };

    // Add listener with a delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [closeOnOutsideClick, isOpen, close]);

  // Modal props for accessibility
  const modalProps = {
    'aria-hidden': !isOpen,
    role: 'dialog' as const,
    tabIndex: -1,
  };

  // Trigger props for accessibility
  const triggerProps = {
    'aria-expanded': isOpen,
    'aria-haspopup': 'dialog' as const,
    onClick: toggle,
  };

  return {
    isOpen,
    open,
    close,
    toggle,
    modalProps,
    triggerProps,
  };
} 