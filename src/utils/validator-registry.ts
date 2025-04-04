import { ValidationFunction, ValidationResult, KeyGenerator } from '../types/validation';

// Store for registered validators
const validatorRegistry = new Map<string, ValidationFunction>();

// Store for memoized validation results
const validationCache = new Map<string, ValidationResult>();

/**
 * Registers a validator function with the given name
 * @param name
 * @param validator
 * @returns {ReturnType} The return value
 */
export function _registerValidator(name: string, validator: ValidationFunction): void {
  validatorRegistry.set(name, validator);
}

/**
 * Retrieves a validator function by name
 * @param name
 * @returns {ReturnType} The return value
 */
export function _getValidator(name: string): ValidationFunction | undefined {
  return validatorRegistry.get(name);
}

/**
 * Clears all registered validators
 * @returns {ReturnType} The return value
 */
export function _clearValidatorRegistry(): void {
  validatorRegistry.clear();
}

/**
 * Checks if a validator exists
 * @param name
 * @returns {ReturnType} The return value
 */
export function _hasValidator(name: string): boolean {
  return validatorRegistry.has(name);
}

/**
 * Gets all registered validator names
 * @returns {ReturnType} The return value
 */
export function _getValidatorNames(): string[] {
  return Array.from(validatorRegistry.keys());
}

/**
 * Creates a memoized version of a validator function
 * @param validator
 * @param keyGenerator
 * @returns {ReturnType} The return value
 */
export function memoizeValidator<T>(
  validator: ValidationFunction<T>,
  keyGenerator?: KeyGenerator<T>
): ValidationFunction<T> {
  // Type assertion to handle both sync and async cases
  const validatorFn = (value: T): ValidationResult | Promise<ValidationResult> => {
    const key = keyGenerator ? keyGenerator(value) : JSON.stringify(value);
    const cached = validationCache.get(key);
    if (cached) return cached;

    const result = validator(value);
    if(result instanceof Promise) {
      return result.then(asyncResult => {
        validationCache.set(key, asyncResult);
        return asyncResult;
      });
    }

    validationCache.set(key, result);
    return result;
  };
  
  // Return the validator function explicitly typed
  return validatorFn as ValidationFunction<T>;
}

/**
 * Clears the validation cache
 * @returns {unknown} - The return value
 */
export function _clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Composes multiple validators into a single validator
 * @param {...any} validators
 * @returns {unknown} - The return value
 */
export function composeValidators<T>(...validators: ValidationFunction<T>[]): ValidationFunction<T> {
  return async (value: T): Promise<ValidationResult> => {
    const results = await Promise.all(validators.map(validator => validator(value)));
    
    const valid = results.every(result => result.valid);
    const errors = results.flatMap(result => result.errors);

    return { valid, errors };
  };
}