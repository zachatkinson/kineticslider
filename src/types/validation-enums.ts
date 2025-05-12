/**
 * Validation error enum types
 *
 * @module
 * @version 1.0.0
 */

/**
 * Validation error types
 */
export enum ValidationErrorType {
  REQUIRED = "required",
  REQUIRED_PROP = "required_prop",
  TYPE = "type",
  INVALID_TYPE = "invalid_type",
  FORMAT = "format",
  INVALID_FORMAT = "invalid_format",
  PATTERN = "pattern",
  RANGE = "range",
  INVALID_RANGE = "invalid_range",
  CUSTOM = "custom",
  CUSTOM_VALIDATION_FAILED = "custom_validation_failed",
  ASYNC_VALIDATION_FAILED = "async_validation_failed",
  NETWORK_ERROR = "network_error",
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  REQUIRED_FIELD = "REQUIRED_FIELD",
  REQUIRED_PROP = "REQUIRED_PROP",
  INVALID_TYPE = "INVALID_TYPE",
  INVALID_FORMAT = "INVALID_FORMAT",
  PATTERN_MISMATCH = "PATTERN_MISMATCH",
  OUT_OF_RANGE = "OUT_OF_RANGE",
  INVALID_RANGE = "INVALID_RANGE",
  CUSTOM_ERROR = "CUSTOM_ERROR",
  CUSTOM_VALIDATION_FAILED = "CUSTOM_VALIDATION_FAILED",
  ASYNC_VALIDATION_FAILED = "ASYNC_VALIDATION_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
}

/**
 * Represents the severity level of a validation error
 */
export enum ValidationErrorSeverity {
  WARNING = "warning",
  ERROR = "error",
}
