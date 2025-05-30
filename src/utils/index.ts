/**
 * Core utilities index
 */

// Import error types for re-export
import {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
} from "../types/validation";

// Import slide validator functions
import { _validateSlidesWithSchema as validateSlides } from "./slide-validator";
// Import animation validator functions
import { _validateAnimationConfig as validateAnimationConfig } from "./animation-validator";

// Import validation functions from validation.ts
import {
  validateProps as _validateProps,
  validateErrorInfo as _validateErrorInfo,
  validateAccessibility as _validateAccessibility,
  validatePerformanceConfig as _validatePerformanceConfig,
  validateImageExists as _validateImageExists,
} from "./validation";

// Form utilities
export {
  getFeedbackClass,
  hasFieldCriticalError,
  hasFormCriticalErrors,
} from "./form-helpers";

// Re-export error types
export {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
};

// Re-export validation functions with clean names
export {
  validateSlides,
  validateAnimationConfig,
  _validateProps as validateProps,
  _validateErrorInfo as validateErrorInfo,
  _validateAccessibility as validateAccessibility,
  _validatePerformanceConfig as validatePerformanceConfig,
  _validateImageExists as validateImageExists,
};

// Animation utilities
export {
  createBasicAnimation,
} from "./animation";

// Type checking utilities
export {
  isNullOrUndefined,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  hasMethod,
  isPromise,
  isValidDate as isDate,
  _isFiniteNumber as isFiniteNumber,
  _isValidationResult as isValidationResult,
  _isPerformanceMetrics as isPerformanceMetrics,
  _isAnimationConfig as isAnimationConfig,
  _hasFocusFunction as hasFocusFunction,
  _hasInitialFocusFunction as hasInitialFocusFunction,
} from "./type-checks";

// String utilities
export {
  capitalize,
  _isEmptyString as isEmptyString,
} from "./string";

// Math utilities
export {
  calculateMean,
  _calculateMedian as calculateMedian,
  _calculateStandardDeviation as calculateStandardDeviation,
  clamp,
  _lerp as lerp,
  _mapRange as mapRange,
  _roundTo as roundTo,
  _approximatelyEqual as approximatelyEqual,
  randomBetween,
  _randomIntBetween as randomIntBetween,
  _safeArithmetic as safeArithmetic,
} from "./math";

// Object utilities (centralized)
export {
  isEmpty,
  safeGet,
  safeGetNested,
  safeGetPath,
  hasProperty,
  safeSet,
} from "./object-helpers";

// Branded type utilities
export {
  createBrandedId,
  createBrandedNumber,
  createSliderId,
  createComponentId,
  createAnimationId,
  createGestureId,
  createSessionId,
  createElementId,
  isSliderId,
  isComponentId,
  validateAndCreateSliderId,
} from "./branded-helpers";

// Memory utilities
export {
  captureMemoryUsage,
  compareMemorySnapshots,
  measureMemoryUsage,
  measureMemoryUsageAsync,
} from "./memory-helpers";

// Event utilities
export {
  createPointerEvent,
  createTouchEvent,
  createGestureEvent,
  createKeyboardEvent,
  createMouseEvent,
  createWheelEvent,
  createFocusEvent,
  dispatchEvent,
  createAndDispatchEvent,
} from "./event-helpers";

// Validation helpers (keeping only unique functions)
export {
  validateStringConstraints,
  validateNumberConstraints,
  _validateRequiredFields as validateRequiredFields,
  validateAgainstSchemaField,
} from "./validation-helpers";

// PIXI utilities
export {
  calculatePixiCanvasDimensions,
  hasPixiDimensionsChanged,
  getCurrentPixiBreakpoint,
} from "./pixi-canvas";

// Slide helper utilities
export {
  shouldPreloadSlide,
  createSliderGestureEvent,
  calculateSlideTransform,
  generateSlideAriaLabel,
  calculateNextSlideIndex,
  calculatePreviousSlideIndex,
} from "./slide-helpers";

// Navigation helper utilities
export {
  calculateNextIndex,
  calculatePreviousIndex,
  validateSlideIndex,
  canNavigate,
  generateNavigationAnnouncement,
} from "./navigation-helpers";

// React ref helper utilities
export {
  isRefNotNull,
  safeRefAccess,
  withRef,
} from "./ref-helpers";

// ID helper utilities
export {
  createSlideId,
  createComponentId as createComponentIdHelper,
  createAnimationId as createAnimationIdHelper,
  createGestureId as createGestureIdHelper,
  createSessionId as createSessionIdHelper,
} from "./id-helpers";

// Worker pool utilities
export { WorkerPool } from "./worker-pool";
export type { WorkerPoolOptions, WorkerTask, WorkerPoolStats } from "../types/worker-pool";

// Test utilities
export { mockImageValidation } from "./test-helpers";
