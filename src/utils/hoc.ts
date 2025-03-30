import React from 'react';

import { ErrorBoundary } from '../components/ErrorBoundary';
import type { ErrorBoundaryProps } from '../types/components';

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 *
 * @param Component - The component to wrap
 * @param errorBoundaryProps - Props to pass to the ErrorBoundary
 * @returns A wrapped component with error boundary protection
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props: P) =>
    React.createElement(ErrorBoundary, {
      ...errorBoundaryProps,
      children: React.createElement(Component, props),
    });

  return WrappedComponent;
}
