/**
 * Core utilities index
 */

// Form utilities
export {
  getFeedbackClass,
  hasFieldCriticalError,
  hasFormCriticalErrors,
} from './form-helpers';

// Common utilities
export {
  debounce,
  throttle,
  memoize,
  safeJsonParse,
  sleep,
  createRandomId,
  deepClone,
  shallowMerge,
  getNestedValue,
} from './common';

// Performance utilities
export {
  measurePerformance,
  measureFPS,
  createPerformanceMonitor,
  calculateMetricSummary,
  trackInteraction as trackPerformanceInteraction,
} from './performance';

// Validation utilities
export {
  registerValidator,
  getValidator,
  createSchemaValidator,
  validateErrorInfo,
  memoizeValidator,
  clearValidationCache,
  toSlideId,
  toComponentId,
  composeValidators,
  composeAsyncValidators,
} from './validation';

// Type checking utilities
export {
  isNullOrUndefined,
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isEmpty,
  hasMethod,
  isPromise,
  isDate,
  isFiniteNumber,
  isValidationResult,
  isPerformanceMetrics,
  isAnimationConfig,
  hasFocusFunction,
  hasInitialFocusFunction,
} from './type-checks';

// String utilities
export {
  capitalize,
  camelToKebab,
  kebabToCamel,
  truncate,
  isEmptyString,
} from './string';

// JSON utilities
export {
  safeGet,
} from './json';

// Math utilities
export {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  clamp,
  lerp,
  mapRange,
  roundTo,
  approximatelyEqual,
  randomBetween,
  randomIntBetween,
  safeArithmetic,
} from './math';

// Animation utilities
export {
  AnimationController,
  animationController,
  createSlideTransition,
  animateSlide,
  createBasicAnimation,
  createFadeAnimation,
  createSlideAnimation,
} from './animation';

// Image utilities
export {
  preloadImage,
} from './image';

// Cache utilities
export {
  Cache,
  ValidationCache,
  globalValidationCache,
  type CacheOptions,
} from './cache';

// Validation helpers
export {
  validateStringConstraints,
  validateNumberConstraints,
  validateRequiredFields,
  validateAgainstSchemaField,
  createValidationError,
} from './validation-helpers';

// Validation checks
export {
  hasErrors,
  hasErrorsOfSeverity,
  getErrorsOfSeverity,
  getMostSevereError,
  hasErrorsWithProperties,
  getErrorsForProperties,
} from './validation-checks';
