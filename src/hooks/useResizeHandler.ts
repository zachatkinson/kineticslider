import { useEffect, useRef, useCallback, type RefObject } from "react";
import { Application, Sprite, Container } from "pixi.js";
import ResourceManager from '../managers/ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

// Default debounce time
const DEFAULT_DEBOUNCE_TIME = 100;

// Cancellation flag interface
interface CancellationFlags {
    isCancelled: boolean;
}

interface ResizeHandlerProps {
    sliderRef: RefObject<HTMLDivElement | null>;
    appRef: RefObject<Application | null>;
    slidesRef: RefObject<Sprite[]>;
    textContainersRef: RefObject<Container[]>;
    backgroundDisplacementSpriteRef: RefObject<Sprite | null>;
    cursorDisplacementSpriteRef: RefObject<Sprite | null>;
    resourceManager?: ResourceManager | null;
    debounceTime?: number;
}

/**
 * Hook to handle resize events for the slider
 * Ensures proper scaling and positioning of all visual elements when the window resizes
 */
const useResizeHandler = ({
                              sliderRef,
                              appRef,
                              slidesRef,
                              textContainersRef,
                              backgroundDisplacementSpriteRef,
                              cursorDisplacementSpriteRef,
                              resourceManager,
                              debounceTime = DEFAULT_DEBOUNCE_TIME
                          }: ResizeHandlerProps) => {
    // Cancellation flag to prevent race conditions
    const cancellationRef = useRef<CancellationFlags>({ isCancelled: false });

    // Store debounce timer
    const resizeTimerRef = useRef<number | null>(null);

    /**
     * Calculate sprite scale based on dimensions with improved error handling
     */
    const calculateSpriteScale = useCallback((
        sprite: Sprite,
        containerWidth: number,
        containerHeight: number
    ): boolean => {
        try {
            // Validate texture and dimensions
            if (!sprite.texture || !sprite.texture.width || !sprite.texture.height) {
                if (isDevelopment) {
                    console.warn('Invalid sprite or texture for scaling', {
                        textureExists: !!sprite.texture,
                        width: sprite.texture?.width,
                        height: sprite.texture?.height
                    });
                }
                return false;
            }

            const imageWidth = sprite.texture.width;
            const imageHeight = sprite.texture.height;

            // Skip invalid container dimensions
            if (!containerWidth || !containerHeight) {
                if (isDevelopment) {
                    console.warn('Invalid container dimensions for sprite scaling', {
                        containerWidth,
                        containerHeight
                    });
                }
                return false;
            }

            // Calculate scale based on aspect ratios
            const imageAspect = imageWidth / imageHeight;
            const containerAspect = containerWidth / containerHeight;

            const scale = imageAspect > containerAspect
                ? containerHeight / imageHeight
                : containerWidth / imageWidth;

            // Apply scale and center sprite
            sprite.scale.set(scale);

            // Store base scale for future reference
            (sprite as any).baseScale = scale;

            // Center the sprite
            sprite.x = containerWidth / 2;
            sprite.y = containerHeight / 2;

            // Track with ResourceManager
            if (resourceManager) {
                resourceManager.trackDisplayObject(sprite);
            }

            return true;
        } catch (error) {
            if (isDevelopment) {
                console.error('Unexpected error in sprite scaling:', error);
            }
            return false;
        }
    }, [resourceManager]);

    /**
     * Center a container within the slider
     */
    const centerContainer = useCallback((
        container: Container,
        width: number,
        height: number
    ): void => {
        try {
            container.x = width / 2;
            container.y = height / 2;

            // Track the updated container with ResourceManager
            if (resourceManager) {
                resourceManager.trackDisplayObject(container);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error centering container:', error);
            }
        }
    }, [resourceManager]);

    /**
     * Main resize handler function with comprehensive error handling
     */
    const handleResize = useCallback(() => {
        // Reset cancellation flag
        cancellationRef.current.isCancelled = false;

        // Validate essential references
        if (!sliderRef.current || !appRef.current) {
            if (isDevelopment) {
                console.warn('useResizeHandler: Missing essential references');
            }
            return;
        }

        try {
            const app = appRef.current;
            const containerWidth = sliderRef.current.clientWidth;
            const containerHeight = sliderRef.current.clientHeight;

            if (isDevelopment) {
                console.log(`Resizing to: ${containerWidth}x${containerHeight}`);
            }

            // Clear any existing resize timer
            if (resizeTimerRef.current !== null) {
                if (resourceManager) {
                    resourceManager.clearTimeout(resizeTimerRef.current);
                } else {
                    clearTimeout(resizeTimerRef.current);
                }
                resizeTimerRef.current = null;
            }

            // Debounced resize function
            const resizeFn = () => {
                // Check for cancellation
                if (cancellationRef.current.isCancelled) return;

                try {
                    // Resize renderer
                    app.renderer.resize(containerWidth, containerHeight);

                    // Update slides
                    slidesRef.current.forEach((sprite) => {
                        calculateSpriteScale(sprite, containerWidth, containerHeight);
                    });

                    // Update text containers
                    textContainersRef.current.forEach((container) => {
                        centerContainer(container, containerWidth, containerHeight);
                    });

                    // Update displacement sprites
                    if (backgroundDisplacementSpriteRef.current) {
                        centerContainer(
                            backgroundDisplacementSpriteRef.current,
                            containerWidth,
                            containerHeight
                        );
                    }

                    if (cursorDisplacementSpriteRef.current) {
                        centerContainer(
                            cursorDisplacementSpriteRef.current,
                            containerWidth,
                            containerHeight
                        );
                    }

                    if (isDevelopment) {
                        console.log('Resize handler completed successfully');
                    }
                } catch (error) {
                    if (isDevelopment) {
                        console.error('Error in resize handler execution:', error);
                    }
                }
            };

            // Set timeout using ResourceManager or window
            if (resourceManager) {
                resizeTimerRef.current = resourceManager.setTimeout(resizeFn, debounceTime);
            } else {
                resizeTimerRef.current = window.setTimeout(resizeFn, debounceTime);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Unexpected error in resize handling:', error);
            }
        }
    }, [
        sliderRef,
        appRef,
        slidesRef,
        textContainersRef,
        backgroundDisplacementSpriteRef,
        cursorDisplacementSpriteRef,
        resourceManager,
        debounceTime,
        calculateSpriteScale,
        centerContainer
    ]);

    // Main effect for resize handling
    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        // Add resize event listener
        window.addEventListener("resize", handleResize);

        // Initial resize
        handleResize();

        // Cleanup function
        return () => {
            // Set cancellation flag
            cancellationRef.current.isCancelled = true;

            // Remove resize listener
            window.removeEventListener("resize", handleResize);

            // Clear any pending resize timer
            if (resizeTimerRef.current !== null) {
                if (resourceManager) {
                    resourceManager.clearTimeout(resizeTimerRef.current);
                } else {
                    clearTimeout(resizeTimerRef.current);
                }
                resizeTimerRef.current = null;
            }
        };
    }, [handleResize, resourceManager]);

    // No return value needed as this hook sets up the resize handler
};

export default useResizeHandler;