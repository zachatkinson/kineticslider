/**
 * Animation validation utilities
 */

import {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
} from "../types/validation";
import type {
  ValidationResult,
  ValidationContext,
  ValidationError,
} from "../types/validation";
import { isObject, isNumber, isString } from "./type-checks";

/**
 * Validates an animation configuration object
 *
 * @param config - The animation configuration to validate
 *
 * @param _context - Optional validation context
 *
 * @returns Validation result
 *
 */
export function _validateAnimationConfig(
  config: unknown,
  _context?: ValidationContext,
): ValidationResult {
  if (!isObject(config)) {
    return {
      valid: false,
      errors: [
        {
          type: ValidationErrorType.TYPE,
          code: ValidationErrorCode.INVALID_TYPE,
          message: "Animation config must be an object",
          value: config,
          expected: "object",
          severity: ValidationErrorSeverity.ERROR,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];

  // Validate duration if present
  if ("duration" in config && config.duration !== undefined) {
    if (!isNumber(config.duration)) {
      errors.push({
        type: ValidationErrorType.TYPE,
        code: ValidationErrorCode.INVALID_TYPE,
        message: "Duration must be a number",
        property: "duration",
        value: config.duration,
        expected: "number",
        severity: ValidationErrorSeverity.ERROR,
      });
    } else if (config.duration < 0) {
      errors.push({
        type: ValidationErrorType.RANGE,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: "Duration must be a positive number",
        property: "duration",
        value: config.duration,
        expected: "≥ 0",
        severity: ValidationErrorSeverity.ERROR,
      });
    }
  }

  // Validate ease if present
  if ("ease" in config && config.ease !== undefined) {
    if (!isString(config.ease)) {
      errors.push({
        type: ValidationErrorType.TYPE,
        code: ValidationErrorCode.INVALID_TYPE,
        message: "Ease must be a string",
        property: "ease",
        value: config.ease,
        expected: "string",
        severity: ValidationErrorSeverity.ERROR,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
