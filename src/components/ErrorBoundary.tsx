import React, { Component, ErrorInfo } from 'react';
import type { SliderErrorInfo } from '../types';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: SliderErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: SliderErrorInfo | null;
}

/**
 * Error boundary component for handling slider-specific errors
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const errorInfo = {
      componentStack: info.componentStack,
      message: error.message,
      name: error.name,
      stack: error.stack
    } as SliderErrorInfo;

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert" className="error-boundary">
          <h2>Something went wrong.</h2>
          {this.state.error && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error.toString()}</pre>
              {this.state.errorInfo && (
                <pre>{this.state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
