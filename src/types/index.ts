/**
 * Central type exports for the application
 */

// Animation types
export * from "./animation";

// Analytics types
export * from "./analytics";

// Accessibility types
export type {
  FocusManagerProps,
  AccessibilityAction,
  AccessibilityEvent,
  AccessibilityConfig,
  UseSliderAccessibilityProps,
} from "./accessibility";

// Branded types
export * from "./branded";

// Browser types
export * from "./browser";

// Common types
export * from "./common";

// Component types
export * from "./components";

// Error types
export type {
  BaseError,
  AnimationError,
  GestureError,
  NavigationError,
  RenderError,
} from "./error";

// Gesture types
export * from "./gesture";

// GSAP types
export * from "./gsap";

// Hook types
export type {
  UseAnimationReturn,
  BasicAnimationReturn,
  UseAnimationResult,
  UseKeyboardReturn,
  UsePerformanceReturn,
  UseKineticSliderReturn,
  UseErrorTrackingReturn,
  UsePerformanceOptions,
  UseAnimationConfig,
  KineticSliderHookProps,
  SliderGestureEvent,
  FormValidationOptions,
  GestureStateRef,
  KeyboardNavigationHook,
  SliderAnimationHook,
  SlideValidationOptions,
  KineticSliderHookResult,
} from "./hooks";

// Interactable elements types
export * from "./interactable";

// Keyboard types
export * from "./keyboard";

// Performance types
export * from "./performance";
export * from "./performance-testing";
export * from "./performance-shared";
export * from "./performance-resources";

// PIXI types (exclude conflicting PerformanceMetrics)
export type {
  CanvasMode,
  AspectRatioMode,
  CanvasDimensions,
  ResponsiveBreakpoint,
  CanvasConfig,
  PixiOptimizations,
  PerformanceConfig,
  SlideData,
  PixiAppProps,
  PixiSlide,
} from "./pixi";

// Slider types
export * from "./slider";

// Store types
export * from "./store";

// Storybook types
export * from "./storybook";

// Test types
export * from "./test/mocks";

// Validation types
export {
  ValidationErrorType,
  ValidationErrorCode,
  SchemaType,
} from "./validation";

export type {
  SchemaValidationOptions,
  SchemaField,
  Schema,
  ValidationError,
  ValidationContext,
  ValidationResult,
  Validator,
  AsyncValidator,
  ValidationFunction,
  ValidationRule,
  KeyGenerator,
} from "./validation";

export { ValidationErrorSeverity } from "./validation";

// Do not export test types or global augmentations
