import { gsap } from 'gsap';
import { useCallback, useEffect, useRef } from 'react';
import type {
  UseAnimationConfig,
  UseAnimationReturn,
  DragState,
  AnimationMetrics
} from '@/types/animation';
import { ErrorHandler, AnimationError } from '../utils/errors';

/**
 * A custom hook that manages GSAP animations for a slider component.
 * Handles slide transitions, drag interactions, and momentum-based animations.
 * 
 * @param config - Configuration options for the animation behavior
 * @returns An object containing animation controls and state
 * 
 * @example
 * ```tsx
 * const {
 *   isAnimating,
 *   animateToSlide,
 *   setupContainer,
 *   setupSlides,
 * } = useAnimation({
 *   duration: 0.8,
 *   ease: 'power3.out',
 *   infinite: true,
 *   onAnimationComplete: (index) => console.log(`Animated to slide ${index}`),
 * });
 * ```
 */
export const useAnimation = ({
  duration = 0.8,
  ease = 'power3.out',
  infinite = false,
  onAnimationStart,
  onAnimationComplete,
  onError
}: UseAnimationConfig): UseAnimationReturn => {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const isAnimatingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const slideCountRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);
  const metricsRef = useRef<AnimationMetrics>({
    duration: 0,
    fps: 0,
    droppedFrames: 0,
    memoryUsage: 0,
    scriptTime: 0,
    renderTime: 0
  });
  const errorHandler = useRef<ErrorHandler>(new ErrorHandler(onError));

  /**
   * Safely executes a function and handles any errors
   */
  const safeExecute = useCallback(<T extends unknown[]>(
    fn: (...args: T) => void,
    ...args: T
  ) => {
    try {
      fn(...args);
    } catch (error) {
      errorHandler.current.handle(
        () => Promise.resolve(),
        {
          function: fn.name,
          arguments: args,
          metrics: metricsRef.current
        }
      ).catch(() => {
        // Error already handled by errorHandler
      });
    }
  }, []);

  /**
   * Records performance metrics for the current animation
   */
  const recordMetrics = useCallback(() => {
    try {
      if (!performance || !performance.memory) return;

      const now = performance.now();
      const memory = performance.memory;

      metricsRef.current = {
        duration: now - metricsRef.current.duration,
        fps: 60 / (now - metricsRef.current.duration) * 1000,
        droppedFrames: Math.round(Math.max(0, (now - metricsRef.current.duration) / 16.67 - 1)),
        memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        scriptTime: performance.now() - now,
        renderTime: 0 // Will be set after RAF
      };

      requestAnimationFrame(() => {
        metricsRef.current.renderTime = performance.now() - now;
      });
    } catch (error) {
      errorHandler.current.handle(
        () => Promise.resolve(),
        {
          action: 'recordMetrics',
          metrics: metricsRef.current
        }
      ).catch(() => {
        // Error already handled by errorHandler
      });
    }
  }, []);

  const cleanupAnimations = useCallback(() => {
    try {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      if (containerRef.current) {
        gsap.killTweensOf(containerRef.current);
      }
    } catch (error) {
      errorHandler.current.handle(
        () => Promise.resolve(),
        {
          action: 'cleanupAnimations',
          metrics: metricsRef.current
        }
      ).catch(() => {
        // Error already handled by errorHandler
      });
    }
  }, []);

  const setupContainer = useCallback((container: HTMLElement) => {
    safeExecute(() => {
      containerRef.current = container;
      gsap.set(container, {
        force3D: true,
        transformPerspective: 1000,
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      });
    });
  }, [safeExecute]);

  const setupSlides = useCallback((slides: HTMLElement[]) => {
    safeExecute(() => {
      slideCountRef.current = slides.length;
      gsap.set(slides, {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: (i) => `${i * 100}%`,
        force3D: true,
        backfaceVisibility: 'hidden',
        perspective: 1000,
      });
    });
  }, [safeExecute]);

  const getPosition = useCallback((): number => {
    if (!containerRef.current) return 0;
    const transform = window.getComputedStyle(containerRef.current).transform;
    const matrix = new DOMMatrix(transform);
    return matrix.m41;
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || slideCountRef.current === 0) return;

    safeExecute(() => {
      cleanupAnimations();

      const containerWidth = containerRef.current!.offsetWidth;
      const slides = containerRef.current!.children;

      gsap.set(slides, {
        width: containerWidth,
        left: (i) => `${i * 100}%`,
        force3D: true,
        lazy: true,
      });

      // Update container position
      timelineRef.current = gsap.timeline({
        defaults: {
          duration,
          ease,
        },
        onComplete: () => {
          onAnimationComplete?.(currentIndexRef.current);
          cleanupAnimations();
          recordMetrics();
        },
      });

      if (containerRef.current) {
        timelineRef.current.to(containerRef.current, {
          x: -currentIndexRef.current * containerWidth,
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        });
      }
    });
  }, [duration, ease, cleanupAnimations, onAnimationComplete, safeExecute, recordMetrics]);

  const animateToSlide = useCallback(
    (targetIndex: number, speed: number = 1) => {
      if (!containerRef.current || isAnimatingRef.current) return;

      safeExecute(() => {
        let finalIndex = targetIndex;
        if (infinite) {
          if (targetIndex < 0) {
            finalIndex = slideCountRef.current - 1;
          } else if (targetIndex >= slideCountRef.current) {
            finalIndex = 0;
          }
        } else {
          finalIndex = Math.max(0, Math.min(targetIndex, slideCountRef.current - 1));
        }

        const container = containerRef.current!;
        const targetX = -finalIndex * container.offsetWidth;

        cleanupAnimations();

        isAnimatingRef.current = true;
        metricsRef.current.duration = performance.now();
        onAnimationStart?.();

        timelineRef.current = gsap.timeline({
          defaults: {
            duration: duration * speed,
            ease,
          },
          onComplete: () => {
            isAnimatingRef.current = false;
            currentIndexRef.current = finalIndex;
            onAnimationComplete?.(finalIndex);
            cleanupAnimations();
            recordMetrics();
          },
        });

        timelineRef.current.to(container, {
          x: targetX,
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        });
      });
    },
    [
      duration,
      ease,
      infinite,
      cleanupAnimations,
      onAnimationStart,
      onAnimationComplete,
      safeExecute,
      recordMetrics
    ]
  );

  const handleDragStart = useCallback((x: number) => {
    if (!containerRef.current || isAnimatingRef.current) return;
    
    safeExecute(() => {
      cleanupAnimations();
      
      dragStateRef.current = {
        startX: x,
        currentX: x,
        lastX: x,
        lastTime: performance.now(),
        velocity: 0
      };
    });
  }, [cleanupAnimations, safeExecute]);

  const handleDragMove = useCallback((x: number) => {
    if (!containerRef.current || !dragStateRef.current) return;

    safeExecute(() => {
      const now = performance.now();
      const deltaTime = now - dragStateRef.current!.lastTime;
      const deltaX = x - dragStateRef.current!.lastX;
      
      // Update velocity (pixels per millisecond)
      dragStateRef.current!.velocity = deltaX / deltaTime;
      
      // Update position using GSAP for smooth rendering
      const container = containerRef.current!;
      const currentPos = getPosition();
      const newPos = currentPos + deltaX;
      
      gsap.set(container, {
        x: newPos,
        force3D: true,
        lazy: true
      });

      // Update drag state
      dragStateRef.current!.lastX = x;
      dragStateRef.current!.lastTime = now;
      dragStateRef.current!.currentX = x;
    });
  }, [getPosition, safeExecute]);

  const handleDragEnd = useCallback(() => {
    if (!containerRef.current || !dragStateRef.current) return;

    safeExecute(() => {
      const velocity = dragStateRef.current!.velocity;
      const currentPos = getPosition();
      const containerWidth = containerRef.current!.offsetWidth;
      
      // Calculate target slide based on velocity and position
      const momentumDistance = velocity * 200; // Adjust multiplier for momentum feel
      const targetPos = currentPos + momentumDistance;
      const targetIndex = Math.round(-targetPos / containerWidth);
      
      // Ensure target is within bounds
      const finalIndex = infinite
        ? targetIndex
        : Math.max(0, Math.min(targetIndex, slideCountRef.current - 1));
      
      // Calculate animation duration based on velocity
      const speed = Math.min(Math.abs(velocity * 2), 1);
      
      animateToSlide(finalIndex, speed);
      dragStateRef.current = null;
    });
  }, [getPosition, infinite, animateToSlide, safeExecute]);

  const getVelocity = useCallback(() => {
    return dragStateRef.current?.velocity || 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      safeExecute(() => {
        cleanupAnimations();
        if (containerRef.current) {
          gsap.set(containerRef.current, { clearProps: 'all' });
          containerRef.current = null;
        }
      });
    };
  }, [cleanupAnimations, safeExecute]);

  return {
    isAnimating: isAnimatingRef.current,
    animateToSlide,
    setupContainer,
    setupSlides,
    cleanupAnimations,
    handleResize,
    getPosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    getVelocity
  };
}; 