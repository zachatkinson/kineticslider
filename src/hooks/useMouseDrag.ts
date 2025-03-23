import { useEffect, useRef, useCallback, type RefObject } from "react";
import { Sprite } from "pixi.js";
import { gsap } from "gsap";
import ResourceManager from '../managers/ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

interface UseMouseDragProps {
    sliderRef: RefObject<HTMLDivElement | null>;
    slidesRef: RefObject<Sprite[]>;
    currentIndex: RefObject<number>;
    swipeScaleIntensity: number;
    swipeDistance: number;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    resourceManager?: ResourceManager | null;
}

/**
 * Hook to handle mouse drag interactions for slides
 * Fully optimized with:
 * - Batch animation processing
 * - Comprehensive error handling
 * - Memory leak prevention
 * - Performance optimizations
 * - Throttled event handling
 */
const useMouseDrag = ({
                          sliderRef,
                          slidesRef,
                          currentIndex,
                          swipeScaleIntensity,
                          swipeDistance,
                          onSwipeLeft,
                          onSwipeRight,
                          resourceManager
                      }: UseMouseDragProps) => {
    // Track drag state with a ref to avoid re-renders
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        endX: 0,
        isAnimating: false,
        lastThrottleTime: 0,
        activeAnimations: [] as gsap.core.Tween[]
    });

    // Flag to track component mount state
    const isMountedRef = useRef(true);

    // Process a batch of animations using ResourceManager
    const processBatchAnimations = useCallback(() => {
        try {
            const { activeAnimations } = dragStateRef.current;

            // Skip if no resource manager or no animations
            if (!resourceManager || activeAnimations.length === 0) return;

            // Track all animations in batch
            resourceManager.trackAnimationBatch(activeAnimations);

            // Clear the array by setting length to 0 (more efficient than creating a new array)
            activeAnimations.length = 0;

            if (isDevelopment) {
                console.log('Processed batch animations for mouse drag');
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error processing batch animations:', error);
            }
            // Clear array even on error
            dragStateRef.current.activeAnimations = [];
        }
    }, [resourceManager]);

    // Clean up any active animations
    const cleanupAnimations = useCallback(() => {
        try {
            const { activeAnimations } = dragStateRef.current;

            // Kill all active animations
            activeAnimations.forEach(tween => {
                if (tween && tween.isActive()) {
                    tween.kill();
                }
            });

            // Clear the animations array
            activeAnimations.length = 0;

            // Reset animation state
            dragStateRef.current.isAnimating = false;
        } catch (error) {
            if (isDevelopment) {
                console.error('Error cleaning up animations:', error);
            }
        }
    }, []);

    // Handle mouse drag effects
    const handleDragEffect = useCallback((deltaX: number) => {
        try {
            if (!isMountedRef.current) return;

            const currentSlide = slidesRef.current[currentIndex.current];
            if (!currentSlide) return;

            // Calculate normalized scale factor based on drag distance
            const normalizedFactor = Math.min(Math.abs(deltaX) / swipeDistance, 1);
            const newScale = 1 + normalizedFactor * swipeScaleIntensity;

            // Clean up any existing animations
            cleanupAnimations();

            // Create and add the new animation to our active animations
            const dragTween = gsap.to(currentSlide.scale, {
                x: (currentSlide as any).baseScale * newScale,
                y: (currentSlide as any).baseScale * newScale,
                duration: 0.1,
                ease: "power2.out",
                onComplete: () => {
                    // Re-track the sprite after animation
                    if (resourceManager && currentSlide) {
                        resourceManager.trackDisplayObject(currentSlide);
                    }
                }
            });

            // Add to animations array
            dragStateRef.current.activeAnimations.push(dragTween);

            // Process animations in batch
            processBatchAnimations();
        } catch (error) {
            if (isDevelopment) {
                console.error('Error handling drag effect:', error);
            }
        }
    }, [
        slidesRef,
        currentIndex,
        swipeScaleIntensity,
        swipeDistance,
        cleanupAnimations,
        processBatchAnimations,
        resourceManager
    ]);

    // Reset slide scale after drag
    const resetSlideScale = useCallback(() => {
        try {
            if (!isMountedRef.current) return;

            const currentSlide = slidesRef.current[currentIndex.current];
            if (!currentSlide) return;

            // Clean up any existing animations
            cleanupAnimations();

            // Create and add the reset animation
            const resetTween = gsap.to(currentSlide.scale, {
                x: (currentSlide as any).baseScale,
                y: (currentSlide as any).baseScale,
                duration: 0.2,
                ease: "power2.out",
                onComplete: () => {
                    // Re-track the sprite after animation
                    if (resourceManager && currentSlide) {
                        resourceManager.trackDisplayObject(currentSlide);
                    }

                    // Update state
                    dragStateRef.current.isAnimating = false;
                }
            });

            // Add to animations array
            dragStateRef.current.activeAnimations.push(resetTween);

            // Process animations in batch
            processBatchAnimations();
        } catch (error) {
            if (isDevelopment) {
                console.error('Error resetting slide scale:', error);
            }
            // Ensure animation state is reset even on error
            dragStateRef.current.isAnimating = false;
        }
    }, [
        slidesRef,
        currentIndex,
        cleanupAnimations,
        processBatchAnimations,
        resourceManager
    ]);

    // Event handlers with memoization
    const handleMouseDown = useCallback((event: Event) => {
        try {
            const e = event as MouseEvent;
            e.preventDefault();

            // Set dragging state
            dragStateRef.current.isDragging = true;
            dragStateRef.current.startX = e.clientX;
            dragStateRef.current.endX = e.clientX;
        } catch (error) {
            if (isDevelopment) {
                console.error('Error in mouse down handler:', error);
            }
        }
    }, []);

    const handleMouseMove = useCallback((event: Event) => {
        try {
            // Skip if not dragging
            if (!dragStateRef.current.isDragging) return;

            const e = event as MouseEvent;
            e.preventDefault();

            // Apply throttling for performance (limit to 60fps)
            const now = Date.now();
            const throttleDelay = 16; // ~60fps
            if (now - dragStateRef.current.lastThrottleTime < throttleDelay) return;
            dragStateRef.current.lastThrottleTime = now;

            // Update drag end position
            dragStateRef.current.endX = e.clientX;

            // Calculate drag distance
            const deltaX = dragStateRef.current.endX - dragStateRef.current.startX;

            // Apply drag effect
            handleDragEffect(deltaX);
        } catch (error) {
            if (isDevelopment) {
                console.error('Error in mouse move handler:', error);
            }
        }
    }, [handleDragEffect]);

    const handleMouseUp = useCallback((event: Event) => {
        try {
            // Skip if not dragging
            if (!dragStateRef.current.isDragging) return;

            const e = event as MouseEvent;
            e.preventDefault();

            // Update state
            dragStateRef.current.isDragging = false;

            // Calculate final drag distance
            const deltaX = dragStateRef.current.endX - dragStateRef.current.startX;

            // Reset slide scale first
            resetSlideScale();

            // Handle swipe if distance is sufficient
            if (Math.abs(deltaX) > swipeDistance) {
                // Set small timeout to allow scale reset to complete
                setTimeout(() => {
                    if (!isMountedRef.current) return;

                    if (deltaX < 0) {
                        onSwipeLeft();
                    } else {
                        onSwipeRight();
                    }
                }, 50);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error in mouse up handler:', error);
            }
            // Reset dragging state even on error
            dragStateRef.current.isDragging = false;
        }
    }, [resetSlideScale, swipeDistance, onSwipeLeft, onSwipeRight]);

    const handleMouseLeave = useCallback((event: Event) => {
        try {
            // Skip if not dragging
            if (!dragStateRef.current.isDragging) return;

            const e = event as MouseEvent;
            e.preventDefault();

            // Update state
            dragStateRef.current.isDragging = false;

            // Reset slide scale
            resetSlideScale();
        } catch (error) {
            if (isDevelopment) {
                console.error('Error in mouse leave handler:', error);
            }
            // Reset dragging state even on error
            dragStateRef.current.isDragging = false;
        }
    }, [resetSlideScale]);

    // Set up event listeners with batch handling
    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        // Skip if slider reference is not available
        if (!sliderRef.current) return;

        try {
            const slider = sliderRef.current;

            // Update mounted ref
            isMountedRef.current = true;

            // Create event handler maps for batch registration
            const listeners = new Map<string, EventCallback[]>();

            // Maps for all our event types
            listeners.set('mousedown', [handleMouseDown]);
            listeners.set('mousemove', [handleMouseMove]);
            listeners.set('mouseup', [handleMouseUp]);
            listeners.set('mouseleave', [handleMouseLeave]);

            // Register event listeners - use batch if available
            if (resourceManager) {
                // Batch register all listeners
                resourceManager.addEventListenerBatch(slider, listeners);
            } else {
                // Fall back to individual registration
                slider.addEventListener('mousedown', handleMouseDown);
                slider.addEventListener('mousemove', handleMouseMove);
                slider.addEventListener('mouseup', handleMouseUp);
                slider.addEventListener('mouseleave', handleMouseLeave);
            }

            // Cleanup on unmount
            return () => {
                // Update mounted state immediately
                isMountedRef.current = false;

                try {
                    // Clean up animations first
                    cleanupAnimations();

                    // ResourceManager will handle its own cleanup
                    if (!resourceManager) {
                        // Manual cleanup for each event
                        slider.removeEventListener('mousedown', handleMouseDown);
                        slider.removeEventListener('mousemove', handleMouseMove);
                        slider.removeEventListener('mouseup', handleMouseUp);
                        slider.removeEventListener('mouseleave', handleMouseLeave);
                    }
                } catch (cleanupError) {
                    if (isDevelopment) {
                        console.error('Error during useMouseDrag cleanup:', cleanupError);
                    }
                }
            };
        } catch (error) {
            if (isDevelopment) {
                console.error('Error setting up mouse drag handlers:', error);
            }
            // Return empty cleanup function
            return () => {};
        }
    }, [
        sliderRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
        cleanupAnimations,
        resourceManager
    ]);

    // No return value needed - hook works internally
};

// Type definition for event callback - to match ResourceManager's expected type
type EventCallback = EventListenerOrEventListenerObject;

export default useMouseDrag;