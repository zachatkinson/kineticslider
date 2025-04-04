/**
 * Base error class for the kinetic slider
 */
import type { SliderErrorInfo, ErrorType as _ErrorType, SliderError as ISliderError } from '../types/error';

/**
 * Base error class for slider-specific errors
 * @example Example usage
 */
export class SliderError extends Error implements ISliderError {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: unknown;

  /**
   * Creates a new SliderError instance
   * @param message - Error message
   * @param code - Error code
   * @param details - Optional additional error details
   */
  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'SliderError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.details = details;
  }

  /**
   * Convert the error to a standardized error info object
   * @returns A SliderErrorInfo object containing error details
   */
  toErrorInfo(): SliderErrorInfo {
    return {
      name: this.name,
      message: this.message,
      componentStack: '',
      stack: this.stack || null,
      code: this.code,
      timestamp: this.timestamp,
      details: this.details ?? null,
    };
  }
}

/**
 * Error handler class for consistent error processing
 * @example Example usage
 */
export class _ErrorHandler {
  /**
   * Creates a new ErrorHandler instance
   * @param onError - Optional callback function to execute when an error is handled
   */
  constructor(
    private readonly onError?: (
      error: Error,
      errorInfo: SliderErrorInfo
    ) => void
  ) {}

  /**
   * Handle an operation that might throw an error
   * @param operation
   * @param context
   * @returns The result of the operation if successful
   */
  async handle<T>(
    operation: () => Promise<T> | T,
    context: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch(error) {
      await this.processError(error, context);
      throw error;
    }
  }

  /**
   * Process and report an error
   * @param error
   * @param context
   * @returns {Promise<void>}
   */
  private async processError(
    error: unknown,
    context: Record<string, unknown>
  ): Promise<void> {
    const sliderError = this.normalizeError(error);
    const errorInfo = sliderError.toErrorInfo();

    // Add context to error info if details is an object
    if(typeof errorInfo.details === 'object' && errorInfo.details !== null) {
      errorInfo.details = {
        ...(errorInfo.details as Record<string, unknown>),
        context,
      };
    } else {
      errorInfo.details = { context };
    }

    // Report error to analytics if available
    if(typeof window !== 'undefined') {
      // Access window.errorTracker with a type assertion
      const errorTracker = (window as Window & { errorTracker?: { captureError: (error: Error, context: unknown) => void } }).errorTracker;
      if (errorTracker && typeof errorTracker.captureError === 'function') {
        errorTracker.captureError(sliderError, context);
      }
    }

    // Call error callback if provided
    this.onError?.(sliderError, errorInfo);
  }

  /**
   * Normalize any error into a SliderError
   * @param error
   * @returns A standardized SliderError instance
   */
  private normalizeError(error: unknown): SliderError {
    if(error instanceof SliderError) {
      return error;
    }

    if(error instanceof Error) {
      return new SliderError(error.message, 'UNKNOWN_ERROR', {
        originalError: error,
      });
    }

    return new SliderError('An unknown error occurred', 'UNKNOWN_ERROR', {
      originalError: error,
    });
  }
}

/**
 * Validation error class for handling validation-related errors
 * @example
 * ```typescript
 * // Create and throw a validation error
 * throw new ValidationError('The input value must be a positive number', { value: -5 });
 * 
 * // Create and handle a validation error
 * try {
 *   if (!isValid(input)) {
 *     throw new ValidationError('Invalid input format');
 *   }
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Validation failed:', error.message);
 *   }
 * }
 * ```
 */
export class ValidationError extends SliderError {
  /**
   * Creates a new ValidationError instance
   * @param message - Error message
   * @param details - Optional additional error details
   */
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Animation error class for handling animation-related errors
 * @example
 * ```typescript
 * // Create and throw an animation error
 * throw new AnimationError('Animation timeline failed to initialize', { 
 *   timeline: 'main', 
 *   target: '.slide-element' 
 * });
 * 
 * // Create and handle an animation error
 * try {
 *   if (!timeline.isActive()) {
 *     throw new AnimationError('Animation timeline is not active');
 *   }
 * } catch (error) {
 *   if (error instanceof AnimationError) {
 *     console.error('Animation error:', error.message);
 *   }
 * }
 * ```
 */
export class AnimationError extends SliderError {
  /**
   * Creates a new AnimationError instance
   * @param message - Error message
   * @param details - Optional additional error details
   */
  constructor(message: string, details?: unknown) {
    super(message, 'ANIMATION_ERROR', details);
    this.name = 'AnimationError';
  }
}

/**
 * Gesture error class for handling gesture-related errors
 * @example
 * ```typescript
 * // Create and throw a gesture error
 * throw new GestureError('Gesture recognition failed', { 
 *   gestureType: 'swipe', 
 *   direction: 'horizontal' 
 * });
 * 
 * // Create and handle a gesture error
 * try {
 *   if (!isValidGesture(event)) {
 *     throw new GestureError('Invalid gesture data');
 *   }
 * } catch (error) {
 *   if (error instanceof GestureError) {
 *     console.error('Gesture error:', error.message);
 *   }
 * }
 * ```
 */
export class GestureError extends SliderError {
  /**
   * Creates a new GestureError instance
   * @param message - Error message
   * @param details - Optional additional error details
   */
  constructor(message: string, details?: unknown) {
    super(message, 'GESTURE_ERROR', details);
    this.name = 'GestureError';
  }
}

/**
 * Resource error class for handling resource loading-related errors
 * @example
 * ```typescript
 * // Create and throw a resource error
 * throw new ResourceError('Failed to load image resource', { 
 *   url: 'https://example.com/image.jpg', 
 *   statusCode: 404 
 * });
 * 
 * // Create and handle a resource error
 * try {
 *   const image = await loadImage(url);
 *   if (!image) {
 *     throw new ResourceError('Image failed to load');
 *   }
 * } catch (error) {
 *   if (error instanceof ResourceError) {
 *     console.error('Resource loading error:', error.message);
 *   }
 * }
 * ```
 */
export class ResourceError extends SliderError {
  /**
   * Creates a new ResourceError instance
   * @param message - Error message
   * @param details - Optional additional error details
   */
  constructor(message: string, details?: unknown) {
    super(message, 'RESOURCE_ERROR', details);
    this.name = 'ResourceError';
  }
}

/**
 * Retry operation with exponential backoff
 * @param operation
 * @param options
 * @param options.maxAttempts
 * @param options.backoffMs
 * @param options.timeout
 * @returns The result of the operation if successful
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    backoffMs?: number;
    timeout?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, backoffMs = 1000, timeout = 5000 } = options;

  let lastError: Error = new Error('Operation failed');

  for(let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new SliderError('Operation timeout', 'TIMEOUT_ERROR')),
            timeout
          )
        ),
      ]);
    } catch(error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if(attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError;
}

/**
 * Creates a standardized error information object from an error
 * @param error - The error to convert
 * @param code - The error code to assign
 * @param details - Optional additional error details
 * @returns {SliderErrorInfo} A standardized error information object
 */
export function _createSliderError(
  error: Error | unknown,
  code: string,
  details?: unknown
): SliderErrorInfo {
  const baseError = error instanceof Error ? error : new Error(String(error));

  return {
    name: baseError.name,
    message: baseError.message,
    componentStack: '',
    stack: baseError.stack || null,
    code,
    timestamp: new Date().toISOString(),
    details: details ?? null,
  };
}
