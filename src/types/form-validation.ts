import type { ValidationError, ValidationResult } from "./validation";

/**
 * Form validation options
 *
 * @example Example usage
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
 *
 * @example Example usage
 */
export interface FormValidationState<_T> {
  /** Current validation _result */
  validationResult: ValidationResult;
  /** Whether validation is in progress */
  _validating: boolean;
  /** Whether form has been _submitted */
  _submitted: boolean;
  /** Set _submitted state */
  setSubmitted: (_submitted: boolean) => void;
  /** Get error for specific field */
  getErrorForField: (_fieldName: string) => ValidationError | undefined;
  /** Get field class name based on validation state */
  getFieldClass: (_fieldName: string) => string;
  /** Check if form has critical errors */
  hasCriticalErrors: () => boolean;
  /** Set _validating state */
  setValidating: (_validating: boolean) => void;
  /** Set validation _result */
  setValidationResult: (_result: ValidationResult) => void;
}
