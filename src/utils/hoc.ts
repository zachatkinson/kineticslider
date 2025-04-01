import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { WithErrorBoundary } from '../types/hoc';

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 *
 * @param Component - The component to wrap
 * @param errorBoundaryProps - Props to pass to the ErrorBoundary
 * @returns A wrapped component with error boundary protection
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Parameters<WithErrorBoundary>[1]
): React.FC<P> {
  return (props) =>
    React.createElement(ErrorBoundary, {
      ...errorBoundaryProps,
      children: React.createElement(Component, props),
    });
}
