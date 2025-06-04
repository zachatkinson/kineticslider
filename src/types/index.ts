/**
 * Central type exports for the KineticSlider application
 *
 * This file serves as the main entry point for all type definitions,
 * providing a centralized location for importing types throughout the application.
 *
 * @module Types
 * @version 1.0.0
 */

// Animation types
export type {
  AnimationConfig,
  AnimationOptions,
  BasicAnimationReturn,
  SlideTransitionConfig,
  TransitionType,
  AnimationType,
  AnimationPriority,
  FilterEffectConfig,
  CustomAnimationConfig,
  CustomShader,
} from "./animation";

// Analytics types
export * from "./analytics";

// Accessibility types
export type {
  AccessibilityAction,
  AccessibilityEvent,
  AccessibilityConfig,
  UseSliderAccessibilityProps,
} from "./accessibility";

// Branded types
export type {
  SlideIndex,
  SliderId,
  ComponentId,
  AnimationId,
  GestureId,
  SessionId,
  GestureThreshold,
  GestureVelocity,
  GestureDistance,
  FPS,
  Milliseconds,
  ByteSize,
  FilterIntensity,
  FilterId,
  Percentage,
  BrandedNumber,
} from "./branded";

// Browser types
export * from "./browser";

// Common types
export type {
  Result,
  ResultData,
  ResultError,
  Nullable,
  Optional,
  Status,
  AnimationEase,
  LoadingState,
  Resource,
  ResourceState,
} from "./common";

// Component types
export type {
  SlideFormProps,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  PixiErrorBoundaryState,
  BaseSliderProps,
  WindowExtensions,
} from "./components";

// Context types
export type {
  SliderProviderProps,
  SliderConsumerProps,
  WithSliderProps,
} from "./context";

// E2E testing types
export type {
  TestUtilities,
  GestureTestUtilities,
  UserJourneyTestUtilities,
} from "./e2e-testing";

// Error types
export type {
  BaseError,
  ErrorInfo,
  ErrorSeverity,
  ErrorType,
  ValidationErrorSeverity,
} from "./error";

// Feature flag types
export type {
  FeatureFlag,
} from "./feature-flags";

// Filter types
export type {
  FilterType,
  BaseFilterConfig,
  DisplacementFilterConfig,
  BlurFilterConfig,
  GlowFilterConfig,
  GlitchFilterConfig,
  RGBSplitFilterConfig,
  AdjustmentFilterConfig,
  ShockwaveFilterConfig,
  FilterConfig,
  FilterResult,
  FilterFactoryOptions,
  FilterPerformanceMetrics,
  FilterAnimationState,
  FilterEventType,
  FilterEvent,
  FilterManagerConfig,
  FilterModuleEntry,
  FilterInstance,
} from "./filters";

// Form validation types
export type {
  FormValidationOptions,
  FormValidationState,
} from "./form-validation";

// Gesture types
export type {
  GestureConfig,
  GestureOptions,
  SwipeDirection,
  UseGesturesReturn,
} from "./gestures";

// GSAP types
export type {
  GsapVars,
  GsapTween,
  GsapTimeline,
} from "./gsap";

// Hook types (from centralized hooks file)
export type {
  UseAnimationStateOptions,
  UseAnimationStateReturn,
  UseModalStateOptions,
  UseModalStateReturn,
  UseAccessibilityAnnouncementsOptions,
  UseAccessibilityAnnouncementsReturn,
} from "./hooks/index";

// Hook types (from main hooks file)
export type {
  AsyncState,
  UseAsyncOptions,
  UseImagePreloadingOptions,
  UseImagePreloadingReturn,
  UseContainerResizeOptions,
  UseContainerResizeReturn,
  UseFocusRestorationOptions,
  UseFocusRestorationReturn,
  UseCanvasDimensionsOptions,
  UseCanvasDimensionsReturn,
  UseModalOptions,
  UseModalReturn,
  UseErrorStateOptions,
  UseErrorStateReturn,
  SliderGestureEvent,
  SlideValidationOptions,
} from "./hooks";

// Image types
export type {
  ImageError,
  PreloadImageOptions,
} from "./image";

// Interactable elements types
export type {
  Focusable,
  InitialFocusable,
  Activatable,
} from "./interactable";

// Keyboard types
export type {
  KeyboardOptions,
  FocusTrapOptions,
  UseKeyboardReturn,
} from "./keyboard";

// Logger types
export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
} from "./logger";

// Migration types
export type {
  TestPerformanceMetric,
  BenchmarkResult,
  FeatureEvent,
  FeatureMetrics,
} from "./migration";

// Performance types
export type {
  PerformanceMetrics,
  UsePerformanceOptions,
  UsePerformanceReturn,
} from "./performance";

// Performance testing types
export type {
  MetricType,
} from "./performance-testing";

// PIXI types
export type {
  CanvasDimensions,
  CanvasConfig,
  PerformanceMetrics as PixiPerformanceMetrics,
} from "./pixi";

// Slider types
export type {
  Slide,
  SliderConfig,
  SliderState,
  SlideItem,
  SliderAction,
  SliderContextValue,
  KineticSliderProps,
  SliderMetrics,
} from "./slider";

// Store types
export type {
  SlideAction as StoreSlideAction,
} from "./store";

// Validation types
export type {
  ValidationContext,
  ValidationErrorType,
  ValidationErrorCode,
  SchemaType,
  ValidationError,
  ValidationResult,
  Validator,
  AsyncValidator,
  Schema,
  SchemaField,
  ValidationType,
} from "./validation";

// Re-export utility functions
export {
  createFilterIntensity,
  createFilterId,
  createFilterCacheKey,
  isDisplacementFilter,
  isBlurFilter,
  isGlowFilter,
  isGlitchFilter,
  isRGBSplitFilter,
  isAdjustmentFilter,
  isShockwaveFilter,
  isAlphaFilter,
  isCRTFilter,
  isColorReplaceFilter,
  isConvolutionFilter,
  isDropShadowFilter,
  isGrayscaleFilter,
} from "./filters";
