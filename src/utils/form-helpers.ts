import { VALIDATION_CSS_CLASSES } from '../constants/validation';
import { ValidationErrorSeverity, ValidationResult } from './validation';

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
 * Get CSS class for form field based on validation state
 *
 * @param error - Validation error for the field
 * @param submitted - Whether the form has been submitted
 * @param baseClass - Base CSS class
 * @returns CSS class for the field
 */
export function getFieldClass(
  error: ValidationResult['errors'][0] | undefined,
  submitted: boolean,
  baseClass: string = VALIDATION_CSS_CLASSES.BASE
): string {
  if (!submitted) return baseClass;

  if (!error) return VALIDATION_CSS_CLASSES.VALID;

  return error.severity === ValidationErrorSeverity.WARNING
    ? VALIDATION_CSS_CLASSES.WARNING
    : VALIDATION_CSS_CLASSES.INVALID;
}

/**
 * Build CSS class for feedback element based on error severity
 *
 * @param error - The validation error
 * @returns CSS class for the feedback element
 */
export function getFeedbackClass(
  error?: ValidationResult['errors'][0]
): string {
  if (!error) return '';

  return error.severity === ValidationErrorSeverity.WARNING
    ? VALIDATION_CSS_CLASSES.FEEDBACK_WARNING
    : VALIDATION_CSS_CLASSES.FEEDBACK_INVALID;
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
