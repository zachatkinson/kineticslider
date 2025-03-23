import { useEffect, useRef, useCallback } from 'react';
import { type NavElement } from '../types';
import type ResourceManager from "../managers/ResourceManager";

// Define EventCallback type to match ResourceManager's definition
type EventCallback = EventListenerOrEventListenerObject;

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

interface UseExternalNavProps {
    externalNav: boolean;
    navElement: NavElement;
    handleNext: () => void;
    handlePrev: () => void;
    resourceManager?: ResourceManager | null;
}

/**
 * Hook to set up external navigation elements for the slider
 * Fully optimized with:
 * - Batch event listener registration
 * - Stable event handler references
 * - Comprehensive error handling
 * - Memory leak prevention
 * - Element reference caching
 * - Event propagation control
 * - Optimized dependency tracking
 * - Type safety improvements
 */
const useExternalNav = ({
                            externalNav,
                            navElement,
                            handleNext,
                            handlePrev,
                            resourceManager
                        }: UseExternalNavProps) => {
    // Track found elements to avoid unnecessary DOM queries
    const elementsRef = useRef<{
        prevNav: Element | null;
        nextNav: Element | null;
    }>({ prevNav: null, nextNav: null });

    // Define a stable interface for our event handlers
    interface StableHandlers {
        prevHandler: EventCallback;
        nextHandler: EventCallback;
        latestPrevFn: (() => void) | null;
        latestNextFn: (() => void) | null;
    }

    // Create stable event handlers that internally reference the latest callback functions
    const handlersRef = useRef<StableHandlers>({
        prevHandler: (e: Event) => {
            try {
                e.preventDefault();
                // Call the latest function reference
                const latestHandler = handlersRef.current.latestPrevFn;
                if (typeof latestHandler === 'function') {
                    latestHandler();
                }
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in previous navigation handler:', error);
                }
            }
        },
        nextHandler: (e: Event) => {
            try {
                e.preventDefault();
                // Call the latest function reference
                const latestHandler = handlersRef.current.latestNextFn;
                if (typeof latestHandler === 'function') {
                    latestHandler();
                }
            } catch (error) {
                if (isDevelopment) {
                    console.error('Error in next navigation handler:', error);
                }
            }
        },
        latestPrevFn: null,
        latestNextFn: null
    });

    // Keep the latest function references updated
    useEffect(() => {
        handlersRef.current.latestPrevFn = handlePrev;
        handlersRef.current.latestNextFn = handleNext;
    }, [handlePrev, handleNext]);

    // Memoize the batch registration function for better performance
    const setupBatchListeners = useCallback((
        prevElement: Element,
        nextElement: Element,
        prevHandler: EventCallback,
        nextHandler: EventCallback
    ) => {
        try {
            if (!resourceManager) return false;

            // Create listeners maps for each element
            const prevListenersMap = new Map<string, EventCallback[]>();
            prevListenersMap.set('click', [prevHandler]);

            const nextListenersMap = new Map<string, EventCallback[]>();
            nextListenersMap.set('click', [nextHandler]);

            // Register event listeners in batch operations
            resourceManager.addEventListenerBatch(prevElement, prevListenersMap);
            resourceManager.addEventListenerBatch(nextElement, nextListenersMap);

            return true;
        } catch (error) {
            if (isDevelopment) {
                console.error('Error setting up batch listeners:', error);
            }
            return false;
        }
    }, [resourceManager]);

    // Setup regular DOM event listeners
    const setupDirectListeners = useCallback((
        prevElement: Element,
        nextElement: Element,
        prevHandler: EventCallback,
        nextHandler: EventCallback
    ) => {
        try {
            prevElement.addEventListener('click', prevHandler);
            nextElement.addEventListener('click', nextHandler);
            return true;
        } catch (error) {
            if (isDevelopment) {
                console.error('Error setting up direct listeners:', error);
            }
            return false;
        }
    }, []);

    // Main effect for setting up and cleaning up navigation
    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        // Skip if external navigation is not enabled
        if (!externalNav) return;

        // Track initialization status for cleanup
        let isInitialized = false;

        try {
            // Find the navigation elements in the DOM
            const prevNav = document.querySelector(navElement.prev);
            const nextNav = document.querySelector(navElement.next);

            // Store references to found elements
            elementsRef.current = { prevNav, nextNav };

            // Check if both elements are found
            if (!prevNav || !nextNav) {
                // Create helpful error message
                const missingElements = [];
                if (!prevNav) missingElements.push(`"${navElement.prev}"`);
                if (!nextNav) missingElements.push(`"${navElement.next}"`);

                // Log warning in development mode
                if (isDevelopment) {
                    console.warn(
                        `KineticSlider: External navigation elements not found: ${missingElements.join(', ')}. ` +
                        `Ensure these selectors exist in the DOM.`
                    );
                }
                return;
            }

            // Get stable event handlers
            const { prevHandler, nextHandler } = handlersRef.current;

            // Try batch registration first, fall back to direct listeners if needed
            let registrationSuccessful = false;

            if (resourceManager) {
                registrationSuccessful = setupBatchListeners(
                    prevNav, nextNav, prevHandler, nextHandler
                );
            }

            // Fall back to direct listeners if batch registration failed or unavailable
            if (!registrationSuccessful) {
                registrationSuccessful = setupDirectListeners(
                    prevNav, nextNav, prevHandler, nextHandler
                );
            }

            // Mark as successfully initialized
            isInitialized = registrationSuccessful;

        } catch (error) {
            // Handle any unexpected errors during initialization
            if (isDevelopment) {
                console.error('Error initializing external navigation:', error);
            }
        }

        // Cleanup on unmount or dependencies change
        return () => {
            try {
                // Skip cleanup if not initialized
                if (!isInitialized) return;

                // Get current element references for cleanup
                const { prevNav, nextNav } = elementsRef.current;
                const { prevHandler, nextHandler } = handlersRef.current;

                // ResourceManager handles its own cleanup
                if (!resourceManager && prevNav && nextNav) {
                    // Safely remove event listeners
                    try {
                        prevNav.removeEventListener('click', prevHandler);
                    } catch (e) {
                        if (isDevelopment) {
                            console.warn('Error removing event listener from previous nav:', e);
                        }
                    }

                    try {
                        nextNav.removeEventListener('click', nextHandler);
                    } catch (e) {
                        if (isDevelopment) {
                            console.warn('Error removing event listener from next nav:', e);
                        }
                    }
                }

                // Clear element references to help garbage collection
                elementsRef.current = { prevNav: null, nextNav: null };
            } catch (cleanupError) {
                // Handle errors during cleanup
                if (isDevelopment) {
                    console.error('Error during navigation cleanup:', cleanupError);
                }
            }
        };
    }, [
        externalNav,
        navElement.prev,
        navElement.next,
        resourceManager,
        setupBatchListeners,
        setupDirectListeners
    ]);

    // Return current elements for potential external use
    return {
        elements: elementsRef.current
    };
};

export default useExternalNav;