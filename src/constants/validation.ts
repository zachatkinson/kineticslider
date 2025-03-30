/**
 * Constants for form validation
 */

/**
 * Default debounce timeout in milliseconds for form validation
 */
export const DEFAULT_VALIDATION_DEBOUNCE = 300;

/**
 * Default error messages for validation
 */
export const DEFAULT_ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
  PATTERN_MISMATCH: 'The format is incorrect',
  TYPE_MISMATCH: 'The value has an incorrect type',
  RANGE_OVERFLOW: (max: number) => `Value must be less than or equal to ${max}`,
  RANGE_UNDERFLOW: (min: number) =>
    `Value must be greater than or equal to ${min}`,
};

/**
 * CSS classes for form validation states
 */
export const VALIDATION_CSS_CLASSES = {
  BASE: 'form-control',
  VALID: 'form-control is-valid',
  INVALID: 'form-control is-invalid',
  WARNING: 'form-control is-warning',
  FEEDBACK_VALID: 'valid-feedback',
  FEEDBACK_INVALID: 'invalid-feedback',
  FEEDBACK_WARNING: 'warning-feedback',
};
