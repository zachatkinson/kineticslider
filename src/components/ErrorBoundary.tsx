import React, { Component, ErrorInfo } from 'react';
import type { SliderErrorInfo } from '../types';
import { ErrorHandler, SliderError } from '../utils/errors';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: SliderErrorInfo) => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: SliderErrorInfo | null;
  recoveryAttempts: number;
}

const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_DELAY_MS = 1000;

/**
 * Enhanced error boundary component for handling slider-specific errors
 * with automatic recovery attempts and detailed error reporting
 */
export class ErrorBoundary extends Component<Props, State> {
  private errorHandler: ErrorHandler;
  private recoveryTimeout: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0
    };
    this.errorHandler = new ErrorHandler(props.onError);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      recoveryAttempts: 0
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const sliderError = error instanceof SliderError ? error : new SliderError(
      error.message,
      'COMPONENT_ERROR',
      { originalError: error }
    );

    const errorInfo = {
      componentStack: info.componentStack,
      message: sliderError.message,
      name: sliderError.name,
      stack: sliderError.stack,
      code: sliderError.code,
      timestamp: sliderError.timestamp,
      details: sliderError.details
    } as SliderErrorInfo;

    this.setState({ errorInfo });
    this.errorHandler.handle(
      () => Promise.resolve(),
      {
        componentStack: info.componentStack,
        recoveryAttempts: this.state.recoveryAttempts
      }
    ).catch(() => {
      // Error already handled by errorHandler
    });

    // Attempt recovery if we haven't exceeded max attempts
    if (this.state.recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
      this.scheduleRecovery();
    }
  }

  private scheduleRecovery = (): void => {
    if (this.recoveryTimeout !== null) {
      window.clearTimeout(this.recoveryTimeout);
    }

    this.recoveryTimeout = window.setTimeout(() => {
      this.setState(state => ({
        hasError: false,
        recoveryAttempts: state.recoveryAttempts + 1
      }));
    }, RECOVERY_DELAY_MS * Math.pow(2, this.state.recoveryAttempts));
  };

  override componentWillUnmount(): void {
    if (this.recoveryTimeout !== null) {
      window.clearTimeout(this.recoveryTimeout);
    }
  }

  override render(): React.ReactNode {
    const { hasError, error, errorInfo, recoveryAttempts } = this.state;
    const { fallback, children, className = '' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div 
          role="alert" 
          className={`error-boundary ${className}`.trim()}
          aria-live="polite"
        >
          <h2>Something went wrong</h2>
          {error && (
            <details>
              <summary>Error Details</summary>
              <pre>{error.toString()}</pre>
              {errorInfo && (
                <>
                  <p>Error Code: {errorInfo.code}</p>
                  <p>Timestamp: {errorInfo.timestamp}</p>
                  <pre>{errorInfo.componentStack}</pre>
                </>
              )}
              {recoveryAttempts > 0 && (
                <p>Recovery attempts: {recoveryAttempts}/{MAX_RECOVERY_ATTEMPTS}</p>
              )}
            </details>
          )}
          {recoveryAttempts < MAX_RECOVERY_ATTEMPTS && (
            <p>Attempting to recover...</p>
          )}
        </div>
      );
    }

    return children;
  }
}
