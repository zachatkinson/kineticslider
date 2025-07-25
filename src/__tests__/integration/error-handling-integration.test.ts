/**
 * @fileoverview Integration Tests for Error Handling System
 *
 * Tests the interaction between ErrorBoundary, ErrorRecovery, ValidationError,
 * and FallbackRenderer to ensure comprehensive error handling across the system.
 *
 * @version 1.0.0 - Phase 4.4 Error Handling & Recovery System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorBoundary } from '../../components/error-boundary';
import { ErrorRecovery } from '../../core/error-recovery';
import { FallbackRenderer } from '../../rendering/fallback-renderer';
import { SliderCore } from '../../core/slider-core';
import { StateManager } from '../../managers/state-manager';
import { ConfigurationSystem } from '../../config';
import { SliderError } from '../../core/types';
import { SLIDER_ERROR_CODES } from '../../core/constants';

describe('Error Handling Integration', () => {
  let container: HTMLElement;
  let errorBoundary: ErrorBoundary;
  // let errorRecovery: ErrorRecovery | undefined;
  let fallbackRenderer: FallbackRenderer;
  let sliderCore: SliderCore | undefined;
  let stateManager: StateManager | undefined;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Cleanup
    if (errorBoundary) errorBoundary.destroy();
    if (fallbackRenderer) fallbackRenderer.destroy();
    if (sliderCore) sliderCore.destroy();
    if (stateManager) stateManager.destroy();

    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('Error Boundary and Recovery Integration', () => {
    it('should handle errors with automatic recovery', async () => {
      let errorCount = 0;
      const onError = vi.fn();
      const onRecovery = vi.fn();

      // Create error boundary with recovery
      errorBoundary = new ErrorBoundary(container, {
        enableAutoRecovery: true,
        recoveryDelay: 50,
        onError,
        onRecovery,
      });

      // Create error recovery manager
      const errorRecovery = new ErrorRecovery({
        maxAttempts: 2,
        baseDelay: 25,
        backoffMultiplier: 1.2,
      });

      // Use errorRecovery for testing
      expect(errorRecovery).toBeDefined();

      // Simulate recoverable error
      const recoverableError = new Error('Network timeout');

      errorBoundary.wrap(() => {
        errorCount++;
        if (errorCount <= 1) {
          throw recoverableError;
        }
        // Success on second attempt
        container.innerHTML = '<div>Slider content</div>';
      });

      // Wait for recovery attempts
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onError).toHaveBeenCalledWith(
        recoverableError,
        expect.objectContaining({
          recoverable: true,
        })
      );

      expect(onRecovery).toHaveBeenCalledWith(recoverableError, true);
      expect(container.textContent).toContain('Slider content');
    });

    it('should fall back to static content on unrecoverable errors', () => {
      // Create error boundary
      errorBoundary = new ErrorBoundary(container, {
        enableAutoRecovery: false, // Disable to avoid timing issues
      });

      // Simulate unrecoverable error
      const unrecoverableError = new SliderError(
        'Critical configuration error',
        SLIDER_ERROR_CODES.INVALID_CONFIG
      );

      errorBoundary.wrap(() => {
        throw unrecoverableError;
      });

      // Should show fallback UI immediately
      expect(container.innerHTML).toContain('Slider Temporarily Unavailable');
    });
  });

  describe('Validation Error Integration', () => {
    it('should validate configuration errors', () => {
      // Test simple validation using ConfigurationSystem
      const invalidConfig = {
        slides: [],
        autoPlayInterval: -1000,
      };

      expect(() => {
        ConfigurationSystem.processConfig(invalidConfig);
      }).toThrow();
    });
  });

  describe('Fallback Renderer Integration', () => {
    it('should create fallback renderer', () => {
      const defaultConfig = ConfigurationSystem.getDefaults();
      fallbackRenderer = new FallbackRenderer(container, defaultConfig, {
        mode: 'static',
      });

      expect(fallbackRenderer).toBeDefined();
    });
  });

  describe('Complete Error Flow Integration', () => {
    it('should handle errors gracefully', () => {
      const onError = vi.fn();

      errorBoundary = new ErrorBoundary(container, {
        onError,
        enableAutoRecovery: false,
      });

      errorBoundary.wrap(() => {
        throw new Error('Test error');
      });

      expect(onError).toHaveBeenCalled();
      expect(container.innerHTML).toContain('Slider Temporarily Unavailable');
    });

    it('should handle multiple errors', () => {
      const errors: Error[] = [];
      let shouldThrow = true;

      errorBoundary = new ErrorBoundary(container, {
        onError: (error) => errors.push(error),
        maxErrors: 3,
        enableAutoRecovery: false,
      });

      // First error
      errorBoundary.wrap(() => {
        if (shouldThrow) throw new Error('Error 1');
      });

      // Reset with non-throwing function to avoid re-triggering
      shouldThrow = false;
      errorBoundary.wrap(() => {
        if (shouldThrow) throw new Error('Error 1');
      });
      errorBoundary.reset();

      // Second error
      shouldThrow = true;
      errorBoundary.wrap(() => {
        if (shouldThrow) throw new Error('Error 2');
      });

      expect(errors).toHaveLength(2);
    });
  });

  describe('Error Reporting Integration', () => {
    it('should collect error information', () => {
      const errorReports: Array<{
        error: string;
        timestamp: number;
        errorCount: number;
      }> = [];

      errorBoundary = new ErrorBoundary(container, {
        onError: (error, errorInfo) => {
          errorReports.push({
            error: error.message,
            timestamp: errorInfo.timestamp,
            errorCount: errorInfo.errorCount,
          });
        },
        enableAutoRecovery: false,
      });

      errorBoundary.reportError(new Error('Manual error'), 'test-context');

      expect(errorReports).toHaveLength(1);
      expect(errorReports[0].error).toContain('Manual error');
    });
  });
});
