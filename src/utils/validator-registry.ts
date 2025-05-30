import {
  ValidationFunction,
  ValidationResult,
} from "../types/validation";

// Store for registered validators
const validatorRegistry = new Map<string, ValidationFunction>();

// Store for memoized validation results
const validationCache = new Map<string, ValidationResult>();

/**
 * Registers a validator function with the given name
 *
 * @param name
 *
 * @param validator
 *
 * @returns {ReturnType} The return value
 *
 */
export function _registerValidator(
  name: string,
  validator: ValidationFunction,
): void {
  validatorRegistry.set(name, validator);
}

/**
 * Retrieves a validator function by name
 *
 * @param name
 *
 * @returns {ReturnType} The return value
 *
 */
export function _getValidator(name: string): ValidationFunction | undefined {
  return validatorRegistry.get(name);
}

/**
 * Clears all registered validators
 *
 * @returns {ReturnType} The return value
 *
 */
export function _clearValidatorRegistry(): void {
  validatorRegistry.clear();
}

/**
 * Checks if a validator exists
 *
 * @param name
 *
 * @returns {ReturnType} The return value
 *
 */
export function _hasValidator(name: string): boolean {
  return validatorRegistry.has(name);
}

/**
 * Gets all registered validator names
 *
 * @returns {ReturnType} The return value
 *
 */
export function _getValidatorNames(): string[] {
  return Array.from(validatorRegistry.keys());
}

/**
 * Clears the validation cache
 *
 * @returns {unknown} - The return value
 *
 */
export function _clearValidationCache(): void {
  validationCache.clear();
}

// Re-export memoizeValidator from centralized location
export { memoizeValidator } from "./validation";

/**
 * Composes multiple validators into a single validator
 *
 * @param {...any} validators
 *
 * @returns {unknown} - The return value
 *
 */
export function composeValidators<T>(
  ...validators: ValidationFunction<T>[]
): ValidationFunction<T> {
  return async (value: T): Promise<ValidationResult> => {
    const results = await Promise.all(
      validators.map((validator) => validator(value)),
    );

    const valid = results.every((result) => result.valid);
    const errors = results.flatMap((result) => result.errors);

    return { valid, errors };
  };
}
