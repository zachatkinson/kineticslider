import * as React from "react";
import { useCallback, useRef } from "react";
import { useSlider } from "../../context/SliderContext";
import { createBrandedNumber } from "../../utils/branded-helpers";
import type { SliderContextValue } from "../../types/slider";
import type { GestureStateRef } from "../../types/hooks";

/**
 *
 * @param _containerRef The reference to the container element
 *
 * @returns {unknown} The function return value
 *
 */
export function useGestureHandling(
  _containerRef: React.RefObject<HTMLDivElement>,
): unknown {
  const { state, config, actions } = useSlider() as SliderContextValue;
  const gestureState = useRef<GestureStateRef>({
    isTracking: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: Date.now(),
    isDragging: false,
  });

  const handleGestureStart = useCallback(
    (clientX: number, clientY: number) => {
      if (state.isAnimating) return;

      gestureState.current = {
        isTracking: true,
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        currentY: clientY,
        startTime: Date.now(),
        isDragging: true,
      };
    },
    [state.isAnimating],
  );

  const handleGestureMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!gestureState.current.isDragging) return;

      // Update current position
      gestureState.current.currentX = clientX;
      gestureState.current.currentY = clientY;

      const deltaX = clientX - gestureState.current.startX;
      const deltaY = clientY - gestureState.current.startY;

      // Apply resistance to the drag (default to 1 if not specified)
      const resistance = 1;
      const resistedDeltaX = createBrandedNumber(
        deltaX * resistance,
        "GestureDistance",
      );
      const resistedDeltaY = createBrandedNumber(
        deltaY * resistance,
        "GestureDistance",
      );

      // Update drag delta based on direction
      if (
        config.gestureDirection === "horizontal" ||
        config.gestureDirection === "both"
      ) {
        actions.updateDragDelta({
          x: resistedDeltaX,
          y: createBrandedNumber(0, "GestureDistance"),
        });
      }
      if (
        config.gestureDirection === "vertical" ||
        config.gestureDirection === "both"
      ) {
        actions.updateDragDelta({
          x: createBrandedNumber(0, "GestureDistance"),
          y: resistedDeltaY,
        });
      }
    },
    [config.gestureDirection, actions],
  );

  const handleGestureEnd = useCallback(() => {
    if (!gestureState.current.isDragging) return;

    const { startX, startY: _startY } = gestureState.current;
    const deltaX = state.dragDelta.x;
    const deltaY = state.dragDelta.y;
    const velocity = Math.abs(deltaX as number) / (Date.now() - startX);

    // Reset gesture state
    gestureState.current.isDragging = false;
    gestureState.current.isTracking = false;

    // Determine if the gesture should trigger a slide change
    const isHorizontalSwipe =
      Math.abs(deltaX as number) > Math.abs(deltaY as number);
    const threshold = config.gestureThreshold ?? 50;
    const velocityThreshold = 0.5;
    const meetsThreshold =
      Math.abs(deltaX as number) > threshold || velocity > velocityThreshold;

    if (isHorizontalSwipe && meetsThreshold) {
      if ((deltaX as number) > 0) {
        actions.previous();
      } else {
        actions.next();
      }
    }

    // Reset drag delta
    actions.updateDragDelta({
      x: createBrandedNumber(0, "GestureDistance"),
      y: createBrandedNumber(0, "GestureDistance"),
    });
  }, [state.dragDelta, config.gestureThreshold, actions]);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      handleGestureStart(touch.clientX, touch.clientY);
    },
    [handleGestureStart],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      handleGestureMove(touch.clientX, touch.clientY);
    },
    [handleGestureMove],
  );

  const handleTouchEnd = useCallback(() => {
    handleGestureEnd();
  }, [handleGestureEnd]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      handleGestureStart(event.clientX, event.clientY);
    },
    [handleGestureStart],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      handleGestureMove(event.clientX, event.clientY);
    },
    [handleGestureMove],
  );

  const handleMouseUp = useCallback(() => {
    handleGestureEnd();
  }, [handleGestureEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
