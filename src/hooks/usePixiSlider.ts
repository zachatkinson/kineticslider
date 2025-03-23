import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import type { KineticSliderProps } from '../types';
import ResourceManager from '../managers/ResourceManager';

// Development environment logging utility
const createLogger = () => ({
    info: (message: string, ...args: any[]) => {
        if (import.meta.env?.MODE === 'development') {
            console.log(`[usePixiSlider:INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: any[]) => {
        if (import.meta.env?.MODE === 'development') {
            console.warn(`[usePixiSlider:WARN] ${message}`, ...args);
        }
    },
    error: (message: string, error?: unknown) => {
        if (import.meta.env?.MODE === 'development') {
            console.error(`[usePixiSlider:ERROR] ${message}`, error);
        }
    }
});

// Comprehensive cancellation and lifecycle management interface
interface CancellationFlags {
    isCancelled: boolean;
}

// Enhanced state interface with comprehensive typing
interface SliderState {
    isInitializing: boolean;
    isInitialized: boolean;
    currentSlide: number;
    error?: string | null;
}

// Module cache interface for dynamic imports
interface ModuleCache {
    gsap?: any;
    hooks?: any;
    lastUpdated: number;
}

// Performance tracking interface
interface PerformanceMetrics {
    initializationStart?: number;
    initializationEnd?: number;
    totalInitTime?: number;
}

/**
 * Advanced PixiJS Slider Hook with Comprehensive Optimization
 */
export const usePixiSlider = (
    sliderRef: RefObject<HTMLDivElement>,
    canvasContainerRef: RefObject<HTMLDivElement>,
    props: KineticSliderProps,
    resourceManager?: ResourceManager | null
) => {
    // Logger initialization
    const logger = createLogger();

    // Refs for advanced state management
    const cancellationRef = useRef<CancellationFlags>({ isCancelled: false });
    const modulesRef = useRef<ModuleCache>({
        lastUpdated: 0
    });
    const performanceRef = useRef<PerformanceMetrics>({});

    // Comprehensive state management
    const [sliderState, setSliderState] = useState<SliderState>({
        isInitializing: false,
        isInitialized: false,
        currentSlide: 0,
        error: null
    });

    // Advanced module import with comprehensive error handling
    const safeImportModule = useCallback(async <T>(
        importFn: () => Promise<T>,
        moduleName: string
    ): Promise<T | null> => {
        try {
            logger.info(`Importing module: ${moduleName}`);
            const startTime = performance.now();

            const module = await importFn();

            const endTime = performance.now();
            logger.info(`Module ${moduleName} imported in ${(endTime - startTime).toFixed(2)}ms`);

            return module;
        } catch (error) {
            logger.error(`Failed to import ${moduleName}`, error);

            // Update state with error
            setSliderState(prev => ({
                ...prev,
                error: `Module import failed: ${moduleName}`
            }));

            return null;
        }
    }, []);

    // Comprehensive initialization function
    const initializeSlider = useCallback(async () => {
        // Reset performance tracking
        performanceRef.current.initializationStart = performance.now();

        // Reset cancellation and state
        cancellationRef.current.isCancelled = false;
        setSliderState(prev => ({
            ...prev,
            isInitializing: true,
            error: null
        }));

        // Server-side and early exit checks
        if (typeof window === 'undefined') {
            logger.warn('Initialization cancelled: Server-side environment');
            return false;
        }

        // Validate references
        if (!sliderRef.current || !canvasContainerRef.current) {
            logger.warn('Initialization cancelled: Missing references');
            setSliderState(prev => ({
                ...prev,
                isInitializing: false,
                error: 'Missing DOM references'
            }));
            return false;
        }

        try {
            // Dynamic module imports with comprehensive error handling
            const [gsapModule, hooksModule] = await Promise.all([
                safeImportModule(() => import('gsap'), 'GSAP'),
                safeImportModule(() => import('./index.ts'), 'Hooks')
            ]);

            // Check for cancellation after async operations
            if (cancellationRef.current.isCancelled) {
                logger.info('Initialization cancelled during module import');
                return false;
            }

            // Validate imported modules
            if (!gsapModule || !hooksModule) {
                throw new Error('Failed to import required modules');
            }

            // Register GSAP plugin if available
            try {
                const { default: PixiPlugin } = await import('gsap/PixiPlugin');
                gsapModule.gsap.registerPlugin(PixiPlugin);
                logger.info('GSAP PixiPlugin registered successfully');
            } catch (pluginError) {
                logger.warn('Could not load PixiPlugin', pluginError);
            }

            // Initialize PixiJS application
            const { pixiRefs, isInitialized: pixiInitialized } = await hooksModule.usePixiApp(
                sliderRef,
                props.images,
                [
                    props.backgroundDisplacementSpriteLocation || '',
                    props.cursorDisplacementSpriteLocation || ''
                ],
                resourceManager
            );

            // Check for cancellation
            if (cancellationRef.current.isCancelled) {
                logger.info('Initialization cancelled during PixiJS setup');
                return false;
            }

            // Validate PixiJS initialization
            if (!pixiInitialized) {
                throw new Error('Failed to initialize PixiJS application');
            }

            // Setup slider components
            await setupSliderComponents(pixiRefs, hooksModule, resourceManager, props);

            // Check for final cancellation
            if (cancellationRef.current.isCancelled) {
                logger.info('Initialization cancelled during component setup');
                return false;
            }

            // Update state to show successful initialization
            setSliderState(prev => ({
                ...prev,
                isInitializing: false,
                isInitialized: true,
                error: null
            }));

            // Record initialization performance
            performanceRef.current.initializationEnd = performance.now();
            performanceRef.current.totalInitTime =
                performanceRef.current.initializationEnd -
                performanceRef.current.initializationStart;

            logger.info(`Slider initialized in ${performanceRef.current.totalInitTime?.toFixed(2)}ms`);

            return true;
        } catch (error) {
            // Comprehensive error handling
            logger.error('Slider initialization failed', error);

            setSliderState(prev => ({
                ...prev,
                isInitializing: false,
                isInitialized: false,
                error: error instanceof Error ? error.message : 'Unknown initialization error'
            }));

            return false;
        }
    }, [
        sliderRef,
        canvasContainerRef,
        props.images,
        props.backgroundDisplacementSpriteLocation,
        props.cursorDisplacementSpriteLocation,
        resourceManager,
        safeImportModule
    ]);

    // Comprehensive slider component setup
    const setupSliderComponents = useCallback(async (
        pixiRefs: any,
        hooks: any,
        resourceManager?: ResourceManager | null,
        sliderProps?: KineticSliderProps
    ) => {
        if (!hooks || !sliderProps) {
            logger.warn('Cannot setup slider components: Missing hooks or props');
            return;
        }

        try {
            // Create hook params object
            const hookParams = {
                sliderRef,
                pixi: pixiRefs,
                props: sliderProps,
                resourceManager
            };

            // Parallel component setup with error handling
            await Promise.allSettled([
                hooks.useSlides(hookParams),
                hooks.useTextContainers(hookParams)
            ].map(async (setupPromise) => {
                try {
                    await setupPromise;
                } catch (error) {
                    logger.error('Error in slider component setup', error);
                }
            }));

        } catch (error) {
            logger.error('Comprehensive slider component setup failed', error);
            throw error;
        }
    }, [sliderRef]);

    // Initialize the slider on mount
    useEffect(() => {
        // Attempt initialization
        initializeSlider();

        // Cleanup function
        return () => {
            // Set cancellation flag
            cancellationRef.current.isCancelled = true;

            // Reset state on unmount
            setSliderState({
                isInitializing: false,
                isInitialized: false,
                currentSlide: 0,
                error: null
            });
        };
    }, [initializeSlider]);

    // Memoized navigation functions
    const goToNextSlide = useCallback(() => {
        if (!sliderState.isInitialized) return;

        setSliderState(prev => ({
            ...prev,
            currentSlide: (prev.currentSlide + 1) % props.images.length
        }));
    }, [props.images.length, sliderState.isInitialized]);

    const goToPrevSlide = useCallback(() => {
        if (!sliderState.isInitialized) return;

        setSliderState(prev => ({
            ...prev,
            currentSlide: (prev.currentSlide - 1 + props.images.length) % props.images.length
        }));
    }, [props.images.length, sliderState.isInitialized]);

    // Return comprehensive hook result
    return {
        // Initialization states
        isInitialized: sliderState.isInitialized,
        isInitializing: sliderState.isInitializing,

        // Current slide tracking
        currentSlide: sliderState.currentSlide,

        // Error handling
        error: sliderState.error,

        // Navigation methods
        goToNextSlide,
        goToPrevSlide,

        // Performance metrics (optional)
        performanceMetrics: performanceRef.current
    };
};

export default usePixiSlider;