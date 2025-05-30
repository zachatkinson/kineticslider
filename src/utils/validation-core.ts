import type { ValidationResult, ValidationError, ValidationContext } from "../types/validation";
import { ValidationErrorType, ValidationErrorCode } from "../types/validation";

/**
 * Helper function to convert a string to a SlideId
 *
 * @param id The string to convert
 *
 * @returns The string as a SlideId
 *
 */
export function _toSlideId(id: string): string {
  return id;
}

/**
 * Helper function to convert a string to a ComponentId
 *
 * @param id The string to convert
 *
 * @returns The string as a ComponentId
 *
 */
export function _toComponentId(id: string): string {
  return id;
}

/**
 * Creates a validation error object
 *
 * @param type The type of validation error
 *
 * @param code The error code
 *
 * @param message The error message
 *
 * @param path The path to the invalid value
 *
 * @param value The invalid value
 *
 * @param expected The expected value or type
 *
 * @returns A validation error object
 *
 */
export function _createValidationError(
  type: ValidationErrorType,
  code: ValidationErrorCode,
  message: string,
  path: string[],
  value: unknown,
  expected: string,
): ValidationError {
  return {
    type,
    code,
    message,
    path,
    value,
    expected,
  };
}

/**
 * Composes multiple validators into one
 *
 * @param validators The validators to compose
 *
 * @returns A composed validator function
 *
 */
export function composeValidators<T>(
  ...validators: Array<
    (value: T, context?: ValidationContext) => ValidationResult
  >
) {
  return (value: T, context?: ValidationContext): ValidationResult => {
    const errors: ValidationError[] = [];
    let valid = true;

    for (const validator of validators) {
      const result = validator(value, context);
      if (!result.valid) {
        valid = false;
        errors.push(...result.errors);
      }
    }

    return {
      valid,
      errors,
      metadata: { count: validators.length, total: validators.length },
    };
  };
}

/**
 * Composes multiple async validators into one
 *
 * @param validators The async validators to compose
 *
 * @returns A composed async validator function
 *
 */
export function composeAsyncValidators<T>(
  ...validators: Array<
    (value: T, context?: ValidationContext) => Promise<ValidationResult>
  >
) {
  return async (
    value: T,
    context?: ValidationContext,
  ): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];
    let valid = true;

    for (const validator of validators) {
      const result = await validator(value, context);
      if (!result.valid) {
        valid = false;
        errors.push(...result.errors);
      }
    }

    return {
      valid,
      errors,
      metadata: { count: validators.length, total: validators.length },
    };
  };
}
