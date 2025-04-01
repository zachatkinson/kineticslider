import React from 'react';
import { useCallback, useRef } from 'react';
import { useSlider } from '../../context/SliderContext';
import { GestureState, GestureDistance } from '../../types/slider';

export function useGestureHandling(containerRef: React.RefObject<HTMLDivElement>) {
  const { state, config, actions } = useSlider();
  const gestureState = useRef<GestureState>({
    startX: 0,
    startY: 0,
    isDragging: false,
  });

  const handleGestureStart = useCallback((clientX: number, clientY: number) => {
    if (state.isAnimating) return;

    gestureState.current = {
      startX: clientX,
      startY: clientY,
      isDragging: true,
    };
  }, [state.isAnimating]);

  const handleGestureMove = useCallback((clientX: number, clientY: number) => {
    if (!gestureState.current.isDragging) return;

    const deltaX = clientX - gestureState.current.startX;
    const deltaY = clientY - gestureState.current.startY;

    // Apply resistance to the drag
    const resistance = config.gesture?.resistance ?? 1;
    const resistedDeltaX = (deltaX * resistance) as GestureDistance;
    const resistedDeltaY = (deltaY * resistance) as GestureDistance;

    // Update drag delta based on direction
    if (config.direction === 'horizontal' || config.direction === 'both') {
      actions.updateDragDelta({ x: resistedDeltaX, y: 0 as GestureDistance });
    }
    if (config.direction === 'vertical' || config.direction === 'both') {
      actions.updateDragDelta({ x: 0 as GestureDistance, y: resistedDeltaY });
    }
  }, [config.direction, config.gesture?.resistance, actions]);

  const handleGestureEnd = useCallback(() => {
    if (!gestureState.current.isDragging) return;

    const { startX, startY } = gestureState.current;
    const deltaX = state.dragDelta.x;
    const deltaY = state.dragDelta.y;
    const velocity = Math.abs(deltaX) / (Date.now() - startX);

    // Reset gesture state
    gestureState.current.isDragging = false;

    // Determine if the gesture should trigger a slide change
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const threshold = config.gesture?.threshold ?? 50;
    const velocityThreshold = config.gesture?.velocity ?? 0.5;
    const meetsThreshold = Math.abs(deltaX) > threshold || velocity > velocityThreshold;

    if (isHorizontalSwipe && meetsThreshold) {
      if (deltaX > 0) {
        actions.previous();
      } else {
        actions.next();
      }
    }

    // Reset drag delta
    actions.updateDragDelta({ x: 0 as GestureDistance, y: 0 as GestureDistance });
  }, [state.dragDelta, config.gesture?.threshold, config.gesture?.velocity, actions]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    handleGestureStart(touch.clientX, touch.clientY);
  }, [handleGestureStart]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    handleGestureMove(touch.clientX, touch.clientY);
  }, [handleGestureMove]);

  const handleTouchEnd = useCallback(() => {
    handleGestureEnd();
  }, [handleGestureEnd]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    handleGestureStart(event.clientX, event.clientY);
  }, [handleGestureStart]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    handleGestureMove(event.clientX, event.clientY);
  }, [handleGestureMove]);

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