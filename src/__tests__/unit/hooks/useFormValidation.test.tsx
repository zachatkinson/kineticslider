import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useFormValidation } from "@/hooks/useFormValidation";
import * as validationHelpers from "@/utils/validation-helpers";
import { DEFAULT_VALIDATION_DEBOUNCE } from "@/constants/validation";
import type {
  ValidationResult,
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
} from "@/types/validation";

// Mock validation utilities
vi.mock("@/utils/validation-helpers", () => ({
  validateFormData: vi.fn(),
  createDebouncedValidator: vi.fn(),
}));

describe("useFormValidation Hook", () => {
  const mockFormData = {
    name: "John Doe",
    email: "john@example.com",
  };

  const mockValidationFn = vi.fn().mockResolvedValue({
    valid: true,
    errors: [],
  });

  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useFormValidation(mockFormData));

    // Check initial state
    expect(result.current.validationResult).toEqual({
      valid: true,
      errors: [],
    });
    expect(result.current._validating).toBe(false);
    expect(result.current._submitted).toBe(false);

    // Check helper functions
    expect(typeof result.current.getErrorForField).toBe("function");
    expect(typeof result.current.getFieldClass).toBe("function");
    expect(typeof result.current.hasCriticalErrors).toBe("function");
  });

  it("should validate on mount when validateOnMount is true", () => {
    renderHook(() =>
      useFormValidation(mockFormData, mockValidationFn, {
        validateOnMount: true,
      }),
    );

    // Verify that validation is triggered on mount
    expect(validationHelpers.validateFormData).toHaveBeenCalledWith(
      mockFormData,
      mockValidationFn,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("should not validate on mount when validateOnMount is false", () => {
    renderHook(() =>
      useFormValidation(mockFormData, mockValidationFn, {
        validateOnMount: false,
      }),
    );

    // Verify that validation is not triggered on mount
    expect(validationHelpers.validateFormData).not.toHaveBeenCalled();
  });

  it("should validate when formData changes", async () => {
    const { rerender } = renderHook(
      ({ data }) => useFormValidation(data, mockValidationFn),
      { initialProps: { data: mockFormData } },
    );

    // Change form data
    const updatedFormData = { ...mockFormData, name: "Jane Doe" };
    rerender({ data: updatedFormData });

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(DEFAULT_VALIDATION_DEBOUNCE);
    });

    // Verify that validation is triggered after debounce
    expect(validationHelpers.validateFormData).toHaveBeenCalledWith(
      updatedFormData,
      mockValidationFn,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("should not validate when validateOnChange is false", async () => {
    const { rerender } = renderHook(
      ({ data }) =>
        useFormValidation(data, mockValidationFn, { validateOnChange: false }),
      { initialProps: { data: mockFormData } },
    );

    // Change form data
    const updatedFormData = { ...mockFormData, name: "Jane Doe" };
    rerender({ data: updatedFormData });

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(DEFAULT_VALIDATION_DEBOUNCE);
    });

    // Verify that validation is not triggered
    expect(validationHelpers.validateFormData).not.toHaveBeenCalled();
  });

  it("should update validation result when validation completes", async () => {
    // Mock implementation that triggers the callback
    vi.mocked(validationHelpers.validateFormData).mockImplementation(
      async (
        _data: unknown,
        _validationFn: unknown,
        setValidating: (validating: boolean) => void,
        setValidationResult: (result: ValidationResult) => void,
      ) => {
        setValidating(true);

        // Simulate validation result
        const mockResult: ValidationResult = {
          valid: false,
          errors: [
            {
              property: "email",
              message: "Invalid email format",
              type: "INVALID_FORMAT" as ValidationErrorType,
              code: "INVALID_EMAIL" as ValidationErrorCode,
              severity: "error" as ValidationErrorSeverity,
            },
          ],
        };

        setValidationResult(mockResult);
        setValidating(false);
      },
    );

    const { result } = renderHook(() =>
      useFormValidation(mockFormData, mockValidationFn, {
        validateOnMount: true,
      }),
    );

    // Verify validation result is updated
    expect(result.current.validationResult.valid).toBe(false);
    expect(result.current.validationResult.errors).toHaveLength(1);
    expect(result.current.validationResult.errors[0].property).toBe("email");
  });

  it("should return the correct field error", async () => {
    // Setup a validation result with an error
    const mockResult: ValidationResult = {
      valid: false,
      errors: [
        {
          property: "email",
          message: "Invalid email format",
          type: "INVALID_FORMAT" as ValidationErrorType,
          code: "INVALID_EMAIL" as ValidationErrorCode,
          severity: "error" as ValidationErrorSeverity,
        },
      ],
    };

    // Create a hook instance with the validation result
    const { result } = renderHook(() => useFormValidation(mockFormData));

    // Set the validation result directly
    act(() => {
      result.current.setValidationResult(mockResult);
    });

    // Test getErrorForField
    const emailError = result.current.getErrorForField("email");
    expect(emailError).toEqual(mockResult.errors[0]);

    // Should return undefined for a field without errors
    const nameError = result.current.getErrorForField("name");
    expect(nameError).toBeUndefined();
  });

  it("should correctly identify forms with critical errors", async () => {
    // Setup a validation result with critical errors
    const mockResult: ValidationResult = {
      valid: false,
      errors: [
        {
          property: "email",
          message: "Invalid email format",
          type: "INVALID_FORMAT" as ValidationErrorType,
          code: "INVALID_EMAIL" as ValidationErrorCode,
          severity: "error" as ValidationErrorSeverity,
        },
      ],
    };

    // Create a hook instance with the validation result
    const { result } = renderHook(() => useFormValidation(mockFormData));

    // Set the validation result directly
    act(() => {
      result.current.setValidationResult(mockResult);
    });

    // Test hasCriticalErrors
    expect(result.current.hasCriticalErrors()).toBe(true);

    // Change error severity to warning (non-critical)
    act(() => {
      result.current.setValidationResult({
        valid: false,
        errors: [
          {
            ...mockResult.errors[0],
            severity: "warning" as ValidationErrorSeverity,
          },
        ],
      });
    });

    // Should now return false for hasCriticalErrors
    expect(result.current.hasCriticalErrors()).toBe(false);
  });
});
