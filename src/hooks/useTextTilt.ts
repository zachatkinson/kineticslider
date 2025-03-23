import { useEffect, useRef, type RefObject } from "react";
import { Container, DisplacementFilter } from "pixi.js";
import { gsap } from "gsap";
import ResourceManager from '../managers/ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

// Enhanced error logging utility
const logError = (context: string, error: unknown) => {
    if (isDevelopment) {
        console.error(`[useTextTilt:${context}] Error:`, error);
    }
};

// Comprehensive interface for hook props
interface UseTextTiltProps {
    sliderRef: RefObject<HTMLDivElement | null>;
    textContainersRef: RefObject<Container[]>;
    currentIndex: RefObject<number>;
    cursorTextEffect: boolean;
    maxContainerShiftFraction: number;
    bgDispFilterRef: RefObject<DisplacementFilter | null>;
    cursorDispFilterRef: RefObject<DisplacementFilter | null>;
    cursorImgEffect: boolean;
    resourceManager?: ResourceManager | null;
    throttleTime?: number;
}

// Enhanced state management interface
interface TiltState {
    isAnimating: boolean;
    lastOffsetX: number;
    lastOffsetY: number;
}

// Cancellation and lifecycle management interface
interface CancellationFlags {
    isCancelled: boolean;
}

/**
 * Advanced text tilt hook with comprehensive optimization
 */
const useTextTilt = ({
                         sliderRef,
                         textContainersRef,
                         currentIndex,
                         cursorTextEffect,
                         maxContainerShiftFraction,
                         bgDispFilterRef,
                         cursorDispFilterRef,
                         cursorImgEffect,
                         resourceManager,
                         throttleTime = 50
                     }: UseTextTiltProps) => {
    // Enhanced refs with strict typing
    const lastMoveTimeRef = useRef<number>(0);
    const tiltTimeoutRef = useRef<number | null>(null);
    const animationStateRef = useRef<TiltState>({
        isAnimating: false,
        lastOffsetX: 0,
        lastOffsetY: 0
    });
    const cancellationRef = useRef<CancellationFlags>({ isCancelled: false });
    const activeTweensRef = useRef<gsap.core.Tween[]>([]);

    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        // Early exit if effect is disabled
        if (!cursorTextEffect || !sliderRef.current) {
            if (isDevelopment) {
                console.log('Text tilt effect disabled or missing slider reference');
            }
            return;
        }

        // Reset cancellation flag
        cancellationRef.current.isCancelled = false;

        const sliderElement = sliderRef.current;

        /**
         * Comprehensive cleanup of active tweens
         */
        const cleanupActiveTweens = () => {
            try {
                activeTweensRef.current.forEach(tween => {
                    if (tween && tween.isActive()) {
                        tween.kill();
                    }
                });
                activeTweensRef.current = [];
            } catch (error) {
                logError('cleanupActiveTweens', error);
            }
        };

        /**
         * Safe calculation of tilt values with comprehensive error handling
         */
        const calculateTiltValues = (mouseX: number, mouseY: number) => {
            try {
                // Validate slider element
                if (!sliderElement) {
                    throw new Error('Slider element is undefined');
                }

                const containerWidth = sliderElement.clientWidth;
                const containerHeight = sliderElement.clientHeight;

                // Validate container dimensions
                if (containerWidth <= 0 || containerHeight <= 0) {
                    throw new Error('Invalid container dimensions');
                }

                const centerX = containerWidth / 2;
                const centerY = containerHeight / 2;

                // Calculate offsets from center
                const offsetX = centerX - mouseX;
                const offsetY = centerY - mouseY;

                // Store for comparison in throttling
                animationStateRef.current.lastOffsetX = offsetX;
                animationStateRef.current.lastOffsetY = offsetY;

                // Constrained shift calculations
                const rawContainerShiftX = offsetX * 0.05;
                const rawContainerShiftY = offsetY * 0.1;
                const maxShiftX = containerWidth * maxContainerShiftFraction;
                const maxShiftY = containerHeight * maxContainerShiftFraction;

                const containerShiftX = Math.max(Math.min(rawContainerShiftX, maxShiftX), -maxShiftX);
                const containerShiftY = Math.max(Math.min(rawContainerShiftY, maxShiftY), -maxShiftY);

                // Title and subtitle shift calculations
                const maxTitleShift = containerWidth * 0.1;
                const titleRawShiftX = offsetX * 0.8;
                const titleShiftX = Math.max(Math.min(titleRawShiftX, maxTitleShift), -maxTitleShift);

                const maxSubtitleShift = containerWidth * 0.15;
                const subtitleRawShiftX = offsetX;
                const subtitleShiftX = Math.max(Math.min(subtitleRawShiftX, maxSubtitleShift), -maxSubtitleShift);

                return {
                    containerShiftX,
                    containerShiftY,
                    titleShiftX,
                    subtitleShiftX,
                    centerX,
                    centerY
                };
            } catch (error) {
                logError('calculateTiltValues', error);

                // Return safe default values
                return {
                    containerShiftX: 0,
                    containerShiftY: 0,
                    titleShiftX: 0,
                    subtitleShiftX: 0,
                    centerX: sliderElement?.clientWidth / 2 || 0,
                    centerY: sliderElement?.clientHeight / 2 || 0
                };
            }
        };

        /**
         * Apply tilt effect with comprehensive error handling and resource tracking
         */
        const applyTiltEffect = (tiltValues: ReturnType<typeof calculateTiltValues>) => {
            try {
                // Check for cancellation
                if (cancellationRef.current.isCancelled) return;

                const activeTextContainer = textContainersRef.current[currentIndex.current];

                if (!activeTextContainer || activeTextContainer.children.length < 2) {
                    return;
                }

                // Clear previous animations
                cleanupActiveTweens();

                // Create and track animations
                const createTrackedTween = (target: any, props: any) => {
                    const tween = gsap.to(target, {
                        ...props,
                        onComplete: () => {
                            // Re-track the object after animation
                            if (resourceManager) {
                                resourceManager.trackDisplayObject(target);
                            }
                        }
                    });

                    // Track the animation
                    if (resourceManager) {
                        resourceManager.trackAnimation(tween);
                    }

                    activeTweensRef.current.push(tween);
                    return tween;
                };

                // Container animation
                createTrackedTween(activeTextContainer, {
                    x: tiltValues.centerX + tiltValues.containerShiftX,
                    y: tiltValues.centerY + tiltValues.containerShiftY,
                    duration: 0.5,
                    ease: "expo.out"
                });

                // Title animation
                if (activeTextContainer.children[0]) {
                    createTrackedTween(activeTextContainer.children[0], {
                        x: tiltValues.titleShiftX,
                        duration: 0.5,
                        ease: "expo.out"
                    });
                }

                // Subtitle animation
                if (activeTextContainer.children[1]) {
                    createTrackedTween(activeTextContainer.children[1], {
                        x: tiltValues.subtitleShiftX,
                        duration: 0.5,
                        ease: "expo.out"
                    });
                }

                // Mark as animating
                animationStateRef.current.isAnimating = true;
            } catch (error) {
                logError('applyTiltEffect', error);

                // Reset animation state on error
                animationStateRef.current.isAnimating = false;
            }
        };

        /**
         * Reset tilt effect with comprehensive cleanup
         */
        const resetTiltEffect = () => {
            try {
                // Check for cancellation
                if (cancellationRef.current.isCancelled) return;

                const activeContainer = textContainersRef.current[currentIndex.current];

                if (!activeContainer) return;

                // Clear previous animations
                cleanupActiveTweens();

                // Calculate center
                const centerX = sliderElement.clientWidth / 2;
                const centerY = sliderElement.clientHeight / 2;

                // Create reset animation function
                const createResetTween = (target: any, props: any) => {
                    const tween = gsap.to(target, {
                        ...props,
                        duration: 1,
                        ease: "expo.inOut",
                        onComplete: () => {
                            // Re-track object after animation
                            if (resourceManager) {
                                resourceManager.trackDisplayObject(target);
                            }
                        }
                    });

                    // Track animation
                    if (resourceManager) {
                        resourceManager.trackAnimation(tween);
                    }

                    activeTweensRef.current.push(tween);
                    return tween;
                };

                // Container reset
                createResetTween(activeContainer, {
                    x: centerX,
                    y: centerY,
                    onComplete: () => {
                        animationStateRef.current.isAnimating = false;
                    }
                });

                // Reset title
                if (activeContainer.children[0]) {
                    createResetTween(activeContainer.children[0], { x: 0 });
                }

                // Reset subtitle
                if (activeContainer.children[1]) {
                    createResetTween(activeContainer.children[1], { x: 0 });
                }

                // Reset filters if they exist
                const resetFilterTween = (filterRef: RefObject<DisplacementFilter | null>) => {
                    if (filterRef.current) {
                        const tween = gsap.to(filterRef.current.scale, {
                            x: 0,
                            y: 0,
                            duration: 1,
                            ease: "expo.inOut",
                            onComplete: () => {
                                if (resourceManager && filterRef.current) {
                                    resourceManager.trackFilter(filterRef.current);
                                }
                            }
                        });

                        if (resourceManager) {
                            resourceManager.trackAnimation(tween);
                        }

                        activeTweensRef.current.push(tween);
                    }
                };

                resetFilterTween(bgDispFilterRef);
                if (cursorImgEffect) {
                    resetFilterTween(cursorDispFilterRef);
                }
            } catch (error) {
                logError('resetTiltEffect', error);

                // Ensure animation state is reset
                animationStateRef.current.isAnimating = false;
            }
        };

        /**
         * Throttled mouse move handler
         */
        const handleTextTilt = (e: MouseEvent) => {
            try {
                // Skip if cancelled
                if (cancellationRef.current.isCancelled) return;

                const now = Date.now();

                // Throttle check
                if (now - lastMoveTimeRef.current < throttleTime) {
                    return;
                }

                // Update last move time
                lastMoveTimeRef.current = now;

                // Calculate tilt values
                const tiltValues = calculateTiltValues(e.clientX, e.clientY);

                // Apply tilt effect
                applyTiltEffect(tiltValues);

                // Clear existing timeout
                if (tiltTimeoutRef.current !== null) {
                    if (resourceManager) {
                        resourceManager.clearTimeout(tiltTimeoutRef.current);
                    } else {
                        clearTimeout(tiltTimeoutRef.current);
                    }
                    tiltTimeoutRef.current = null;
                }

                // Set reset timeout
                const setTimeoutFn = () => {
                    resetTiltEffect();
                    tiltTimeoutRef.current = null;
                };

                // Use ResourceManager for timeout if available
                if (resourceManager) {
                    tiltTimeoutRef.current = resourceManager.setTimeout(setTimeoutFn, 300);
                } else {
                    tiltTimeoutRef.current = window.setTimeout(setTimeoutFn, 300);
                }
            } catch (error) {
                logError('handleTextTilt', error);
            }
        };

        // Add event listener
        sliderElement.addEventListener("mousemove", handleTextTilt, { passive: true });

        // Cleanup function
        return () => {
            // Set cancellation flag
            cancellationRef.current.isCancelled = true;

            // Remove event listener
            sliderElement.removeEventListener("mousemove", handleTextTilt);

            // Clean up tweens
            cleanupActiveTweens();

            // Clear timeout
            if (tiltTimeoutRef.current !== null) {
                if (resourceManager) {
                    resourceManager.clearTimeout(tiltTimeoutRef.current);
                } else {
                    clearTimeout(tiltTimeoutRef.current);
                }
                tiltTimeoutRef.current = null;
            }
        };
    }, [
        sliderRef,
        textContainersRef,
        currentIndex,
        cursorTextEffect,
        maxContainerShiftFraction,
        bgDispFilterRef,
        cursorDispFilterRef,
        cursorImgEffect,
        resourceManager,
        throttleTime
    ]);
};

export default useTextTilt;