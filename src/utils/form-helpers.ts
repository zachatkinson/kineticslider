import { VALIDATION_CSS_CLASSES } from '../constants/validation';
import { ValidationErrorSeverity, ValidationResult, ValidationErrorType, ValidationErrorCode } from '../types/validation';
import type { ValidationError } from '../types/validation';

/**
 * Extract error message for a specific field
 *
 * @param errors - Validation errors array
 * @param fieldName - Field name to extract error for
 * @returns Error message or undefined
 */
export function getFieldError(
  errors: ValidationResult['errors'],
  fieldName: string
): ValidationResult['errors'][0] | undefined {
  return errors.find((err) => err.property === fieldName);
}

/**
 * Get CSS class for a form field based on its validation state
 * Supports both array of errors and single error
 *
 * @param errors - Validation errors array or single error
 * @param fieldName - Field name to get class for
 * @returns CSS class string
 */
export function getFieldClass(
  errors: ValidationResult['errors'] | ValidationError | undefined,
  fieldName: string
): string {
  if (Array.isArray(errors)) {
    const error = errors.find((err) => err.property === fieldName);
    if (!error) return VALIDATION_CSS_CLASSES.BASE;
    return error.severity === ValidationErrorSeverity.WARNING
      ? VALIDATION_CSS_CLASSES.WARNING
      : VALIDATION_CSS_CLASSES.INVALID;
  }

  if (!errors) return VALIDATION_CSS_CLASSES.BASE;
  return errors.severity === ValidationErrorSeverity.WARNING
    ? VALIDATION_CSS_CLASSES.WARNING
    : VALIDATION_CSS_CLASSES.INVALID;
}

/**
 * Get the appropriate feedback class based on validation error
 */
export function getFeedbackClass(error?: ValidationError): string {
  if (!error) return '';
  return error.severity === ValidationErrorSeverity.WARNING
    ? 'invalid-feedback warning'
    : 'invalid-feedback';
}

/**
 * Check if field has a critical validation error
 *
 * @param error - Validation error for the field
 * @returns True if field has a critical error
 */
export function hasFieldCriticalError(
  error?: ValidationResult['errors'][0]
): boolean {
  if (!error) return false;

  return (
    error.severity === ValidationErrorSeverity.ERROR ||
    error.severity === ValidationErrorSeverity.CRITICAL
  );
}

/**
 * Check if form has any critical errors
 *
 * @param errors - Validation errors array
 * @returns True if form has any critical errors
 */
export function hasFormCriticalErrors(
  errors: ValidationResult['errors']
): boolean {
  return errors.some(
    (error) =>
      error.severity === ValidationErrorSeverity.ERROR ||
      error.severity === ValidationErrorSeverity.CRITICAL
  );
}

/**
 * Validate and submit form data
 */
export async function validateAndSubmit<T>(
  data: T,
  validateFn: (data: T) => Promise<ValidationResult>,
  onSave: (data: T) => void,
  setValidating: (validating: boolean) => void,
  setValidationResult: (result: ValidationResult) => void,
  setSubmitted: (submitted: boolean) => void
): Promise<void> {
  setValidating(true);
  setSubmitted(true);

  try {
    const result = await validateFn(data);
    setValidationResult(result);

    if (result.valid) {
      onSave(data);
    }
  } catch (error: unknown) {
    setValidationResult({
      valid: false,
      errors: [{
        type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
        code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
        message: 'Validation failed unexpectedly',
        severity: ValidationErrorSeverity.ERROR
      }]
    });
  } finally {
    setValidating(false);
  }
}
