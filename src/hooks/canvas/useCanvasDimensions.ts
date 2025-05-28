/**
 * Canvas Dimensions Hook
 * 
 * Manages canvas dimensions with responsive behavior, aspect ratio management,
 * and performance optimization for PIXI.js applications
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  CanvasDimensions,
  CanvasConfig,
  PerformanceMetrics,
} from "../../types/pixi";
import {
  calculatePixiCanvasDimensions,
  hasPixiDimensionsChanged,
  getCurrentPixiBreakpoint,
} from "../../utils/pixi-canvas";

/**
 * Hook options for canvas dimensions management
 *
 * @example
 * ```typescript
 * const options: UseCanvasDimensionsOptions = {
 *   config: createPixiCanvasConfig(),
 *   containerRef: myContainerRef,
 *   onDimensionsChange: (dims) => console.log('New dimensions:', dims)
 * };
 * ```
 */
export interface UseCanvasDimensionsOptions {
  /** Canvas configuration */
  config: CanvasConfig;
  /** Container element reference */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Resize debounce delay in milliseconds */
  debounceDelay?: number;
  /** Performance monitoring callback */
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  /** Dimension change callback */
  onDimensionsChange?: (dimensions: CanvasDimensions) => void;
  /** Breakpoint change callback */
  onBreakpointChange?: (breakpoint: string) => void;
}

/**
 * Hook return type
 *
 * @example
 * ```typescript
 * const { dimensions, recalculate, updateConfig } = useCanvasDimensions(options);
 * console.log('Current size:', dimensions.width, 'x', dimensions.height);
 * ```
 */
export interface UseCanvasDimensionsReturn {
  /** Current canvas dimensions */
  dimensions: CanvasDimensions;
  /** Current breakpoint name (for responsive mode) */
  currentBreakpoint: string | null;
  /** Whether dimensions are being calculated */
  isCalculating: boolean;
  /** Force recalculation of dimensions */
  recalculate: () => void;
  /** Update canvas configuration */
  updateConfig: (newConfig: Partial<CanvasConfig>) => void;
}

/**
 * Custom hook for managing canvas dimensions
 * 
 * @param options - Configuration options for canvas dimensions management
 *
 * @returns Canvas dimensions management utilities
 *
 */
export function useCanvasDimensions(
  options: UseCanvasDimensionsOptions,
): UseCanvasDimensionsReturn {
  const {
    config,
    containerRef,
    debounceDelay = 100,
    onPerformanceUpdate,
    onDimensionsChange,
    onBreakpointChange,
  } = options;

  const [dimensions, setDimensions] = useState<CanvasDimensions>(config.dimensions);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CanvasConfig>(config);

  // Store refs to avoid dependency issues
  const callbacksRef = useRef({
    onPerformanceUpdate,
    onDimensionsChange,
    onBreakpointChange,
  });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);
  const configRef = useRef<CanvasConfig>(config);
  const containerRefStable = useRef(containerRef);

  // Update refs when values change (no useEffect needed)
  callbacksRef.current = {
    onPerformanceUpdate,
    onDimensionsChange,
    onBreakpointChange,
  };
  configRef.current = currentConfig;
  containerRefStable.current = containerRef;

  /**
   * Calculate dimensions - stable function using refs
   */
  const calculateDimensions = useCallback(() => {
    const startTime = performance.now();
    setIsCalculating(true);

    try {
      // Default to large container size to allow config dimensions to be used
      let containerWidth = 9999;
      let containerHeight = 9999;

      // Use container dimensions if available
      if (containerRefStable.current?.current) {
        try {
          const containerRect = containerRefStable.current.current.getBoundingClientRect();
          containerWidth = containerRect.width;
          containerHeight = containerRect.height;
        } catch (error) {
          // Fallback to config dimensions if getBoundingClientRect fails
          console.warn("Failed to get container dimensions:", error);
          containerWidth = configRef.current.dimensions.width;
          containerHeight = configRef.current.dimensions.height;
        }
      }

      // Calculate new dimensions
      const newDimensions = calculatePixiCanvasDimensions(
        configRef.current,
        containerWidth,
        containerHeight,
      );

      // Update dimensions - always call callback for config changes
      setDimensions(prevDimensions => {
        const hasChanged = hasPixiDimensionsChanged(prevDimensions, newDimensions);
        if (hasChanged) {
          callbacksRef.current.onDimensionsChange?.(newDimensions);
        }
        return newDimensions;
      });

      // Update breakpoint for responsive mode
      if (configRef.current.mode === "responsive" && configRef.current.breakpoints) {
        const newBreakpoint = getCurrentPixiBreakpoint(
          configRef.current.breakpoints,
          containerWidth,
        );
        
        setCurrentBreakpoint(prevBreakpoint => {
          if (prevBreakpoint !== newBreakpoint) {
            callbacksRef.current.onBreakpointChange?.(newBreakpoint);
          }
          return newBreakpoint;
        });
      }

      // Report performance metrics
      if (callbacksRef.current.onPerformanceUpdate) {
        const endTime = performance.now();
        const calculationTime = endTime - startTime;
        
        const metrics: PerformanceMetrics = {
          fps: 0,
          memoryMB: 0,
          renderTimeMS: calculationTime,
          drawCalls: 0,
          spriteCount: 0,
          timestamp: Date.now(),
        };
        callbacksRef.current.onPerformanceUpdate(metrics);
      }
    } catch (error) {
      console.error("Error calculating dimensions:", error);
    } finally {
      setIsCalculating(false);
    }
  }, []); // No dependencies - uses refs for all values

  /**
   * Debounced dimension calculation
   */
  const debouncedCalculate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      calculateDimensions();
    }, debounceDelay);
  }, [calculateDimensions, debounceDelay]);

  /**
   * Force recalculation of dimensions
   */
  const recalculate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    calculateDimensions();
  }, [calculateDimensions]);

  /**
   * Update canvas configuration
   */
  const updateConfig = useCallback((newConfig: Partial<CanvasConfig>) => {
    // Update the config synchronously first
    const updated = {
      ...configRef.current,
      ...newConfig,
      dimensions: newConfig.dimensions ? {
        ...configRef.current.dimensions,
        ...newConfig.dimensions,
      } : configRef.current.dimensions,
    };
    
    // Update the ref immediately
    configRef.current = updated;
    
    // Update the state
    setCurrentConfig(updated);
    
    // Trigger recalculation after config update
    setTimeout(() => {
      calculateDimensions();
    }, 0);
  }, [calculateDimensions]);

  /**
   * Update config when prop changes
   */
  useEffect(() => {
    setCurrentConfig(config);
    // Trigger recalculation when config prop changes
    calculateDimensions();
  }, [config, calculateDimensions]);

  /**
   * Set up resize observer and initial calculation
   */
  useEffect(() => {
    // Initial calculation
    calculateDimensions();

    // Set up resize observer only if containerRef is available
    if (containerRefStable.current?.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        debouncedCalculate();
      });

      resizeObserverRef.current.observe(containerRefStable.current.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [calculateDimensions, debouncedCalculate]); // Include dependencies

  /**
   * Set up window resize listener for fullscreen mode
   */
  useEffect(() => {
    if (currentConfig.mode !== "fullscreen") {
      return;
    }

    const handleWindowResize = (): void => {
      debouncedCalculate();
    };

    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("orientationchange", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("orientationchange", handleWindowResize);
    };
  }, [currentConfig.mode, debouncedCalculate]); // Include debouncedCalculate dependency

  return {
    dimensions,
    currentBreakpoint,
    isCalculating,
    recalculate,
    updateConfig,
  };
} 