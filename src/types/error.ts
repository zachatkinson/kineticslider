/**
 * Error type definitions and error handling interfaces
 * @module
 * @version 1.0.0
 */

import { SliderId, SlideIndex } from './branded';
import type { ValidationResult } from './validation';

// Re-export ValidationResult for backward compatibility
export type { ValidationResult };

/**
 * Core error types that can be tracked
 */
export enum ErrorType {
  /** Errors that occur during component rendering */
  RENDER = 'render',
  /** Errors that occur during asynchronous operations */
  ASYNC = 'async',
  /** Errors that occur during animations */
  ANIMATION = 'animation',
  /** Errors that occur during data validation */
  VALIDATION = 'validation',
  /** Errors that occur during resource loading */
  RESOURCE = 'resource',
  /** Errors that occur during user interactions */
  INTERACTION = 'interaction',
  /** Errors that occur during state updates */
  STATE = 'state',
  /** Generic operation errors */
  OPERATION = 'operation',
  /** Gesture handling errors */
  GESTURE = 'gesture',
  /** Navigation errors */
  NAVIGATION = 'navigation',
  /**
   * Animation errors
   */
  ANIMATION_ERROR = 'animation_error',
  
  /**
   * Asset loading errors
   */
  ASSET_LOADING = 'asset_loading',
  
  /**
   * Image loading errors
   */
  IMAGE_LOAD_ERROR = 'image_load_error',
  
  /**
   * Network errors
   */
  NETWORK = 'network',
  
  /**
   * User input errors
   */
  USER_INPUT = 'user_input',
  
  /**
   * Configuration errors
   */
  CONFIGURATION = 'configuration',
  
  /**
   * Unknown or unspecified errors
   */
  UNKNOWN = 'unknown',
  
  /**
   * Performance-related errors
   */
  PERFORMANCE = 'performance',
  
  /**
   * Initialization errors
   */
  INITIALIZATION = 'initialization',
  
  /**
   * Worker pool errors
   */
  WORKER_POOL = 'worker_pool'
}

/**
 * Error severity levels for error classification
 */
export enum ErrorSeverity {
  /** Informational issues that don't affect functionality */
  INFO = 'info',
  /** Minor issues that don't significantly impact functionality */
  WARNING = 'warning',
  /** Serious issues that affect core functionality */
  ERROR = 'error',
  /** Critical issues that prevent the application from functioning */
  CRITICAL = 'critical'
}

/**
 * Base error interface for all application errors
 * @example Example usage
 */
export interface BaseError {
  message: string;
  stack?: string;
  timestamp: number;
  type: ErrorType;
  severity?: ErrorSeverity;
}

/**
 * Base slider error information interface
 * @example Example usage
 */
export interface SliderErrorInfo {
  name: string;
  message: string;
  componentStack: string;
  stack: string | null;
  code: string;
  timestamp: string;
  details: unknown | null;
}

/**
 * Base slider error interface
 * @example Example usage
 */
export interface SliderError extends Error {
  code: string;
  timestamp: string;
  details?: unknown;
  toErrorInfo(): SliderErrorInfo;
}

/**
 * Structure of a tracked error event
 * @example Example usage
 */
export interface ErrorEvent extends BaseError {
  componentInfo: Record<string, unknown>;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorType: ErrorType;
}

/**
 * Extended Error interface with additional properties
 * @example Example usage
 */
export interface ExtendedError extends Error {
  /**
   * Error code
   */
  code?: string;
  
  /**
   * Error context
   */
  context?: Record<string, unknown>;
  
  /**
   * Error stack
   */
  stack?: string;
  
  /**
   * Error timestamp
   */
  timestamp?: string;
  
  /**
   * Whether the error has been handled
   */
  handled?: boolean;
  
  /**
   * Number of error occurrences
   */
  occurrences?: number;
  
  /**
   * Convert to standardized error info
   */
  toErrorInfo(): SliderErrorInfo;
}

/**
 * Extended Error interface with additional context
 * @example Example usage
 */
export interface ComponentError extends Error {
  /** Error classification code */
  code?: string;
  /** Type of error that occurred */
  type?: ErrorType;
  /** Severity level of the error */
  severity?: ErrorSeverity;
  /** Component information where the error occurred */
  componentInfo?: {
    /** Name of the component */
    name?: string;
    /** Component props at time of error */
    props?: Record<string, unknown>;
    /** Component state at time of error */
    state?: Record<string, unknown>;
  };
  /** Additional context about the error */
  context?: Record<string, unknown>;
  /** Stack trace of the error */
  stack?: string;
  /** Time when the error occurred */
  timestamp?: string;
  /** Whether the error has been handled */
  handled?: boolean;
  /** Number of times this error has occurred */
  occurrences?: number;
}

/**
 * Error boundary state interface
 * @example Example usage
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that: occurred, if any */
  error: Error | null;
}

/**
 * Error tracking configuration options
 * @example Example usage
 */
export interface ErrorTrackingOptions {
  /** Whether to enable error tracking */
  enabled?: boolean;
  /** Sampling rate for error tracking (0-1) */
  sampleRate?: number;
  /** Maximum number of errors to track */
  maxErrors?: number;
  /** Whether to include stack traces */
  includeStack?: boolean;
  /** Custom error handlers */
  handlers?: {
    /** Handler for error events */
    onError?: (error: ComponentError) => void;
    /** Handler for error recovery */
    onRecovery?: () => void;
  };
}

/**
 * Represents a sanitized error object safe for client display
 * @example Example usage
 */
export interface SanitizedError {
  name: string;
  message: string;
  stack?: string;
  code: string;
  timestamp: string;
}

/**
 * Represents the severity level of a validation error
 */
export enum ValidationErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Animation error for slider transitions
 * @example Example usage
 */
export interface AnimationError extends ExtendedError {
  type: ErrorType.ANIMATION;
  details: {
    currentSlide: SlideIndex;
    targetSlide: SlideIndex;
    duration: number;
    property: string;
  };
}

/**
 * Gesture error for touch/mouse interactions
 * @example Example usage
 */
export interface GestureError extends BaseError {
  type: ErrorType.GESTURE;
  details: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    eventType: string;
  };
}

/**
 * Navigation error for slide transitions
 * @example Example usage
 */
export interface NavigationError extends BaseError {
  type: ErrorType.NAVIGATION;
  details: {
    fromSlide: SlideIndex;
    toSlide: SlideIndex;
    direction: 'next' | 'prev';
  };
}

/**
 * Render error for component failures
 * @example Example usage
 */
export interface RenderError extends ExtendedError {
  type: ErrorType.RENDER;
  details: {
    slideId: SliderId;
    componentStack: string;
  };
}

/**
 * Validation error interface with improved structure
 * @example Example usage
 */
export interface ValidationError extends ExtendedError {
  type: ErrorType.VALIDATION;
  details: {
    field: string;
    value: unknown;
    constraint: string;
    expected: unknown;
  };
}

/**
 * Resource error for asset loading failures
 * @example Example usage
 */
export interface ResourceError extends BaseError {
  type: ErrorType.RESOURCE;
  details: {
    url: string;
    resourceType: string;
    status?: number;
    statusText?: string;
  };
}

/**
 * Operation error for general failures
 * @example Example usage
 */
export interface OperationError extends BaseError {
  type: ErrorType.OPERATION;
  details: {
    operation: string;
    input?: unknown;
    context?: Record<string, unknown>;
  };
}

/**
 * Network error
 * @example
 * ```typescript
 * const networkError: NetworkError = {
 *   message: "Failed to fetch data",
 *   type: ErrorType.NETWORK,
 *   status: 404,
 *   url: "https://api.example.com/data",
 *   stack: new Error().stack,
 *   code: "API_FETCH_ERROR",
 *   timestamp: new Date().toISOString(),
 *   toErrorInfo: () => ({ ... })
 * };
 * ```
 */
export interface NetworkError extends ExtendedError {
  type: ErrorType.NETWORK;
  status?: number;
  url?: string;
}

/**
 * User input error
 * @example
 * ```typescript
 * const inputError: UserInputError = {
 *   message: "Invalid email format",
 *   type: ErrorType.USER_INPUT,
 *   fieldName: "email",
 *   inputValue: "invalid-email",
 *   code: "INVALID_EMAIL_FORMAT",
 *   timestamp: new Date().toISOString(),
 *   toErrorInfo: () => ({ ... })
 * };
 * ```
 */
export interface UserInputError extends ExtendedError {
  type: ErrorType.USER_INPUT;
  fieldName?: string;
  inputValue?: unknown;
}

/**
 * Configuration error
 * @example
 * ```typescript
 * const configError: ConfigurationError = {
 *   message: "Missing required configuration",
 *   type: ErrorType.CONFIGURATION,
 *   configKey: "apiKey",
 *   configValue: undefined,
 *   code: "MISSING_CONFIG",
 *   timestamp: new Date().toISOString(),
 *   toErrorInfo: () => ({ ... })
 * };
 * ```
 */
export interface ConfigurationError extends ExtendedError {
  type: ErrorType.CONFIGURATION;
  configKey?: string;
  configValue?: unknown;
}

/**
 * Asset loading error
 * @example
 * ```typescript
 * const assetError: AssetLoadingError = {
 *   message: "Failed to load image",
 *   type: ErrorType.ASSET_LOADING,
 *   assetId: "hero-image",
 *   assetType: "image",
 *   assetUrl: "/images/hero.webp",
 *   code: "IMAGE_LOAD_FAILURE",
 *   timestamp: new Date().toISOString(),
 *   toErrorInfo: () => ({ ... })
 * };
 * ```
 */
export interface AssetLoadingError extends ExtendedError {
  type: ErrorType.ASSET_LOADING;
  assetId?: string;
  assetType?: string;
  assetUrl?: string;
}

/**
 * Worker pool error for handling failures in web worker operations
 * @example
 * ```typescript
 * const workerError: WorkerPoolError = {
 *   message: "Worker task execution failed",
 *   type: ErrorType.WORKER_POOL,
 *   severity: ErrorSeverity.ERROR,
 *   workerId: "worker-1",
 *   error: "Task execution failed",
 *   timestamp: new Date().toISOString(),
 *   operation: "execute",
 *   category: "worker_error",
 *   stackTrace: new Error().stack,
 *   code: "WORKER_ERROR",
 *   details: {
 *     taskId: "task-123",
 *     errorTime: Date.now(),
 *     workerId: "worker-1"
 *   }
 * };
 * ```
 */
export interface WorkerPoolError extends ExtendedError {
  type: ErrorType.WORKER_POOL;
  workerId: string;
  error: string;
  timestamp: string;
  operation: string;
  category: string;
  stackTrace: string;
  severity: ErrorSeverity;
  code: string;
  details: {
    taskId?: string;
    errorTime: number;
    workerId: string;
  };
}

/**
 * Union type of all specific slider errors
 */
export type SliderErrorUnion = 
  | AnimationError 
  | GestureError 
  | NavigationError 
  | RenderError
  | ValidationError
  | ResourceError
  | OperationError
  | NetworkError
  | UserInputError
  | ConfigurationError
  | AssetLoadingError
  | WorkerPoolError;

/**
 * Error tracker context for error reporting
 * @example Example usage
 */
export interface ErrorTrackerContext {
  /** Component where the error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** Error severity level */
  severity: 'error' | 'warning' | 'info';
  /** Timestamp when error occurred */
  timestamp: number;
  /** Additional error data */
  data?: Record<string, unknown>;
}

/**
 * Error report structure for error tracking
 * @example Example usage
 */
export interface ErrorTrackerReport {
  /** The error that occurred */
  error: Error;
  /** Context about the error */
  context: ErrorTrackerContext;
  /** Stack trace if available */
  stackTrace?: string;
  /** User agent string */
  userAgent: string;
  /** URL where error occurred */
  url: string;
}

/**
 * Component error handling options
 * @example
 * ```typescript
 * const errorOptions: ErrorHandlingOptions = {
 *   retry: true,
 *   retryAttempts: 3,
 *   retryDelay: 1000,
 *   errorBoundary: {
 *     enabled: true,
 *     onError: (error) => {
 *       console.error("Component error:", error);
 *       trackError(error);
 *     },
 *     onRecovery: () => {
 *       console.log("Component recovered from error");
 *     }
 *   }
 * };
 * ```
 */
export interface ErrorHandlingOptions {
  /**
   * Whether to retry on error
   */
  retry?: boolean;
  
  /**
   * Number of retry attempts
   */
  retryAttempts?: number;
  
  /**
   * Delay between retries in ms
   */
  retryDelay?: number;
  
  /**
   * Error boundary options
   */
  errorBoundary?: {
    /**
     * Whether to use error boundary
     */
    enabled?: boolean;
    
    /**
     * Error callback
     */
    onError?: (error: ComponentError) => void;
    
    /**
     * Recovery callback
     */
    onRecovery?: () => void;
  };
}