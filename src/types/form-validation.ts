import { ValidationResult } from './validation';

/**
 * Form validation state and helper functions
 */
export interface FormValidationState<_T> {
  /** Current validation result */
  validationResult: ValidationResult;
  /** Whether validation is in progress */
  validating: boolean;
  /** Whether the form has been submitted */
  submitted: boolean;
  /** Function to set submitted state */
  setSubmitted: (state: boolean) => void;
  /** Get error for a specific field */
  getErrorForField: (
    fieldName: string
  ) => ValidationResult['errors'][0] | undefined;
  /** Get CSS class based on field validation state */
  getFieldClass: (fieldName: string) => string;
  /** Check if form has critical errors */
  hasCriticalErrors: () => boolean;
  /** Function to set validating state */
  setValidating: (state: boolean) => void;
  /** Function to set validation result */
  setValidationResult: (result: ValidationResult) => void;
}

/**
 * Options for form validation hook
 */
export interface FormValidationOptions {
  /** Debounce timeout in milliseconds */
  debounceMs?: number;
  /** Auto-validate on initial render */
  validateOnMount?: boolean;
  /** Auto-validate on field change */
  validateOnChange?: boolean;
}
