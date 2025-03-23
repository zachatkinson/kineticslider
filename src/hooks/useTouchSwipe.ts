import { useEffect, useRef, type RefObject } from "react";
import ResourceManager from '../managers/ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

interface UseTouchSwipeProps {
    sliderRef: RefObject<HTMLDivElement | null>;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    threshold?: number; // Optional override for swipe threshold
    thresholdFraction?: number; // Optional threshold as fraction of screen width
    minSwipeDistance?: number; // Minimum swipe distance in pixels
    resourceManager?: ResourceManager | null;
}

/**
 * Hook to handle touch swipe gestures for the slider
 * Detects left and right swipes on touch devices and triggers navigation
 */
const useTouchSwipe = ({
                           sliderRef,
                           onSwipeLeft,
                           onSwipeRight,
                           threshold,
                           thresholdFraction = 0.2, // Default: 20% of screen width
                           minSwipeDistance = 30, // Default minimum swipe distance in pixels
                           resourceManager
                       }: UseTouchSwipeProps) => {
    // Store touch state in refs to avoid re-renders
    const touchStateRef = useRef({
        touchStartX: 0,
        touchStartY: 0,
        touchEndX: 0,
        touchEndY: 0,
        swiping: false
    });

    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        const slider = sliderRef.current;
        if (!slider) {
            if (isDevelopment) {
                console.warn('useTouchSwipe: Slider reference is not available');
            }
            return;
        }

        /**
         * Calculate the appropriate swipe threshold based on slider width
         * @returns The calculated threshold in pixels
         */
        const calculateThreshold = (): number => {
            // If explicit threshold is provided, use it
            if (threshold !== undefined) return threshold;

            // Calculate based on slider width if available, otherwise use window width
            const baseWidth = slider.clientWidth || window.innerWidth;
            const calculatedThreshold = baseWidth * thresholdFraction;

            // Ensure minimum threshold for small screens
            return Math.max(calculatedThreshold, minSwipeDistance);
        };

        /**
         * Handle the start of a touch event
         * @param e - The touch event
         */
        const handleTouchStart = (e: Event) => {
            try {
                // Cast to TouchEvent for type safety
                const touchEvent = e as TouchEvent;

                if (!touchEvent.touches || touchEvent.touches.length === 0) return;

                // Store initial touch position
                touchStateRef.current.touchStartX = touchEvent.touches[0].clientX;
                touchStateRef.current.touchStartY = touchEvent.touches[0].clientY;
                touchStateRef.current.swiping = true;

                if (isDevelopment) {
                    console.log(`Touch start at (${touchStateRef.current.touchStartX}, ${touchStateRef.current.touchStartY})`);
                }
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in touch start handler:', error);
                }
            }
        };

        /**
         * Handle touch move events
         * @param e - The touch event
         */
        const handleTouchMove = (e: Event) => {
            try {
                // Cast to TouchEvent for type safety
                const touchEvent = e as TouchEvent;

                if (!touchStateRef.current.swiping || !touchEvent.touches || touchEvent.touches.length === 0) return;

                // Update current touch position
                touchStateRef.current.touchEndX = touchEvent.touches[0].clientX;
                touchStateRef.current.touchEndY = touchEvent.touches[0].clientY;
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in touch move handler:', error);
                }
            }
        };

        /**
         * Handle the end of a touch event
         */
        const handleTouchEnd = () => {
            try {
                if (!touchStateRef.current.swiping) return;

                // Calculate swipe distance and angle
                const { touchStartX, touchStartY, touchEndX, touchEndY } = touchStateRef.current;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const swipeThreshold = calculateThreshold();

                // Calculate absolute distances
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);

                if (isDevelopment) {
                    console.log(`Touch end: deltaX=${deltaX}, deltaY=${deltaY}, threshold=${swipeThreshold}`);
                }

                // Only trigger if horizontal distance > vertical distance (to avoid scrolling conflicts)
                // and if the horizontal distance exceeds the threshold
                if (absX > absY && absX > swipeThreshold) {
                    // Determine direction and trigger appropriate callback
                    if (deltaX < 0) {
                        if (isDevelopment) {
                            console.log('Swipe left detected');
                        }
                        onSwipeLeft();
                    } else {
                        if (isDevelopment) {
                            console.log('Swipe right detected');
                        }
                        onSwipeRight();
                    }
                }

                // Reset swiping state
                touchStateRef.current.swiping = false;
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in touch end handler:', error);
                }
                // Reset swiping state even on error
                touchStateRef.current.swiping = false;
            }
        };

        /**
         * Handle touch cancel events
         */
        const handleTouchCancel = () => {
            try {
                if (isDevelopment) {
                    console.log('Touch canceled');
                }
                // Reset swiping state
                touchStateRef.current.swiping = false;
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in touch cancel handler:', error);
                }
                // Reset swiping state even on error
                touchStateRef.current.swiping = false;
            }
        };

        // Add event listeners with passive flag for better scrolling performance
        // Use ResourceManager if available, otherwise add directly
        if (resourceManager) {
            resourceManager.addEventListener(slider, "touchstart", handleTouchStart);
            resourceManager.addEventListener(slider, "touchmove", handleTouchMove);
            resourceManager.addEventListener(slider, "touchend", handleTouchEnd);
            resourceManager.addEventListener(slider, "touchcancel", handleTouchCancel);
        } else {
            // Use regular event listeners with passive option
            slider.addEventListener("touchstart", handleTouchStart, { passive: true });
            slider.addEventListener("touchmove", handleTouchMove, { passive: true });
            slider.addEventListener("touchend", handleTouchEnd);
            slider.addEventListener("touchcancel", handleTouchCancel);
        }

        // Cleanup function
        return () => {
            // Remove event listeners if ResourceManager not used
            if (!resourceManager) {
                slider.removeEventListener("touchstart", handleTouchStart);
                slider.removeEventListener("touchmove", handleTouchMove);
                slider.removeEventListener("touchend", handleTouchEnd);
                slider.removeEventListener("touchcancel", handleTouchCancel);
            }
            // Note: ResourceManager handles event cleanup when disposed
        };
    }, [
        sliderRef,
        onSwipeLeft,
        onSwipeRight,
        threshold,
        thresholdFraction,
        minSwipeDistance,
        resourceManager
    ]);

    // No return value needed as this hook just sets up the touch handlers
};

export default useTouchSwipe;