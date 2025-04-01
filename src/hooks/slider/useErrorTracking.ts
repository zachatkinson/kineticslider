import { useEffect } from 'react';
import { useSlider } from '../../context/SliderContext';
import { trackError, createErrorTracker } from '../../utils/error-tracking';
import { ErrorType } from '../../types/error';

export function useErrorTracking() {
  const { state } = useSlider();
  
  const componentInfo = {
    currentIndex: state.currentIndex,
    isAnimating: state.isAnimating,
    isDragging: state.isDragging,
  };

  // Track render errors
  useEffect(() => {
    const cleanup = createErrorTracker(componentInfo, ErrorType.RENDER);
    return cleanup;
  }, [componentInfo]);

  return {
    trackError: (error: Error, type: ErrorType) => trackError(error, type, componentInfo),
    ERROR_TYPES: ErrorType,
  };
} 