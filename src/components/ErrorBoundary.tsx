import React, { Component, ErrorInfo, ReactNode } from 'react';

import { SliderEventType } from '../types/analytics';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../types/components';
import { AnalyticsManager } from '../utils/analytics';

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Custom error logging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Track error in analytics
    AnalyticsManager.getInstance().trackError(error, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Call onError prop if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      console.warn(`Maximum retry attempts (${maxRetries}) reached`);

      // Track max retries reached
      AnalyticsManager.getInstance().trackEvent({
        type: SliderEventType.ERROR_MAX_RETRIES,
        data: {
          error: this.state.error?.message,
          component: this.constructor.name,
          maxRetries,
        },
      });
    }
  };

  scheduleRecoveryAttempt(): void {
    // Auto-recovery attempt after 10 seconds
    setTimeout(this.handleRetry, 10000);
  }

  renderFallback(): ReactNode {
    const { fallback } = this.props;
    const { error } = this.state;

    if (!error) return null;

    if (typeof fallback === 'function') {
      return fallback(error, this.handleRetry);
    }

    if (fallback) {
      return fallback;
    }

    // Default fallback UI
    return (
      <div role="alert" aria-live="assertive" className="error-boundary">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={this.handleRetry}>Retry</button>
      </div>
    );
  }

  override render(): ReactNode {
    const { children } = this.props;
    const { hasError } = this.state;

    return hasError ? this.renderFallback() : children;
  }
}

// Function component wrapper for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
