/**
 * Hooks index - centralized exports for all custom hooks
 */

// Animation hooks
export { useAnimation } from "./useAnimation";
export { useEnhancedAnimation } from "./animation/useEnhancedAnimation";

// Async data hooks
export { useAsync, useAsyncWithRetry, useMultipleAsync } from "./useAsync";

// Canvas hooks
export { useCanvasDimensions } from "./canvas/useCanvasDimensions";

// Container hooks
export { useContainerResize } from "./useContainerResize";

// Error hooks
export { useErrorState } from "./useErrorState";

// Focus hooks
export { useFocusRestoration } from "./useFocusRestoration";

// Form hooks
export { useFormValidation } from "./useFormValidation";

// Gesture hooks
export { useGestures } from "./useGestures";
export { useTouchGestures } from "./useTouchGestures";

// Image hooks
export { useImagePreloading } from "./useImagePreloading";

// Keyboard hooks
export { useKeyboard } from "./useKeyboard";

// Modal hooks
export { useModal } from "./useModal";

// Accessibility hooks
export { useAccessibilityAnnouncements, announcementHelpers } from "./useAccessibilityAnnouncements";

// Performance hooks
export { usePerformance } from "./usePerformance";

// Slider hooks
export { useKineticSlider } from "./useKineticSlider";
export { useSliderAnimation } from "./slider/useSliderAnimation";
export { useErrorTracking } from "./slider/useErrorTracking";
export { usePerformanceMonitoring } from "./slider/usePerformanceMonitoring";

// PIXI hooks
export { useSliderAccessibility } from "./pixi/useSliderAccessibility";

// Re-export types from centralized types file
export type {
  UseErrorStateOptions,
  UseErrorStateReturn,
  UseTouchGesturesOptions,
  UseTouchGesturesReturn,
  UseContainerResizeOptions,
  UseContainerResizeReturn,
  UseImagePreloadingOptions,
  UseImagePreloadingReturn,
  UseFocusRestorationOptions,
  UseFocusRestorationReturn,
  UseCanvasDimensionsOptions,
  UseCanvasDimensionsReturn,
  AsyncState,
  UseAsyncOptions,
  SliderAnimationHook,
  UseModalOptions,
  UseModalReturn,
  UseAccessibilityAnnouncementsOptions,
  UseAccessibilityAnnouncementsReturn,
} from "../types/hooks"; 