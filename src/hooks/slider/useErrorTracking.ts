import { useEffect, useMemo } from "react";
import { useSlider } from "../../context/SliderContext";
import { trackError, createErrorTracker } from "../../utils/error-tracking";
import { ErrorType } from "../../types/error";
import type { SliderContextValue } from "../../types/slider";

/**
 * Hook for tracking and managing errors in the slider component.
 * Provides error tracking functionality and error type constants.
 *
 * @returns Object containing error tracking utilities and error type constants
 *
 */
export function useErrorTracking(): {
  trackError: (error: Error, type: ErrorType) => void;
  ERROR_TYPES: typeof ErrorType;
} {
  const { state } = useSlider() as SliderContextValue;

  const componentInfo = useMemo(
    () => ({
      currentIndex: state.currentIndex,
      isAnimating: state.isAnimating,
      isDragging: state.isDragging,
    }),
    [state.currentIndex, state.isAnimating, state.isDragging],
  );

  // Track render errors
  useEffect(() => {
    const cleanup = createErrorTracker(componentInfo, ErrorType.RENDER);
    return cleanup;
  }, [componentInfo]);

  return {
    trackError: (error: Error, type: ErrorType) =>
      trackError(error, type, componentInfo),
    ERROR_TYPES: ErrorType,
  };
}
