import { useCallback, useRef, useMemo } from 'react';
import { 
  DEFAULT_GESTURE_CONFIG,
  isValidPointerEvent
} from '@/types/gestures';
import type { 
  UseGesturesOptions, 
  UseGesturesResult, 
  TouchPoint,
  GestureConfig,
  SwipeDirection
} from '@/types/gestures';
import { ErrorHandler, GestureError } from '../utils/errors';

interface GestureState {
  startPoint: TouchPoint;
  currentPoint: TouchPoint;
  lastPoint: TouchPoint;
  lastTime: number;
  velocity: number;
  pointerId?: number;
}

// Resource pool for gesture states to reduce GC pressure
class GestureStatePool {
  private pool: GestureState[] = [];
  private inUse = new Set<GestureState>();

  acquire(startPoint: TouchPoint): GestureState {
    const now = performance.now();
    let state = this.pool.pop() || {
      startPoint: { x: 0, y: 0 },
      currentPoint: { x: 0, y: 0 },
      lastPoint: { x: 0, y: 0 },
      lastTime: now,
      velocity: 0
    };
    
    state.startPoint = startPoint;
    state.currentPoint = { ...startPoint };
    state.lastPoint = { ...startPoint };
    state.lastTime = now;
    state.velocity = 0;
    
    this.inUse.add(state);
    return state;
  }

  release(state: GestureState): void {
    if (this.inUse.has(state)) {
      this.inUse.delete(state);
      this.pool.push(state);
    }
  }

  cleanup(): void {
    this.pool = [];
    this.inUse.clear();
  }
}

// Create a live region for announcements
const createLiveRegion = () => {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.style.position = 'absolute';
  region.style.width = '1px';
  region.style.height = '1px';
  region.style.padding = '0';
  region.style.overflow = 'hidden';
  region.style.clip = 'rect(0, 0, 0, 0)';
  region.style.whiteSpace = 'nowrap';
  region.style.border = '0';
  return region;
};

// Performance monitoring for gesture metrics
class GestureMetrics {
  private metrics: Map<string, number[]> = new Map();
  private readonly MAX_SAMPLES = 100;

  track(metric: string, value: number): void {
    const values = this.metrics.get(metric) || [];
    values.push(value);
    
    // Keep only the last MAX_SAMPLES values
    if (values.length > this.MAX_SAMPLES) {
      values.shift();
    }
    
    this.metrics.set(metric, values);
  }

  getMetrics(metric: string): {
    avg: number;
    p95: number;
    max: number;
  } | null {
    const values = this.metrics.get(metric);
    if (!values?.length) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      max: Math.max(...values)
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

/**
 * A hook that provides unified pointer gesture detection with velocity tracking.
 * Uses the modern Pointer Events API for better cross-device compatibility.
 * 
 * @param options - Configuration options for gesture detection
 * @returns An object containing the attach function for gesture detection
 * 
 * @example
 * ```tsx
 * const { attach } = useGestures({
 *   onSwipe: (direction, distance) => console.log(`Swiped ${direction} by ${distance}px`),
 *   onDrag: (distance) => console.log(`Dragged ${distance}px`),
 *   threshold: 50
 * });
 * ```
 */
export const useGestures = ({
  enabled = true,
  onSwipe,
  onDrag,
  threshold,
  config: userConfig,
  ariaLabel = 'Swipeable content',
  onError
}: UseGesturesOptions): UseGesturesResult => {
  const gestureState = useRef<GestureState | null>(null);
  const liveRegionRef = useRef<HTMLElement | null>(null);
  const statePoolRef = useRef<GestureStatePool | null>(null);
  const metricsRef = useRef<GestureMetrics | null>(null);
  const errorHandler = useRef<ErrorHandler>(new ErrorHandler(onError));
  
  // Initialize state pool if not exists
  if (!statePoolRef.current) {
    statePoolRef.current = new GestureStatePool();
  }

  // Initialize metrics if not exists
  if (!metricsRef.current) {
    metricsRef.current = new GestureMetrics();
  }

  // Merge default config with user config
  const config = useMemo<GestureConfig>(() => ({
    ...DEFAULT_GESTURE_CONFIG,
    ...(userConfig || {}),
    threshold: threshold || DEFAULT_GESTURE_CONFIG.threshold
  }), [threshold, userConfig]);

  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const handleError = useCallback((error: Error, action: string) => {
    errorHandler.current.handle(
      () => Promise.resolve(),
      {
        action,
        gestureState: gestureState.current,
        metrics: metricsRef.current
      }
    ).catch(() => {
      // Error already handled by errorHandler
    });
  }, []);

  const handleStart = useCallback((e: PointerEvent) => {
    try {
      if (!enabled) return;

      if (!isValidPointerEvent(e) || !statePoolRef.current) return;
      e.preventDefault();
      
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      
      const startPoint = {
        x: e.clientX,
        y: e.clientY
      };

      gestureState.current = statePoolRef.current.acquire(startPoint);
      gestureState.current.pointerId = e.pointerId;
    } catch (error) {
      handleError(
        new GestureError('Failed to handle gesture start', { event: e }),
        'gesture-start'
      );
    }
  }, [enabled, handleError]);

  const handleMove = useCallback((e: PointerEvent) => {
    try {
      if (!enabled || !gestureState.current) return;

      if (!isValidPointerEvent(e) || 
          e.pointerId !== gestureState.current.pointerId) return;
      e.preventDefault();

      const now = performance.now();
      const startTime = gestureState.current.lastTime || now;
      const frameTime = now - startTime;
      
      // Track frame time and velocity metrics
      if (metricsRef.current) {
        metricsRef.current.track('frameTime', frameTime);
        metricsRef.current.track('velocity', gestureState.current.velocity);
      }

      const deltaTime = Math.max(now - (gestureState.current.lastTime || now), 1); // Ensure non-zero deltaTime
      const currentPoint = {
        x: e.clientX,
        y: e.clientY
      };
      
      const deltaX = currentPoint.x - gestureState.current.lastPoint.x;
      
      // Update velocity (pixels per millisecond)
      gestureState.current.velocity = deltaX / deltaTime;
      gestureState.current.currentPoint = currentPoint;
      gestureState.current.lastPoint = currentPoint;
      gestureState.current.lastTime = now;

      const distance = currentPoint.x - gestureState.current.startPoint.x;
      
      // Update ARIA attributes during movement
      const target = e.target as HTMLElement;
      const normalizedValue = Math.round((distance / config.threshold) * 100);
      target.setAttribute('aria-valuenow', normalizedValue.toString());
      target.setAttribute('aria-valuetext', 
        `Moved ${Math.abs(normalizedValue)}% ${normalizedValue > 0 ? 'right' : 'left'}`
      );
      
      onDrag?.(distance);
    } catch (error) {
      handleError(
        new GestureError('Failed to handle gesture move', { event: e }),
        'gesture-move'
      );
    }
  }, [enabled, onDrag, config.threshold, handleError]);

  const handleEnd = useCallback((e: PointerEvent) => {
    try {
      if (!enabled || !gestureState.current) return;

      const target = e.target as HTMLElement;
      target.releasePointerCapture(e.pointerId);

      const { startPoint, currentPoint, velocity } = gestureState.current;
      const distanceX = currentPoint.x - startPoint.x;
      const distanceY = currentPoint.y - startPoint.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

      // Add momentum based on velocity if above minimum threshold
      const momentumDistance = Math.abs(velocity) >= config.minVelocity
        ? velocity * config.momentumMultiplier
        : 0;
      const totalDistance = distanceX + momentumDistance;

      // Track gesture completion metrics
      if (metricsRef.current) {
        metricsRef.current.track('gestureDistance', Math.abs(distanceX));
        metricsRef.current.track('finalVelocity', Math.abs(velocity));
      }

      if (isHorizontalSwipe && Math.abs(totalDistance) > config.threshold) {
        const direction: SwipeDirection = totalDistance > 0 ? 'right' : 'left';
        onSwipe?.(direction, Math.abs(totalDistance));
        
        // Update ARIA attributes after swipe
        target.setAttribute('aria-valuenow', '0');
        target.setAttribute('aria-valuetext', `Swiped ${direction}`);
      } else {
        // Reset ARIA attributes if no swipe
        target.setAttribute('aria-valuenow', '0');
        target.setAttribute('aria-valuetext', 'At starting position');
      }

      // Release the gesture state back to the pool
      statePoolRef.current.release(gestureState.current);
      gestureState.current = null;
    } catch (error) {
      handleError(
        new GestureError('Failed to handle gesture end', { event: e }),
        'gesture-end'
      );
    }
  }, [enabled, config, onSwipe, handleError]);

  const handleCancel = useCallback((e: Event) => {
    try {
      if (!enabled || !gestureState.current) return;

      if (!isValidPointerEvent(e) || gestureState.current?.pointerId !== e.pointerId) return;
      
      const target = e.target as HTMLElement;
      target.releasePointerCapture(e.pointerId);
      gestureState.current = null;
    } catch (error) {
      handleError(
        new GestureError('Failed to handle gesture cancel', { event: e }),
        'gesture-cancel'
      );
    }
  }, [enabled, handleError]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onSwipe?.('left', config.threshold);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSwipe?.('right', config.threshold);
        break;
    }
  }, [enabled, config.threshold, onSwipe]);

  const attach = useCallback((element: HTMLElement) => {
    try {
      if (!enabled) return () => {};

      // Create and append live region
      liveRegionRef.current = createLiveRegion();
      document.body.appendChild(liveRegionRef.current);

      const eventOptions: AddEventListenerOptions = {
        passive: false,
        capture: true
      };

      // Set ARIA attributes
      element.setAttribute('role', 'slider');
      element.setAttribute('aria-label', ariaLabel);
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-valuemin', '-100');
      element.setAttribute('aria-valuemax', '100');
      element.setAttribute('aria-valuenow', '0');
      element.setAttribute('aria-valuetext', 'At starting position');

      element.addEventListener('pointerdown', handleStart as EventListener, eventOptions);
      element.addEventListener('pointermove', handleMove as EventListener, eventOptions);
      element.addEventListener('pointerup', handleEnd as EventListener, eventOptions);
      element.addEventListener('pointercancel', handleCancel as EventListener, eventOptions);
      element.addEventListener('keydown', handleKeyDown as EventListener);
      
      element.style.touchAction = 'none';
      element.style.userSelect = 'none';

      return () => {
        try {
          element.removeEventListener('pointerdown', handleStart as EventListener, eventOptions);
          element.removeEventListener('pointermove', handleMove as EventListener, eventOptions);
          element.removeEventListener('pointerup', handleEnd as EventListener, eventOptions);
          element.removeEventListener('pointercancel', handleCancel as EventListener, eventOptions);
          element.removeEventListener('keydown', handleKeyDown as EventListener);
          
          // Remove ARIA attributes
          element.removeAttribute('role');
          element.removeAttribute('aria-label');
          element.removeAttribute('tabindex');
          element.removeAttribute('aria-valuemin');
          element.removeAttribute('aria-valuemax');
          element.removeAttribute('aria-valuenow');
          element.removeAttribute('aria-valuetext');
          
          element.style.touchAction = '';
          element.style.userSelect = '';
          
          if (gestureState.current?.pointerId) {
            try {
              element.releasePointerCapture(gestureState.current.pointerId);
            } catch (e) {
              // Ignore errors if pointer was already released
            }
          }

          // Remove live region
          if (liveRegionRef.current?.parentNode) {
            liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
          }
          liveRegionRef.current = null;

          // Clean up the state pool
          statePoolRef.current?.cleanup();
          statePoolRef.current = null;

          // Clean up metrics
          metricsRef.current?.clear();
          metricsRef.current = null;
        } catch (error) {
          handleError(
            new GestureError('Failed to cleanup gesture handlers', { element }),
            'cleanup'
          );
        }
      };
    } catch (error) {
      handleError(
        new GestureError('Failed to initialize gesture handlers', { element }),
        'initialization'
      );
      return () => {};
    }
  }, [enabled, handleStart, handleMove, handleEnd, handleCancel, handleKeyDown, ariaLabel, handleError]);

  // Expose metrics for debugging and monitoring
  const getMetrics = useCallback(() => {
    if (!metricsRef.current) return null;
    
    return {
      frameTime: metricsRef.current.getMetrics('frameTime'),
      velocity: metricsRef.current.getMetrics('velocity'),
      gestureDistance: metricsRef.current.getMetrics('gestureDistance'),
      finalVelocity: metricsRef.current.getMetrics('finalVelocity')
    };
  }, []);

  return { attach, getMetrics };
}; 