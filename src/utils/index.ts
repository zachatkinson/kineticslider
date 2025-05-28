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

// Common utilities
export {
  debounce,
  throttle,
  memoize,
  safeJsonParse,
  sleep,
  _createRandomId as createRandomId,
  deepClone,
  shallowMerge,
  getNestedValue,
} from "./common";

// Performance utilities
export {
  measurePerformance,
  _measureFPS as measureFPS,
  createPerformanceMonitor,
  _calculateMetricSummary as calculateMetricSummary,
  trackInteraction as trackPerformanceInteraction,
} from "./performance";

// Validation utilities
export {
  isEmpty,
  isObject,
  registerValidator,
  getValidator,
  createSchemaValidator,
  memoizeValidator,
  clearValidationCache,
  toSlideId,
  toComponentId,
  safeGet,
  composeValidators,
  composeAsyncValidators,
  createValidationError,
} from "./validation";

// Slide validation utilities
export { validateSlides, validateAnimationConfig };

// Additional validation utilities
export {
  createValidator,
  safeGet as safeGetProp, // Rename to avoid conflict with safeGet from json.ts
  _createValidationError as createTestValidationError, // Rename to avoid conflict
} from "./validation-extras";

// Validation guard functions
export {
  isValidSlide,
  isValidProps,
  isValidErrorInfo,
} from "./validation-guards";

// Re-export validation enums
export { ValidationErrorType, ValidationErrorCode, ValidationErrorSeverity };

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
  _camelToKebab as camelToKebab,
  _kebabToCamel as kebabToCamel,
  truncate,
  _isEmptyString as isEmptyString,
} from "./string";

// JSON utilities
export { safeGet as safeGetJson } from "./json";

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

// Animation utilities
export {
  AnimationController,
  animationController,
  createSlideTransition,
  animateSlide,
  createBasicAnimation,
  createFadeAnimation,
  createSlideAnimation,
} from "./animation";

// Image utilities
export { preloadImage } from "./image";

// Cache utilities
export {
  Cache,
  ValidationCache,
  _globalValidationCache as globalValidationCache,
} from "./cache";

// Export types from type definitions
export type { CacheOptions } from "../types/cache";

// Validation helpers
export {
  validateStringConstraints,
  validateNumberConstraints,
  _validateRequiredFields as validateRequiredFields,
  validateAgainstSchemaField,
} from "./validation-helpers";

// Validation checks
export {
  _hasErrors as hasErrors,
  _hasErrorsOfSeverity as hasErrorsOfSeverity,
  _getErrorsOfSeverity as getErrorsOfSeverity,
  _getMostSevereError as getMostSevereError,
  _hasErrorsWithProperties as hasErrorsWithProperties,
  _getErrorsForProperties as getErrorsForProperties,
} from "./validation-checks";

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
