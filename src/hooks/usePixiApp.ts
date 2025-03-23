import { useEffect, useRef, useCallback, type RefObject } from 'react';
import { Application, Container, Assets, Texture } from 'pixi.js';
import ResourceManager from '../managers/ResourceManager';
import { type PixiRefs } from '../types';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

// Maximum number of retries for asset loading
const MAX_ASSET_LOAD_RETRIES = 3;

// Retry backoff timing
const RETRY_BASE_DELAY = 100; // ms

// Interface for batch loading statistics
interface BatchLoadStats {
    totalAssets: number;
    loadedAssets: number;
    failedAssets: number;
    retryCount: number;
    timeElapsed: number;
    assetCache: Map<string, boolean>; // track already loaded assets
}

// Interface for cancellation state
interface CancellationState {
    isCancelled: boolean;
    cancelReason: string | null;
    isUnmounting: boolean;
}

// Interface for module cache
interface ModuleCache {
    gsap?: any;
    PixiPlugin?: any;
    lastUpdated: number;
}

// Interface for the hook's return value
interface UsePixiAppResult {
    pixiRefs: PixiRefs;
    isInitialized: boolean;
    isInitializing: boolean;
    loadingProgress: {
        isLoading: boolean;
        progress: number;
        assetsLoaded: number;
        assetsTotal: number;
    };
}

/**
 * Helper function to load fonts with comprehensive retry mechanism
 * @param fontPath - Path to the font file
 * @param retries - Number of retry attempts
 * @param cancellationRef - Reference to check if operation is cancelled
 * @returns Promise that resolves when the font is loaded
 */
const loadFont = async (
    fontPath: string,
    retries = MAX_ASSET_LOAD_RETRIES,
    cancellationRef: RefObject<CancellationState>
): Promise<boolean> => {
    try {
        // Validate font path
        if (!fontPath) {
            if (isDevelopment) {
                console.warn('Invalid font path provided');
            }
            return false;
        }

        // Try to load the font with exponential backoff
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Check for cancellation before each attempt
                if (cancellationRef.current?.isCancelled) {
                    if (isDevelopment) {
                        console.log(`Font loading cancelled: ${fontPath}`);
                    }
                    return false;
                }

                await Assets.load(fontPath);

                if (isDevelopment) {
                    console.log(`Successfully loaded font: ${fontPath} (attempt ${attempt})`);
                }
                return true;
            } catch (error) {
                if (attempt === retries) throw error;

                // Exponential backoff with jitter
                const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 range for jitter
                const delay = Math.pow(2, attempt) * RETRY_BASE_DELAY * jitter;

                if (isDevelopment) {
                    console.warn(`Font load attempt ${attempt} failed for ${fontPath}, retrying in ${delay.toFixed(0)}ms`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));

                // Check for cancellation after delay
                if (cancellationRef.current?.isCancelled) {
                    if (isDevelopment) {
                        console.log(`Font loading cancelled during retry: ${fontPath}`);
                    }
                    return false;
                }
            }
        }
        return false;
    } catch (error) {
        if (isDevelopment) {
            console.warn(`Failed to load font from ${fontPath}:`, error);
        }
        return false;
    }
};

/**
 * Custom hook to initialize and manage a Pixi Application with comprehensive optimizations
 *
 * @param sliderRef - Reference to the slider DOM element
 * @param images - Array of image URLs to preload
 * @param displacementImages - Array of displacement image URLs to preload
 * @param resourceManager - Optional ResourceManager instance for resource tracking
 * @returns Object containing PixiRefs and initialization status
 */
export const usePixiApp = (
    sliderRef: RefObject<HTMLDivElement | null>,
    images: string[] = [],
    displacementImages: string[] = [],
    resourceManager?: ResourceManager | null
): UsePixiAppResult => {
    // Cancellation state to prevent race conditions and enable proper cleanup
    const cancellationRef = useRef<CancellationState>({
        isCancelled: false,
        cancelReason: null,
        isUnmounting: false
    });

    // Batch loading statistics for tracking and reporting
    const batchStatsRef = useRef<BatchLoadStats>({
        totalAssets: 0,
        loadedAssets: 0,
        failedAssets: 0,
        retryCount: 0,
        timeElapsed: 0,
        assetCache: new Map()
    });

    // Loading progress state
    const loadingProgressRef = useRef({
        isLoading: false,
        progress: 0,
        assetsLoaded: 0,
        assetsTotal: 0
    });

    // Core Pixi.js references
    const appRef = useRef<Application | null>(null);
    const slidesRef = useRef<any[]>([]);
    const textContainersRef = useRef<Container[]>([]);
    const backgroundDisplacementSpriteRef = useRef<any>(null);
    const cursorDisplacementSpriteRef = useRef<any>(null);
    const bgDispFilterRef = useRef<any>(null);
    const cursorDispFilterRef = useRef<any>(null);
    const currentIndex = useRef<number>(0);

    // Track initialization and module import states
    const isInitializedRef = useRef<boolean>(false);
    const isInitializingRef = useRef<boolean>(false);
    const modulesRef = useRef<ModuleCache>({
        lastUpdated: 0
    });

    /**
     * Set cancellation state with reason
     */
    const setCancelled = useCallback((reason: string): void => {
        if (cancellationRef.current) {
            cancellationRef.current.isCancelled = true;
            cancellationRef.current.cancelReason = reason;

            if (isDevelopment) {
                console.log(`Operation cancelled: ${reason}`);
            }
        }
    }, []);

    /**
     * Update loading progress with detailed metrics
     */
    const updateLoadingProgress = useCallback((
        progress: number,
        loaded: number,
        total: number
    ): void => {
        // Clamp progress between 0-100
        const clampedProgress = Math.max(0, Math.min(100, progress));

        // Update ref
        loadingProgressRef.current = {
            isLoading: progress < 100,
            progress: clampedProgress,
            assetsLoaded: loaded,
            assetsTotal: total
        };

        if (isDevelopment) {
            console.log(`Loading progress: ${clampedProgress.toFixed(1)}% (${loaded}/${total})`);
        }
    }, []);

    /**
     * Load required modules with retry
     */
    const loadModules = useCallback(async (): Promise<boolean> => {
        try {
            // Skip if already loaded or operation is cancelled
            if (
                modulesRef.current.gsap ||
                cancellationRef.current.isCancelled
            ) {
                return !!modulesRef.current.gsap;
            }

            if (isDevelopment) {
                console.log('Loading GSAP and PixiPlugin modules...');
            }

            const startTime = performance.now();

            // Load GSAP
            try {
                const gsapModule = await import('gsap');
                modulesRef.current.gsap = gsapModule.gsap;

                // Try to load PixiPlugin
                try {
                    const { default: PixiPlugin } = await import('gsap/PixiPlugin');
                    modulesRef.current.PixiPlugin = PixiPlugin;

                    // Register plugin
                    gsapModule.gsap.registerPlugin(PixiPlugin);

                    if (isDevelopment) {
                        console.log('GSAP PixiPlugin loaded and registered');
                    }
                } catch (pluginError) {
                    if (isDevelopment) {
                        console.warn('Could not load PixiPlugin for GSAP:', pluginError);
                    }
                }

                // Update timestamp
                modulesRef.current.lastUpdated = Date.now();

                const elapsed = performance.now() - startTime;
                if (isDevelopment) {
                    console.log(`Modules loaded in ${elapsed.toFixed(2)}ms`);
                }

                return true;
            } catch (error) {
                if (isDevelopment) {
                    console.error('Failed to load GSAP:', error);
                }
                return false;
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Unexpected error loading modules:', error);
            }
            return false;
        }
    }, []);

    /**
     * Batch load images with comprehensive retry and progress tracking
     */
    const batchLoadImages = useCallback(async (
        imagesToLoad: string[],
        bundleName: string
    ): Promise<Map<string, Texture>> => {
        const results = new Map<string, Texture>();
        if (!imagesToLoad.length) return results;

        try {
            const { assetCache } = batchStatsRef.current;
            const startTime = performance.now();

            // Filter already loaded assets
            const uncachedAssets = imagesToLoad.filter(url => {
                const isCached = Assets.cache.has(url) || assetCache.has(url);
                if (isCached && isDevelopment) {
                    console.log(`Using cached asset: ${url}`);
                }
                return !isCached;
            });

            // Track total assets
            const totalAssets = imagesToLoad.length;
            const cachedAssets = totalAssets - uncachedAssets.length;

            // Update stats
            batchStatsRef.current.totalAssets += totalAssets;
            batchStatsRef.current.loadedAssets += cachedAssets;

            // Update loading progress
            updateLoadingProgress(
                (cachedAssets / totalAssets) * 100,
                cachedAssets,
                totalAssets
            );

            // Skip if all assets are cached
            if (uncachedAssets.length === 0) {
                if (isDevelopment) {
                    console.log(`All ${totalAssets} assets already cached`);
                }

                // Return cached textures
                for (const url of imagesToLoad) {
                    if (Assets.cache.has(url)) {
                        results.set(url, Assets.get(url));
                    }
                }

                updateLoadingProgress(100, totalAssets, totalAssets);
                return results;
            }

            if (isDevelopment) {
                console.log(`Loading ${uncachedAssets.length} uncached assets in batch "${bundleName}"...`);
            }

            // Create bundle for batch loading
            const assetBundle: Record<string, string> = {};
            uncachedAssets.forEach((url, index) => {
                assetBundle[`${bundleName}-${index}`] = url;
            });

            // Add bundle to Assets
            Assets.addBundle(bundleName, assetBundle);

            // Load with retry and progress tracking
            for (let attempt = 1; attempt <= MAX_ASSET_LOAD_RETRIES; attempt++) {
                try {
                    // Check for cancellation
                    if (cancellationRef.current.isCancelled) {
                        if (isDevelopment) {
                            console.log(`Batch loading cancelled during attempt ${attempt}`);
                        }
                        return results;
                    }

                    // Load bundle with progress tracking
                    const loadedAssets = await Assets.loadBundle(bundleName, (progress) => {
                        // Calculate combined progress including cached assets
                        const combinedProgress = (cachedAssets + (progress * uncachedAssets.length)) / totalAssets;

                        // Calculate loaded assets count
                        const loadedCount = cachedAssets + Math.floor(progress * uncachedAssets.length);

                        // Update loading progress
                        updateLoadingProgress(combinedProgress * 100, loadedCount, totalAssets);
                    });

                    // Extract textures and map to original URLs
                    Object.entries(loadedAssets).forEach(([key, texture]) => {
                        const originalUrl = assetBundle[key];
                        if (originalUrl) {
                            results.set(originalUrl, texture as Texture);

                            // Update asset cache
                            assetCache.set(originalUrl, true);

                            // Track with ResourceManager if available
                            if (resourceManager) {
                                resourceManager.trackTexture(originalUrl, texture as Texture);
                            }
                        }
                    });

                    // Update stats
                    batchStatsRef.current.loadedAssets += uncachedAssets.length;
                    batchStatsRef.current.timeElapsed += performance.now() - startTime;

                    if (isDevelopment) {
                        console.log(`Batch "${bundleName}" loaded successfully`);
                    }

                    break; // Successfully loaded
                } catch (error) {
                    batchStatsRef.current.retryCount++;

                    if (attempt === MAX_ASSET_LOAD_RETRIES) {
                        if (isDevelopment) {
                            console.error(`Failed to load batch "${bundleName}" after ${attempt} attempts:`, error);
                        }
                        batchStatsRef.current.failedAssets += uncachedAssets.length;
                        break;
                    }

                    // Exponential backoff with jitter
                    const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 range for jitter
                    const delay = Math.pow(2, attempt) * RETRY_BASE_DELAY * jitter;

                    if (isDevelopment) {
                        console.warn(`Batch load attempt ${attempt} failed, retrying in ${delay.toFixed(0)}ms`);
                    }

                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Check for cancellation after delay
                    if (cancellationRef.current.isCancelled) {
                        if (isDevelopment) {
                            console.log(`Batch loading cancelled during retry delay`);
                        }
                        return results;
                    }
                }
            }

            // Final progress update
            updateLoadingProgress(100, totalAssets, totalAssets);

            return results;
        } catch (error) {
            if (isDevelopment) {
                console.error(`Error in batch loading "${bundleName}":`, error);
            }
            return results;
        }
    }, [resourceManager, updateLoadingProgress]);

    /**
     * Preload all required assets in optimized batches
     */
    const preloadAssets = useCallback(async (): Promise<boolean> => {
        // Skip if cancelled, running on the server, or no assets to preload
        if (
            cancellationRef.current.isCancelled ||
            typeof window === 'undefined' ||
            (images.length === 0 && displacementImages.length === 0)
        ) {
            return true;
        }

        try {
            if (isDevelopment) {
                console.log("Preloading assets...");
            }

            // Reset loading progress
            updateLoadingProgress(0, 0, images.length + displacementImages.length);
            loadingProgressRef.current.isLoading = true;

            // Begin loading process
            const startTime = performance.now();

            // First load images in a batch
            if (images.length > 0) {
                await batchLoadImages(images, 'slider-images');

                // Check for cancellation
                if (cancellationRef.current.isCancelled) {
                    return false;
                }
            }

            // Then load displacement images in a separate batch
            if (displacementImages.length > 0) {
                const filteredDisplacements = displacementImages.filter(Boolean);
                if (filteredDisplacements.length > 0) {
                    await batchLoadImages(filteredDisplacements, 'displacement-images');
                }
            }

            // Update loading progress
            loadingProgressRef.current.isLoading = false;

            const elapsed = performance.now() - startTime;
            if (isDevelopment) {
                console.log(`Asset preloading completed in ${elapsed.toFixed(2)}ms`);

                // Log detailed stats
                const { loadedAssets, totalAssets, failedAssets, retryCount } = batchStatsRef.current;
                console.log(`Assets loaded: ${loadedAssets}/${totalAssets} (${failedAssets} failed, ${retryCount} retries)`);
            }

            return true;
        } catch (error) {
            if (isDevelopment) {
                console.error("Unexpected error in asset preloading:", error);
            }

            // Update loading state
            loadingProgressRef.current.isLoading = false;

            return false;
        }
    }, [images, displacementImages, batchLoadImages, updateLoadingProgress]);

    /**
     * Memoized function to initialize Pixi application
     */
    const initializePixiApp = useCallback(async (): Promise<boolean> => {
        // Set initialization flag
        isInitializingRef.current = true;

        // Reset cancellation flag
        cancellationRef.current.isCancelled = false;
        cancellationRef.current.cancelReason = null;

        // Skip if already initialized or missing references
        if (
            isInitializedRef.current ||
            typeof window === 'undefined' ||
            !sliderRef.current
        ) {
            isInitializingRef.current = false;
            return false;
        }

        try {
            // Log initialization start
            if (isDevelopment) {
                console.log('Initializing PixiJS application...');
            }

            // Load modules first
            const modulesLoaded = await loadModules();
            if (!modulesLoaded) {
                throw new Error("Failed to load required modules");
            }

            // Check for cancellation after module loading
            if (cancellationRef.current.isCancelled) {
                if (isDevelopment) {
                    console.log("Initialization cancelled after module loading");
                }
                isInitializingRef.current = false;
                return false;
            }

            // Preload default font with retry
            const defaultFontPath = '/fonts/Vamos.woff2';
            await loadFont(defaultFontPath, MAX_ASSET_LOAD_RETRIES, cancellationRef);

            // Check for cancellation after font loading
            if (cancellationRef.current.isCancelled) {
                if (isDevelopment) {
                    console.log("Initialization cancelled after font loading");
                }
                isInitializingRef.current = false;
                return false;
            }

            // Preload assets
            const assetsLoaded = await preloadAssets();
            if (!assetsLoaded) {
                if (isDevelopment) {
                    console.warn("Asset preloading failed or was cancelled");
                }
                // Continue anyway since this isn't critical
            }

            // Check if cancelled during asset loading
            if (cancellationRef.current.isCancelled) {
                if (isDevelopment) {
                    console.log("Initialization cancelled during asset loading");
                }
                isInitializingRef.current = false;
                return false;
            }

            // Validate component is still mounted
            if (!sliderRef.current) {
                throw new Error('Component unmounted during initialization');
            }

            // Create Pixi application
            const app = new Application();

            try {
                await app.init({
                    width: sliderRef.current?.clientWidth || 800,
                    height: sliderRef.current?.clientHeight || 600,
                    backgroundAlpha: 0,
                    resizeTo: sliderRef.current || undefined,
                });
            } catch (initError) {
                throw new Error(`Failed to initialize Pixi application: ${initError}`);
            }

            // Check if cancelled during app initialization
            if (cancellationRef.current.isCancelled) {
                app.destroy(true);
                if (isDevelopment) {
                    console.log("Initialization cancelled during app initialization");
                }
                isInitializingRef.current = false;
                return false;
            }

            // Track the application with ResourceManager
            if (resourceManager) {
                resourceManager.trackPixiApp(app);
            }

            // Append canvas to slider element
            if (sliderRef.current && app.canvas instanceof HTMLCanvasElement) {
                sliderRef.current.appendChild(app.canvas);
                app.canvas.classList.add('kinetic-slider-canvas');
            }

            // Store app reference
            appRef.current = app;

            // Create main container
            const stage = new Container();
            app.stage.addChild(stage);

            // Track stage with ResourceManager
            if (resourceManager) {
                resourceManager.trackDisplayObject(stage);
            }

            // Mark as initialized
            isInitializedRef.current = true;
            isInitializingRef.current = false;

            if (isDevelopment) {
                console.log('PixiJS application initialized successfully');
            }

            return true;
        } catch (error) {
            isInitializingRef.current = false;
            console.error("Failed to initialize PixiJS application:", error);
            return false;
        }
    }, [sliderRef, resourceManager, preloadAssets, loadModules, setCancelled]);

    // Initialize Pixi and GSAP
    useEffect(() => {
        // Skip during server-side rendering
        if (typeof window === 'undefined') return;

        // Reset cancellation state
        cancellationRef.current = {
            isCancelled: false,
            cancelReason: null,
            isUnmounting: false
        };

        // Attempt initialization
        initializePixiApp();

        // Cleanup function
        return () => {
            // Set cancellation flags using the centralized function
            setCancelled('Component unmounting');
            cancellationRef.current.isUnmounting = true;

            // Reset initialization state
            isInitializedRef.current = false;
            isInitializingRef.current = false;

            // If ResourceManager is available, it will handle resource disposal
            if (!resourceManager && appRef.current) {
                try {
                    // Manual cleanup if no ResourceManager
                    const canvas = appRef.current.canvas;
                    if (canvas instanceof HTMLCanvasElement && canvas.parentElement) {
                        canvas.parentElement.removeChild(canvas);
                    }
                    appRef.current.destroy(true);
                } catch (error) {
                    console.error('Error during PixiJS app cleanup:', error);
                }

                // Clear references
                appRef.current = null;
            }
        };
    }, [sliderRef, resourceManager, initializePixiApp, setCancelled]);

    // Return refs for use in other hooks
    return {
        pixiRefs: {
            app: appRef,
            slides: slidesRef,
            textContainers: textContainersRef,
            backgroundDisplacementSprite: backgroundDisplacementSpriteRef,
            cursorDisplacementSprite: cursorDisplacementSpriteRef,
            bgDispFilter: bgDispFilterRef,
            cursorDispFilter: cursorDispFilterRef,
            currentIndex
        },
        isInitialized: isInitializedRef.current,
        isInitializing: isInitializingRef.current,
        loadingProgress: { ...loadingProgressRef.current }
    };
};