import { useState, useEffect, useRef, RefObject, useCallback } from "react";
import { debounce } from "../utils/performance";
import type { UseContainerResizeOptions, UseContainerResizeReturn } from "../types/hooks";

/**
 * Custom hook for handling container resize events with debouncing
 *
 * @param containerRef - Reference to the container element to monitor
 *
 * @param options - Configuration options for resize behavior
 *
 * @returns Object containing current dimensions and utilities
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { containerWidth, containerHeight, recalculateSize } = useContainerResize(containerRef, {
 *   debounceDelay: 200,
 *   trackWidth: true,
 *   trackHeight: false,
 *   initialWidth: "100%"
 * });
 * 
 * return (
 *   <div 
 *     ref={containerRef}
 *     style={{ width: containerWidth, height: containerHeight }}
 *   >
 *     {content}
 *   </div>
 * );
 * ```
 */
export function useContainerResize(
  containerRef: RefObject<HTMLElement>,
  options: UseContainerResizeOptions = {}
): UseContainerResizeReturn {
  const {
    debounceDelay = 200,
    trackWidth = true,
    trackHeight = false,
    initialWidth = "100%",
    initialHeight = "auto",
  } = options;

  const [containerWidth, setContainerWidth] = useState(initialWidth);
  const [containerHeight, setContainerHeight] = useState(initialHeight);

  // Store the debounced function in a ref to maintain reference stability
  const debouncedResizeRef = useRef<(() => void) | null>(null);

  const recalculateSize = useCallback((): void => {
    if (containerRef.current?.parentElement) {
      if (trackWidth) {
        const width = containerRef.current.parentElement.offsetWidth;
        setContainerWidth(`${width}px`);
      }
      if (trackHeight) {
        const height = containerRef.current.parentElement.offsetHeight;
        setContainerHeight(`${height}px`);
      }
    }
  }, [containerRef, trackWidth, trackHeight]);

  useEffect(() => {
    // Create debounced resize handler
    debouncedResizeRef.current = debounce(recalculateSize, debounceDelay);

    // Initial calculation
    debouncedResizeRef.current();

    // Add event listener
    window.addEventListener("resize", debouncedResizeRef.current);

    return () => {
      if (debouncedResizeRef.current) {
        window.removeEventListener("resize", debouncedResizeRef.current);
      }
    };
  }, [debounceDelay, recalculateSize]);

  return {
    containerWidth,
    containerHeight,
    recalculateSize,
  };
} 