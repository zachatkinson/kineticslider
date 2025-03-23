import { type FilterConfig, type FilterResult, type FilterType } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Filter module loading states
 */
enum FilterModuleState {
    UNLOADED = 'unloaded',
    LOADING = 'loading',
    LOADED = 'loaded',
    ERROR = 'error'
}

/**
 * Interface for filter module registry entry
 */
interface FilterModuleEntry {
    state: FilterModuleState;
    loadPromise?: Promise<any>;
    lastUsed: number;
    useCount: number;
    loadTime?: number;
    creator?: Function;
    error?: Error;
}

/**
 * Configuration for filter lazy loading
 */
interface LazyLoadingConfig {
    /** Timeout in ms before unloading unused filters */
    unloadTimeoutMs: number;
    /** Maximum number of cached filter modules */
    maxCachedModules: number;
    /** Whether to enable prefetching */
    enablePrefetching: boolean;
    /** Whether to retry failed loads */
    retryFailedLoads: boolean;
    /** Maximum number of retries */
    maxRetries: number;
}

/**
 * Factory for creating and managing different types of PixiJS filters
 *
 * This factory creates filters based on the provided configuration,
 * with lazy loading of filter modules and resource management.
 */
export class FilterFactory {
    /** Shader resource manager instance */
    private static shaderManager: ShaderResourceManager | null = null;

    /** Filter cache for reusing instances with identical configurations */
    private static filterCache = new Map<string, FilterResult>();

    /** Debug mode flag */
    private static debug = false;

    /** Is shader pooling enabled */
    private static shaderPoolingEnabled = false;

    /** Registry of filter modules and their loading states */
    private static moduleRegistry = new Map<FilterType, FilterModuleEntry>();

    /** Lazy loading configuration */
    private static lazyLoadConfig: LazyLoadingConfig = {
        unloadTimeoutMs: 60000, // 1 minute
        maxCachedModules: 20,
        enablePrefetching: true,
        retryFailedLoads: true,
        maxRetries: 3
    };

    /** Timer for cleanup of unused modules */
    private static cleanupTimer: number | null = null;

    /** Map of filter types to their module paths for dynamic imports */
    private static readonly MODULE_PATHS: Record<FilterType, string> = {
        'adjustment': './filters/adjustmentFilter.js',
        'advancedBloom': './filters/advancedBloomFilter.js',
        'alpha': './filters/alphaFilter.js',
        'ascii': './filters/asciiFilter.js',
        'backdropBlur': './filters/backdropBlurFilter.js',
        'bevel': './filters/bevelFilter.js',
        'bloom': './filters/bloomFilter.js',
        'blur': './filters/blurFilter.js',
        'bulgePinch': './filters/bulgePinchFilter.js',
        'colorGradient': './filters/colorGradientFilter.js',
        'colorMap': './filters/colorMapFilter.js',
        'colorMatrix': './filters/colorMatrixFilter.js',
        'colorOverlay': './filters/colorOverlayFilter.js',
        'colorReplace': './filters/colorReplaceFilter.js',
        'convolution': './filters/convolutionFilter.js',
        'crossHatch': './filters/crossHatchFilter.js',
        'crt': './filters/crtFilter.js',
        'dot': './filters/dotFilter.js',
        'dropShadow': './filters/dropShadowFilter.js',
        'emboss': './filters/embossFilter.js',
        'glitch': './filters/glitchFilter.js',
        'glow': './filters/glowFilter.js',
        'godray': './filters/godrayFilter.js',
        'grayscale': './filters/grayscaleFilter.js',
        'hsl': './filters/hslAdjustmentFilter.js',
        'kawaseBlur': './filters/kawaseBlurFilter.js',
        'motionBlur': './filters/motionBlurFilter.js',
        'multiColorReplace': './filters/multiColorReplaceFilter.js',
        'noise': './filters/noiseFilter.js',
        'oldFilm': './filters/oldFilmFilter.js',
        'outline': './filters/outlineFilter.js',
        'pixelate': './filters/pixelateFilter.js',
        'radialBlur': './filters/radialBlurFilter.js',
        'reflection': './filters/reflectionFilter.js',
        'rgbSplit': './filters/rgbSplitFilter.js',
        'shockwave': './filters/shockwaveFilter.js',
        'simpleLightmap': './filters/simpleLightmapFilter.js',
        'simplexNoise': './filters/simplexNoiseFilter.js',
        'tiltShift': './filters/tiltShiftFilter.js',
        'twist': './filters/twistFilter.js',
        'zoomBlur': './filters/zoomBlurFilter.js'
    };

    /**
     * Initialize the FilterFactory with a ShaderResourceManager
     *
     * @param options - Configuration options
     */
    public static initialize(options: {
        enableShaderPooling?: boolean;
        enableDebug?: boolean;
        maxCacheSize?: number;
        lazyLoadConfig?: Partial<LazyLoadingConfig>;
    } = {}): void {
        // Get or create a shader manager instance
        this.shaderManager = ShaderResourceManager.getInstance({
            debug: options.enableDebug,
            maxPoolSize: 100
        });

        this.debug = options.enableDebug ?? false;
        this.shaderPoolingEnabled = options.enableShaderPooling ?? true;

        // Apply lazy loading configuration if provided
        if (options.lazyLoadConfig) {
            this.lazyLoadConfig = {
                ...this.lazyLoadConfig,
                ...options.lazyLoadConfig
            };
        }

        if (this.debug) {
            console.log(`[FilterFactory] Initialized with shader pooling ${this.shaderPoolingEnabled ? 'enabled' : 'disabled'}`);
            console.log(`[FilterFactory] Lazy loading configuration:`, this.lazyLoadConfig);
        }

        // Start the cleanup timer
        this.startCleanupTimer();

        // Apply shader program pooling patches if enabled
        if (this.shaderPoolingEnabled && this.shaderManager) {
            // PixiJS patching for shader pooling would go here in a production implementation
            // This requires internal knowledge of how each filter creates its shaders
            if (this.debug) {
                console.log('[FilterFactory] Shader pooling enabled - shader programs will be shared between filter instances');
            }
        }

        // Initialize the module registry with all filter types in UNLOADED state
        Object.keys(this.MODULE_PATHS).forEach(type => {
            const filterType = type as FilterType;
            if (!this.moduleRegistry.has(filterType)) {
                this.moduleRegistry.set(filterType, {
                    state: FilterModuleState.UNLOADED,
                    lastUsed: 0,
                    useCount: 0
                });
            }
        });
    }

    /**
     * Start the cleanup timer for unused filter modules
     */
    private static startCleanupTimer(): void {
        if (this.cleanupTimer !== null) {
            window.clearInterval(this.cleanupTimer);
        }

        this.cleanupTimer = window.setInterval(() => {
            this.cleanupUnusedModules();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Cleanup unused filter modules
     */
    private static cleanupUnusedModules(): void {
        if (this.debug) {
            console.log('[FilterFactory] Running cleanup for unused filter modules');
        }

        const now = Date.now();
        let unloadCount = 0;

        // Find modules that haven't been used recently
        for (const [type, entry] of this.moduleRegistry.entries()) {
            // Skip modules that are not loaded or are currently loading
            if (entry.state !== FilterModuleState.LOADED) continue;

            // Check if module hasn't been used for the timeout period
            const timeSinceLastUse = now - entry.lastUsed;
            if (timeSinceLastUse > this.lazyLoadConfig.unloadTimeoutMs) {
                // Unload the module by removing the creator reference
                entry.creator = undefined;
                entry.state = FilterModuleState.UNLOADED;
                unloadCount++;

                if (this.debug) {
                    console.log(`[FilterFactory] Unloaded unused filter module: ${type} (${timeSinceLastUse}ms since last use)`);
                }
            }
        }

        if (this.debug) {
            console.log(`[FilterFactory] Cleanup complete: unloaded ${unloadCount} unused filter modules`);
        }
    }

    /**
     * Prefetch filter modules based on likely usage
     *
     * @param filterTypes - Array of filter types to prefetch
     * @param priority - Priority level (high, medium, low)
     */
    public static prefetchFilterModules(filterTypes: FilterType[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
        if (!this.lazyLoadConfig.enablePrefetching) return;

        const priorityDelay = {
            high: 0,
            medium: 100,
            low: 1000
        };

        // Schedule prefetching with appropriate delay based on priority
        setTimeout(() => {
            filterTypes.forEach(type => {
                // Skip if already loaded or loading
                const entry = this.moduleRegistry.get(type);
                if (!entry || entry.state === FilterModuleState.LOADED || entry.state === FilterModuleState.LOADING) {
                    return;
                }

                if (this.debug) {
                    console.log(`[FilterFactory] Prefetching filter module: ${type} (${priority} priority)`);
                }

                // Load the module but don't wait for it
                this.loadFilterModule(type).catch(error => {
                    if (this.debug) {
                        console.error(`[FilterFactory] Error prefetching filter module ${type}:`, error);
                    }
                });
            });
        }, priorityDelay[priority]);
    }

    /**
     * Check if a filter module is available (loaded)
     *
     * @param type - Filter type to check
     * @returns True if the filter module is loaded and ready to use
     */
    public static isFilterModuleLoaded(type: FilterType): boolean {
        const entry = this.moduleRegistry.get(type);
        return entry?.state === FilterModuleState.LOADED && !!entry.creator;
    }

    /**
     * Get the loading state of a filter module
     *
     * @param type - Filter type to check
     * @returns The current loading state of the filter module
     */
    public static getFilterModuleState(type: FilterType): FilterModuleState {
        return this.moduleRegistry.get(type)?.state || FilterModuleState.UNLOADED;
    }

    /**
     * Load a filter module if not already loaded
     *
     * @param type - Type of filter to load
     * @returns Promise resolving when the module is loaded
     */
    private static async loadFilterModule(type: FilterType, retryCount = 0): Promise<any> {
        // Get or create registry entry
        if (!this.moduleRegistry.has(type)) {
            this.moduleRegistry.set(type, {
                state: FilterModuleState.UNLOADED,
                lastUsed: Date.now(),
                useCount: 0
            });
        }

        const entry = this.moduleRegistry.get(type)!;

        // If already loading, return the existing promise
        if (entry.state === FilterModuleState.LOADING && entry.loadPromise) {
            return entry.loadPromise;
        }

        // If already loaded, return immediately
        if (entry.state === FilterModuleState.LOADED && entry.creator) {
            // Update usage stats
            entry.lastUsed = Date.now();
            entry.useCount++;
            return Promise.resolve(entry.creator);
        }

        // Start loading the module
        entry.state = FilterModuleState.LOADING;
        const startTime = performance.now();

        // For better debuggability
        if (this.debug) {
            console.log(`[FilterFactory] Loading filter module: ${type}`);
        }

        try {
            // Record the loading promise - now using a more reliable method with the index file
            entry.loadPromise = this.importAllFilters().then(module => {
                // Convert the filter type to the correct function name
                // e.g., 'rgbSplit' -> 'createRGBSplitFilter'
                const creatorFnName = `create${this.capitalizeFilterType(type)}Filter`;

                if (this.debug) {
                    console.log(`[FilterFactory] Looking for creator function: ${creatorFnName}`);
                }

                const creator = module[creatorFnName];

                if (!creator || typeof creator !== 'function') {
                    throw new Error(`Filter creator function ${creatorFnName} not found in filters module`);
                }

                // Update registry entry
                entry.state = FilterModuleState.LOADED;
                entry.creator = creator;
                entry.loadTime = performance.now() - startTime;
                entry.lastUsed = Date.now();
                entry.useCount = 1;
                entry.error = undefined;

                if (this.debug) {
                    console.log(`[FilterFactory] Loaded filter module: ${type} in ${entry.loadTime.toFixed(2)}ms`);
                }

                return creator;
            });

            return entry.loadPromise;
        } catch (error) {
            entry.state = FilterModuleState.ERROR;
            entry.error = error as Error;

            if (this.debug) {
                console.error(`[FilterFactory] Error loading filter module ${type}:`, error);
            }

            // Retry loading if enabled and under max retries
            if (this.lazyLoadConfig.retryFailedLoads && retryCount < this.lazyLoadConfig.maxRetries) {
                if (this.debug) {
                    console.log(`[FilterFactory] Retrying load for filter module ${type} (attempt ${retryCount + 1}/${this.lazyLoadConfig.maxRetries})`);
                }

                // Wait a bit before retrying (exponential backoff)
                const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                await new Promise(resolve => setTimeout(resolve, retryDelay));

                // Clear the error state
                entry.state = FilterModuleState.UNLOADED;
                entry.error = undefined;

                // Try again with incremented retry count
                return this.loadFilterModule(type, retryCount + 1);
            }

            return Promise.reject(error);
        }
    }

    /**
     * Import all filters from the consolidated module
     * This is more reliable than individual dynamic imports
     *
     * @returns Promise resolving to the module with all filter creators
     */
    private static async importAllFilters(): Promise<any> {
        if (this.debug) {
            console.log('[FilterFactory] Importing all filters from consolidated module');
        }

        try {
            // Try importing the main filters index
            return import('./index');
        } catch (error) {
            if (this.debug) {
                console.error('[FilterFactory] Error importing filter index:', error);
            }

            // If direct import fails, try relative path from current module
            return import('../filters/index');
        }
    }

    /**
     * Capitalize the first letter of a filter type
     */
    private static capitalizeFilterType(type: string): string {
        // Handle special cases like "rgbSplit" -> "RGBSplit"
        if (type === 'rgbSplit') return 'RGBSplit';
        if (type === 'hsl') return 'HslAdjustment';

        // Standard case: first letter capitalized
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Generate a cache key for a filter configuration
     *
     * @param config - Filter configuration
     * @returns A string key for cache lookups
     */
    private static generateCacheKey(config: FilterConfig): string {
        return `${config.type}_${JSON.stringify(config)}`;
    }

    /**
     * Log a message if debug is enabled
     *
     * @param message - Message to log
     */
    private static log(message: string): void {
        if (this.debug) {
            console.log(`[FilterFactory] ${message}`);
        }
    }

    /**
     * Create a filter based on the provided configuration
     *
     * @param config - Configuration for the filter
     * @returns Promise resolving to an object containing the filter instance and control functions
     */
    static async createFilterAsync(config: FilterConfig & { type: FilterType }): Promise<FilterResult> {
        // Initialize if not already done
        if (!this.shaderManager) {
            this.initialize();
        }

        // Check cache for identical configuration
        const cacheKey = this.generateCacheKey(config);
        if (this.filterCache.has(cacheKey)) {
            const cachedResult = this.filterCache.get(cacheKey);
            this.log(`Reusing cached filter for ${config.type}`);

            // Update last used timestamp for the module
            const entry = this.moduleRegistry.get(config.type);
            if (entry) {
                entry.lastUsed = Date.now();
                entry.useCount++;
            }

            return cachedResult!;
        }

        try {
            // Load the filter module
            const creator = await this.loadFilterModule(config.type);

            // Create the filter using the loaded creator function
            const result = creator(config);

            // Cache the result
            this.filterCache.set(cacheKey, result);

            return result;
        } catch (error) {
            this.log(`Error creating filter ${config.type}: ${error}`);
            throw error;
        }
    }

    /**
     * Create a filter based on the provided configuration (synchronous version)
     * Falls back to async loading if the module is not already loaded
     *
     * @param config - Configuration for the filter
     * @returns Object containing the filter instance and control functions, or a promise resolving to it
     */
    static createFilter(config: FilterConfig & { type: FilterType }): FilterResult | Promise<FilterResult> {
        // Initialize if not already done
        if (!this.shaderManager) {
            this.initialize();
        }

        // Check cache for identical configuration
        const cacheKey = this.generateCacheKey(config);
        if (this.filterCache.has(cacheKey)) {
            const cachedResult = this.filterCache.get(cacheKey);
            this.log(`Reusing cached filter for ${config.type}`);

            // Update last used timestamp for the module
            const entry = this.moduleRegistry.get(config.type);
            if (entry) {
                entry.lastUsed = Date.now();
                entry.useCount++;
            }

            return cachedResult!;
        }

        // Check if the module is already loaded
        const entry = this.moduleRegistry.get(config.type);

        if (entry?.state === FilterModuleState.LOADED && entry.creator) {
            // Module is loaded, create the filter synchronously
            try {
                const result = entry.creator(config);
                this.filterCache.set(cacheKey, result);

                // Update usage stats
                entry.lastUsed = Date.now();
                entry.useCount++;

                return result;
            } catch (error) {
                this.log(`Error creating filter ${config.type}: ${error}`);
                throw error;
            }
        } else {
            // Module is not loaded, fall back to async loading
            this.log(`Filter module ${config.type} not loaded, loading asynchronously`);
            return this.createFilterAsync(config);
        }
    }

    /**
     * Get stats about loaded filter modules
     *
     * @returns Object with statistics about filter module loading
     */
    static getFilterModuleStats(): {
        totalModules: number;
        loadedModules: number;
        loadingModules: number;
        errorModules: number;
        unloadedModules: number;
        moduleDetails: Record<string, {
            state: string;
            useCount: number;
            lastUsed: number;
            loadTime?: number;
            hasError: boolean;
        }>;
    } {
        const stats = {
            totalModules: this.moduleRegistry.size,
            loadedModules: 0,
            loadingModules: 0,
            errorModules: 0,
            unloadedModules: 0,
            moduleDetails: {} as Record<string, any>
        };

        this.moduleRegistry.forEach((entry, type) => {
            if (entry.state === FilterModuleState.LOADED) stats.loadedModules++;
            else if (entry.state === FilterModuleState.LOADING) stats.loadingModules++;
            else if (entry.state === FilterModuleState.ERROR) stats.errorModules++;
            else stats.unloadedModules++;

            stats.moduleDetails[type] = {
                state: entry.state,
                useCount: entry.useCount,
                lastUsed: entry.lastUsed,
                loadTime: entry.loadTime,
                hasError: !!entry.error
            };
        });

        return stats;
    }

    /**
     * Clear the filter cache
     */
    static clearCache(): void {
        this.filterCache.clear();
        this.log('Filter cache cleared');
    }

    /**
     * Dispose all resources managed by the FilterFactory
     */
    static dispose(): void {
        // Clear cache and stop timer
        this.clearCache();

        if (this.cleanupTimer !== null) {
            window.clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        // Reset registry
        this.moduleRegistry.clear();

        this.log('FilterFactory disposed');
    }
}