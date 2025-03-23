import { useEffect, useRef, useCallback } from 'react';
import ResourceManager from '../managers/ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

// Enhanced interfaces for better type safety
interface UseNavigationProps {
    onNext: () => void;
    onPrev: () => void;
    enableKeyboardNav?: boolean;
    resourceManager?: ResourceManager | null;
}

interface NavigationResult {
    goNext: () => void;
    goPrev: () => void;
    isKeyboardEnabled: boolean;
}

// Type definition for event callbacks to match ResourceManager's expected type
type EventCallback = EventListenerOrEventListenerObject;

// Interface for stable handler storage
interface StableHandlers {
    keyDownHandler: EventCallback;
    slideChangeHandler: EventCallback;
    latestNextFn: (() => void) | null;
    latestPrevFn: (() => void) | null;
}

// Interface for batch operation states
interface BatchOperationState {
    pendingListeners: Map<EventTarget, Map<string, EventCallback[]>>;
    processedCount: number;
}

/**
 * Hook to set up navigation controls for the slider
 * Fully optimized with:
 * - Batch event listener registration
 * - Comprehensive error handling
 * - Memory leak prevention
 * - Stable handler references
 * - Strong cancellation mechanisms
 * - Server-side rendering safety
 */
const useNavigation = ({
                           onNext,
                           onPrev,
                           enableKeyboardNav = true,
                           resourceManager
                       }: UseNavigationProps): NavigationResult => {
    // Track component mount state
    const isMountedRef = useRef(true);

    // Track batch operations
    const batchOperationsRef = useRef<BatchOperationState>({
        pendingListeners: new Map(),
        processedCount: 0
    });

    // Define stable handler interface with ref
    const handlersRef = useRef<StableHandlers>({
        keyDownHandler: (event: Event) => {
            try {
                if (!isMountedRef.current || !enableKeyboardNav) return;

                const keyEvent = event as KeyboardEvent;
                const handlers = handlersRef.current;

                // Handle keyboard navigation
                switch (keyEvent.key) {
                    case 'ArrowLeft':
                        if (handlers.latestPrevFn) {
                            handlers.latestPrevFn();
                        }
                        break;
                    case 'ArrowRight':
                        if (handlers.latestNextFn) {
                            handlers.latestNextFn();
                        }
                        break;
                }
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in keyboard navigation handler:', error);
                }
            }
        },
        slideChangeHandler: (event: Event) => {
            try {
                if (!isMountedRef.current) return;

                const customEvent = event as CustomEvent;
                const handlers = handlersRef.current;

                // Handle custom slide change events
                if (customEvent.detail && typeof customEvent.detail.nextIndex === 'number') {
                    if (handlers.latestNextFn) {
                        handlers.latestNextFn();
                    }
                }
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in slide change handler:', error);
                }
            }
        },
        latestNextFn: null,
        latestPrevFn: null
    });

    /**
     * Process any pending event listeners in batch
     */
    const processPendingListeners = useCallback(() => {
        try {
            const { pendingListeners } = batchOperationsRef.current;

            // Skip if no ResourceManager or no pending listeners
            if (!resourceManager || pendingListeners.size === 0) return;

            let totalProcessed = 0;

            // Process each event target
            pendingListeners.forEach((listenerMap, target) => {
                try {
                    resourceManager.addEventListenerBatch(target, listenerMap);
                    totalProcessed += Array.from(listenerMap.values())
                        .reduce((sum, callbacks) => sum + callbacks.length, 0);
                } catch (error) {
                    if (isDevelopment) {
                        console.error('Error processing listener batch for target:', error);
                    }
                }
            });

            // Clear the pending map
            pendingListeners.clear();

            // Update processed count
            batchOperationsRef.current.processedCount += totalProcessed;

            if (isDevelopment) {
                console.log(`Processed ${totalProcessed} event listeners in batch`);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error processing batch listeners:', error);
            }
            // Clear pending listeners even on error
            batchOperationsRef.current.pendingListeners.clear();
        }
    }, [resourceManager]);

    /**
     * Add a listener to the pending batch
     */
    const addListenerToBatch = useCallback((
        target: EventTarget,
        eventType: string,
        callback: EventCallback
    ) => {
        try {
            const { pendingListeners } = batchOperationsRef.current;

            // Get or create map for this target
            if (!pendingListeners.has(target)) {
                pendingListeners.set(target, new Map());
            }

            const targetMap = pendingListeners.get(target)!;

            // Get or create array for this event type
            if (!targetMap.has(eventType)) {
                targetMap.set(eventType, []);
            }

            // Add callback to the list
            targetMap.get(eventType)!.push(callback);

            return true;
        } catch (error) {
            if (isDevelopment) {
                console.error('Error adding listener to batch:', error);
            }
            return false;
        }
    }, []);

    // Keep the latest function references updated
    useEffect(() => {
        handlersRef.current.latestNextFn = onNext;
        handlersRef.current.latestPrevFn = onPrev;
    }, [onNext, onPrev]);

    // Set up keyboard navigation
    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        // Skip if keyboard navigation is disabled
        if (!enableKeyboardNav) return;

        // Reset mounted state
        isMountedRef.current = true;

        try {
            const { keyDownHandler } = handlersRef.current;

            // Start performance timer if in development
            const startTime = isDevelopment ? performance.now() : 0;

            // Register event listener with batch processing if ResourceManager available
            if (resourceManager) {
                // Add to batch operations
                addListenerToBatch(window, 'keydown', keyDownHandler);

                // Process in batch
                processPendingListeners();
            } else {
                // Direct registration
                window.addEventListener('keydown', keyDownHandler);
            }

            // Log performance if in development
            if (isDevelopment && startTime > 0) {
                const setupTime = performance.now() - startTime;
                console.log(`Keyboard navigation setup completed in ${setupTime.toFixed(2)}ms`);
            }

            // Cleanup on unmount
            return () => {
                // Update mounted state immediately
                isMountedRef.current = false;

                try {
                    // ResourceManager handles its own cleanup
                    if (!resourceManager) {
                        window.removeEventListener('keydown', keyDownHandler);
                    }
                } catch (cleanupError) {
                    if (isDevelopment) {
                        console.error('Error during keyboard navigation cleanup:', cleanupError);
                    }
                }
            };
        } catch (error) {
            if (isDevelopment) {
                console.error('Error setting up keyboard navigation:', error);
            }
            // Return empty cleanup function
            return () => {};
        }
    }, [enableKeyboardNav, resourceManager, addListenerToBatch, processPendingListeners]);

    // Listen for custom slide change events
    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        try {
            const { slideChangeHandler } = handlersRef.current;

            // Start performance timer if in development
            const startTime = isDevelopment ? performance.now() : 0;

            // Register with batch processing if ResourceManager is available
            if (resourceManager) {
                // Add to batch operations
                addListenerToBatch(window, 'slideChange', slideChangeHandler);

                // Process in batch
                processPendingListeners();
            } else {
                // Direct registration
                window.addEventListener('slideChange', slideChangeHandler);
            }

            // Log performance if in development
            if (isDevelopment && startTime > 0) {
                const setupTime = performance.now() - startTime;
                console.log(`Slide change listener setup completed in ${setupTime.toFixed(2)}ms`);
            }

            // Cleanup on unmount
            return () => {
                try {
                    // ResourceManager handles its own cleanup
                    if (!resourceManager) {
                        window.removeEventListener('slideChange', slideChangeHandler);
                    }
                } catch (cleanupError) {
                    if (isDevelopment) {
                        console.error('Error removing slide change event listener:', cleanupError);
                    }
                }
            };
        } catch (error) {
            if (isDevelopment) {
                console.error('Error setting up slide change listener:', error);
            }
            // Return empty cleanup function
            return () => {};
        }
    }, [resourceManager, addListenerToBatch, processPendingListeners]);

    // Expose memoized navigation methods
    const goNext = useCallback(() => {
        try {
            if (isMountedRef.current && handlersRef.current.latestNextFn) {
                const startTime = isDevelopment ? performance.now() : 0;

                handlersRef.current.latestNextFn();

                if (isDevelopment && startTime > 0) {
                    const executionTime = performance.now() - startTime;
                    console.log(`Navigation next completed in ${executionTime.toFixed(2)}ms`);
                }
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error in goNext navigation function:', error);
            }
        }
    }, []);

    const goPrev = useCallback(() => {
        try {
            if (isMountedRef.current && handlersRef.current.latestPrevFn) {
                const startTime = isDevelopment ? performance.now() : 0;

                handlersRef.current.latestPrevFn();

                if (isDevelopment && startTime > 0) {
                    const executionTime = performance.now() - startTime;
                    console.log(`Navigation prev completed in ${executionTime.toFixed(2)}ms`);
                }
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Error in goPrev navigation function:', error);
            }
        }
    }, []);

    return {
        goNext,
        goPrev,
        isKeyboardEnabled: enableKeyboardNav
    };
};

export default useNavigation;