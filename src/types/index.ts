/**
 * Central type exports for the application
 */

// Animation types
export type {
  AnimationOptions,
  AnimationMetrics,
  AnimationEvents,
  ExtendedAnimationConfig,
  AnimationConfig,
  TimelineConfig,
  TransitionType,
  AnimationEasing,
  AnimationInstance,
  AnimationProfilerMetrics,
  BasicAnimationReturn,
  EnhancedAnimationHookConfig,
  AnimationHookReturn,
  ImageDistortionConfig,
  TextDistortionConfig,
  ShaderConfig,
  CustomShader,
} from "./animation";

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
export type {
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
} from "./branded";

// Browser types
export * from "./browser";

// Common types
export type {
  Result,
  Status,
  AnimationEase,
} from "./common";

// Component types
export * from "./components";

// Error types
export type {
  ErrorType,
  ErrorSeverity,
  BaseError,
  SliderError,
  ValidationError as ErrorValidationError,
  NetworkError,
  ErrorBoundaryState,
  ErrorInfo,
} from "./error";

// Gesture types
export type {
  GestureConfig,
  GestureOptions,
  SwipeDirection,
  UseGesturesReturn,
} from "./gestures";

// GSAP types
export * from "./gsap";

// Hook types
export type {
  UseAsyncOptions,
  AsyncState,
  UseErrorStateOptions,
  UseErrorStateReturn,
  UseFocusRestorationOptions,
  UseFocusRestorationReturn,
  UseImagePreloadingOptions,
  UseImagePreloadingReturn,
  UseContainerResizeOptions,
  UseContainerResizeReturn,
  UseCanvasDimensionsOptions,
  UseCanvasDimensionsReturn,
  UseModalOptions,
  UseModalReturn,
} from "./hooks";

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

// Performance types
export type {
  PerformanceMetrics as PerformanceMetricsType,
  UsePerformanceOptions,
  UsePerformanceReturn,
} from "./performance";

// PIXI types
export type {
  CanvasDimensions,
  CanvasConfig,
  CanvasMode,
  PerformanceMetrics,
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
export type {
  ValidationResult,
  ValidationError,
  ValidationContext,
  Validator,
  AsyncValidator,
  Schema,
  SchemaField,
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
  SchemaType,
  ValidationType,
} from "./validation";

export type {
  SchemaValidationOptions,
  ValidationRule,
  KeyGenerator,
} from "./validation";

// Do not export test types or global augmentations

// Worker pool types
export type {
  WorkerTask,
  WorkerPoolOptions,
  WorkerPoolStats,
} from "./worker-pool";

// Image types
export type {
  ImageError,
} from "./image";

// Form validation types
export type {
  FormValidationOptions,
  FormValidationState,
} from "./form-validation";

// Logger types
export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
} from "./logger";

// Analytics types
export type {
  BaseEventData,
  SlideChangeEventData,
  AnimationEventData,
  GestureEventData,
  ErrorEventData,
  ViewEventData,
  InteractionEventData,
  PerformanceEventData,
  AccessibilityEventData,
  AnalyticsConfig,
  BaseAnalyticsData,
  SlideChangeAnalytics,
  AnimationCompleteAnalytics,
  GestureAnalytics,
  ErrorAnalytics,
} from "./analytics";

// E2E testing types
export type {
  TestUtilities,
  GestureTestUtilities,
  UserJourneyTestUtilities,
  ResourceManagementTestUtilities,
  WorkerPoolTestUtilities,
  CanvasTestUtilities,
  E2ETestSetupFunction,
  E2ETestCleanupFunction,
  E2ETestConfig,
  BrowserCapabilities,
} from "./e2e-testing";

// Test mock types
export type {
  MockApplicationOptions,
  MockTexture,
  MockPixiContainer,
  MockWorker,
  MockHTMLElement,
  MockCanvasContext,
  MockResizeObserver,
  MockIntersectionObserver,
  MockTimers,
  TestDataFactory,
  MockValidationError,
  MockFormData,
  MockGestureEvent,
  MockAnimationOptions,
  MockPerformanceMetrics,
} from "./test-mocks";
