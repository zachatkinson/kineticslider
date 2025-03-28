import gsap from 'gsap';

import React, {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { KineticSliderProps } from './types';

export const KineticSlider: React.FC<KineticSliderProps> = ({
  children,
  className = '',
  style,
  duration = 0.5,
  ease = 'power2.out',
  enableGestures = true,
  onChange,
  initialIndex = 0,
  infinite = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const dragRef = useRef({ startX: 0, currentX: 0, isDragging: false });
  const velocityRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideCount = Children.count(children);

  // Initialize slide positions and GSAP timeline
  useEffect(() => {
    if (!containerRef.current || !slidesRef.current || slideCount === 0) return;

    // Create a new GSAP context
    const ctx = gsap.context(() => {
      // Position all slides
      const slides = slidesRef.current!.children;
      gsap.set(slides, {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: (i) => `${i * 100}%`,
      });

      // Position the container to show the initial slide
      gsap.set(slidesRef.current, {
        x: -initialIndex * 100 + '%',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [slideCount, initialIndex]);

  // Handle slide transitions
  const goToSlide = useCallback(
    (index: number, _direction: 1 | -1, customDuration?: number) => {
      if (isAnimating || !slidesRef.current) return;

      let targetIndex = index;

      // Handle infinite looping
      if (infinite) {
        if (index < 0) {
          targetIndex = slideCount - 1;
        } else if (index >= slideCount) {
          targetIndex = 0;
        }
      } else {
        if (index < 0 || index >= slideCount) return;
      }

      setIsAnimating(true);

      // Kill any existing animations
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create new timeline for the transition
      const tl = gsap.timeline({
        defaults: { duration: customDuration || duration, ease },
        onComplete: () => {
          setIsAnimating(false);
          setCurrentIndex(targetIndex);
          onChange?.(targetIndex);
        },
      });

      // Animate to the target slide
      tl.to(slidesRef.current, {
        x: -targetIndex * 100 + '%',
      });

      timelineRef.current = tl;
    },
    [duration, ease, infinite, isAnimating, onChange, slideCount]
  );

  // Handle touch/mouse events for dragging
  const handleDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!enableGestures || isAnimating) return;

      const clientX =
        'touches' in e && e.touches[0]
          ? e.touches[0].clientX
          : 'clientX' in e
            ? e.clientX
            : 0;
      dragRef.current = {
        startX: clientX,
        currentX: clientX,
        isDragging: true,
      };
      velocityRef.current = 0;

      // Kill any existing animations
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Set up GSAP dragging
      gsap.set(slidesRef.current, { cursor: 'grabbing' });
    },
    [enableGestures, isAnimating]
  );

  const handleDragMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (
        !dragRef.current.isDragging ||
        !slidesRef.current ||
        !containerRef.current
      )
        return;

      const clientX =
        'touches' in e && e.touches[0]
          ? e.touches[0].clientX
          : 'clientX' in e
            ? e.clientX
            : 0;
      const deltaX = clientX - dragRef.current.currentX;
      const containerWidth = containerRef.current.offsetWidth;

      // Calculate velocity for momentum scrolling
      velocityRef.current = deltaX;

      // Update drag position
      dragRef.current.currentX = clientX;

      // Calculate new position
      const element = slidesRef.current;
      const currentX = element ? (gsap.getProperty(element, 'x') as number) : 0;
      let newX = currentX + deltaX;

      // Apply resistance at edges if not infinite
      if (!infinite) {
        const minX = -(slideCount - 1) * containerWidth;
        const maxX = 0;
        if (newX > maxX) {
          newX = maxX + (newX - maxX) * 0.5;
        } else if (newX < minX) {
          newX = minX + (newX - minX) * 0.5;
        }
      }

      gsap.set(element, { x: newX });
    },
    [infinite, slideCount]
  );

  const handleDragEnd = useCallback(
    (_e: React.TouchEvent | React.MouseEvent) => {
      if (
        !dragRef.current.isDragging ||
        !slidesRef.current ||
        !containerRef.current
      )
        return;

      dragRef.current.isDragging = false;
      const element = slidesRef.current;
      gsap.set(element, { cursor: 'grab' });

      const containerWidth = containerRef.current.offsetWidth;
      const currentX = element ? (gsap.getProperty(element, 'x') as number) : 0;
      const previousX = element
        ? (gsap.getProperty(element, 'x') as number)
        : 0;
      const progress = Math.abs(currentX % containerWidth) / containerWidth;
      const velocity = Math.abs(velocityRef.current);

      // Determine direction based on drag or velocity
      let targetIndex = currentIndex;
      if (velocity > 10 || progress > 0.2) {
        targetIndex =
          currentX < previousX ? currentIndex + 1 : currentIndex - 1;
      }

      // Calculate custom duration based on velocity
      const customDuration = Math.min(
        duration,
        Math.max(0.2, 0.5 - velocity * 0.001)
      );
      goToSlide(
        targetIndex,
        targetIndex > currentIndex ? 1 : -1,
        customDuration
      );
    },
    [currentIndex, duration, goToSlide]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToSlide(currentIndex - 1, -1);
      } else if (e.key === 'ArrowRight') {
        goToSlide(currentIndex + 1, 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, goToSlide]);

  // Public methods for slide navigation
  const next = useCallback(() => {
    goToSlide(currentIndex + 1, 1);
  }, [currentIndex, goToSlide]);

  const prev = useCallback(() => {
    goToSlide(currentIndex - 1, -1);
  }, [currentIndex, goToSlide]);

  return (
    <div
      ref={containerRef}
      className={`kinetic-slider ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Navigation click areas */}
      <button
        className="kinetic-slider__nav kinetic-slider__nav--prev"
        onClick={prev}
        aria-label="Previous slide"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '20%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          zIndex: 1,
        }}
      />
      <button
        className="kinetic-slider__nav kinetic-slider__nav--next"
        onClick={next}
        aria-label="Next slide"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '20%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          zIndex: 1,
        }}
      />
      <div
        ref={slidesRef}
        className="kinetic-slider__container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: enableGestures ? 'grab' : 'default',
          touchAction: 'pan-y pinch-zoom',
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        role="presentation"
      >
        {children}
      </div>
    </div>
  );
};
