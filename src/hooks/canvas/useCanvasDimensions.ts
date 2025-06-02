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
import type {
  UseCanvasDimensionsOptions,
  UseCanvasDimensionsReturn,
} from "../../types/hooks";
import {
  calculatePixiCanvasDimensions,
  hasPixiDimensionsChanged,
  getCurrentPixiBreakpoint,
} from "../../utils/pixi-canvas";

/**
 * Hook for managing responsive canvas dimensions with performance optimization
 * 
 * @param options - Configuration options for canvas dimension management
 * 
 * @returns Canvas dimensions management interface
 * 
 * @example
 * ```tsx
 * const { dimensions, isCalculating, recalculate } = useCanvasDimensions({
 *   config: canvasConfig,
 *   containerRef: myContainerRef
 * });
 * ```
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

  // State
  const [dimensions, setDimensions] = useState<CanvasDimensions>(() =>
    calculatePixiCanvasDimensions(config, 800, 600)
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Refs for stable references
  const configRef = useRef(config);
  const containerRefStable = useRef(containerRef);
  const callbacksRef = useRef({ onDimensionsChange, onBreakpointChange, onPerformanceUpdate });

  // Update refs when props change
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    containerRefStable.current = containerRef;
  }, [containerRef]);

  useEffect(() => {
    callbacksRef.current = { onDimensionsChange, onBreakpointChange, onPerformanceUpdate };
  }, [onDimensionsChange, onBreakpointChange, onPerformanceUpdate]);

  /**
   * Calculate dimensions - stable function using refs
   */
  const calculateDimensions = useCallback(() => {
    const startTime = performance.now();
    setIsCalculating(true);

    try {
      // Default to config dimensions
      let containerWidth = configRef.current.dimensions.width;
      let containerHeight = configRef.current.dimensions.height;

      // Use container dimensions if available and valid
      if (containerRefStable.current?.current) {
        try {
          const containerRect = containerRefStable.current.current.getBoundingClientRect();
          // Only use container dimensions if they are valid (> 0)
          if (containerRect.width > 0 && containerRect.height > 0) {
            containerWidth = containerRect.width;
            containerHeight = containerRect.height;
          }
        } catch (error) {
          // Fallback to config dimensions if getBoundingClientRect fails
          console.warn("Failed to get container dimensions:", error);
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

      // Performance tracking
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      const metrics: PerformanceMetrics = {
        fps: 60, // Placeholder
        memoryMB: 0,
        renderTimeMS: calculationTime,
        drawCalls: 0,
        spriteCount: 0,
        timestamp: Date.now()
      };

      setPerformanceMetrics(metrics);
      callbacksRef.current.onPerformanceUpdate?.(metrics);

    } catch (error) {
      console.error("Error calculating canvas dimensions:", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Debounced resize handler
  const _debouncedCalculate = useCallback(() => {
    const timeoutId = setTimeout(calculateDimensions, debounceDelay);
    return () => clearTimeout(timeoutId);
  }, [calculateDimensions, debounceDelay]);

  // Initial calculation and resize listener
  useEffect(() => {
    calculateDimensions();
  }, [calculateDimensions]);

  // Recalculate when config changes - but avoid infinite loops
  useEffect(() => {
    // Only recalculate if config actually changed
    const timeoutId = setTimeout(() => {
      calculateDimensions();
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [calculateDimensions, config.mode, config.dimensions.width, config.dimensions.height, config.aspectRatio]);

  const recalculate = useCallback(() => {
    calculateDimensions();
  }, [calculateDimensions]);

  const updateConfig = useCallback((newConfig: CanvasConfig) => {
    configRef.current = newConfig;
    calculateDimensions();
  }, [calculateDimensions]);

  return {
    dimensions,
    isCalculating,
    currentBreakpoint,
    performanceMetrics,
    recalculate,
    updateConfig,
  };
} 