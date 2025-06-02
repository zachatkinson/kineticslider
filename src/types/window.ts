/**
 * Window interface extensions and browser API type definitions
 *
 * @module Window
 * @version 1.0.0
 */

/**
 * Extended Window interface with additional properties for testing and development
 *
 * @example
 * ```ts
 * // Access test utilities
 * if (window.__TEST_UTILS__) {
 *   window.__TEST_UTILS__.resetMocks();
 * }
 * 
 * // Access debug utilities
 * if (window.__DEBUG__) {
 *   window.__DEBUG__.enableLogging();
 * }
 * ```
 */
declare global {
  interface Window {
    /** Test utilities for browser testing */
    __TEST_UTILS__?: {
      resetMocks: () => void;
      mockMatchMedia: (matches: boolean) => void;
      mockRequestAnimationFrame: () => void;
      mockIntersectionObserver: () => void;
      mockResizeObserver: () => void;
    };
    
    /** Debug utilities for development */
    __DEBUG__?: {
      enableLogging: () => void;
      disableLogging: () => void;
      getPerformanceMetrics: () => Record<string, unknown>;
      clearCache: () => void;
    };
    
    /** Performance monitoring utilities */
    __PERFORMANCE__?: {
      startMeasurement: (name: string) => void;
      endMeasurement: (name: string) => number;
      getMetrics: () => Record<string, number>;
    };
    
    /** Feature flag utilities */
    __FEATURE_FLAGS__?: {
      isEnabled: (flag: string) => boolean;
      enable: (flag: string) => void;
      disable: (flag: string) => void;
      getAll: () => Record<string, boolean>;
    };
    
    /** Error tracking utilities */
    __ERROR_TRACKING__?: {
      captureError: (error: Error, context?: Record<string, unknown>) => void;
      getErrorHistory: () => Array<{ error: Error; timestamp: number; context?: Record<string, unknown> }>;
      clearErrors: () => void;
    };
    
    /** E2E Test utilities */
    testUtils?: {
      getCurrentSlide: () => number;
      setSlide: (index: number) => void;
      getSlideCount: () => number;
    };
    
    /** Filter test utilities */
    filterTestUtils?: {
      isFilterActive: (type: string) => boolean;
      applyFilter: (type: string, intensity: number) => void;
      removeFilter: (type: string) => void;
      getActiveFilters: () => string[];
    };
    
    /** Gesture test utilities */
    gestureTestUtils?: {
      simulateSwipe: (direction: 'left' | 'right') => void;
      simulateTouch: (x: number, y: number) => void;
      getGestureState: () => Record<string, unknown>;
    };
    
    /** Resource test utilities */
    resourceTestUtils?: {
      getPerformanceMetrics: () => { fps: number; memoryUsage: number };
      getResourceUsage: () => Record<string, number>;
      clearCache: () => void;
    };
    
    /** Worker test utilities */
    workerTestUtils?: {
      getActiveWorkers: () => number;
      terminateAllWorkers: () => void;
      getWorkerStats: () => Record<string, number>;
    };
    
    /** Canvas test utilities */
    canvasTestUtils?: {
      getCanvasDimensions: () => { width: number; height: number };
      resizeCanvas: (width: number, height: number) => void;
      getCanvasContext: () => CanvasRenderingContext2D | null;
    };
    
    /** User journey test utilities */
    userJourneyTestUtils?: {
      startJourney: (journeyName: string) => void;
      completeStep: (stepName: string) => void;
      getJourneyProgress: () => Record<string, unknown>;
    };
    
    /** Error boundary test utilities */
    setErrorBoundaryRecovery?: (value: boolean) => void;
    shouldRecover?: boolean;
    
    /** Mock utilities for testing */
    __MOCK_NAV_ERROR__?: boolean;
    __MOCK_SLIDER_CONFIG__?: Record<string, unknown>;
    
    /** Worker registry for testing */
    __WORKER_REGISTRY__: Set<unknown>;
  }
}

export {}; 