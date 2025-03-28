import { gsap } from 'gsap';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Configuration options for the useAnimation hook
 */
interface UseAnimationConfig {
  /** Duration of the animation in seconds. Defaults to 0.8 */
  duration?: number;
  /** GSAP easing function to use. Defaults to 'power3.out' */
  ease?: string;
  /** Whether to enable infinite looping. Defaults to false */
  infinite?: boolean;
  /** Callback fired when animation starts */
  onAnimationStart?: () => void;
  /** Callback fired when animation completes with the new index */
  onAnimationComplete?: (index: number) => void;
}

/**
 * Return type for the useAnimation hook containing all animation controls
 */
interface UseAnimationReturn {
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Animate to a specific slide index with optional speed multiplier */
  animateToSlide: (targetIndex: number, speed?: number) => void;
  /** Initialize the container element with GSAP settings */
  setupContainer: (container: HTMLElement) => void;
  /** Initialize the slides with GSAP settings */
  setupSlides: (slides: HTMLElement[]) => void;
  /** Clean up any ongoing animations */
  cleanupAnimations: () => void;
  /** Handle resize events and update positions */
  handleResize: () => void;
  /** Get the current position of the container */
  getPosition: () => number;
  /** Start drag interaction at the given x coordinate */
  handleDragStart: (x: number) => void;
  /** Update drag position to the given x coordinate */
  handleDragMove: (x: number) => void;
  /** End drag interaction and trigger momentum animation */
  handleDragEnd: () => void;
  /** Get the current drag velocity */
  getVelocity: () => number;
}

/**
 * Internal state for tracking drag interactions
 */
interface DragState {
  /** Starting X coordinate of the drag */
  startX: number;
  /** Current X coordinate of the drag */
  currentX: number;
  /** Previous X coordinate for velocity calculation */
  lastX: number;
  /** Timestamp of last update for velocity calculation */
  lastTime: number;
  /** Current velocity in pixels per millisecond */
  velocity: number;
}

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
}: UseAnimationConfig): UseAnimationReturn => {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const isAnimatingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const slideCountRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);

  const cleanupAnimations = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    if (containerRef.current) {
      gsap.killTweensOf(containerRef.current);
    }
  }, []);

  const setupContainer = useCallback((container: HTMLElement) => {
    containerRef.current = container;
    gsap.set(container, {
      force3D: true,
      transformPerspective: 1000,
      backfaceVisibility: 'hidden',
      willChange: 'transform',
    });
  }, []);

  const setupSlides = useCallback((slides: HTMLElement[]) => {
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
  }, []);

  const getPosition = useCallback((): number => {
    if (!containerRef.current) return 0;
    const transform = window.getComputedStyle(containerRef.current).transform;
    const matrix = new DOMMatrix(transform);
    return matrix.m41;
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || slideCountRef.current === 0) return;

    cleanupAnimations();

    const containerWidth = containerRef.current.offsetWidth;
    const slides = containerRef.current.children;

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
  }, [duration, ease, cleanupAnimations, onAnimationComplete]);

  const animateToSlide = useCallback(
    (targetIndex: number, speed: number = 1) => {
      if (!containerRef.current || isAnimatingRef.current) return;

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

      const container = containerRef.current;
      const targetX = -finalIndex * container.offsetWidth;

      cleanupAnimations();

      isAnimatingRef.current = true;
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
    },
    [duration, ease, infinite, cleanupAnimations, onAnimationStart, onAnimationComplete]
  );

  const handleDragStart = useCallback((x: number) => {
    if (!containerRef.current || isAnimatingRef.current) return;
    
    cleanupAnimations();
    
    dragStateRef.current = {
      startX: x,
      currentX: x,
      lastX: x,
      lastTime: performance.now(),
      velocity: 0
    };
  }, [cleanupAnimations]);

  const handleDragMove = useCallback((x: number) => {
    if (!containerRef.current || !dragStateRef.current) return;

    const now = performance.now();
    const deltaTime = now - dragStateRef.current.lastTime;
    const deltaX = x - dragStateRef.current.lastX;
    
    // Update velocity (pixels per millisecond)
    dragStateRef.current.velocity = deltaX / deltaTime;
    
    // Update position using GSAP for smooth rendering
    const container = containerRef.current;
    const currentPos = getPosition();
    const newPos = currentPos + deltaX;
    
    gsap.set(container, {
      x: newPos,
      force3D: true,
      lazy: true
    });

    // Update drag state
    dragStateRef.current.lastX = x;
    dragStateRef.current.lastTime = now;
    dragStateRef.current.currentX = x;
  }, [getPosition]);

  const handleDragEnd = useCallback(() => {
    if (!containerRef.current || !dragStateRef.current) return;

    const velocity = dragStateRef.current.velocity;
    const currentPos = getPosition();
    const containerWidth = containerRef.current.offsetWidth;
    
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
  }, [getPosition, infinite, animateToSlide]);

  const getVelocity = useCallback(() => {
    return dragStateRef.current?.velocity || 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimations();
      if (containerRef.current) {
        gsap.set(containerRef.current, { clearProps: 'all' });
        containerRef.current = null;
      }
    };
  }, [cleanupAnimations]);

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