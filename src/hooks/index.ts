// Main hooks
export { useKineticSlider } from "./useKineticSlider";
export { useFormValidation } from "./useFormValidation";
export { useKeyboard } from "./useKeyboard";
export { usePerformance } from "./usePerformance";
export { useGestures } from "./useGestures";
export { useAnimation } from "./useAnimation";

// New abstracted hooks
export { useTouchGestures } from "./useTouchGestures";
export { useImagePreloading } from "./useImagePreloading";
export { useContainerResize } from "./useContainerResize";
export { useErrorState } from "./useErrorState";
export { useFocusRestoration } from "./useFocusRestoration";

// Slider-specific hooks
export { useSlideValidation } from "./slider/useSlideValidation";
export { useKeyboardNavigation } from "./slider/useKeyboardNavigation";
export { useKineticSlider as useKineticSliderCore } from "./slider/useKineticSlider";
export { useGestureHandling } from "./slider/useGestureHandling";
export { useErrorTracking } from "./slider/useErrorTracking";
export { useSliderAnimation } from "./slider/useSliderAnimation";
export { usePerformanceMonitoring } from "./slider/usePerformanceMonitoring";

// Canvas hooks
export { useCanvasDimensions } from "./canvas/useCanvasDimensions";

// Pixi hooks
export { useSliderAccessibility } from "./pixi/useSliderAccessibility";

// Hook types
export type {
  UseTouchGesturesOptions,
  UseTouchGesturesReturn,
  UseImagePreloadingOptions,
  UseImagePreloadingReturn,
  UseContainerResizeOptions,
  UseContainerResizeReturn,
  UseErrorStateOptions,
  UseErrorStateReturn,
  UseFocusRestorationOptions,
  UseFocusRestorationReturn,
} from "../types/hooks"; 