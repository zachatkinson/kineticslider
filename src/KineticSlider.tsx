import gsap from 'gsap';
import React, {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  Suspense,
  ReactNode,
  CSSProperties,
} from 'react';
import debounce from 'lodash/debounce';
import { act } from '@testing-library/react';

interface DragState {
  startX: number;
  currentX: number;
  quickSetter?: ReturnType<typeof gsap.quickSetter> | undefined;
  timeline?: gsap.core.Timeline | null;
}

interface KineticSliderProps {
  children: ReactNode[];
  className?: string;
  style?: CSSProperties;
  infinite?: boolean;
  enableGestures?: boolean;
  enableKeyboard?: boolean;
  onChange?: (index: number) => void;
  lazyLoad?: boolean;
  duration?: number;
  ease?: string;
  initialIndex?: number;
}

export const KineticSlider: React.FC<KineticSliderProps> = ({
  children,
  className = '',
  style = {},
  infinite = false,
  enableGestures = true,
  enableKeyboard = true,
  onChange,
  lazyLoad = false,
  duration = 0.8,
  ease = 'power3.out',
  initialIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rafRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const slideCount = Children.count(children);
  const slides = Children.toArray(children);

  // Prevent multiple onChange calls during rapid navigation
  const onChangeRef = useRef(onChange);
  const isAnimatingRef = useRef(isAnimating);

  useEffect(() => {
    onChangeRef.current = onChange;
    isAnimatingRef.current = isAnimating;
  }, [onChange, isAnimating]);

  const handleStateUpdate = useCallback((newIndex: number) => {
    if (newIndex === currentIndex) return;
    setCurrentIndex(newIndex);
    onChangeRef.current?.(newIndex);
  }, [currentIndex, onChangeRef]);

  // Initialize GSAP timeline with optimized settings
  useEffect(() => {
    if (containerRef.current) {
      // Kill any existing animations
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      // Create new timeline with optimized settings
      const timeline = gsap.timeline({
        defaults: {
          duration: 0.8,
          ease: 'power3.out',
          force3D: true,
          lazy: false,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        },
        onComplete: () => {
          handleStateUpdate(currentIndex);
          // Clean up memory
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        }
      });

      // Optimize animation by using transform3d
      if (containerRef.current) {
        const container = containerRef.current as HTMLDivElement;
        timeline.to(container, {
          x: -currentIndex * container.offsetWidth,
          transformPerspective: 1000,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        });
      }

      timelineRef.current = timeline;
    }

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [currentIndex, handleStateUpdate]);

  // Handle container resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !slidesRef.current || slideCount === 0) return;

    const containerWidth = containerRef.current.offsetWidth;
    
    // Update slide positions using quickSetter for better performance
    const slides = slidesRef.current.children;
    gsap.set(slides, {
      width: containerWidth,
      left: (i) => `${i * 100}%`,
      force3D: true,
      lazy: true,
    });

    // Update container position using quickSetter
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = gsap.timeline({
        defaults: {
          duration: 0.8,
          ease: 'power3.out'
        },
        onComplete: () => {
          handleStateUpdate(currentIndex);
          // Clean up memory
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        }
      });
      if (containerRef.current) {
        const container = containerRef.current as HTMLDivElement;
        timelineRef.current?.to(container, {
          x: -currentIndex * container.offsetWidth,
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        });
      }
    }
  }, [currentIndex, slideCount, handleStateUpdate]);

  // Debounced resize handler with increased delay for better performance
  const debouncedResize = useMemo(
    () => debounce(handleResize, 32),
    [handleResize]
  );

  // Initialize ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(debouncedResize);
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      debouncedResize.cancel();
    };
  }, [debouncedResize]);

  // Initialize slide positions and GSAP timeline
  useEffect(() => {
    if (!containerRef.current || !slidesRef.current || slideCount === 0) return;

    // Position all slides
    const slides = slidesRef.current.children;
    gsap.set(slides, {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: (i) => `${i * 100}%`,
    });

    // Position the container using quickSetter
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = gsap.timeline({
        defaults: {
          duration: 0.8,
          ease: 'power3.out'
        },
        onComplete: () => {
          handleStateUpdate(currentIndex);
          // Clean up memory
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        }
      });
      if (containerRef.current) {
        const container = containerRef.current as HTMLDivElement;
        timelineRef.current?.to(container, {
          x: -currentIndex * container.offsetWidth,
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: true,
          immediateRender: true,
        });
      }
    }

    return () => {
      gsap.killTweensOf(slides);
      gsap.killTweensOf(slidesRef.current);
    };
  }, [slideCount, currentIndex, handleStateUpdate]);

  // Handle slide transitions
  const animateToSlide = useCallback((index: number, customDuration?: number) => {
    if (isAnimatingRef.current || !containerRef.current) return;
    if (!infinite && (index < 0 || index >= slideCount)) return;

    setIsAnimating(true);
    isAnimatingRef.current = true;

    // Kill any existing animations
    timelineRef.current?.kill();

    const timeline = gsap.timeline({
      defaults: {
        duration: customDuration || 0.8,
        ease: 'power3.out'
      },
      onComplete: () => {
        handleStateUpdate(index);
        // Clean up memory
        if (timelineRef.current) {
          timelineRef.current.kill();
          timelineRef.current = null;
        }
      }
    });

    const containerWidth = containerRef.current.offsetWidth;
    timeline.to(containerRef.current as HTMLElement, {
      x: -index * containerWidth,
      force3D: true,
      lazy: true,
      clearProps: 'transform',
      overwrite: true,
      immediateRender: true,
    });

    timelineRef.current = timeline;
  }, [infinite, slideCount, handleStateUpdate]);

  // Frame throttling for smoother animations
  const throttleFrame = useCallback((callback: () => void) => {
    let ticking = false;
    return () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
      }
    };
  }, []);

  // Optimized RAF handler with throttling and memory management
  const rafDragHandler = useCallback((newPos: number, dragState: DragState) => {
    if (!dragState.quickSetter) return;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    // Batch DOM reads and writes with minimal reflows
    const updateTransform = throttleFrame(() => {
      if (!dragState.quickSetter) return;

      // Read phase - batch all DOM reads
      const container = containerRef.current;
      if (!container) return;

      // Write phase - batch all DOM writes
      dragState.quickSetter(newPos);
      
      // Use minimal transform properties
      gsap.set(container, {
        x: newPos,
        force3D: true,
        transformPerspective: 1000,
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        overwrite: 'auto',
        immediateRender: true,
      });
    });

    rafRef.current = requestAnimationFrame(updateTransform);
  }, [throttleFrame]);

  // Handle drag with optimized performance and memory management
  const handleDrag = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    const dragState = dragRef.current;
    const container = containerRef.current;
    if (!enableGestures || !isDragging || !container || !dragState?.quickSetter) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const deltaX = clientX - (dragState?.currentX || 0);
    
    // Update velocity with optimized smoothing
    velocityRef.current = deltaX * 0.4 + (velocityRef.current || 0) * 0.6;
    
    // Calculate new position with bounds checking
    const containerWidth = container.offsetWidth;
    const currentPos = -currentIndex * containerWidth;
    const newPos = Math.max(
      Math.min(
        currentPos + deltaX,
        0
      ),
      -(slideCount - 1) * containerWidth
    );
    
    // Use RAF for smoother performance
    if (dragState) {
      rafDragHandler(newPos, dragState);
      dragState.currentX = clientX;
    }

    // Create or update timeline for drag animation with minimal properties
    if (!timelineRef.current) {
      const timeline = gsap.timeline({
        defaults: {
          duration: 0.1,
          ease: 'none',
          force3D: true,
          lazy: true,
          clearProps: 'transform',
          overwrite: 'auto',
          immediateRender: true,
        },
        paused: true,
        onComplete: () => {
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        }
      });
      
      timeline.to(container, {
        x: newPos,
        force3D: true,
        transformPerspective: 1000,
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        immediateRender: true,
      });

      timelineRef.current = timeline;
      timeline.play();
    }
  }, [enableGestures, isDragging, currentIndex, slideCount, rafDragHandler]);

  // Handle drag start with optimized settings
  const handleDragStart = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!enableGestures || isAnimating) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const container = containerRef.current;
    if (!container) return;

    // Create new drag state with optimized settings
    const newDragState: DragState = {
      startX: clientX,
      currentX: clientX,
      quickSetter: gsap.quickSetter(container, 'x', 'px'),
      timeline: null,
    };
    dragRef.current = newDragState;

    setIsDragging(true);
    velocityRef.current = 0;

    // Kill any existing animations
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Optimize container for animations
    gsap.set(container, {
      force3D: true,
      transformPerspective: 1000,
      backfaceVisibility: 'hidden',
      willChange: 'transform',
    });
  }, [enableGestures, isAnimating]);

  // Handle drag end with optimized animation
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const container = containerRef.current;
    if (!container) return;

    const velocity = velocityRef.current;
    const containerWidth = container.offsetWidth;
    const threshold = containerWidth * 0.2;
    const currentPos = -currentIndex * containerWidth;

    let targetIndex = currentIndex;
    if (Math.abs(velocity) > threshold) {
      targetIndex = velocity > 0 ? currentIndex - 1 : currentIndex + 1;
    }

    // Ensure target index is within bounds
    if (!infinite) {
      targetIndex = Math.max(0, Math.min(targetIndex, slideCount - 1));
    }

    // Clean up existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Create snap animation timeline with optimized settings
    const timeline = gsap.timeline({
      defaults: {
        duration: 0.3,
        ease: 'power2.out',
        force3D: true,
        lazy: true,
        clearProps: 'transform',
        overwrite: 'auto',
        immediateRender: true,
      },
      onComplete: () => {
        handleStateUpdate(targetIndex);
        if (timelineRef.current) {
          timelineRef.current.kill();
          timelineRef.current = null;
        }
      }
    });

    timeline.to(container, {
      x: -targetIndex * containerWidth,
      force3D: true,
      transformPerspective: 1000,
      backfaceVisibility: 'hidden',
      willChange: 'transform',
    });

    timelineRef.current = timeline;
  }, [isDragging, currentIndex, infinite, slideCount, handleStateUpdate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enableKeyboard) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          requestAnimationFrame(() => animateToSlide(currentIndex - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          requestAnimationFrame(() => animateToSlide(currentIndex + 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, currentIndex, animateToSlide]);

  // Public methods for slide navigation
  const next = useCallback(() => {
    animateToSlide(currentIndex + 1, 1);
  }, [currentIndex, animateToSlide]);

  const prev = useCallback(() => {
    animateToSlide(currentIndex - 1, 1);
  }, [currentIndex, animateToSlide]);

  // Virtualization window calculation
  const visibleSlides = useMemo(() => {
    if (!lazyLoad) return Children.toArray(children);
    
    const window = 1; // Load one slide before and after
    const start = Math.max(0, currentIndex - window);
    const end = Math.min(slideCount - 1, currentIndex + window);
    
    return Children.toArray(children).slice(start, end + 1);
  }, [children, currentIndex, lazyLoad, slideCount]);

  // Memory cleanup on unmount with optimized cleanup
  useEffect(() => {
    return () => {
      // Clean up container
      if (containerRef.current) {
        gsap.killTweensOf(containerRef.current);
        gsap.set(containerRef.current, { clearProps: 'all' });
        containerRef.current = null;
      }
      slidesRef.current = null;

      // Clean up resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      // Clear GSAP memory safely
      const gsapInstance = gsap as unknown as { globalTimeline?: { clear: () => void }; ticker?: { remove: (fn: any) => void }; updateRoot?: () => void };
      if (gsapInstance.globalTimeline?.clear) {
        gsapInstance.globalTimeline.clear();
      }
      if (gsapInstance.ticker?.remove && gsapInstance.updateRoot) {
        gsapInstance.ticker.remove(gsapInstance.updateRoot);
      }
    };
  }, []);

  // Optimize event listeners with cleanup and throttle drag events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastDragTime = 0;
    const THROTTLE_MS = 16; // ~60fps

    const throttledDrag = (e: TouchEvent | MouseEvent) => {
      const now = performance.now();
      if (now - lastDragTime >= THROTTLE_MS) {
        handleDrag(e as any);
        lastDragTime = now;
      }
    };

    const handlers = {
      touchStart: (e: TouchEvent) => handleDragStart(e as unknown as React.TouchEvent),
      mouseDown: (e: MouseEvent) => handleDragStart(e as unknown as React.MouseEvent),
      touchMove: throttledDrag,
      mouseMove: throttledDrag,
      touchEnd: () => handleDragEnd(),
      mouseUp: () => handleDragEnd(),
    };

    // Add event listeners with passive option for better performance
    container.addEventListener('touchstart', handlers.touchStart, { passive: true });
    container.addEventListener('mousedown', handlers.mouseDown);
    window.addEventListener('touchmove', handlers.touchMove, { passive: true });
    window.addEventListener('mousemove', handlers.mouseMove);
    window.addEventListener('touchend', handlers.touchEnd);
    window.addEventListener('mouseup', handlers.mouseUp);

    return () => {
      // Remove event listeners
      container.removeEventListener('touchstart', handlers.touchStart);
      container.removeEventListener('mousedown', handlers.mouseDown);
      window.removeEventListener('touchmove', handlers.touchMove);
      window.removeEventListener('mousemove', handlers.mouseMove);
      window.removeEventListener('touchend', handlers.touchEnd);
      window.removeEventListener('mouseup', handlers.mouseUp);

      // Clear handlers
      Object.keys(handlers).forEach(key => {
        (handlers as any)[key] = undefined;
      });
    };
  }, [handleDragStart, handleDrag, handleDragEnd]);

  return (
    <div
      ref={containerRef}
      className={`kinetic-slider ${className || ''}`}
      role={enableGestures ? "region" : undefined}
      aria-roledescription={enableGestures ? "carousel" : undefined}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      data-testid="kinetic-slider"
    >
      <div
        ref={slidesRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            data-testid="slide"
            className={`kinetic-slider__slide ${currentIndex === index ? 'active' : ''}`}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: `${index * 100}%`,
            }}
          >
            {lazyLoad ? (
              <Suspense fallback={<div>Loading...</div>}>
                {index === currentIndex || index === currentIndex - 1 || index === currentIndex + 1
                  ? slide
                  : null}
              </Suspense>
            ) : (
              slide
            )}
          </div>
        ))}
      </div>
      {slideCount > 1 && (
        <>
          <button
            className="kinetic-slider__nav kinetic-slider__nav--prev"
            onClick={() => animateToSlide(currentIndex - 1)}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 1,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            className="kinetic-slider__nav kinetic-slider__nav--next"
            onClick={() => animateToSlide(currentIndex + 1)}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 1,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">→</span>
          </button>
        </>
      )}
    </div>
  );
};
