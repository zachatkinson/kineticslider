/**
 * Reusable hook for managing modal open/close state
 */
import { useState, useCallback } from 'react';
import type { UseModalStateOptions, UseModalStateReturn } from '../types/hooks/index';

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
    setIsOpen(prev => {
      const newState = !prev;
      if (newState) {
        onOpen?.();
      } else {
        onClose?.();
      }
      return newState;
    });
  }, [onOpen, onClose]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
} 