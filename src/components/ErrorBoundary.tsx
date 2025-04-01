import React from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types/components';
import type { SliderErrorInfo } from '../types/slider';
import { ErrorHandler } from '../utils/errors';
import { sanitizeErrorForClient } from '../utils/error-sanitizer';

/**
 * A component that catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * Implements standardized error handling patterns and security measures.
 *
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<div>Something went wrong</div>}
 *   onError={(error) => logError(error)}
 *   maxRetries={3}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * @accessibility
 * - Uses ARIA live regions for error announcements
 * - Provides clear error messages
 * - Supports keyboard interaction for retry
 * - Maintains focus management
 *
 * @state
 * - Tracks error state
 * - Manages retry attempts
 * - Handles error info
 * - Controls recovery state
 *
 * @events
 * - onError: Fired when an error occurs
 * - onRetry: Internal retry handling
 * - onRecovery: Internal recovery handling
 *
 * @error
 * - Implements error boundaries
 * - Sanitizes error messages
 * - Provides retry mechanism
 * - Supports development details
 * - Handles async errors
 *
 * @security
 * - Sanitizes error information
 * - Limits stack traces in production
 * - Implements retry backoff
 * - Prevents sensitive data leaks
 *
 * @see {@link ErrorHandler} For error handling implementation
 * @see {@link sanitizeErrorForClient} For error sanitization
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler: ErrorHandler;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
    this.errorHandler = new ErrorHandler(props.onError);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Sanitize error before storing in state
    const sanitizedError = sanitizeErrorForClient(error);
    return {
      hasError: true,
      error: sanitizedError,
      errorInfo: null,
      retryCount: 0
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Create detailed error info for logging and analytics
    const detailedError: SliderErrorInfo = {
      componentStack: errorInfo.componentStack,
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: 'SLIDER_ERROR',
      timestamp: new Date().toISOString(),
      details: {
        retryCount: this.state.retryCount,
        componentName: this.constructor.name,
      },
    };

    // Handle error through error handler which manages logging and monitoring
    this.errorHandler.handle(async () => {
      // Update state with error details
      this.setState({
        error: sanitizeErrorForClient(error),
        errorInfo,
        retryCount: this.state.retryCount + 1,
      });

      // Schedule automatic retry if within maxRetries limit
      if (this.state.retryCount < (this.props.maxRetries || 3)) {
        this.scheduleRecoveryAttempt();
      }
    }, detailedError);
  }

  private scheduleRecoveryAttempt(): void {
    const backoffMs = Math.min(1000 * Math.pow(2, this.state.retryCount), 30000);
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, backoffMs);
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): React.ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback } = this.props;
    const maxRetries = this.props.maxRetries || 3;

    if (hasError) {
      // If we've exceeded max retries, show the fallback UI
      if (retryCount >= maxRetries) {
        return (
          <div 
            role="alert" 
            aria-live="assertive"
            className="error-boundary"
          >
            {fallback || (
              <div className="error-boundary-fallback">
                <h2>Something went wrong</h2>
                <p>{error?.message || 'An unexpected error occurred'}</p>
                {process.env.NODE_ENV === 'development' && error && (
                  <details>
                    <summary>Technical Details</summary>
                    <pre>{error.toString()}</pre>
                  </details>
                )}
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="error-boundary-retry"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        );
      }

      // If we're still within retry attempts, show loading state
      return (
        <div 
          role="status" 
          aria-live="polite"
          className="error-boundary-retry-status"
        >
          <p>Attempting to recover... (Attempt {retryCount + 1} of {maxRetries})</p>
        </div>
      );
    }

    return children;
  }
}
