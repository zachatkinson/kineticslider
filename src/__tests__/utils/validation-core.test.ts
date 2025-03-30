/* eslint-env vitest */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearValidationCache,
  composeAsyncValidators,
  composeValidators,
  createValidationError,
  createValidator,
  isEmpty,
  isObject,
  memoizeValidator,
  safeGet,
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationErrorType,
} from '../../utils/validation';

describe('Core Validation Utilities', () => {
  beforeEach(() => {
    clearValidationCache();
  });

  describe('createValidationError', () => {
    it('creates a validation error with required properties', () => {
      const error = createValidationError(
        ValidationErrorType.REQUIRED_PROP,
        'Field is required',
        'title'
      );

      expect(error).toMatchObject({
        type: ValidationErrorType.REQUIRED_PROP,
        code: ValidationErrorCode.REQUIRED_PROP,
        message: 'Field is required',
        property: 'title',
        severity: ValidationErrorSeverity.ERROR,
      });
    });

    it('includes optional properties when provided', () => {
      const error = createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Wrong type',
        'name',
        123,
        'string',
        ValidationErrorSeverity.WARNING,
        'Use a string instead',
        'en-US'
      );

      expect(error).toMatchObject({
        type: ValidationErrorType.INVALID_TYPE,
        code: ValidationErrorCode.INVALID_TYPE,
        message: 'Wrong type',
        property: 'name',
        value: 123,
        expected: 'string',
        severity: ValidationErrorSeverity.WARNING,
        suggestion: 'Use a string instead',
        locale: 'en-US',
      });
    });
  });

  describe('composeValidators', () => {
    it('combines multiple validators into one', async () => {
      const validator1 = vi.fn().mockReturnValue({ valid: true, errors: [] });
      const validator2 = vi
        .fn()
        .mockReturnValue({ valid: false, errors: [{ message: 'Error' }] });

      const composed = composeValidators(validator1, validator2);
      const result = await composed({ value: 'test' });

      expect(validator1).toHaveBeenCalled();
      expect(validator2).toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('returns valid=true when all validators pass', async () => {
      const validator1 = vi.fn().mockReturnValue({ valid: true, errors: [] });
      const validator2 = vi.fn().mockReturnValue({ valid: true, errors: [] });

      const composed = composeValidators(validator1, validator2);
      const result = await composed({ value: 'test' });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('merges metadata from all validators', async () => {
      const validator1 = vi.fn().mockReturnValue({
        valid: true,
        errors: [],
        metadata: { count: 1 },
      });
      const validator2 = vi.fn().mockReturnValue({
        valid: true,
        errors: [],
        metadata: { total: 10 },
      });

      const composed = composeValidators(validator1, validator2);
      const result = await composed({ value: 'test' });

      expect(result.metadata).toEqual({ count: 1, total: 10 });
    });
  });

  describe('composeAsyncValidators', () => {
    it('combines multiple async validators into one', async () => {
      const validator1 = vi.fn().mockResolvedValue({ valid: true, errors: [] });
      const validator2 = vi
        .fn()
        .mockResolvedValue({ valid: false, errors: [{ message: 'Error' }] });

      const composed = composeAsyncValidators(validator1, validator2);
      const result = await composed({ value: 'test' });

      expect(validator1).toHaveBeenCalled();
      expect(validator2).toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('returns valid=true when all validators pass', async () => {
      const validator1 = vi.fn().mockResolvedValue({ valid: true, errors: [] });
      const validator2 = vi.fn().mockResolvedValue({ valid: true, errors: [] });

      const composed = composeAsyncValidators(validator1, validator2);
      const result = await composed({ value: 'test' });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('merges metadata from all validators', async () => {
      const validator1 = vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
        metadata: { count: 1 },
      });
      const validator2 = vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
        metadata: { total: 10 },
      });

      const composed = composeAsyncValidators(validator1, validator2);
      const result = await composed({ value: 'test' });

      expect(result.metadata).toEqual({ count: 1, total: 10 });
    });
  });

  describe('memoizeValidator', () => {
    it('caches validation results for the same input', async () => {
      const mockValidator = vi
        .fn()
        .mockReturnValue({ valid: true, errors: [] });
      const memoized = memoizeValidator(mockValidator);

      // First call should invoke the validator
      await memoized('test');
      expect(mockValidator).toHaveBeenCalledTimes(1);

      // Second call with same input should use cache
      await memoized('test');
      expect(mockValidator).toHaveBeenCalledTimes(1);

      // Call with different input should invoke the validator again
      await memoized('different');
      expect(mockValidator).toHaveBeenCalledTimes(2);
    });

    it('uses custom key generator when provided', async () => {
      const mockValidator = vi
        .fn()
        .mockReturnValue({ valid: true, errors: [] });
      const keyGenerator = vi.fn().mockReturnValue('customKey');
      const memoized = memoizeValidator(mockValidator, keyGenerator);

      await memoized('test');
      expect(keyGenerator).toHaveBeenCalledWith('test', undefined);
    });

    it('respects cache clearing', async () => {
      const mockValidator = vi
        .fn()
        .mockReturnValue({ valid: true, errors: [] });
      const memoized = memoizeValidator(mockValidator);

      await memoized('test');
      expect(mockValidator).toHaveBeenCalledTimes(1);

      clearValidationCache();

      await memoized('test');
      expect(mockValidator).toHaveBeenCalledTimes(2);
    });

    it('supports cache options for performance tuning', async () => {
      // Test with a custom cache TTL and size
      const mockValidator = vi
        .fn()
        .mockReturnValue({ valid: true, errors: [] });
      const memoized = memoizeValidator(mockValidator, undefined, {
        ttl: 1000, // 1 second
        maxSize: 100,
      });

      await memoized('test');
      expect(mockValidator).toHaveBeenCalledTimes(1);

      await memoized('test');
      expect(mockValidator).toHaveBeenCalledTimes(1);

      // With TTL we'd need to advance timers, but since we can't directly
      // test the cache implementation, we'll rely on clearCache testing
    });
  });

  describe('Helper Functions', () => {
    describe('isObject', () => {
      it('identifies objects correctly', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: 'value' })).toBe(true);
        expect(isObject(new Date())).toBe(true);

        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject('string')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(true)).toBe(false);
        expect(isObject([])).toBe(false);
      });
    });

    describe('safeGet', () => {
      it('retrieves values safely', () => {
        const obj = { key: 'value', nested: { deep: true } };

        expect(safeGet(obj, 'key', 'default')).toBe('value');
        expect(safeGet(obj, 'nested', {})).toBe(obj.nested);
        expect(safeGet(obj, 'nonexistent', 'default')).toBe('default');
        expect(safeGet(null, 'key', 'default')).toBe('default');
        expect(safeGet(undefined, 'key', 'default')).toBe('default');
      });
    });

    describe('isEmpty', () => {
      it('identifies empty values correctly', () => {
        expect(isEmpty(null)).toBe(true);
        expect(isEmpty(undefined)).toBe(true);
        expect(isEmpty('')).toBe(true);
        expect(isEmpty([])).toBe(true);
        expect(isEmpty({})).toBe(true);

        expect(isEmpty('text')).toBe(false);
        expect(isEmpty(0)).toBe(false);
        expect(isEmpty(false)).toBe(false);
        expect(isEmpty([1, 2])).toBe(false);
        expect(isEmpty({ key: 'value' })).toBe(false);
      });
    });

    describe('createValidator', () => {
      it('creates a type guard from a validator function', () => {
        const mockValidator = vi
          .fn()
          .mockReturnValue({ valid: true, errors: [] });
        const typeGuard = createValidator(mockValidator);

        const value = { test: 'value' };
        const isValid = typeGuard(value);

        expect(mockValidator).toHaveBeenCalledWith(value, undefined);
        expect(isValid).toBe(true);
      });

      it('returns false when validator returns invalid result', () => {
        const mockValidator = vi
          .fn()
          .mockReturnValue({ valid: false, errors: [{ message: 'Error' }] });
        const typeGuard = createValidator(mockValidator);

        const isValid = typeGuard({ test: 'value' });

        expect(isValid).toBe(false);
      });
    });
  });
});
