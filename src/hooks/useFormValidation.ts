import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_VALIDATION_DEBOUNCE } from '../constants/validation';
import {
  FormValidationOptions,
  FormValidationState,
} from '../types/form-validation';
import {
  getFieldClass as getFieldClassName,
  getFieldError,
  hasFormCriticalErrors,
} from '../utils/form-helpers';
import type { ValidationError, ValidationResult } from '../types/validation';
import {
  validateFormData,
  createDebouncedValidator as _createDebouncedValidator
} from '../utils/validation-helpers';

/**
 * Hook for handling form validation with debounce
 *
 * @param formData - The form data to validate
 * @param validationFn - Optional custom validation function
 * @param options - Validation options
 * @returns Object containing validation: state, result and helper functions
 */
export function useFormValidation<T>(
  formData: T,
  validationFn?: (data: T) => Promise<ValidationResult>,
  options?: FormValidationOptions
): FormValidationState<T> {
  const debounceMs = options?.debounceMs ?? DEFAULT_VALIDATION_DEBOUNCE;
  const validateOnChange = options?.validateOnChange ?? true;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Track the latest validation result
  const validate = useCallback(() => {
    if (validationFn) {
      void validateFormData(
        formData,
        validationFn,
        setValidating,
        setValidationResult
      );
    }
  }, [formData, validationFn]);

  // Validate on mount if enabled
  useEffect(() => {
    if(options?.validateOnMount && validationFn) {
      validate();
    }
  }, [options?.validateOnMount, validationFn, formData, validate]);

  // Validate on change if enabled
  useEffect(() => {
    if (!validateOnChange || !validationFn) return;

    const handler = setTimeout(() => {
      validate();
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [formData, validationFn, debounceMs, validateOnChange, validate]);

  // Helper to get error message for a field
  const getErrorForField = (fieldName: string): ValidationError | undefined => {
    return getFieldError(validationResult.errors, fieldName);
  };

  // Helper to get CSS class based on validation state
  const getFieldClass = (fieldName: string): string => {
    const error = getErrorForField(fieldName);
    return getFieldClassName(error, fieldName);
  };

  // Helper to check if form has critical errors
  const hasCriticalErrors = (): boolean => {
    return hasFormCriticalErrors(validationResult.errors);
  };

  return {
    validationResult,
    _validating: validating,
    _submitted: submitted,
    setSubmitted,
    getErrorForField,
    getFieldClass,
    hasCriticalErrors,
    setValidating,
    setValidationResult,
  };
} 