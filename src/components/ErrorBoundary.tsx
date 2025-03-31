import React from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types/components';
import type { SliderErrorInfo } from '../types/slider';

/**
 * A component that catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1,
    });

    // Create detailed error info for logging and analytics
    const detailedError: SliderErrorInfo = {
      componentStack: errorInfo.componentStack,
      message: error.message,
      name: error.name,
      stack: error.stack || null,
      code: 'SLIDER_ERROR',
      timestamp: new Date().toISOString(),
      details: {
        retryCount: this.state.retryCount,
        componentName: this.constructor.name,
      },
    };

    // Log error to console in development
    if (process.env['NODE_ENV'] === 'development') {
      console.error('Error caught by ErrorBoundary:', detailedError);
    }

    // Call onError prop if provided
    this.props.onError?.(error, errorInfo);

    // Schedule automatic retry if within maxRetries limit
    if (this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRecoveryAttempt();
    }
  }

  private scheduleRecoveryAttempt(): void {
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, Math.min(1000 * Math.pow(2, this.state.retryCount), 30000)); // Exponential backoff with 30s max
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
          <div role="alert" aria-live="assertive">
            {fallback || (
              <div className="error-boundary-fallback">
                <h2>Something went wrong</h2>
                <p>{error?.message || 'An unexpected error occurred'}</p>
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
        <div role="status" aria-live="polite">
          <p>Attempting to recover... (Attempt {retryCount + 1} of {maxRetries})</p>
        </div>
      );
    }

    return children;
  }
}
