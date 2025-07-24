/**
 * @fileoverview React-agnostic Error Boundary for KineticSlider
 *
 * Provides comprehensive error catching and recovery capabilities for slider components.
 * Can wrap any render function and provide graceful error handling with customizable fallbacks.
 *
 * @version 1.0.0 - Phase 4.4 Error Handling & Recovery
 */

import { SliderError } from '../core/types';
import { SLIDER_ERROR_CODES } from '../core/constants';

/**
 * Error information provided to error handlers
 */
export interface ErrorInfo {
  /** The original error that occurred */
  error: Error;
  /** Component stack or context where error occurred */
  componentStack?: string;
  /** Error boundary instance ID */
  boundaryId: string;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Number of times this error has occurred */
  errorCount: number;
  /** Whether this is a recoverable error */
  recoverable: boolean;
}

/**
 * Current error state of the boundary
 */
export interface ErrorState {
  /** Whether the boundary has caught an error */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Additional error information */
  errorInfo: ErrorInfo | null;
  /** Number of errors caught by this boundary */
  errorCount: number;
  /** Whether recovery has been attempted */
  recoveryAttempted: boolean;
}

/**
 * Configuration options for ErrorBoundary
 */
export interface ErrorBoundaryConfig {
  /** Maximum number of errors before disabling recovery */
  maxErrors?: number;
  /** Whether to attempt automatic recovery */
  enableAutoRecovery?: boolean;
  /** Delay before attempting recovery (ms) */
  recoveryDelay?: number;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom recovery handler */
  onRecovery?: (error: Error, successful: boolean) => void;
  /** Custom fallback UI generator */
  fallbackUI?: (error: Error, errorInfo: ErrorInfo) => HTMLElement;
  /** Whether to log errors to console */
  logErrors?: boolean;
}

/**
 * React-agnostic error boundary for catching and handling errors in slider components
 *
 * @example
 * ```typescript
 * const errorBoundary = new ErrorBoundary(container, {
 *   onError: (error, errorInfo) => {
 *     console.error('Slider error:', error);
 *     // Send to error reporting service
 *   },
 *   fallbackUI: (error) => {
 *     const div = document.createElement('div');
 *     div.textContent = 'Slider temporarily unavailable';
 *     return div;
 *   }
 * });
 *
 * errorBoundary.wrap(() => {
 *   // Render slider components
 *   initializeSlider();
 * });
 * ```
 */
export class ErrorBoundary {
  private container: HTMLElement;
  private config: Required<ErrorBoundaryConfig>;
  private state: ErrorState;
  private boundaryId: string;
  private originalContent: string = '';
  private wrappedFunction: (() => void) | null = null;
  private recoveryTimer: number | null = null;

  constructor(container: HTMLElement, config: ErrorBoundaryConfig = {}) {
    this.container = container;
    this.boundaryId = this.generateBoundaryId();

    // Set default configuration
    this.config = {
      maxErrors: 3,
      enableAutoRecovery: true,
      recoveryDelay: 2000,
      onError: this.defaultErrorHandler.bind(this),
      onRecovery: this.defaultRecoveryHandler.bind(this),
      fallbackUI: this.defaultFallbackUI.bind(this),
      logErrors: true,
      ...config,
    };

    // Initialize state
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      recoveryAttempted: false,
    };

    // Store original content for recovery
    this.originalContent = this.container.innerHTML;

    // Set up global error handlers for uncaught errors
    this.setupGlobalErrorHandlers();
  }

  /**
   * Wrap a function with error boundary protection
   *
   * @param renderFn - Function to execute with error protection
   */
  wrap(renderFn: () => void): void {
    this.wrappedFunction = renderFn;

    try {
      if (!this.state.hasError) {
        renderFn();
      }
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Reset the error boundary to allow re-rendering
   */
  reset(): void {
    // Clear any pending recovery
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }

    // Reset state
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: this.state.errorCount, // Keep error count for tracking
      recoveryAttempted: false,
    };

    // Restore original content
    this.container.innerHTML = this.originalContent;

    // Try to re-render if we have a wrapped function
    if (this.wrappedFunction) {
      this.wrap(this.wrappedFunction);
    }
  }

  /**
   * Get current error state
   */
  getErrorState(): ErrorState | null {
    return this.state.hasError ? { ...this.state } : null;
  }

  /**
   * Manually trigger error handling (for testing or manual error reporting)
   */
  reportError(error: Error, context?: string): void {
    const enhancedError = context
      ? new SliderError(
          `${context}: ${error.message}`,
          SLIDER_ERROR_CODES.MANUAL_ERROR_REPORT,
          { originalError: error }
        )
      : error;

    this.handleError(enhancedError);
  }

  /**
   * Clean up error boundary resources
   */
  destroy(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }

    // Remove global error handlers
    this.cleanupGlobalErrorHandlers();

    // Reset container to original state
    this.container.innerHTML = this.originalContent;
  }

  /**
   * Handle caught errors
   */
  private handleError(error: Error): void {
    this.state.errorCount++;
    this.state.hasError = true;
    this.state.error = error;

    // Create error info
    const errorInfo: ErrorInfo = {
      error,
      componentStack: this.generateComponentStack(),
      boundaryId: this.boundaryId,
      timestamp: Date.now(),
      errorCount: this.state.errorCount,
      recoverable: this.isRecoverable(error),
    };

    this.state.errorInfo = errorInfo;

    // Log error if enabled
    if (this.config.logErrors) {
      // eslint-disable-next-line no-console
      console.error(`[ErrorBoundary ${this.boundaryId}] Caught error:`, error);
      // eslint-disable-next-line no-console
      console.error('Error info:', errorInfo);
    }

    // Call custom error handler
    try {
      this.config.onError(error, errorInfo);
    } catch (handlerError) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Error in error handler:', handlerError);
    }

    // Render fallback UI
    this.renderFallbackUI(error, errorInfo);

    // Attempt recovery if enabled and conditions are met
    if (this.shouldAttemptRecovery(error, errorInfo)) {
      this.scheduleRecovery(error);
    }
  }

  /**
   * Determine if error is recoverable
   */
  private isRecoverable(error: Error): boolean {
    // SliderErrors with specific codes are generally recoverable
    if (error instanceof SliderError) {
      const unrecoverableCodes = [
        'SLIDER_DEPENDENCY_MISSING',
        'SLIDER_INVALID_CONFIG',
      ];
      return !unrecoverableCodes.includes(error.code);
    }

    // Network and temporary errors are usually recoverable
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /connection/i,
      /load.*failed/i,
    ];

    return recoverablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Determine if recovery should be attempted
   */
  private shouldAttemptRecovery(error: Error, errorInfo: ErrorInfo): boolean {
    return (
      this.config.enableAutoRecovery &&
      !this.state.recoveryAttempted &&
      this.state.errorCount <= this.config.maxErrors &&
      errorInfo.recoverable
    );
  }

  /**
   * Schedule automatic recovery
   */
  private scheduleRecovery(error: Error): void {
    this.recoveryTimer = window.setTimeout(() => {
      this.attemptRecovery(error);
    }, this.config.recoveryDelay);
  }

  /**
   * Attempt to recover from error
   */
  private attemptRecovery(error: Error): void {
    this.state.recoveryAttempted = true;
    let successful = false;

    try {
      // Clear error state temporarily
      this.state.hasError = false;
      this.state.error = null;

      // Try to re-render
      if (this.wrappedFunction) {
        this.wrappedFunction();
        successful = true;
      }
    } catch (recoveryError) {
      // Recovery failed, restore error state
      this.state.hasError = true;
      this.state.error = error;

      if (this.config.logErrors) {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] Recovery failed:', recoveryError);
      }
    }

    // Call recovery handler
    try {
      this.config.onRecovery(error, successful);
    } catch (handlerError) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Error in recovery handler:', handlerError);
    }

    // If recovery failed, show fallback UI again
    if (!successful && this.state.errorInfo) {
      this.renderFallbackUI(error, this.state.errorInfo);
    }
  }

  /**
   * Render fallback UI
   */
  private renderFallbackUI(error: Error, errorInfo: ErrorInfo): void {
    try {
      const fallbackElement = this.config.fallbackUI(error, errorInfo);
      this.container.innerHTML = '';
      this.container.appendChild(fallbackElement);
    } catch (fallbackError) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Error in fallback UI:', fallbackError);
      // Use basic fallback
      this.container.innerHTML = this.getBasicErrorHTML(error);
    }
  }

  /**
   * Default error handler
   */
  private defaultErrorHandler(error: Error, _errorInfo: ErrorInfo): void {
    // Default implementation just logs
    if (this.config.logErrors) {
      // eslint-disable-next-line no-console
      console.error('[KineticSlider] Error caught by boundary:', {
        error: error.message,
        stack: error.stack,
        errorInfo: _errorInfo,
      });
    }
  }

  /**
   * Default recovery handler
   */
  private defaultRecoveryHandler(error: Error, successful: boolean): void {
    if (this.config.logErrors) {
      // eslint-disable-next-line no-console
      console.log('[KineticSlider] Recovery attempt:', {
        error: error.message,
        successful,
        boundaryId: this.boundaryId,
      });
    }
  }

  /**
   * Default fallback UI generator
   */
  private defaultFallbackUI(error: Error, _errorInfo: ErrorInfo): HTMLElement {
    const container = document.createElement('div');
    container.className = 'kinetic-slider-error-fallback';
    container.style.cssText = `
      padding: 20px;
      text-align: center;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      color: #495057;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Slider Temporarily Unavailable';
    title.style.cssText =
      'margin: 0 0 10px 0; font-size: 18px; color: #343a40;';

    const message = document.createElement('p');
    message.textContent = this.getUserFriendlyErrorMessage(error);
    message.style.cssText = 'margin: 0 0 15px 0; font-size: 14px;';

    const retryButton = document.createElement('button');
    retryButton.textContent = 'Try Again';
    retryButton.style.cssText = `
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    retryButton.onclick = (): void => this.reset();

    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(retryButton);

    return container;
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyErrorMessage(error: Error): string {
    if (error instanceof SliderError) {
      switch (error.code) {
        case SLIDER_ERROR_CODES.NOT_INITIALIZED:
          return 'The slider is still loading. Please wait a moment.';
        case SLIDER_ERROR_CODES.INVALID_CONFIG:
          return 'There was a configuration issue. Please check your settings.';
        case SLIDER_ERROR_CODES.TRANSITION_IN_PROGRESS:
          return 'Please wait for the current transition to complete.';
        default:
          return 'A temporary issue occurred. Please try again.';
      }
    }

    // Generic error messages for common patterns
    if (/network|fetch|load/i.test(error.message)) {
      return 'Unable to load content. Please check your connection and try again.';
    }

    if (/timeout/i.test(error.message)) {
      return 'The request took too long. Please try again.';
    }

    return 'A temporary issue occurred. Please try again.';
  }

  /**
   * Get basic error HTML for when fallback UI fails
   */
  private getBasicErrorHTML(error: Error): string {
    return `
      <div style="padding: 20px; text-align: center; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        <strong>Error:</strong> ${this.getUserFriendlyErrorMessage(error)}
        <br><br>
        <button onclick="location.reload()" style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }

  /**
   * Generate unique boundary ID
   */
  private generateBoundaryId(): string {
    return `error-boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate component stack for debugging
   */
  private generateComponentStack(): string {
    const stack = new Error().stack || '';
    return stack
      .split('\n')
      .filter((line) => line.includes('kinetic') || line.includes('slider'))
      .join('\n');
  }

  /**
   * Set up global error handlers to catch unhandled errors
   */
  private setupGlobalErrorHandlers(): void {
    // Note: In a real implementation, you might want to make this more sophisticated
    // to avoid interfering with other error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener(
      'unhandledrejection',
      this.handleUnhandledRejection.bind(this)
    );
  }

  /**
   * Clean up global error handlers
   */
  private cleanupGlobalErrorHandlers(): void {
    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener(
      'unhandledrejection',
      this.handleUnhandledRejection.bind(this)
    );
  }

  /**
   * Handle global uncaught errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    // Only handle errors that seem related to our slider
    if (this.isSliderRelatedError(event.error || new Error(event.message))) {
      this.handleError(event.error || new Error(event.message));
      event.preventDefault(); // Prevent default browser error handling
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    if (this.isSliderRelatedError(error)) {
      this.handleError(error);
      event.preventDefault(); // Prevent default browser handling
    }
  }

  /**
   * Determine if an error is related to our slider
   */
  private isSliderRelatedError(error: Error): boolean {
    const sliderKeywords = [
      'kinetic',
      'slider',
      'pixi',
      'gsap',
      'texture',
      'animation',
    ];
    const errorString = (error.message + (error.stack || '')).toLowerCase();

    return (
      sliderKeywords.some((keyword) => errorString.includes(keyword)) ||
      error instanceof SliderError
    );
  }
}
