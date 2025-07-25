/**
 * @fileoverview Basic Error System Integration Test
 *
 * Simple test to verify error handling components work together.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorBoundary } from '../../components/error-boundary';

describe('Error System Basic Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should catch and handle basic errors', () => {
    const onError = vi.fn();
    const boundary = new ErrorBoundary(container, {
      onError,
      enableAutoRecovery: false,
    });

    boundary.wrap(() => {
      throw new Error('Test error');
    });

    expect(onError).toHaveBeenCalled();
    expect(container.innerHTML).toContain('Slider Temporarily Unavailable');

    boundary.destroy();
  });

  it('should reset error state', () => {
    const boundary = new ErrorBoundary(container, {
      enableAutoRecovery: false,
    });

    // Trigger error
    boundary.wrap(() => {
      throw new Error('Test error');
    });

    expect(boundary.getErrorState()).not.toBeNull();

    // Reset (the wrapped function will be called again, so we need to make it not throw)
    boundary.wrap(() => {
      // Don't throw on reset
    });

    boundary.reset();
    expect(boundary.getErrorState()).toBeNull();

    boundary.destroy();
  });
});
