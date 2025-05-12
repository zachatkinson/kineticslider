import { vi } from "vitest";
import type { ValidationError } from "@/types/validation";

// Create mock values
export const mockValidationResult: {
  valid: boolean;
  errors: ValidationError[];
} = { valid: true, errors: [] };
export const mockValidating = false;
export const mockSubmitted = false;
export const mockSetValidationResult = vi.fn();
export const mockSetValidating = vi.fn();
export const mockSetSubmitted = vi.fn();
export const mockGetErrorForField = vi.fn().mockReturnValue(null);
export const mockGetFieldClass = vi.fn().mockReturnValue("form-control");

// Create a function to get the mock implementation
export const getMockImplementation = (): {
  validationResult: { valid: boolean; errors: ValidationError[] };
  validating: boolean;
  submitted: boolean;
  setValidationResult: ReturnType<typeof vi.fn>;
  setValidating: ReturnType<typeof vi.fn>;
  setSubmitted: ReturnType<typeof vi.fn>;
  getErrorForField: ReturnType<typeof vi.fn>;
  getFieldClass: ReturnType<typeof vi.fn>;
} => ({
  validationResult: mockValidationResult,
  validating: mockValidating,
  submitted: mockSubmitted,
  setValidationResult: mockSetValidationResult,
  setValidating: mockSetValidating,
  setSubmitted: mockSetSubmitted,
  getErrorForField: mockGetErrorForField,
  getFieldClass: mockGetFieldClass,
});

const _validateSlide = (_slide: any): boolean => {
  return true; // Mock implementation
};
