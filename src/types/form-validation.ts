import { ValidationError, ValidationResult } from '../utils/validation';

/**
 * Form validation options
 */
export interface FormValidationOptions {
  /** Debounce time in milliseconds */
  debounceMs?: number;
  /** Whether to validate on mount */
  validateOnMount?: boolean;
  /** Whether to validate on change */
  validateOnChange?: boolean;
}

/**
 * Form validation state
 */
export interface FormValidationState<T> {
  /** Current validation result */
  validationResult: ValidationResult;
  /** Whether validation is in progress */
  validating: boolean;
  /** Whether form has been submitted */
  submitted: boolean;
  /** Set submitted state */
  setSubmitted: (submitted: boolean) => void;
  /** Get error for specific field */
  getErrorForField: (fieldName: string) => ValidationError | undefined;
  /** Get field class name based on validation state */
  getFieldClass: (fieldName: string) => string;
  /** Check if form has critical errors */
  hasCriticalErrors: () => boolean;
  /** Set validating state */
  setValidating: (validating: boolean) => void;
  /** Set validation result */
  setValidationResult: (result: ValidationResult) => void;
}
