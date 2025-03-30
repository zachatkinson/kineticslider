/**
 * Base error class for the kinetic slider
 */
import { SliderErrorInfo } from '../types/slider';

export class SliderError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'SliderError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.details = details;
  }

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
 */
export class ErrorHandler {
  constructor(
    private readonly onError?: (
      error: Error,
      errorInfo: SliderErrorInfo
    ) => void
  ) {}

  /**
   * Handle an operation that might throw an error
   */
  async handle<T>(
    operation: () => Promise<T> | T,
    context: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      await this.processError(error, context);
      throw error;
    }
  }

  /**
   * Process and report an error
   */
  private async processError(
    error: unknown,
    context: Record<string, unknown>
  ): Promise<void> {
    const sliderError = this.normalizeError(error);
    const errorInfo = sliderError.toErrorInfo();

    // Add context to error info if details is an object
    if (typeof errorInfo.details === 'object' && errorInfo.details !== null) {
      errorInfo.details = {
        ...(errorInfo.details as Record<string, unknown>),
        context,
      };
    } else {
      errorInfo.details = { context };
    }

    // Report error to analytics if available
    if (typeof window !== 'undefined' && window.errorTracker) {
      window.errorTracker.captureError(sliderError, context);
    }

    // Call error callback if provided
    this.onError?.(sliderError, errorInfo);
  }

  /**
   * Normalize any error into a SliderError
   */
  private normalizeError(error: unknown): SliderError {
    if (error instanceof SliderError) {
      return error;
    }

    if (error instanceof Error) {
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
 * Specific error types
 */
export class ValidationError extends SliderError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AnimationError extends SliderError {
  constructor(message: string, details?: unknown) {
    super(message, 'ANIMATION_ERROR', details);
    this.name = 'AnimationError';
  }
}

export class GestureError extends SliderError {
  constructor(message: string, details?: unknown) {
    super(message, 'GESTURE_ERROR', details);
    this.name = 'GestureError';
  }
}

export class ResourceError extends SliderError {
  constructor(message: string, details?: unknown) {
    super(message, 'RESOURCE_ERROR', details);
    this.name = 'ResourceError';
  }
}

/**
 * Retry operation with exponential backoff
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

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError;
}

export function createSliderError(
  error: Error | unknown,
  code: string,
  details?: unknown
): SliderErrorInfo {
  const baseError = error instanceof Error ? error : new Error(String(error));

  return {
    name: baseError.name,
    message: baseError.message,
    componentStack: '', // This will be filled by React if it's a component error
    stack: baseError.stack || null,
    code,
    timestamp: new Date().toISOString(),
    details: details || null,
  };
}
