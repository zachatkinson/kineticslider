import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import React from 'react';

import { ErrorBoundary } from '../../components/ErrorBoundary';
import { withErrorBoundary } from '../../utils/hoc';

// Track these mocks outside the mock definition so we can access them
const trackEventMock = vi.fn();
const trackErrorMock = vi.fn();

// Mock AnalyticsManager
vi.mock('../../utils/analytics', () => {
  return {
    AnalyticsManager: {
      getInstance: () => ({
        trackEvent: trackEventMock,
        trackError: trackErrorMock,
      }),
    },
    SliderEventType: {
      ERROR_MAX_RETRIES: 'ERROR_MAX_RETRIES',
    },
  };
});

// Component that throws an error when mounted
const ErrorThrowingComponent = ({
  shouldThrow = true,
}: {
  shouldThrow?: boolean;
}): JSX.Element => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error thrown</div>;
};

// We don't need the ErrorOnClickComponent for the tests
// so it's been removed

describe('ErrorBoundary Component', () => {
  // Silence console errors during tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('renders default fallback when an error is thrown', () => {
    // Using act to suppress error about component errors not being caught in error boundary
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // We need to suppress the error React throws as it's expected
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Reset console.error
    console.error = originalConsoleError;

    // Verify fallback is rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('calls onError prop when an error is thrown', () => {
    const onErrorMock = vi.fn();
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify onError was called
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onErrorMock.mock.calls[0][0].message).toBe('Test error');
    expect(onErrorMock.mock.calls[0][1]).toHaveProperty('componentStack');
  });

  test('tracks error in analytics when an error is thrown', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify analytics tracking
    expect(trackErrorMock).toHaveBeenCalledTimes(1);
    expect(trackErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(trackErrorMock.mock.calls[0][0].message).toBe('Test error');
    expect(trackErrorMock.mock.calls[0][1]).toHaveProperty('componentStack');
  });

  test('renders custom fallback component when provided', () => {
    const CustomFallback = (): JSX.Element => (
      <div data-testid="custom-fallback">Custom fallback</div>
    );
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify custom fallback is rendered
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  test('renders custom fallback function when provided', () => {
    const fallbackFn = (error: Error, retry: () => void): JSX.Element => (
      <div>
        <h2 data-testid="custom-error">Custom Error: {error.message}</h2>
        <button data-testid="custom-retry" onClick={retry}>
          Custom Retry
        </button>
      </div>
    );

    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify custom fallback function is rendered with the correct props
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    expect(screen.getByTestId('custom-retry')).toBeInTheDocument();
  });

  test('retries rendering on retry button click', async () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Create a simple recoverable component
    let shouldRecover = false;

    const RecoverableComponent = (): JSX.Element => {
      if (!shouldRecover) {
        throw new Error('Test error that should recover');
      }
      return <div data-testid="recovered">Component has recovered</div>;
    };

    render(
      <ErrorBoundary>
        <RecoverableComponent />
      </ErrorBoundary>
    );

    // Error should be caught and fallback rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Set recovery flag
    shouldRecover = true;

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });

    // Click the retry button
    fireEvent.click(retryButton);

    // Component should now be recovered
    expect(screen.getByTestId('recovered')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  test('withErrorBoundary HOC wraps component with error boundary', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent, {
      fallback: <div data-testid="hoc-fallback">HOC Fallback</div>,
    });

    render(<WrappedComponent />);

    // Verify HOC fallback is rendered
    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  test('withErrorBoundary HOC passes props to wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent, {
      fallback: <div>Fallback</div>,
    });

    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(<WrappedComponent shouldThrow={false} />);

    // Component should render without error
    expect(screen.getByText('No error thrown')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  test('component has scheduleRecoveryAttempt method', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Check if the method exists on the prototype
    expect(typeof ErrorBoundary.prototype.scheduleRecoveryAttempt).toBe(
      'function'
    );

    // Mock setTimeout to verify it would be called
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    // Create a spy for the prototype method
    const scheduleRecoverySpy = vi.spyOn(
      ErrorBoundary.prototype,
      'scheduleRecoveryAttempt'
    );

    // Render component to ensure the spy is attached
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Check that the method exists
    expect(typeof scheduleRecoverySpy).toBe('function');

    // Create a fake context to test the method directly
    const handleRetryMock = vi.fn();
    const fakeContext = {
      handleRetry: handleRetryMock,
    };

    // Call the method with the fake context
    ErrorBoundary.prototype.scheduleRecoveryAttempt.call(fakeContext);

    // Verify setTimeout was called with expected args
    expect(setTimeoutSpy).toHaveBeenCalledWith(handleRetryMock, 10000);

    // Clean up
    setTimeoutSpy.mockRestore();
    scheduleRecoverySpy.mockRestore();
    console.error = originalConsoleError;
  });
});
