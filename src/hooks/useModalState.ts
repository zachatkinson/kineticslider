/**
 * Reusable hook for managing modal open/close state
 */
import { useState, useCallback } from 'react';

export interface UseModalStateOptions {
  /** Initial open state */
  initialOpen?: boolean;
  /** Callback when modal opens */
  onOpen?: () => void;
  /** Callback when modal closes */
  onClose?: () => void;
}

export interface UseModalStateReturn {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Toggle the modal state */
  toggle: () => void;
  /** Set the modal state directly */
  setIsOpen: (open: boolean) => void;
}

/**
 * Hook for managing modal open/close state with callbacks
 *
 * @param options - Configuration options
 *
 * @returns Modal state and control functions
 *
 */
export function useModalState(options: UseModalStateOptions = {}): UseModalStateReturn {
  const { initialOpen = false, onOpen, onClose } = options;
  
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const setOpen = useCallback((isOpenValue: boolean) => {
    if (isOpenValue) {
      open();
    } else {
      close();
    }
  }, [open, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen: setOpen
  };
} 