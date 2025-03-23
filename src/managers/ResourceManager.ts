import { Texture, Filter, Container, Application } from 'pixi.js';
import { gsap } from 'gsap';
import { ShaderResourceManager } from './ShaderResourceManager';

/**
 * Types for resource tracking and management
 */
type EventCallback = EventListenerOrEventListenerObject;
type Timer = ReturnType<typeof setTimeout>;
type Animation = gsap.core.Tween | gsap.core.Timeline;

/**
 * Resource entry with reference counting for proper cleanup
 */
interface ResourceEntry<T> {
    resource: T;
    refCount: number;
    lastUsed?: number; // Timestamp for potential LRU optimization
}

/**
 * Resource batch tracking statistics
 */
interface BatchStats {
    totalBatches: number;
    totalItems: number;
    averageBatchSize: number;
    largestBatch: number;
}

/**
 * Configuration options for the ResourceManager
 */
interface ResourceManagerOptions {
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    enableMetrics?: boolean;
    autoCleanupInterval?: number | null; // ms, null to disable
    enableShaderPooling?: boolean;
}

/**
 * Performance metrics for resource operations
 */
interface PerformanceMetrics {
    operations: {
        [key: string]: {
            count: number;
            totalTime: number;
            averageTime: number;
        }
    };
    batchStats: {
        textures: BatchStats;
        filters: BatchStats;
        displayObjects: BatchStats;
        animations: BatchStats;
    };
}

/**
 * Centralized Resource Manager for WebGL and Browser Resources
 *
 * Provides efficient batch tracking and lifecycle management for:
 * - PIXI.js textures, filters, and display objects
 * - GSAP animations
 * - DOM event listeners
 * - Timers and intervals
 */
class ResourceManager {
    // Resource collections
    private textures = new Map<string, ResourceEntry<Texture>>();
    private filters = new Set<Filter>();
    private displayObjects = new Set<Container>();
    private pixiApps = new Set<Application>();
    private animations = new Set<Animation>();

    // Event listener tracking with improved nesting
    private listeners = new Map<EventTarget, Map<string, Set<EventCallback>>>();

    // Timer tracking
    private timeouts = new Set<Timer>();
    private intervals = new Set<Timer>();

    // Manager state
    private disposed = false;
    private unmounting = false;
    private readonly componentId: string;
    private readonly options: ResourceManagerOptions;

    // Performance metrics (optional)
    private metrics: PerformanceMetrics | null = null;
    private autoCleanupTimer: Timer | null = null;

    // Shader resource manager
    private shaderManager: ShaderResourceManager | null = null;

    /**
     * Creates a new ResourceManager instance
     *
     * @param componentId - Unique identifier for this component instance
     * @param options - Configuration options
     */
    constructor(componentId: string, options: ResourceManagerOptions = {}) {
        this.componentId = componentId;
        this.options = {
            logLevel: options.logLevel || 'warn',
            enableMetrics: options.enableMetrics || false,
            autoCleanupInterval: options.autoCleanupInterval || null,
            enableShaderPooling: options.enableShaderPooling !== false // Enable by default
        };

        // Initialize metrics if enabled
        if (this.options.enableMetrics) {
            this.metrics = {
                operations: {},
                batchStats: {
                    textures: this.createEmptyBatchStats(),
                    filters: this.createEmptyBatchStats(),
                    displayObjects: this.createEmptyBatchStats(),
                    animations: this.createEmptyBatchStats()
                }
            };
        }

        // Initialize shader manager if shader pooling is enabled
        if (this.options.enableShaderPooling) {
            this.shaderManager = ShaderResourceManager.getInstance({
                debug: this.options.logLevel === 'debug',
                enableMetrics: this.options.enableMetrics
            });
            this.log('info', 'Shader pooling enabled');
        }

        this.log('info', `ResourceManager initialized`);

        // Set up auto cleanup if enabled
        this.setupAutoCleanup();
    }

    /**
     * Creates an empty batch statistics object
     */
    private createEmptyBatchStats(): BatchStats {
        return {
            totalBatches: 0,
            totalItems: 0,
            averageBatchSize: 0,
            largestBatch: 0
        };
    }

    /**
     * Set up automatic cleanup interval
     */
    private setupAutoCleanup(): void {
        if (this.options.autoCleanupInterval) {
            this.autoCleanupTimer = setInterval(() => {
                this.performAutoCleanup();
            }, this.options.autoCleanupInterval);
        }
    }

    /**
     * Perform automatic cleanup of unused resources
     */
    private performAutoCleanup(): void {
        if (this.disposed || this.unmounting) return;

        this.log('debug', 'Performing automatic resource cleanup...');

        // Clean up 0-reference count textures
        let texturesReleased = 0;
        this.textures.forEach((entry, url) => {
            if (entry.refCount <= 0) {
                this.releaseTexture(url);
                texturesReleased++;
            }
        });

        // Clean up unused animations
        let animationsReleased = 0;
        this.animations.forEach(animation => {
            if (animation.isActive() === false) {
                animation.kill();
                this.animations.delete(animation);
                animationsReleased++;
            }
        });

        this.log('debug', `Auto cleanup complete: ${texturesReleased} textures and ${animationsReleased} animations released`);
    }

    /**
     * Log a message with the appropriate level
     *
     * @param level - Log level
     * @param message - Log message
     * @param data - Optional data to log
     */
    private log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any): void {
        const logLevels = {
            'error': 0,
            'warn': 1,
            'info': 2,
            'debug': 3
        };

        if (logLevels[level] <= logLevels[this.options.logLevel || 'warn']) {
            const logMessage = `[ResourceManager:${this.componentId}] ${message}`;

            switch (level) {
                case 'error':
                    console.error(logMessage, data);
                    break;
                case 'warn':
                    console.warn(logMessage, data);
                    break;
                case 'info':
                    console.info(logMessage, data);
                    break;
                case 'debug':
                    console.debug(logMessage, data);
                    break;
            }
        }
    }

    /**
     * Records performance metric for an operation
     *
     * @param name - Operation name
     * @param startTime - Start time of the operation
     */
    private recordMetric(name: string, startTime: number): void {
        if (!this.metrics) return;

        const endTime = performance.now();
        const duration = endTime - startTime;

        if (!this.metrics.operations[name]) {
            this.metrics.operations[name] = {
                count: 0,
                totalTime: 0,
                averageTime: 0
            };
        }

        const op = this.metrics.operations[name];
        op.count++;
        op.totalTime += duration;
        op.averageTime = op.totalTime / op.count;
    }

    /**
     * Update batch statistics
     *
     * @param type - Resource type
     * @param batchSize - Size of the batch
     */
    private updateBatchStats(type: 'textures' | 'filters' | 'displayObjects' | 'animations', batchSize: number): void {
        if (!this.metrics) return;

        const stats = this.metrics.batchStats[type];
        stats.totalBatches++;
        stats.totalItems += batchSize;
        stats.averageBatchSize = stats.totalItems / stats.totalBatches;
        stats.largestBatch = Math.max(stats.largestBatch, batchSize);
    }

    /**
     * Mark component as unmounting to prevent new resource allocations
     */
    markUnmounting(): void {
        this.unmounting = true;
        this.log('info', 'Component marked as unmounting');
    }

    /**
     * Check if the resource manager is active and can allocate resources
     */
    isActive(): boolean {
        return !this.unmounting && !this.disposed;
    }

    // ===== FILTER CONTROL METHODS =====

    /**
     * Safely disable a filter to ensure it has no visible effect
     *
     * @param filter - Filter to disable
     */
    disableFilter(filter: Filter): void {
        try {
            // Try multiple approaches to disable the filter
            if ('enabled' in filter && typeof filter.enabled === 'boolean') {
                filter.enabled = false;
            }

            // Some filters use alpha property
            if ('alpha' in filter && typeof filter.alpha === 'number') {
                filter.alpha = 0;
            }

            // Some filters use strength
            if ('strength' in filter && typeof filter.strength === 'number') {
                filter.strength = 0;
            }

            // Some filters have a scale property (e.g. DisplacementFilter)
            if ('scale' in filter) {
                const scale = filter.scale as any;
                if (scale && typeof scale.x === 'number' && typeof scale.y === 'number') {
                    scale.x = 0;
                    scale.y = 0;
                } else if (typeof scale === 'number') {
                    (filter as any).scale = 0;
                }
            }

            // Some filters use the blur property
            if ('blur' in filter && typeof filter.blur === 'number') {
                filter.blur = 0;
            }
        } catch (error) {
            this.log('debug', 'Error disabling filter', error);
        }
    }

    /**
     * Disable all filters on a display object
     *
     * @param displayObject - The display object whose filters should be disabled
     */
    disableFiltersOnObject(displayObject: Container): void {
        if (!displayObject.filters) return;

        try {
            if (Array.isArray(displayObject.filters)) {
                displayObject.filters.forEach(filter => {
                    if (filter) this.disableFilter(filter);
                });
            } else if (displayObject.filters) {
                // Handle single filter case
                this.disableFilter(displayObject.filters as Filter);
            }

            this.log('debug', 'Disabled filters on display object');
        } catch (error) {
            this.log('warn', 'Error disabling filters on object', error);
        }
    }

    /**
     * Initialize a filter in a disabled state
     * This ensures the filter has no effect when first created
     *
     * @param filter - Filter to initialize
     * @returns The initialized filter
     */
    initializeFilterDisabled<T extends Filter>(filter: T): T {
        this.disableFilter(filter);
        return filter;
    }

    /**
     * Batch initialize and disable filters
     *
     * @param filters - Array of filters to initialize disabled
     * @returns The array of initialized filters
     */
    initializeFilterBatchDisabled<T extends Filter[]>(filters: T): T {
        filters.forEach(filter => this.disableFilter(filter));
        return filters;
    }

    /**
     * Track a filter
     *
     * @param filter - Filter to track
     * @returns The filter for chaining
     */
    trackFilter(filter: Filter): Filter {
        if (!this.isActive()) return filter;

        const startTime = this.metrics ? performance.now() : 0;
        this.filters.add(filter);

        // Register with shader manager if available
        if (this.shaderManager) {
            // The shader manager will keep track of shader programs used by this filter
            // This is a simplified integration - in a real implementation we'd hook into
            // the filter's shader creation process
            this.log('debug', `Filter registered with shader manager`);
        }

        if (this.metrics) {
            this.recordMetric('trackFilter', startTime);
            this.updateBatchStats('filters', 1);
        }

        return filter;
    }

    /**
     * Dispose of a single filter
     */
    private disposeFilter(filter: Filter): void {
        const startTime = this.metrics ? performance.now() : 0;

        try {
            // First disable the filter before destroying it
            this.disableFilter(filter);

            // Release any shaders associated with this filter
            if (this.shaderManager) {
                this.shaderManager.releaseShader(filter as any);
            }

            // Then destroy it
            filter.destroy();
        } catch (error) {
            // Fallback destruction for resilience
            this.log('debug', `Using fallback disposal for filter`, error);
            this.disableFilter(filter);
        }

        this.filters.delete(filter);

        if (this.metrics) {
            this.recordMetric('disposeFilter', startTime);
        }
    }

    /**
     * Get shader manager instance
     *
     * @returns The shader manager instance or null if not enabled
     */
    getShaderManager(): ShaderResourceManager | null {
        return this.shaderManager;
    }

    // ===== BATCH TRACKING METHODS =====

    /**
     * Track multiple textures at once
     *
     * @param textures - Map of URL to texture
     * @returns The same map for chaining
     */
    trackTextureBatch(textures: Map<string, Texture>): Map<string, Texture> {
        if (!this.isActive()) return textures;

        const startTime = this.metrics ? performance.now() : 0;

        textures.forEach((texture, url) => {
            const entry = this.textures.get(url);
            if (entry) {
                entry.refCount++;
                entry.lastUsed = Date.now();
            } else {
                this.textures.set(url, {
                    resource: texture,
                    refCount: 1,
                    lastUsed: Date.now()
                });
            }
        });

        if (this.metrics) {
            this.recordMetric('trackTextureBatch', startTime);
            this.updateBatchStats('textures', textures.size);
        }

        this.log('debug', `Tracked ${textures.size} textures in batch`);
        return textures;
    }

    /**
     * Track multiple filters at once
     *
     * @param filters - Array of filters to track
     * @returns The same array for chaining
     */
    trackFilterBatch(filters: Filter[]): Filter[] {
        if (!this.isActive()) return filters;

        const startTime = this.metrics ? performance.now() : 0;

        filters.forEach(filter => this.filters.add(filter));

        if (this.metrics) {
            this.recordMetric('trackFilterBatch', startTime);
            this.updateBatchStats('filters', filters.length);
        }

        this.log('debug', `Tracked ${filters.length} filters in batch`);
        return filters;
    }

    /**
     * Track multiple display objects at once
     *
     * @param objects - Array of display objects to track
     * @returns The same array for chaining
     */
    trackDisplayObjectBatch(objects: Container[]): Container[] {
        if (!this.isActive()) return objects;

        const startTime = this.metrics ? performance.now() : 0;

        objects.forEach(object => this.displayObjects.add(object));

        if (this.metrics) {
            this.recordMetric('trackDisplayObjectBatch', startTime);
            this.updateBatchStats('displayObjects', objects.length);
        }

        this.log('debug', `Tracked ${objects.length} display objects in batch`);
        return objects;
    }

    /**
     * Track multiple animations at once
     *
     * @param animations - Array of animations to track
     * @returns The same array for chaining
     */
    trackAnimationBatch(animations: Animation[]): Animation[] {
        if (!this.isActive()) return animations;

        const startTime = this.metrics ? performance.now() : 0;

        animations.forEach(animation => this.animations.add(animation));

        if (this.metrics) {
            this.recordMetric('trackAnimationBatch', startTime);
            this.updateBatchStats('animations', animations.length);
        }

        this.log('debug', `Tracked ${animations.length} animations in batch`);
        return animations;
    }

    /**
     * Track event listeners in batch
     *
     * @param element - DOM element
     * @param listeners - Map of event types to callbacks
     */
    addEventListenerBatch(element: EventTarget, listeners: Map<string, EventCallback[]>): void {
        if (!this.isActive()) return;

        const startTime = this.metrics ? performance.now() : 0;
        let count = 0;

        // Ensure we have a map for this element
        if (!this.listeners.has(element)) {
            this.listeners.set(element, new Map());
        }

        const elementListeners = this.listeners.get(element)!;

        // Add all the listeners
        listeners.forEach((callbacks, eventType) => {
            if (!elementListeners.has(eventType)) {
                elementListeners.set(eventType, new Set());
            }

            const callbackSet = elementListeners.get(eventType)!;

            callbacks.forEach(callback => {
                callbackSet.add(callback);
                element.addEventListener(eventType, callback);
                count++;
            });
        });

        if (this.metrics) {
            this.recordMetric('addEventListenerBatch', startTime);
        }

        this.log('debug', `Added ${count} event listeners in batch`);
    }

    // ===== INDIVIDUAL TRACKING METHODS =====

    /**
     * Track a GSAP animation
     *
     * @param animation - Animation to track
     * @returns The animation for chaining
     */
    trackAnimation<T extends Animation>(animation: T): T {
        if (!this.isActive()) {
            animation.kill();
            return animation;
        }

        const startTime = this.metrics ? performance.now() : 0;
        this.animations.add(animation);

        if (this.metrics) {
            this.recordMetric('trackAnimation', startTime);
            this.updateBatchStats('animations', 1);
        }

        return animation;
    }

    /**
     * Track a texture
     *
     * @param url - Texture URL
     * @param texture - Texture to track
     * @returns The texture for chaining
     */
    trackTexture(url: string, texture: Texture): Texture {
        if (!this.isActive()) return texture;

        const startTime = this.metrics ? performance.now() : 0;

        const entry = this.textures.get(url);
        if (entry) {
            entry.refCount++;
            entry.lastUsed = Date.now();
        } else {
            this.textures.set(url, {
                resource: texture,
                refCount: 1,
                lastUsed: Date.now()
            });
        }

        if (this.metrics) {
            this.recordMetric('trackTexture', startTime);
            this.updateBatchStats('textures', 1);
        }

        return texture;
    }

    /**
     * Release a texture, destroying it when no longer referenced
     */
    releaseTexture(url: string): void {
        const entry = this.textures.get(url);
        if (!entry) return;

        const startTime = this.metrics ? performance.now() : 0;

        entry.refCount--;

        if (entry.refCount <= 0) {
            try {
                entry.resource.destroy(true);
                this.textures.delete(url);
                this.log('debug', `Destroyed texture: ${url}`);
            } catch (error) {
                this.log('warn', `Failed to destroy texture: ${url}`, error);
            }
        }

        if (this.metrics) {
            this.recordMetric('releaseTexture', startTime);
        }
    }

    /**
     * Track a PIXI Application
     *
     * @param app - Application to track
     * @returns The application for chaining
     */
    trackPixiApp(app: Application): Application {
        if (!this.isActive()) {
            this.disposePixiApp(app);
            return app;
        }

        const startTime = this.metrics ? performance.now() : 0;
        this.pixiApps.add(app);

        if (this.metrics) {
            this.recordMetric('trackPixiApp', startTime);
        }

        this.log('info', 'Tracking PIXI application');
        return app;
    }

    /**
     * Dispose of a PIXI Application
     */
    private disposePixiApp(app: Application): void {
        const startTime = this.metrics ? performance.now() : 0;

        try {
            app.stop();

            // Remove canvas from DOM
            if (app.canvas instanceof HTMLCanvasElement) {
                app.canvas.remove();
            }

            app.destroy(true, { children: true });
            this.log('info', 'PIXI application destroyed');
        } catch (error) {
            this.log('warn', 'Error disposing PIXI application', error);
        }

        this.pixiApps.delete(app);

        if (this.metrics) {
            this.recordMetric('disposePixiApp', startTime);
        }
    }

    /**
     * Track a display object
     *
     * @param displayObject - Display object to track
     * @returns The display object for chaining
     */
    trackDisplayObject<T extends Container>(displayObject: T): T {
        if (!this.isActive()) return displayObject;

        const startTime = this.metrics ? performance.now() : 0;
        this.displayObjects.add(displayObject);

        if (this.metrics) {
            this.recordMetric('trackDisplayObject', startTime);
            this.updateBatchStats('displayObjects', 1);
        }

        return displayObject;
    }

    /**
     * Dispose of a display object
     */
    private disposeDisplayObject(displayObject: Container): void {
        const startTime = this.metrics ? performance.now() : 0;

        try {
            // Remove from parent if possible
            if (displayObject.parent) {
                displayObject.parent.removeChild(displayObject);
            }

            // Disable filters first, then dispose them
            this.disableFiltersOnObject(displayObject);

            // Dispose filters if any
            if (displayObject.filters) {
                if (Array.isArray(displayObject.filters)) {
                    displayObject.filters.forEach((filter: Filter) => {
                        this.disposeFilter(filter);
                    });
                } else {
                    // Handle single filter case
                    this.disposeFilter(displayObject.filters as Filter);
                }
                // Set to empty array instead of null
                displayObject.filters = [];
            }

            // Destroy the object with appropriate options
            displayObject.destroy({
                children: true,
                texture: false
            });
        } catch (error) {
            this.log('warn', 'Error disposing display object', error);
        }

        this.displayObjects.delete(displayObject);

        if (this.metrics) {
            this.recordMetric('disposeDisplayObject', startTime);
        }
    }

    /**
     * Add an event listener with tracking
     */
    addEventListener(
        element: EventTarget,
        eventType: string,
        callback: EventCallback
    ): void {
        if (!this.isActive()) return;

        const startTime = this.metrics ? performance.now() : 0;

        if (!this.listeners.has(element)) {
            this.listeners.set(element, new Map());
        }

        const elementListeners = this.listeners.get(element)!;
        if (!elementListeners.has(eventType)) {
            elementListeners.set(eventType, new Set());
        }

        const callbacks = elementListeners.get(eventType)!;
        callbacks.add(callback);
        element.addEventListener(eventType, callback);

        if (this.metrics) {
            this.recordMetric('addEventListener', startTime);
        }
    }

    /**
     * Remove all event listeners
     */
    private removeAllEventListeners(): void {
        const startTime = this.metrics ? performance.now() : 0;
        let count = 0;

        this.listeners.forEach((eventMap, element) => {
            eventMap.forEach((callbacks, eventType) => {
                callbacks.forEach(callback => {
                    element.removeEventListener(eventType, callback);
                    count++;
                });
            });
        });

        this.listeners.clear();

        if (this.metrics) {
            this.recordMetric('removeAllEventListeners', startTime);
        }

        this.log('debug', `Removed ${count} event listeners`);
    }

    /**
     * Create a setTimeout with tracking
     */
    setTimeout(callback: () => void, delay: number): Timer {
        if (!this.isActive()) return setTimeout(() => {}, 0);

        const startTime = this.metrics ? performance.now() : 0;

        const timeout = setTimeout(() => {
            this.timeouts.delete(timeout);
            callback();
        }, delay);

        this.timeouts.add(timeout);

        if (this.metrics) {
            this.recordMetric('setTimeout', startTime);
        }

        return timeout;
    }

    /**
     * Create a setInterval with tracking
     */
    setInterval(callback: () => void, delay: number): Timer {
        if (!this.isActive()) return setInterval(() => {}, 0);

        const startTime = this.metrics ? performance.now() : 0;

        const interval = setInterval(callback, delay);
        this.intervals.add(interval);

        if (this.metrics) {
            this.recordMetric('setInterval', startTime);
        }

        return interval;
    }

    /**
     * Clear a tracked timeout
     */
    clearTimeout(id: Timer): void {
        const startTime = this.metrics ? performance.now() : 0;

        globalThis.clearTimeout(id);
        this.timeouts.delete(id);

        if (this.metrics) {
            this.recordMetric('clearTimeout', startTime);
        }
    }

    /**
     * Clear a tracked interval
     */
    clearInterval(id: Timer): void {
        const startTime = this.metrics ? performance.now() : 0;

        globalThis.clearInterval(id);
        this.intervals.delete(id);

        if (this.metrics) {
            this.recordMetric('clearInterval', startTime);
        }
    }

    /**
     * Clear all tracked timeouts
     */
    private clearAllTimeouts(): void {
        const startTime = this.metrics ? performance.now() : 0;
        let count = 0;

        this.timeouts.forEach(id => {
            globalThis.clearTimeout(id);
            count++;
        });

        this.timeouts.clear();

        if (this.metrics) {
            this.recordMetric('clearAllTimeouts', startTime);
        }

        this.log('debug', `Cleared ${count} timeouts`);
    }

    /**
     * Clear all tracked intervals
     */
    private clearAllIntervals(): void {
        const startTime = this.metrics ? performance.now() : 0;
        let count = 0;

        this.intervals.forEach(id => {
            globalThis.clearInterval(id);
            count++;
        });

        this.intervals.clear();

        if (this.metrics) {
            this.recordMetric('clearAllIntervals', startTime);
        }

        this.log('debug', `Cleared ${count} intervals`);
    }

    /**
     * Get current resource statistics
     *
     * @returns An object containing counts of various tracked resources
     */
    getStats(): Record<string, number | BatchStats | PerformanceMetrics | any> {
        const result: Record<string, number | BatchStats | PerformanceMetrics | any> = {
            textures: this.textures.size,
            filters: this.filters.size,
            displayObjects: this.displayObjects.size,
            animations: this.animations.size,
            eventTargets: this.listeners.size,
            timeouts: this.timeouts.size,
            intervals: this.intervals.size,
            pixiApps: this.pixiApps.size,
            shaderPoolingEnabled: !!this.shaderManager
        };

        // Add performance metrics if enabled
        if (this.metrics) {
            result.metrics = this.metrics;
        }

        // Add shader manager stats if available
        if (this.shaderManager) {
            result.shaderManager = this.shaderManager.getStats();
        }

        return result;
    }

    /**
     * Clear all tracked resources
     */
    dispose(): void {
        if (this.disposed) return;

        const startTime = this.metrics ? performance.now() : 0;

        this.log('info', 'Disposing all resources...');

        this.disposed = true;
        this.markUnmounting();

        // Stop auto cleanup if running
        if (this.autoCleanupTimer) {
            clearInterval(this.autoCleanupTimer);
            this.autoCleanupTimer = null;
        }

        // Clear animations first to stop visual changes
        this.animations.forEach(animation => animation.kill());
        this.animations.clear();

        // Remove all event listeners
        this.removeAllEventListeners();

        // Dispose PIXI applications (which will handle most resources)
        this.pixiApps.forEach(app => this.disposePixiApp(app));
        this.pixiApps.clear();

        // Disable all filters on display objects first
        this.displayObjects.forEach(obj => this.disableFiltersOnObject(obj));

        // Dispose remaining display objects
        this.displayObjects.forEach(obj => this.disposeDisplayObject(obj));
        this.displayObjects.clear();

        // Dispose filters
        this.filters.forEach(filter => this.disposeFilter(filter));
        this.filters.clear();

        // Release textures
        this.textures.forEach((entry, url) => {
            try {
                entry.resource.destroy(true);
            } catch (error) {
                this.log('warn', `Error disposing texture: ${url}`, error);
            }
        });
        this.textures.clear();

        // Clear timers
        this.clearAllTimeouts();
        this.clearAllIntervals();

        // Clear shader manager if present
        if (this.shaderManager) {
            // Release all filters from the shader manager by iterating through our filters
            this.filters.forEach(filter => {
                this.shaderManager?.releaseShader(filter as any);
            });
            // Set to null without calling the nonexistent clear method
            this.shaderManager = null;
        }

        if (this.metrics) {
            this.recordMetric('dispose', startTime);

            // Log performance summary
            this.log('info', 'Performance metrics summary:', this.metrics);
        }

        this.log('info', 'All resources disposed');
    }

    /**
     * Clears any pending updates in the queue
     */
    clearPendingUpdates(): void {
        // Clear any pending timeouts or intervals
        this.timeouts.forEach(clearTimeout);
        this.timeouts.clear();

        // Clear any pending animation frames
        this.intervals.forEach(clearInterval);
        this.intervals.clear();
    }

    /**
     * Monitor filter performance and adjust quality if necessary
     * Part of the shader optimization implementation
     *
     * @param filter - Filter to monitor
     * @param performanceThreshold - Performance threshold in ms
     * @param qualityReduceFactor - How much to reduce quality (0-1)
     * @returns Whether the filter was optimized
     */
    monitorFilterPerformance(
        filter: Filter,
        performanceThreshold: number = 16,
        qualityReduceFactor: number = 0.5
    ): boolean {
        if (!filter || !this.isActive()) return false;

        try {
            // Measure filter rendering time
            const startTime = performance.now();

            // Simulate a render cycle - in practice this would be done
            // during actual rendering with proper timing
            if (filter.enabled) {
                // Force filter to update its internal state
                if ('apply' in filter && typeof filter.apply === 'function') {
                    // This is a simplification - in a real implementation,
                    // we would measure during actual rendering
                    this.log('debug', 'Monitoring filter performance');
                }
            }

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // If rendering takes too long, reduce quality
            if (renderTime > performanceThreshold) {
                this.optimizeFilterQuality(filter, qualityReduceFactor);
                this.log('info', `Filter performance optimized: ${renderTime.toFixed(2)}ms -> threshold: ${performanceThreshold}ms`);
                return true;
            }

            return false;
        } catch (error) {
            this.log('warn', 'Error monitoring filter performance', error);
            return false;
        }
    }

    /**
     * Optimize a filter's quality settings to improve performance
     *
     * @param filter - Filter to optimize
     * @param factor - Factor to reduce quality by (0-1)
     * @returns Whether optimization was applied
     */
    optimizeFilterQuality(filter: Filter, factor: number = 0.5): boolean {
        if (!filter || !this.isActive()) return false;

        try {
            let optimized = false;

            // Adjust quality parameter if available
            if ('quality' in filter && typeof filter.quality === 'number') {
                const newQuality = Math.max(1, Math.floor(filter.quality * factor));
                if (newQuality < filter.quality) {
                    filter.quality = newQuality;
                    optimized = true;
                    this.log('debug', `Reduced filter quality to ${newQuality}`);
                }
            }

            // Adjust resolution if available
            if ('resolution' in filter && typeof filter.resolution === 'number') {
                const newResolution = Math.max(0.1, filter.resolution * factor);
                if (newResolution < filter.resolution) {
                    filter.resolution = newResolution;
                    optimized = true;
                    this.log('debug', `Reduced filter resolution to ${newResolution.toFixed(2)}`);
                }
            }

            // Many filters have a specific quality parameter
            const specificParams = [
                'kernelSize', 'blur', 'steps', 'passes', 'iterations',
                'sampleSize', 'pixelSize', 'blurX', 'blurY'
            ];

            // Try to adjust known quality parameters
            for (const param of specificParams) {
                if (param in filter && typeof (filter as any)[param] === 'number') {
                    const currentValue = (filter as any)[param];
                    // For parameters where higher = better quality, reduce
                    const newValue = Math.max(1, Math.floor(currentValue * factor));

                    if (newValue < currentValue) {
                        (filter as any)[param] = newValue;
                        optimized = true;
                        this.log('debug', `Reduced filter ${param} to ${newValue}`);
                    }
                }
            }

            return optimized;
        } catch (error) {
            this.log('warn', 'Error optimizing filter quality', error);
            return false;
        }
    }

    /**
     * Run diagnostics on all active filters
     * Provides insights into filter performance
     *
     * @returns Diagnostic information about filters
     */
    runFilterDiagnostics(): Record<string, any> {
        const results: Record<string, any> = {
            totalFilters: this.filters.size,
            filtersByType: {},
            potentialOptimizations: 0
        };

        try {
            // Group filters by type
            this.filters.forEach(filter => {
                const filterType = filter.constructor.name;
                if (!results.filtersByType[filterType]) {
                    results.filtersByType[filterType] = 0;
                }
                results.filtersByType[filterType]++;

                // Check for potential optimizations
                let canOptimize = false;

                // Check common quality parameters
                if ('quality' in filter && typeof filter.quality === 'number' && filter.quality > 1) {
                    canOptimize = true;
                }

                if ('resolution' in filter && typeof filter.resolution === 'number' && filter.resolution > 0.5) {
                    canOptimize = true;
                }

                // Count potential optimizations
                if (canOptimize) {
                    results.potentialOptimizations++;
                }
            });

            // Add shader manager diagnostics if available
            if (this.shaderManager) {
                results.shaderPoolStats = this.shaderManager.getStats();
            }

            return results;
        } catch (error) {
            this.log('warn', 'Error running filter diagnostics', error);
            return { error: 'Failed to run diagnostics', totalFilters: this.filters.size };
        }
    }

    /**
     * Automatically optimize all filters based on FPS
     * This method should be called periodically during animation
     *
     * @param currentFPS - Current FPS of the application
     * @param targetFPS - Target FPS to maintain
     * @param optimizationStep - How aggressive to optimize (0-1)
     * @returns Number of filters optimized
     */
    autoOptimizeFilters(
        currentFPS: number,
        targetFPS: number = 55,
        optimizationStep: number = 0.8
    ): number {
        if (!this.isActive() || this.filters.size === 0) return 0;

        // Don't optimize if FPS is already good
        if (currentFPS >= targetFPS) return 0;

        try {
            let optimizedCount = 0;
            const fpsDifference = targetFPS - currentFPS;

            // More aggressive optimization for lower FPS
            const optimizationFactor = Math.min(0.9, Math.max(0.5,
                optimizationStep * (1 - (currentFPS / targetFPS))
            ));

            this.log('info', `Auto-optimizing filters: FPS ${currentFPS.toFixed(1)}/${targetFPS}, factor: ${optimizationFactor.toFixed(2)}`);

            // Sort filters by complexity/cost (simplified approach)
            // In a real implementation, you'd track actual rendering cost
            const filterEntries = Array.from(this.filters.entries())
                .map(([id, filter]) => {
                    // Estimate filter cost based on its properties
                    let estimatedCost = 1;

                    // Quality-based cost estimation
                    if ('quality' in filter && typeof filter.quality === 'number') {
                        estimatedCost *= filter.quality;
                    }

                    // Resolution-based cost estimation
                    if ('resolution' in filter && typeof filter.resolution === 'number') {
                        estimatedCost *= filter.resolution;
                    }

                    return { id, filter, cost: estimatedCost };
                })
                .sort((a, b) => b.cost - a.cost); // Sort by highest cost first

            // Optimize the most expensive filters first
            for (const { filter } of filterEntries) {
                if (optimizedCount >= 3) break; // Limit optimizations per frame

                const wasOptimized = this.optimizeFilterQuality(filter, optimizationFactor);
                if (wasOptimized) {
                    optimizedCount++;
                }
            }

            if (optimizedCount > 0) {
                this.log('info', `Optimized ${optimizedCount} filters to improve performance`);
            }

            return optimizedCount;
        } catch (error) {
            this.log('warn', 'Error auto-optimizing filters', error);
            return 0;
        }
    }
}

export default ResourceManager;