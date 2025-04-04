/* eslint-env vitest */
import _React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { usePerformance } from '../../hooks/usePerformance';
import * as performanceUtils from '../../utils/performance';
import type { PerformanceMetrics as _PerformanceMetrics } from '../../types/performance';

/**
 * Tests for the usePerformance hook
 * 
 * Testing strategy:
 * 1. Mock the performance.now API to control timestamp values
 * 2. Spy on utility functions to verify they're called correctly
 * 3. Test: initialization, options: handling, and metric tracking
 * 4. Test callback behavior and state updates
 */

// Mock the performance API to control timing
const mockPerformanceNow = vi.fn();
global.performance.now = mockPerformanceNow;

describe('usePerformance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    
    // Spy on performance utility functions
    vi.spyOn(performanceUtils, 'createPerformanceMonitor').mockReturnValue(() => { return; });
    vi.spyOn(performanceUtils, 'trackRenderTime').mockReturnValue(10);
    vi.spyOn(performanceUtils, '_createPerformanceComponentId').mockReturnValue('test-component-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePerformance());
    
    // Verify initial metrics state
    expect(result.current.metrics.fps).toBeNull();
    expect(result.current.metrics.memoryUsage).toBe(0);
    expect(result.current.metrics.renderTime).toEqual([]);
    expect(result.current.metrics.interactionTime).toEqual([]);
    
    // Verify that hook returns expected functions
    expect(result.current.trackRender).toBeInstanceOf(Function);
    expect(result.current.trackInteraction).toBeInstanceOf(Function);
  });

  it('should call createPerformanceMonitor with correct options', () => {
    // Test with custom options
    const options = {
      debug: true,
      logToConsole: true,
      trackMemory: true,
      includeWebVitals: true,
      updateInterval: 2000,
      onMetricsUpdate: vi.fn()
    };
    
    renderHook(() => usePerformance(options));
    
    // Verify options are passed correctly to the monitoring utility
    expect(performanceUtils.createPerformanceMonitor).toHaveBeenCalledWith({
      onMetricsUpdate: expect.any(Function),
      trackMemory: true,
      includeWebVitals: true,
      updateInterval: 2000,
      debug: true,
      logToConsole: true
    });
  });

  it('should call trackRenderTime when trackRender is called', () => {
    // Set a specific timestamp for consistent testing
    mockPerformanceNow.mockReturnValue(100);
    
    const { result } = renderHook(() => usePerformance());
    
    // Call trackRender
    result.current.trackRender('test-render');
    
    // Verify trackRenderTime was called with correct arguments
    expect(performanceUtils.trackRenderTime).toHaveBeenCalledWith(
      100,
      'test-component-id',
      'test-render',
      false
    );
  });
  
  it('should call the original function when using trackInteraction', () => {
    // Simulate timing for interaction measurement
    mockPerformanceNow
      .mockReturnValueOnce(0)   // Initial call
      .mockReturnValueOnce(100) // Start of interaction
      .mockReturnValueOnce(150); // End of interaction
    
    const { result } = renderHook(() => usePerformance());
    
    // Create a mock function to track
    const mockFn = vi.fn();
    const trackedFn = result.current.trackInteraction(mockFn);
    
    // Execute the tracked function
    trackedFn();
    
    // Verify original function was called
    expect(mockFn).toHaveBeenCalled();
  });
  
  it('should provide onMetricsUpdate callback to performance monitor', () => {
    // Create a spy to capture the callback
    const createMonitorSpy = vi.spyOn(performanceUtils, 'createPerformanceMonitor');
    
    // Render the hook
    renderHook(() => usePerformance());
    
    // Verify createPerformanceMonitor was called with an onMetricsUpdate callback
    expect(createMonitorSpy).toHaveBeenCalled();
    const callArgs = createMonitorSpy.mock.calls[0][0];
    expect(callArgs).toHaveProperty('onMetricsUpdate');
    expect(typeof callArgs.onMetricsUpdate).toBe('function');
  });
});
