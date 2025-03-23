import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './KineticSlider.module.css';
import type { KineticSliderProps } from './types';
import { Application, Sprite, Container, DisplacementFilter } from 'pixi.js';
import ResourceManager from './managers/ResourceManager';
import {AtlasManager} from './managers/AtlasManager';
import RenderScheduler from './managers/RenderScheduler';
import { UpdateType } from './managers/UpdateTypes';
import { ThrottleStrategy } from './managers/FrameThrottler';
import AnimationCoordinator from './managers/AnimationCoordinator';
import SlidingWindowManager from './managers/SlidingWindowManager';
import { FilterFactory } from './filters';
import { type FilterConfig, type FilterType } from './filters/types';

// Import hooks directly
import { useDisplacementEffects } from './hooks';
import { useFilters } from './hooks';
import { useSlides } from './hooks';
import { useTextContainers } from './hooks';
import { useMouseTracking } from './hooks';
import { useIdleTimer } from './hooks';
import { useNavigation } from './hooks';
import { useExternalNav } from './hooks';
import { useTouchSwipe } from './hooks';
import { useMouseDrag } from './hooks';
import { useTextTilt } from './hooks';
import { useResizeHandler } from './hooks';
import { loadKineticSliderDependencies } from './ImportHelpers';
import { preloadKineticSliderAssets } from './utils/assetPreload';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

// Define the filter coordination event name
const FILTER_COORDINATION_EVENT = 'kinetic-slider:filter-update';

/**
 * Creates an interactive image slider with various displacement and transition effects
 */
const KineticSlider: React.FC<KineticSliderProps> = ({
                                                          // Content sources
                                                          images = [],
                                                          texts = [],
                                                          slidesBasePath = '/images/',

                                                          // Displacement settings
                                                          backgroundDisplacementSpriteLocation = '/images/background-displace.jpg',
                                                          cursorDisplacementSpriteLocation = '/images/cursor-displace.png',
                                                          cursorImgEffect = true,
                                                          cursorTextEffect = true,
                                                          cursorScaleIntensity = 0.65,
                                                          cursorMomentum = 0.14,

                                                          // Cursor displacement sizing options
                                                          cursorDisplacementSizing = 'natural',
                                                          cursorDisplacementWidth,
                                                          cursorDisplacementHeight,

                                                          // Text styling
                                                          textTitleColor = 'white',
                                                          textTitleSize = 64,
                                                          mobileTextTitleSize = 40,
                                                          textTitleLetterspacing = 2,
                                                          textTitleFontFamily,
                                                          textSubTitleColor = 'white',
                                                          textSubTitleSize = 24,
                                                          mobileTextSubTitleSize = 18,
                                                          textSubTitleLetterspacing = 1,
                                                          textSubTitleOffsetTop = 10,
                                                          mobileTextSubTitleOffsetTop = 5,
                                                          textSubTitleFontFamily,

                                                          // Animation settings
                                                          maxContainerShiftFraction = 0.05,
                                                          swipeScaleIntensity = 2,
                                                          transitionScaleIntensity = 30,

                                                          // Navigation settings
                                                          externalNav = false,
                                                          navElement = { prev: '.main-nav.prev', next: '.main-nav.next' },
                                                          buttonMode = false,

                                                          // Filter configurations
                                                          imageFilters,
                                                          textFilters,

                                                          // Atlas configuration
                                                          slidesAtlas = 'slides-atlas',
                                                          effectsAtlas = 'effects-atlas',
                                                          useEffectsAtlas = false,
                                                          useSlidesAtlas = false
                                                      }) => {
    // Debug log the props
    console.log("KineticSlider received props:", {
        useSlidesAtlas,
        useEffectsAtlas,
        slidesAtlas,
        effectsAtlas
    });

    // Core references
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const cursorActiveRef = useRef<boolean>(false);

    // Initialize the render scheduler (singleton)
    const scheduler = RenderScheduler.getInstance();

    // Create ResourceManager instance with unique ID
    const resourceManagerRef = useRef<ResourceManager | null>(null);

    // Create SlidingWindowManager reference
    const slidingWindowManagerRef = useRef<SlidingWindowManager | null>(null);

    // Initialize the animation coordinator and set the resource manager
    const animationCoordinator = AnimationCoordinator.getInstance();

    // Configure the scheduler for optimal performance
    useEffect(() => {
        // Only run on client-side
        if (typeof window === 'undefined') return;

        scheduler.configureThrottling({
            targetFps: 60,
            strategy: ThrottleStrategy.PRIORITY
        });

        return () => {
            // Clear any pending updates related to this component when unmounting
            scheduler.clearQueue();
        };
    }, [scheduler]);

    // Create AtlasManager instance
    const atlasManagerRef = useRef<AtlasManager | null>(null);

    // Set up Pixi app
    const appRef = useRef<Application | null>(null);
    const slidesRef = useRef<Sprite[]>([]);
    const textContainersRef = useRef<Container[]>([]);
    const backgroundDisplacementSpriteRef = useRef<Sprite | null>(null);
    const cursorDisplacementSpriteRef = useRef<Sprite | null>(null);
    const bgDispFilterRef = useRef<DisplacementFilter | null>(null);
    const cursorDispFilterRef = useRef<DisplacementFilter | null>(null);
    const currentIndexRef = useRef<number>(0);

    // Client-side initialization
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize ResourceManager and AtlasManager on mount
    useEffect(() => {
        const componentId = `kinetic-slider-${Math.random().toString(36).substring(2, 9)}`;

        // Initialize ResourceManager
        resourceManagerRef.current = new ResourceManager(componentId, {
            enableMetrics: true,
            enableShaderPooling: true,
            logLevel: import.meta.env.NODE_ENV === 'development' ? 'debug' : 'warn'
        });

        // Initialize FilterFactory with lazy loading
        FilterFactory.initialize({
            enableShaderPooling: true,
            enableDebug: import.meta.env.NODE_ENV === 'development',
            lazyLoadConfig: {
                unloadTimeoutMs: 120000, // 2 minutes
                maxCachedModules: 20,
                enablePrefetching: true,
                retryFailedLoads: true,
                maxRetries: 3
            }
        });

        // Initialize AtlasManager with resource manager
        atlasManagerRef.current = new AtlasManager({
            debug: true,
            preferAtlas: true,
            cacheFrameTextures: true,
            basePath: '/atlas'
        }, resourceManagerRef.current);

        // Set the resource manager for the animation coordinator
        if (resourceManagerRef.current) {
            animationCoordinator.setResourceManager(resourceManagerRef.current);
        }

        // Initialize SlidingWindowManager with default window size and initial index
        slidingWindowManagerRef.current = new SlidingWindowManager({
            totalSlides: images.length,
            initialIndex: 0,
            windowSize: 2, // Default: current slide ±2
            debug: import.meta.env.NODE_ENV === 'development'
        }, resourceManagerRef.current);

        return () => {
            // Mark as unmounting to prevent new resource allocation
            if (resourceManagerRef.current) {
                console.log("Component unmounting - disposing all resources");
                resourceManagerRef.current.markUnmounting();
                // Dispose all tracked resources
                resourceManagerRef.current.dispose();
                resourceManagerRef.current = null;
            }

            // Clean up atlas manager
            if (atlasManagerRef.current) {
                atlasManagerRef.current.dispose();
                atlasManagerRef.current = null;
            }

            // Clear the sliding window manager
            slidingWindowManagerRef.current = null;
        };
    }, [images.length, animationCoordinator]);

    // Create a pixi refs object for hooks
    const pixiRefs = {
        app: appRef,
        slides: slidesRef,
        textContainers: textContainersRef,
        backgroundDisplacementSprite: backgroundDisplacementSpriteRef,
        cursorDisplacementSprite: cursorDisplacementSpriteRef,
        bgDispFilter: bgDispFilterRef,
        cursorDispFilter: cursorDispFilterRef,
        currentIndex: currentIndexRef
    };

    // Props object for hooks
    const hookProps = {
        images,
        texts,
        slidesBasePath,
        backgroundDisplacementSpriteLocation,
        cursorDisplacementSpriteLocation,
        cursorImgEffect,
        cursorTextEffect,
        cursorScaleIntensity,
        cursorMomentum,
        cursorDisplacementSizing,
        cursorDisplacementWidth,
        cursorDisplacementHeight,
        textTitleColor,
        textTitleSize,
        mobileTextTitleSize,
        textTitleLetterspacing,
        textTitleFontFamily,
        textSubTitleColor,
        textSubTitleSize,
        mobileTextSubTitleSize,
        textSubTitleLetterspacing,
        textSubTitleOffsetTop,
        mobileTextSubTitleOffsetTop,
        textSubTitleFontFamily,
        maxContainerShiftFraction,
        swipeScaleIntensity,
        transitionScaleIntensity,
        imageFilters,
        textFilters,
        slidesAtlas,
        effectsAtlas,
        useSlidesAtlas,
        useEffectsAtlas
    };

    // Enhanced hook params with resource and atlas managers
    const hookParams = {
        sliderRef,
        pixi: pixiRefs,
        props: hookProps,
        resourceManager: resourceManagerRef.current,
        atlasManager: atlasManagerRef.current,
        slidingWindowManager: slidingWindowManagerRef.current
    };

    // Use displacement effects
    const { showDisplacementEffects, hideDisplacementEffects } = useDisplacementEffects({
        sliderRef,
        bgDispFilterRef,
        cursorDispFilterRef,
        backgroundDisplacementSpriteRef,
        cursorDisplacementSpriteRef,
        appRef,
        backgroundDisplacementSpriteLocation,
        cursorDisplacementSpriteLocation,
        cursorImgEffect,
        cursorScaleIntensity,
        cursorDisplacementSizing,
        cursorDisplacementWidth,
        cursorDisplacementHeight,
        resourceManager: resourceManagerRef.current,
        atlasManager: atlasManagerRef.current || undefined,
        effectsAtlas,
        useEffectsAtlas
    });

    // Use filter effects
    const {
        updateFilterIntensities,
        resetAllFilters,
        activateFilterEffects,
        isInitialized: filtersInitialized,
        isActive: filtersActive,
        setFiltersActive
    } = useFilters(hookParams);

    // Coordinate filter states with interaction state
    useEffect(() => {
        if (!isAppReady || !assetsLoaded) {
            console.log("Skipping filter coordination - not ready", {
                filtersInitialized,
                isAppReady,
                assetsLoaded
            });
            return;
        }

        // Try to initialize filters if they're not already initialized
        if (!filtersInitialized && typeof activateFilterEffects === 'function') {
            console.log("Attempting to initialize filters during coordination");
            activateFilterEffects();
        }

        console.log(`Filter coordination - isInteracting: ${isInteracting}, filtersActive: ${filtersActive}`);

        if (isInteracting) {
            // When interaction starts, activate both displacement and custom filters
            console.log("Interaction started - activating effects");
            showDisplacementEffects();

            // First try to use the dedicated activation function
            if (typeof activateFilterEffects === 'function') {
                console.log("Using activateFilterEffects");
                activateFilterEffects();
            } else {
                // Fallback to updateFilterIntensities
                console.log("Using updateFilterIntensities");
                updateFilterIntensities(true, true);
            }
        } else {
            // When interaction ends, deactivate both
            console.log("Interaction ended - deactivating effects");
            hideDisplacementEffects();
            updateFilterIntensities(false);
        }
    }, [
        isInteracting,
        isAppReady,
        assetsLoaded,
        filtersInitialized,
        filtersActive,
        showDisplacementEffects,
        hideDisplacementEffects,
        updateFilterIntensities,
        activateFilterEffects
    ]);

    // Reset filters when component unmounts or when app/assets state changes
    useEffect(() => {
        if (!isAppReady || !assetsLoaded) {
            resetAllFilters();
        }
        return () => {
            resetAllFilters();
        };
    }, [isAppReady, assetsLoaded, resetAllFilters]);

    // Preload assets including fonts and atlases
    useEffect(() => {
        if (typeof window === 'undefined' || !isClient) return;

        const loadAssets = async () => {
            try {
                console.log("Preloading assets and fonts...");

                // Preload atlases first
                if (atlasManagerRef.current) {
                    // Load the slides atlas
                    if (slidesAtlas) {
                        await atlasManagerRef.current.loadAtlas(
                            slidesAtlas,
                            `/atlas/${slidesAtlas}.json`,
                            `/atlas/${slidesAtlas}.png`
                        );
                    }

                    // Load the effects atlas
                    if (effectsAtlas) {
                        await atlasManagerRef.current.loadAtlas(
                            effectsAtlas,
                            `/atlas/${effectsAtlas}.json`,
                            `/atlas/${effectsAtlas}.png`
                        );
                    }
                }

                // Then preload any remaining assets (as fallback)
                await preloadKineticSliderAssets(
                    images,
                    backgroundDisplacementSpriteLocation,
                    cursorDisplacementSpriteLocation,
                    textTitleFontFamily,
                    textSubTitleFontFamily
                );

                setAssetsLoaded(true);
                console.log("Assets and fonts preloaded successfully");
            } catch (error) {
                console.error("Failed to preload assets:", error);
                // Continue anyway so the component doesn't totally fail
                setAssetsLoaded(true);
            }
        };

        loadAssets();
    }, [
        isClient,
        images,
        backgroundDisplacementSpriteLocation,
        cursorDisplacementSpriteLocation,
        textTitleFontFamily,
        textSubTitleFontFamily,
        slidesAtlas,
        effectsAtlas
    ]);

    // Initialize Pixi.js application
    useEffect(() => {
        if (typeof window === 'undefined' || !sliderRef.current || appRef.current || !assetsLoaded) return;

        const initPixi = async () => {
            try {
                console.log("Loading PixiJS dependencies...");
                // Load all dependencies first
                const { gsap, pixi, pixiPlugin } = await loadKineticSliderDependencies();

                // Only register plugins in browser
                if (typeof window !== 'undefined' && pixiPlugin) {
                    // Register GSAP plugins
                    gsap.registerPlugin(pixiPlugin);

                    // Check if we have the actual plugin (not the mock)
                    if (pixiPlugin.registerPIXI) {
                        pixiPlugin.registerPIXI(pixi);
                    }
                }

                console.log("Creating Pixi.js application...");

                // Create Pixi application
                const app = new Application();
                await app.init({
                    width: sliderRef.current?.clientWidth || 800,
                    height: sliderRef.current?.clientHeight || 600,
                    backgroundAlpha: 0,
                    resizeTo: sliderRef.current || undefined,
                });

                // Track the application with the resource manager
                if (resourceManagerRef.current) {
                    resourceManagerRef.current.trackPixiApp(app);
                }

                // Add canvas to DOM
                if (sliderRef.current) {
                    sliderRef.current.appendChild(app.canvas);
                }

                // Store reference
                appRef.current = app;

                // Create main container
                const stage = new Container();
                app.stage.addChild(stage);

                // Track the stage with the resource manager
                if (resourceManagerRef.current) {
                    resourceManagerRef.current.trackDisplayObject(stage);
                }

                // Set app as ready
                setIsAppReady(true);

                console.log("Pixi.js application initialized");
            } catch (error) {
                console.error("Failed to initialize Pixi.js application:", error);
            }
        };

        initPixi();

        // Cleanup on unmount
        return () => {
            if (appRef.current) {
                if (sliderRef.current) {
                    const canvas = sliderRef.current.querySelector('canvas');
                    if (canvas) {
                        sliderRef.current.removeChild(canvas);
                    }
                }

                // Note: We don't need to manually destroy the app here
                // as the ResourceManager will handle it during disposal
                appRef.current = null;
                setIsAppReady(false);
            }
        };
    }, [sliderRef.current, assetsLoaded]);

    // Prefetch filters based on props
    useEffect(() => {
        // Only run on client-side after app is initialized and props are loaded
        if (typeof window === 'undefined' || !isAppReady) return;

        // Skip if no filter configurations
        if (!hookProps.imageFilters && !hookProps.textFilters) return;

        // Helper to extract filter types from configurations
        const getFilterTypes = (config?: any): FilterType[] => {
            if (!config) return [];

            const configs = Array.isArray(config) ? config : [config];
            return configs
                .filter(c => c && c.type && c.enabled !== false)
                .map(c => c.type as FilterType);
        };

        // Get unique filter types from both image and text filters
        const imageFilterTypes = getFilterTypes(hookProps.imageFilters);
        const textFilterTypes = getFilterTypes(hookProps.textFilters);
        const allFilterTypes = [...new Set([...imageFilterTypes, ...textFilterTypes])];

        // Prefetch all filter types
        if (allFilterTypes.length > 0) {
            console.log(`Prefetching ${allFilterTypes.length} filter types:`, allFilterTypes);
            FilterFactory.prefetchFilterModules(allFilterTypes as any, 'high');
        }
    }, [isAppReady, hookProps.imageFilters, hookProps.textFilters]);

    // Handle slide transitions
    const handleSlideChange = useCallback((newIndex: number) => {
        // Update the current index
        currentIndexRef.current = newIndex;
        setCurrentSlideIndex(newIndex);

        // Activate filters for the new slide
        if (filtersInitialized) {
            // If cursor is within the canvas, apply filters immediately with critical priority
            if (isInteracting) {
                console.log("Cursor is within canvas - applying filters immediately with critical priority");

                // Schedule displacement effects with critical priority
                scheduler.scheduleTypedUpdate(
                    'slider',
                    UpdateType.DISPLACEMENT_EFFECT,
                    () => {
                        showDisplacementEffects();
                    },
                    'critical'
                );

                // Schedule filter activation with critical priority
                // Force the filter activation to use the new slide index
                scheduler.scheduleTypedUpdate(
                    'slider',
                    UpdateType.FILTER_UPDATE,
                    () => {
                        // Explicitly update the current index ref before activating filters
                        currentIndexRef.current = newIndex;

                        // Force filter activation for the new slide
                        if (typeof activateFilterEffects === 'function') {
                            activateFilterEffects();

                            // Double-check that filters are active
                            setFiltersActive(true);
                        }
                    },
                    'critical'
                );
            } else {
                // Use activateFilterEffects to properly apply filters to the new slide
                activateFilterEffects();

                // Schedule filter deactivation if not interacting
                const transitionDuration = 1000; // 1 second transition
                setTimeout(() => {
                    if (!isInteracting) { // Check again in case interaction started during transition
                        updateFilterIntensities(false);
                        hideDisplacementEffects();
                    }
                }, transitionDuration);
            }
        }
    }, [
        filtersInitialized,
        isInteracting,
        activateFilterEffects,
        updateFilterIntensities,
        hideDisplacementEffects,
        showDisplacementEffects,
        scheduler,
        setFiltersActive
    ]);

    // Use slides hook with transition handler
    const { nextSlide, prevSlide } = useSlides({
        ...hookParams,
        onSlideChange: handleSlideChange
    });

    // Use text containers
    useTextContainers({
        sliderRef,
        appRef,
        slidesRef,
        textContainersRef,
        currentIndex: currentIndexRef,
        buttonMode,
        texts,
        textTitleColor,
        textTitleSize,
        mobileTextTitleSize,
        textTitleLetterspacing,
        textTitleFontFamily,
        textSubTitleColor,
        textSubTitleSize,
        mobileTextSubTitleSize,
        textSubTitleLetterspacing,
        textSubTitleOffsetTop,
        mobileTextSubTitleOffsetTop,
        textSubTitleFontFamily,
        resourceManager: resourceManagerRef.current
    });

    // Use mouse tracking
    useMouseTracking({
        ...hookParams,
        backgroundDisplacementSpriteRef,
        cursorDisplacementSpriteRef,
        cursorImgEffect,
        cursorMomentum
    });

    // Use idle timer
    useIdleTimer({
        sliderRef,
        cursorActive: cursorActiveRef,
        bgDispFilterRef,
        cursorDispFilterRef,
        cursorImgEffect,
        defaultBgFilterScale: 20,
        defaultCursorFilterScale: 10,
        resourceManager: resourceManagerRef.current
    });

    /**
     * Handles transition to the next slide
     * Updates state and reapplies effects after transition
     */
    const handleNext = useCallback(() => {
        if (!appRef.current || !isAppReady || slidesRef.current.length === 0) return;
        const nextIndex = (currentSlideIndex + 1) % slidesRef.current.length;

        // Schedule slide transition with high priority
        scheduler.scheduleTypedUpdate(
            'slider',
            UpdateType.SLIDE_TRANSITION,
            () => {
                // First transition the slide
                nextSlide(nextIndex);

                // Update the current index
                currentIndexRef.current = nextIndex;
                setCurrentSlideIndex(nextIndex);

                // Always schedule effect reapplication after a short delay
                // regardless of whether we're interacting or not
                setTimeout(() => {
                    console.log("Scheduling effects after slide change (next)");

                    // Schedule displacement effects reapplication
                    scheduler.scheduleTypedUpdate(
                        'slider',
                        UpdateType.DISPLACEMENT_EFFECT,
                        () => {
                            showDisplacementEffects();
                        },
                        // Use critical priority if cursor is within the canvas
                        isInteracting ? 'critical' : undefined
                    );

                    // Schedule filter update with appropriate priority based on interaction state
                    scheduler.scheduleTypedUpdate(
                        'slider',
                        UpdateType.FILTER_UPDATE,
                        () => {
                            // Ensure current index is set correctly
                            currentIndexRef.current = nextIndex;

                            // Use activateFilterEffects to properly apply filters to the new slide
                            if (typeof activateFilterEffects === 'function') {
                                activateFilterEffects();

                                // If cursor is within canvas, ensure filters are active
                                if (isInteracting) {
                                    setFiltersActive(true);
                                }
                            }
                        },
                        // Use critical priority if cursor is within the canvas
                        isInteracting ? 'critical' : undefined
                    );
                }, 100); // Short delay to allow transition to start
            }
        );
    }, [
        appRef,
        isAppReady,
        slidesRef,
        currentSlideIndex,
        nextSlide,
        isInteracting,
        showDisplacementEffects,
        activateFilterEffects,
        scheduler,
        setFiltersActive
    ]);

    /**
     * Handles transition to the previous slide
     * Updates state and reapplies effects after transition
     */
    const handlePrev = useCallback(() => {
        if (!appRef.current || !isAppReady || slidesRef.current.length === 0) return;
        const prevIndex = (currentSlideIndex - 1 + slidesRef.current.length) % slidesRef.current.length;

        // Schedule slide transition with high priority
        scheduler.scheduleTypedUpdate(
            'slider',
            UpdateType.SLIDE_TRANSITION,
            () => {
                // First transition the slide
                prevSlide(prevIndex);

                // Update the current index
                currentIndexRef.current = prevIndex;
                setCurrentSlideIndex(prevIndex);

                // Always schedule effect reapplication after a short delay
                // regardless of whether we're interacting or not
                setTimeout(() => {
                    console.log("Scheduling effects after slide change (prev)");

                    // Schedule displacement effects reapplication
                    scheduler.scheduleTypedUpdate(
                        'slider',
                        UpdateType.DISPLACEMENT_EFFECT,
                        () => {
                            showDisplacementEffects();
                        },
                        // Use critical priority if cursor is within the canvas
                        isInteracting ? 'critical' : undefined
                    );

                    // Schedule filter update with appropriate priority based on interaction state
                    scheduler.scheduleTypedUpdate(
                        'slider',
                        UpdateType.FILTER_UPDATE,
                        () => {
                            // Ensure current index is set correctly
                            currentIndexRef.current = prevIndex;

                            // Use activateFilterEffects to properly apply filters to the new slide
                            if (typeof activateFilterEffects === 'function') {
                                activateFilterEffects();

                                // If cursor is within canvas, ensure filters are active
                                if (isInteracting) {
                                    setFiltersActive(true);
                                }
                            }
                        },
                        // Use critical priority if cursor is within the canvas
                        isInteracting ? 'critical' : undefined
                    );
                }, 100); // Short delay to allow transition to start
            }
        );
    }, [
        appRef,
        isAppReady,
        slidesRef,
        currentSlideIndex,
        prevSlide,
        isInteracting,
        showDisplacementEffects,
        activateFilterEffects,
        scheduler,
        setFiltersActive
    ]);

    // Apply hooks only when appRef is available and ready - NOW updateFilterIntensities is defined before being referenced
    useEffect(() => {
        // Skip if app is not initialized
        if (!appRef.current || !isAppReady) return;

        // Update current index ref when state changes
        currentIndexRef.current = currentSlideIndex;

        // Note: We no longer need to handle filter updates here as they are now handled directly
        // in the navigation functions (handleNext/handlePrev)
    }, [appRef.current, currentSlideIndex, isAppReady]);

    // Use navigation
    useNavigation({
        onNext: handleNext,
        onPrev: handlePrev,
        enableKeyboardNav: true
    });

    // Use external navigation if enabled
    useExternalNav({
        externalNav,
        navElement,
        handleNext,
        handlePrev
    });

    // Use touch swipe
    useTouchSwipe({
        sliderRef,
        onSwipeLeft: handleNext,
        onSwipeRight: handlePrev
    });

    // Use mouse drag
    useMouseDrag({
        sliderRef,
        slidesRef,
        currentIndex: currentIndexRef,
        swipeScaleIntensity,
        swipeDistance: typeof window !== 'undefined' ? window.innerWidth * 0.2 : 200,
        onSwipeLeft: handleNext,
        onSwipeRight: handlePrev
    });

    // Use text tilt
    useTextTilt({
        sliderRef,
        textContainersRef,
        currentIndex: currentIndexRef,
        cursorTextEffect,
        maxContainerShiftFraction,
        bgDispFilterRef,
        cursorDispFilterRef,
        cursorImgEffect
    });

    // Use resize handler
    useResizeHandler({
        sliderRef,
        appRef,
        slidesRef,
        textContainersRef,
        backgroundDisplacementSpriteRef,
        cursorDisplacementSpriteRef
    });

    /**
     * Handles mouse enter events on the slider element
     * Activates displacement effects and filter intensities
     * Now uses scheduler for batched updates
     */
    const handleMouseEnter = useCallback(() => {
        if (!isAppReady) return;
        console.log("Mouse entered the slider - activating effects immediately", {
            filtersInitialized,
            filtersActive,
            hasActivateFunction: typeof activateFilterEffects === 'function',
            hasUpdateFunction: typeof updateFilterIntensities === 'function',
            currentSlideIndex
        });

        // Update cursor active state
        cursorActiveRef.current = true;

        // Set interaction state immediately to ensure proper coordination
        setIsInteracting(true);

        // Schedule displacement effects with critical priority
        scheduler.scheduleTypedUpdate(
            'slider',
            UpdateType.DISPLACEMENT_EFFECT,
            () => {
                // Apply displacement effects immediately
                showDisplacementEffects();
                console.log("Displacement effects activated");
            },
            'critical'
        );

        // Schedule filter activation with critical priority
        scheduler.scheduleTypedUpdate(
            'slider',
            UpdateType.FILTER_UPDATE,
            () => {
                // Force initialize filters if not already initialized
                if (!filtersInitialized && typeof activateFilterEffects === 'function') {
                    console.log("Filters not initialized, initializing now");
                    activateFilterEffects();
                } else if (typeof activateFilterEffects === 'function') {
                    // Use the dedicated activation function as the primary method
                    console.log("Using activateFilterEffects function for slide", currentSlideIndex);
                    activateFilterEffects();
                } else if (typeof updateFilterIntensities === 'function') {
                    // Only use updateFilterIntensities as fallback
                    console.log("Using updateFilterIntensities function with force=true");
                    updateFilterIntensities(true, true);
                }

                // Explicitly set filters as active
                setFiltersActive(true);

                console.log("Filter activation completed with critical priority");
            },
            'critical'
        );

        // Schedule a final render update to ensure all changes are applied
        scheduler.scheduleTypedUpdate(
            'slider',
            UpdateType.FILTER_UPDATE,
            () => {
                console.log("Final render update after mouse enter completed");

                // Double-check filter state after render
                console.log("Filter state after render:", {
                    filtersActive,
                    bgDispFilterEnabled: bgDispFilterRef.current?.enabled,
                    cursorDispFilterEnabled: cursorDispFilterRef.current?.enabled,
                    currentSlideIndex
                });
            },
            'critical'
        );
    }, [
        isAppReady,
        showDisplacementEffects,
        updateFilterIntensities,
        activateFilterEffects,
        filtersInitialized,
        filtersActive,
        setFiltersActive,
        currentSlideIndex,
        scheduler
    ]);

    /**
     * Handles mouse leave event
     */
    const handleMouseLeave = useCallback(() => {
        if (!isAppReady) return;

        if (isDevelopment) {
            console.log('[KineticSlider] Mouse left slider - deactivating all effects');
        }

        // Set interaction state immediately
        setIsInteracting(false);

        // Explicitly dispatch filter coordination events for both displacement filters
        const event1 = new CustomEvent(FILTER_COORDINATION_EVENT, {
            detail: {
                type: 'background-displacement',
                intensity: 0,
                timestamp: Date.now(),
                source: 'slider-component',
                priority: 'critical'
            }
        });
        window.dispatchEvent(event1);

        const event2 = new CustomEvent(FILTER_COORDINATION_EVENT, {
            detail: {
                type: 'cursor-displacement',
                intensity: 0,
                timestamp: Date.now(),
                source: 'slider-component',
                priority: 'critical'
            }
        });
        window.dispatchEvent(event2);

        // Force the filters to deactivate with critical priority
        updateFilterIntensities(false, true);

        // Schedule a final update after mouse leave to ensure everything is cleaned up
        scheduler.scheduleTypedUpdate(
            'slider',
            UpdateType.FILTER_UPDATE,
            () => {
                if (isDevelopment) {
                    console.log('[KineticSlider] Final render update after mouse leave');
                }
            },
            'critical'
        );
    }, [isAppReady, setIsInteracting, updateFilterIntensities, scheduler]);

    // Handle component cleanup
    useEffect(() => {
        return () => {
            // Reset all filters
            resetAllFilters();

            // Clear any pending filter updates
            if (resourceManagerRef.current) {
                resourceManagerRef.current.clearPendingUpdates();
            }

            // Clear any scheduled filter transitions
            const transitionTimeouts = Array.from(document.querySelectorAll(`[data-slider-id="${sliderRef.current?.id}"]`))
                .map(el => parseInt(el.getAttribute('data-timeout-id') || '0'))
                .filter(id => id > 0);

            transitionTimeouts.forEach(clearTimeout);
        };
    }, [resetAllFilters]);

    // Error boundary for filter operations
    useEffect(() => {
        const handleError = (error: Error) => {
            console.error('Filter system error:', error);
            // Attempt recovery by resetting filters
            resetAllFilters();
            // Hide all effects
            hideDisplacementEffects();
        };

        window.addEventListener('error', (e) => handleError(e.error));
        return () => window.removeEventListener('error', (e) => handleError(e.error));
    }, [resetAllFilters, hideDisplacementEffects]);

    // Add a new useEffect to handle cleanup
    useEffect(() => {
        return () => {
            // Clean up any resources when component unmounts
            if (resourceManagerRef.current) {
                // Use the existing methods instead of the non-existent 'cleanup' method
                resourceManagerRef.current.clearPendingUpdates();
                resourceManagerRef.current.markUnmounting();
            }
        };
    }, []);

    // FPS monitoring for filter optimization
    useEffect(() => {
        if (!resourceManagerRef.current) return;

        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 60;

        // Function to calculate FPS and optimize filters
        const monitorPerformance = () => {
            frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime;

            // Update FPS approximately every second
            if (elapsed > 1000) {
                fps = (frameCount * 1000) / elapsed;
                frameCount = 0;
                lastTime = currentTime;

                // Auto-optimize filters based on current FPS
                if (resourceManagerRef.current && fps < 55) {
                    resourceManagerRef.current.autoOptimizeFilters(fps, 55);
                }
            }

            performanceMonitorId = requestAnimationFrame(monitorPerformance);
        };

        // Start performance monitoring
        let performanceMonitorId = requestAnimationFrame(monitorPerformance);

        // Cleanup
        return () => {
            if (performanceMonitorId) {
                cancelAnimationFrame(performanceMonitorId);
            }
        };
    }, [resourceManagerRef]);

    // Render component
    return (
        <div
            className={styles.kineticSlider}
            ref={sliderRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Placeholder while loading */}
            {(!isAppReady || !assetsLoaded) && (
                <div className={styles.placeholder}>
                    <div className={styles.loadingIndicator}>
                        <div className={styles.spinner}></div>
                        <div>Loading slider...</div>
                    </div>
                </div>
            )}

            {/* Navigation buttons - only render on client and if external nav is not enabled */}
            {!externalNav && isClient && (
                <nav>
                    <button onClick={handlePrev} className={styles.prev}>
                        Prev
                    </button>
                    <button onClick={handleNext} className={styles.next}>
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
};

export default KineticSlider;