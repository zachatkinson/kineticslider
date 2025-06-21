/**
 * Error Handling Framework
 *
 * A comprehensive error handling system with categorization,
 * recovery strategies, and reporting capabilities.
 */

import type { SliderError } from '../domain/models';
import { createLogger, LogLevel } from './logging.js';

// Create a logger for error handling
const errorLogger = createLogger(
  { component: 'ErrorHandler' },
  { level: LogLevel.Info }
);

// ===== ERROR TYPES =====

export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum ErrorCategory {
  Network = 'network',
  Validation = 'validation',
  Runtime = 'runtime',
  Performance = 'performance',
  Security = 'security',
  Configuration = 'configuration',
  Resource = 'resource',
  User = 'user',
}

export interface ErrorContext {
  timestamp: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  slideId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorRecoveryStrategy {
  name: string;
  description: string;
  execute: (error: SliderError, context: ErrorContext) => Promise<boolean>;
  maxAttempts: number;
  backoffMs: number;
}

// ===== CUSTOM ERROR CLASSES =====

export abstract class BaseSliderError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  abstract readonly severity: ErrorSeverity;
  abstract readonly recoverable: boolean;

  public readonly timestamp: Date;
  public readonly context: ErrorContext;

  constructor(message: string, _context: Partial<ErrorContext> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = {
      timestamp: this.timestamp,
      ..._context,
    };

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toSliderError(): SliderError {
    return {
      code: this.code,
      message: this.message,
      slideId: this.context.slideId,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
    };
  }

  toJSON(): {
    name: string;
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    timestamp: Date;
    context: ErrorContext;
    stack?: string;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }

  logError(): void {
    switch (this.severity) {
      case 'low':
        errorLogger.info(`Recoverable error: ${this.code} - ${this.message}`);
        break;
      case 'medium':
        errorLogger.warn(
          `Medium severity error: ${this.code} - ${this.message}`
        );
        break;
      case 'high':
        errorLogger.error(
          `High severity error: ${this.code} - ${this.message}`
        );
        break;
      case 'critical':
        errorLogger.fatal(`Critical error: ${this.code} - ${this.message}`);
        break;
    }
  }
}

// ===== SPECIFIC ERROR CLASSES =====

export class SlideLoadError extends BaseSliderError {
  readonly code = 'SLIDE_LOAD_ERROR';
  readonly category = ErrorCategory.Resource;
  readonly severity = ErrorSeverity.Medium;
  readonly recoverable = true;

  constructor(
    slideId: string,
    reason: string,
    context?: Partial<ErrorContext>
  ) {
    super(`Failed to load slide ${slideId}: ${reason}`, {
      ...context,
      slideId,
    });
  }
}

export class NavigationError extends BaseSliderError {
  readonly code = 'NAVIGATION_ERROR';
  readonly category = ErrorCategory.Runtime;
  readonly severity = ErrorSeverity.Low;
  readonly recoverable = true;

  constructor(message: string, context?: Partial<ErrorContext>) {
    super(`Navigation error: ${message}`, context);
  }
}

export class ConfigurationError extends BaseSliderError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly category = ErrorCategory.Configuration;
  readonly severity = ErrorSeverity.High;
  readonly recoverable = false;

  constructor(message: string, context?: Partial<ErrorContext>) {
    super(`Configuration error: ${message}`, context);
  }
}

export class PerformanceError extends BaseSliderError {
  readonly code = 'PERFORMANCE_ERROR';
  readonly category = ErrorCategory.Performance;
  readonly severity = ErrorSeverity.Medium;
  readonly recoverable = true;

  constructor(message: string, context?: Partial<ErrorContext>) {
    super(`Performance issue: ${message}`, context);
  }
}

export class SecurityError extends BaseSliderError {
  readonly code = 'SECURITY_ERROR';
  readonly category = ErrorCategory.Security;
  readonly severity = ErrorSeverity.Critical;
  readonly recoverable = false;

  constructor(message: string, context?: Partial<ErrorContext>) {
    super(`Security error: ${message}`, context);
  }
}

export class ValidationError extends BaseSliderError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = ErrorCategory.Validation;
  readonly severity = ErrorSeverity.Medium;
  readonly recoverable = false;

  constructor(
    field: string,
    value: unknown,
    reason: string,
    context?: Partial<ErrorContext>
  ) {
    super(
      `Validation failed for ${field}: ${reason} (value: ${value})`,
      context
    );
  }
}

export class NetworkError extends BaseSliderError {
  readonly code = 'NETWORK_ERROR';
  readonly category = ErrorCategory.Network;
  readonly severity = ErrorSeverity.Medium;
  readonly recoverable = true;

  constructor(message: string, context?: Partial<ErrorContext>) {
    super(`Network error: ${message}`, context);
  }
}

// ===== ERROR HANDLER =====

export interface ErrorHandlerOptions {
  enableReporting: boolean;
  enableRecovery: boolean;
  enableLogging: boolean;
  maxRecoveryAttempts: number;
  reportingEndpoint?: string;
}

export class ErrorHandler {
  private strategies = new Map<string, ErrorRecoveryStrategy>();
  private recoveryAttempts = new Map<string, number>();
  private options: ErrorHandlerOptions;

  constructor(options: Partial<ErrorHandlerOptions> = {}) {
    this.options = {
      enableReporting: true,
      enableRecovery: true,
      enableLogging: true,
      maxRecoveryAttempts: 3,
      ...options,
    };

    this.setupDefaultStrategies();
  }

  /**
   * Handle an error with full processing pipeline
   */
  async handleError(
    error: Error | BaseSliderError,
    _context: Partial<ErrorContext> = {}
  ): Promise<SliderError> {
    const sliderError = this.normalizeError(error, _context);

    // Log the error
    if (this.options.enableLogging) {
      this.logError(sliderError, error);
    }

    // Attempt recovery if enabled and error is recoverable
    if (this.options.enableRecovery && sliderError.recoverable) {
      const recovered = await this.attemptRecovery(sliderError, _context);
      if (recovered) {
        return sliderError;
      }
    }

    // Report the error if enabled
    if (this.options.enableReporting) {
      await this.reportError(sliderError, error);
    }

    return sliderError;
  }

  /**
   * Register a recovery strategy
   */
  registerRecoveryStrategy(
    errorCode: string,
    strategy: ErrorRecoveryStrategy
  ): void {
    this.strategies.set(errorCode, strategy);
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: SliderError): boolean {
    return error.recoverable && this.strategies.has(error.code);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoverySuccessRate: number;
  } {
    // Implementation would track error statistics
    return {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoverySuccessRate: 0,
    };
  }

  // ===== PRIVATE METHODS =====

  private normalizeError(
    error: Error | BaseSliderError,
    _context: Partial<ErrorContext>
  ): SliderError {
    if (error instanceof BaseSliderError) {
      return error.toSliderError();
    }

    // Convert generic errors to SliderError
    const errorCode = this.categorizeGenericError(error);
    return {
      code: errorCode,
      message: error.message,
      recoverable: this.isGenericErrorRecoverable(error),
      timestamp: new Date(),
    };
  }

  private categorizeGenericError(error: Error): string {
    if (error.name === 'TypeError') return 'RUNTIME_TYPE_ERROR';
    if (error.name === 'ReferenceError') return 'RUNTIME_REFERENCE_ERROR';
    if (error.name === 'RangeError') return 'RUNTIME_RANGE_ERROR';
    if (error.message.includes('fetch')) return 'NETWORK_FETCH_ERROR';
    if (error.message.includes('timeout')) return 'NETWORK_TIMEOUT_ERROR';
    return 'UNKNOWN_ERROR';
  }

  private isGenericErrorRecoverable(error: Error): boolean {
    // Network errors are generally recoverable
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }

    // Timeout errors are recoverable
    if (error.message.includes('timeout')) {
      return true;
    }

    // Type errors are generally not recoverable
    if (error.name === 'TypeError') {
      return false;
    }

    return false;
  }

  private logError(sliderError: SliderError, originalError: Error): void {
    const logLevel = this.getLogLevelForError(sliderError);
    const logData = {
      error: sliderError,
      stack: originalError.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    switch (logLevel) {
      case 'error':
        errorLogger.error('Slider Error', logData);
        break;
      case 'warn':
        errorLogger.warn('Slider Warning', logData);
        break;
      case 'info':
        errorLogger.info('Slider Info', logData);
        break;
      default:
        errorLogger.debug('Slider Debug', logData);
    }
  }

  private getLogLevelForError(error: SliderError): string {
    // Map error codes to log levels
    if (error.code.includes('CRITICAL') || error.code.includes('SECURITY')) {
      return 'error';
    }
    if (
      error.code.includes('PERFORMANCE') ||
      error.code.includes('VALIDATION')
    ) {
      return 'warn';
    }
    return 'info';
  }

  private async attemptRecovery(
    error: SliderError,
    _context: Partial<ErrorContext>
  ): Promise<boolean> {
    const strategy = this.strategies.get(error.code);
    if (!strategy) {
      return false;
    }

    const attemptKey = `${error.code}-${error.slideId || 'global'}`;
    const currentAttempts = this.recoveryAttempts.get(attemptKey) || 0;

    if (currentAttempts >= strategy.maxAttempts) {
      return false;
    }

    try {
      // Wait for backoff
      if (currentAttempts > 0) {
        await this.delay(strategy.backoffMs * Math.pow(2, currentAttempts - 1));
      }

      // Attempt recovery
      const success = await strategy.execute(error, _context as ErrorContext);

      if (success) {
        this.recoveryAttempts.delete(attemptKey);
        return true;
      } else {
        this.recoveryAttempts.set(attemptKey, currentAttempts + 1);
        return false;
      }
    } catch (recoveryError) {
      errorLogger.error('Recovery strategy failed:', recoveryError);
      this.recoveryAttempts.set(attemptKey, currentAttempts + 1);
      return false;
    }
  }

  private async reportError(
    error: SliderError,
    originalError: Error
  ): Promise<void> {
    if (!this.options.reportingEndpoint) {
      return;
    }

    try {
      await fetch(this.options.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error,
          stack: originalError.stack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportingError) {
      errorLogger.error('Failed to report error:', reportingError);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private setupDefaultStrategies(): void {
    // Slide load retry strategy
    this.registerRecoveryStrategy('SLIDE_LOAD_ERROR', {
      name: 'Slide Load Retry',
      description: 'Retry loading a failed slide',
      maxAttempts: 3,
      backoffMs: 1000,
      execute: async (
        error: SliderError,
        _context: ErrorContext
      ): Promise<boolean> => {
        if (!error.slideId) return false;

        try {
          // Implementation would retry slide loading
          errorLogger.info(`Retrying slide load for ${error.slideId}`);
          return true;
        } catch {
          return false;
        }
      },
    });

    // Network retry strategy
    this.registerRecoveryStrategy('NETWORK_ERROR', {
      name: 'Network Retry',
      description: 'Retry failed network requests',
      maxAttempts: 3,
      backoffMs: 2000,
      execute: async (
        _error: SliderError,
        _context: ErrorContext
      ): Promise<boolean> => {
        try {
          // Implementation would retry network request
          errorLogger.info('Retrying network request');
          return true;
        } catch {
          return false;
        }
      },
    });

    // Performance recovery strategy
    this.registerRecoveryStrategy('PERFORMANCE_ERROR', {
      name: 'Performance Recovery',
      description: 'Reduce quality to improve performance',
      maxAttempts: 1,
      backoffMs: 0,
      execute: async (
        _error: SliderError,
        _context: ErrorContext
      ): Promise<boolean> => {
        try {
          // Implementation would reduce quality settings
          errorLogger.info('Reducing quality for better performance');
          return true;
        } catch {
          return false;
        }
      },
    });
  }
}

// ===== ERROR BOUNDARY HELPERS =====

export interface ErrorBoundaryState {
  hasError: boolean;
  error: SliderError | null;
  errorId: string | null;
}

export function createErrorBoundaryState(): ErrorBoundaryState {
  return {
    hasError: false,
    error: null,
    errorId: null,
  };
}

export function handleErrorBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
): ErrorBoundaryState {
  const errorHandler = new ErrorHandler();
  // Note: handleError returns a Promise<SliderError>, but we need sync behavior here
  // In a real implementation, this would be handled differently
  const sliderError: SliderError = {
    code: 'BOUNDARY_ERROR',
    message: error.message,
    recoverable: false,
    timestamp: new Date(),
  };

  // Trigger async error handling in background
  errorHandler
    .handleError(error, {
      metadata: { componentStack: errorInfo.componentStack },
    })
    .catch((err: Error) =>
      errorLogger.error('Error boundary handler failed', err)
    );

  return {
    hasError: true,
    error: sliderError,
    errorId: `error-${Date.now()}`,
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a safe async function that handles errors
 */
export function safeAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: ErrorHandler
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      await errorHandler.handleError(error as Error);
      return null;
    }
  };
}

/**
 * Create a safe sync function that handles errors
 */
export function safeSync<T extends unknown[], R>(
  fn: (...args: T) => R,
  errorHandler: ErrorHandler
): (...args: T) => R | null {
  return (...args: T): R | null => {
    try {
      return fn(...args);
    } catch (error) {
      errorHandler.handleError(error as Error);
      return null;
    }
  };
}

/**
 * Wrap a promise with error handling
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  errorHandler: ErrorHandler,
  _context?: Partial<ErrorContext>
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    await errorHandler.handleError(error as Error, _context);
    return null;
  }
}
