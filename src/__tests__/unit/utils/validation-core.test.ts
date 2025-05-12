import { describe, expect, test } from "vitest";
import {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationResult,
} from "@/types/validation";
import {
  _isEmpty as isEmpty,
  _isObject as isObject,
  safeGet,
  _toSlideId as toSlideId,
  _toComponentId as toComponentId,
  _createValidationError as createValidationError,
  composeValidators,
  composeAsyncValidators,
} from "@/utils/validation-core";

describe("Core Validation Utilities", () => {
  describe("Helper Functions", () => {
    describe("isEmpty", () => {
      test("correctly identifies empty values", () => {
        expect(isEmpty(null)).toBe(true);
        expect(isEmpty(undefined)).toBe(true);
        expect(isEmpty("")).toBe(true);
        expect(isEmpty("  ")).toBe(true);
        expect(isEmpty([])).toBe(true);
        expect(isEmpty({})).toBe(true);
      });

      test("correctly identifies non-empty values", () => {
        expect(isEmpty("test")).toBe(false);
        expect(isEmpty([1])).toBe(false);
        expect(isEmpty({ key: "value" })).toBe(false);
        expect(isEmpty(0)).toBe(false);
        expect(isEmpty(false)).toBe(false);
      });
    });

    describe("isObject", () => {
      test("correctly identifies objects", () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: "value" })).toBe(true);
        expect(isObject(new Object())).toBe(true);
      });

      test("correctly identifies non-objects", () => {
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject([])).toBe(false);
        expect(isObject("")).toBe(false);
        expect(isObject(123)).toBe(false);
      });
    });

    describe("safeGet", () => {
      test("safely gets values from objects", () => {
        const obj = { a: 1, b: { c: 2 } };
        expect(safeGet(obj, "a", 0)).toBe(1);
        expect(safeGet(obj, "b", {})).toEqual({ c: 2 });
        expect(safeGet(obj, "nonexistent", "default")).toBe("default");
        expect(safeGet(null, "key", "default")).toBe("default");
        expect(safeGet(undefined, "key", "default")).toBe("default");
      });
    });

    describe("toSlideId", () => {
      test("converts string to branded SlideId", () => {
        const id = "slide-1";
        expect(toSlideId(id)).toBe(id);
      });
    });

    describe("toComponentId", () => {
      test("converts string to branded ComponentId", () => {
        const id = "component-1";
        expect(toComponentId(id)).toBe(id);
      });
    });

    describe("createValidationError", () => {
      test("creates properly structured validation errors", () => {
        const error = createValidationError(
          ValidationErrorType.TYPE,
          ValidationErrorCode.INVALID_TYPE,
          "Invalid type",
          ["path", "to", "error"],
          "actual",
          "expected",
        );

        expect(error).toEqual({
          type: ValidationErrorType.TYPE,
          code: ValidationErrorCode.INVALID_TYPE,
          message: "Invalid type",
          path: ["path", "to", "error"],
          value: "actual",
          expected: "expected",
        });
      });
    });
  });

  describe("Validator Composition", () => {
    describe("composeValidators", () => {
      test("combines multiple validators", () => {
        const validator1 = (value: number): ValidationResult => ({
          valid: value > 0,
          errors:
            value > 0
              ? []
              : [
                  createValidationError(
                    ValidationErrorType.RANGE,
                    ValidationErrorCode.OUT_OF_RANGE,
                    "Value must be positive",
                    ["value"],
                    value,
                    "positive number",
                  ),
                ],
        });

        const validator2 = (value: number): ValidationResult => ({
          valid: value < 100,
          errors:
            value < 100
              ? []
              : [
                  createValidationError(
                    ValidationErrorType.RANGE,
                    ValidationErrorCode.OUT_OF_RANGE,
                    "Value must be less than 100",
                    ["value"],
                    value,
                    "number < 100",
                  ),
                ],
        });

        const composedValidator = composeValidators(validator1, validator2);

        expect(composedValidator(50)).toEqual({
          valid: true,
          errors: [],
          metadata: { count: 2, total: 2 },
        });

        expect(composedValidator(-1)).toEqual({
          valid: false,
          errors: [
            expect.objectContaining({
              type: ValidationErrorType.RANGE,
              code: ValidationErrorCode.OUT_OF_RANGE,
              message: "Value must be positive",
              path: ["value"],
              value: -1,
              expected: "positive number",
            }),
          ],
          metadata: { count: 2, total: 2 },
        });

        expect(composedValidator(150)).toEqual({
          valid: false,
          errors: [
            expect.objectContaining({
              type: ValidationErrorType.RANGE,
              code: ValidationErrorCode.OUT_OF_RANGE,
              message: "Value must be less than 100",
              path: ["value"],
              value: 150,
              expected: "number < 100",
            }),
          ],
          metadata: { count: 2, total: 2 },
        });
      });
    });

    describe("composeAsyncValidators", () => {
      test("combines multiple async validators", async () => {
        const asyncValidator1 = async (
          value: number,
        ): Promise<ValidationResult> => ({
          valid: value > 0,
          errors:
            value > 0
              ? []
              : [
                  createValidationError(
                    ValidationErrorType.RANGE,
                    ValidationErrorCode.OUT_OF_RANGE,
                    "Value must be positive",
                    ["value"],
                    value,
                    "positive number",
                  ),
                ],
        });

        const asyncValidator2 = async (
          value: number,
        ): Promise<ValidationResult> => ({
          valid: value < 100,
          errors:
            value < 100
              ? []
              : [
                  createValidationError(
                    ValidationErrorType.RANGE,
                    ValidationErrorCode.OUT_OF_RANGE,
                    "Value must be less than 100",
                    ["value"],
                    value,
                    "number < 100",
                  ),
                ],
        });

        const composedValidator = composeAsyncValidators(
          asyncValidator1,
          asyncValidator2,
        );

        expect(await composedValidator(50)).toEqual({
          valid: true,
          errors: [],
          metadata: { count: 2, total: 2 },
        });

        expect(await composedValidator(-1)).toEqual({
          valid: false,
          errors: [
            expect.objectContaining({
              type: ValidationErrorType.RANGE,
              code: ValidationErrorCode.OUT_OF_RANGE,
              message: "Value must be positive",
              path: ["value"],
              value: -1,
              expected: "positive number",
            }),
          ],
          metadata: { count: 2, total: 2 },
        });

        expect(await composedValidator(150)).toEqual({
          valid: false,
          errors: [
            expect.objectContaining({
              type: ValidationErrorType.RANGE,
              code: ValidationErrorCode.OUT_OF_RANGE,
              message: "Value must be less than 100",
              path: ["value"],
              value: 150,
              expected: "number < 100",
            }),
          ],
          metadata: { count: 2, total: 2 },
        });
      });
    });
  });
});
