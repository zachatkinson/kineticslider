/**
 * Reusable hook for managing animation state
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { UseAnimationStateOptions, UseAnimationStateReturn } from '../types/hooks/index';

/**
 * Hook for managing animation state with automatic timeout handling
 *
 * @param options - Configuration options
 *
 * @returns Animation state and control functions
 *
 */
export function useAnimationState(options: UseAnimationStateOptions = {}): UseAnimationStateReturn {
  const { 
    initialAnimating = false, 
    duration = 1000,
    onAnimationStart,
    onAnimationComplete 
  } = options;
  
  const [isAnimating, setIsAnimating] = useState(initialAnimating);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    onAnimationStart?.();
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout to complete animation
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      onAnimationComplete?.();
      timeoutRef.current = null;
    }, duration);
  }, [duration, onAnimationStart, onAnimationComplete]);

  const stopAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsAnimating(false);
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    startAnimation,
    stopAnimation,
    setIsAnimating
  };
} 