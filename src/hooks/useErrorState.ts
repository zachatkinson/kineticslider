import { useState, useCallback } from "react";
import { useErrorTracking } from "./slider/useErrorTracking";
import { ErrorType } from "../types/error";

/**
 * Options for configuring error state behavior
 *
 * @example
 * ```typescript
 * const options: UseErrorStateOptions = {
 *   initialError: null,
 *   initialIsError: false,
 *   onParentError: (error) => console.error('Parent error:', error),
 *   enableTracking: true
 * };
 * ```
 */
export interface UseErrorStateOptions {
  /** Initial error state */
  initialError?: Error | null;
  /** Initial error flag state */
  initialIsError?: boolean;
  /** Callback for parent error propagation */
  onParentError?: (error: Error | null) => void;
  /** Callback for parent error flag propagation */
  onParentIsError?: (isError: boolean) => void;
  /** Callback for additional error handling */
  onError?: (error: Error) => void;
  /** Whether to enable error tracking */
  enableTracking?: boolean;
}

/**
 * Return type for the useErrorState hook
 *
 * @example
 * ```typescript
 * const { error, isError, propagateError, clearError } = useErrorState({
 *   onParentError: handleError,
 *   enableTracking: true
 * });
 * ```
 */
export interface UseErrorStateReturn {
  /** Current error state */
  error: Error | null;
  /** Whether an error has occurred */
  isError: boolean;
  /** Function to propagate an error */
  propagateError: (error: Error, errorType?: ErrorType) => void;
  /** Function to clear the current error */
  clearError: () => void;
}

/**
 * Custom hook for managing error state with tracking and propagation
 *
 * @param options - Configuration options for error state management
 *
 * @returns Object containing error state and management functions
 *
 * @example
 * ```tsx
 * const { error, isError, propagateError, clearError } = useErrorState({
 *   onParentError: setParentError,
 *   onParentIsError: setParentIsError,
 *   onError: handleError,
 *   enableTracking: true
 * });
 * 
 * const handleOperation = async () => {
 *   try {
 *     await riskyOperation();
 *   } catch (err) {
 *     propagateError(err instanceof Error ? err : new Error('Operation failed'));
 *   }
 * };
 * ```
 */
export function useErrorState(options: UseErrorStateOptions = {}): UseErrorStateReturn {
  const {
    initialError = null,
    initialIsError = false,
    onParentError,
    onParentIsError,
    onError,
    enableTracking = true,
  } = options;

  const [error, setError] = useState<Error | null>(initialError);
  const [isError, setIsError] = useState<boolean>(initialIsError);

  // Always call the hook, but conditionally use its result
  const errorTracking = useErrorTracking();

  const propagateError = useCallback(
    (err: Error, errorType: ErrorType = ErrorType.NAVIGATION): void => {
      setError(err);
      setIsError(true);
      
      // Propagate to parent components
      onParentError?.(err);
      onParentIsError?.(true);
      
      // Call additional error handler
      onError?.(err);
      
      // Track error if tracking is enabled
      if (enableTracking && errorTracking) {
        errorTracking.trackError(err, errorType);
      }
    },
    [onParentError, onParentIsError, onError, enableTracking, errorTracking],
  );

  const clearError = useCallback((): void => {
    setError(null);
    setIsError(false);
    onParentError?.(null);
    onParentIsError?.(false);
  }, [onParentError, onParentIsError]);

  return {
    error,
    isError,
    propagateError,
    clearError,
  };
} 