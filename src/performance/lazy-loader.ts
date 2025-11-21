/**
 * @fileoverview LazyLoader - Progressive feature loading system
 *
 * Advanced lazy loading system that progressively loads features based on
 * user interaction, viewport visibility, and performance metrics. Optimizes
 * initial load time and ensures load time stays under 2 seconds.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { debugLogger } from '../utils/debug-logger';

/**
 * Loadable feature definition
 */
export interface LoadableFeature {
  /** Unique feature identifier */
  id: string;
  /** Feature name */
  name: string;
  /** Module path to load */
  modulePath: string;
  /** Loading strategy */
  strategy: LoadingStrategy;
  /** Load priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Conditions for loading */
  conditions?: LoadingCondition[];
  /** Dependencies that must load first */
  dependencies?: string[];
  /** Feature size estimate in bytes */
  estimatedSize?: number;
  /** Timeout for loading in milliseconds */
  timeout?: number;
}

/**
 * Loading strategies
 */
export type LoadingStrategy =
  | 'immediate' // Load immediately
  | 'on-demand' // Load when requested
  | 'on-interaction' // Load on first user interaction
  | 'on-visible' // Load when component becomes visible
  | 'on-idle' // Load during browser idle time
  | 'on-route' // Load when route changes
  | 'preload' // Preload with high priority
  | 'prefetch'; // Prefetch with low priority

/**
 * Loading conditions
 */
export interface LoadingCondition {
  /** Condition type */
  type: 'viewport' | 'interaction' | 'performance' | 'network' | 'custom';
  /** Condition value */
  value: unknown;
  /** Condition check function */
  check?: () => boolean | Promise<boolean>;
}

/**
 * Load result
 */
export interface LoadResult<T = unknown> {
  /** Feature ID */
  featureId: string;
  /** Whether load was successful */
  success: boolean;
  /** Loaded module */
  module?: T;
  /** Load time in milliseconds */
  loadTime: number;
  /** Error if load failed */
  error?: Error;
  /** Whether loaded from cache */
  cached: boolean;
}

/**
 * Loading statistics
 */
export interface LoadingStats {
  /** Total features registered */
  totalFeatures: number;
  /** Features loaded */
  loadedFeatures: number;
  /** Features pending */
  pendingFeatures: number;
  /** Features failed */
  failedFeatures: number;
  /** Total load time */
  totalLoadTime: number;
  /** Average load time */
  averageLoadTime: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Total bytes loaded */
  totalBytesLoaded: number;
}

/**
 * Lazy loader configuration
 */
export interface LazyLoaderConfig {
  /** Enable caching of loaded modules */
  enableCaching: boolean;
  /** Maximum cache size in bytes */
  maxCacheSize: number;
  /** Default timeout for loading */
  defaultTimeout: number;
  /** Maximum concurrent loads */
  maxConcurrentLoads: number;
  /** Enable preloading */
  enablePreloading: boolean;
  /** Preload threshold (load when idle for X ms) */
  preloadThreshold: number;
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Network speed threshold for conditional loading */
  networkSpeedThreshold: number;
}

/**
 * Lazy loader events
 */
export interface LazyLoaderEvents {
  'feature-loading': (feature: LoadableFeature) => void;
  'feature-loaded': (result: LoadResult) => void;
  'feature-failed': (result: LoadResult) => void;
  'cache-full': (stats: LoadingStats) => void;
  'performance-warning': (stats: LoadingStats) => void;
}

/**
 * Feature cache entry
 */
interface CacheEntry<T = unknown> {
  module: T;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Loading queue item
 */
interface QueueItem {
  feature: LoadableFeature;
  resolve: (result: LoadResult) => void;
  reject: (error: Error) => void;
  startTime: number;
}

/**
 * LazyLoader - Progressive feature loading system
 */
export class LazyLoader extends SimpleEventEmitter {
  private config: Required<LazyLoaderConfig>;
  private features = new Map<string, LoadableFeature>();
  private cache = new Map<string, CacheEntry>();
  private loadingQueue: QueueItem[] = [];
  private activeLoads = new Set<string>();
  private loadedFeatures = new Set<string>();
  private failedFeatures = new Set<string>();
  private intersectionObserver: IntersectionObserver | null = null;
  private idleCallback: number | null = null;
  private networkInfo: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } | null = null;
  private stats: LoadingStats;

  constructor(config: Partial<LazyLoaderConfig> = {}) {
    super();

    this.config = {
      enableCaching: config.enableCaching ?? true,
      maxCacheSize: config.maxCacheSize ?? 50 * 1024 * 1024, // 50MB
      defaultTimeout: config.defaultTimeout ?? 10000, // 10 seconds
      maxConcurrentLoads: config.maxConcurrentLoads ?? 3,
      enablePreloading: config.enablePreloading ?? true,
      preloadThreshold: config.preloadThreshold ?? 2000, // 2 seconds
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      networkSpeedThreshold: config.networkSpeedThreshold ?? 1, // 1 Mbps
    };

    this.stats = {
      totalFeatures: 0,
      loadedFeatures: 0,
      pendingFeatures: 0,
      failedFeatures: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      totalBytesLoaded: 0,
    };

    this.initializeLazyLoader();
  }

  /**
   * Initialize lazy loader
   */
  private initializeLazyLoader(): void {
    // Setup intersection observer for visibility-based loading
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { threshold: 0.1 }
      );
    }

    // Get network information if available
    if ('connection' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.networkInfo = (navigator as any).connection;
    }

    // Setup idle time monitoring
    this.setupIdleMonitoring();

    debugLogger.info('LazyLoader initialized', 'LazyLoader', {
      caching: this.config.enableCaching,
      maxConcurrent: this.config.maxConcurrentLoads,
      preloading: this.config.enablePreloading,
    });
  }

  /**
   * Register a feature for lazy loading
   */
  registerFeature(feature: LoadableFeature): void {
    this.features.set(feature.id, feature);
    this.stats.totalFeatures++;

    // Auto-load immediate features
    if (feature.strategy === 'immediate') {
      this.loadFeature(feature.id);
    }
    // Setup preloading
    else if (feature.strategy === 'preload' && this.config.enablePreloading) {
      this.schedulePreload(feature);
    }
    // Setup visibility observation
    else if (feature.strategy === 'on-visible') {
      this.observeForVisibility(feature);
    }

    debugLogger.info(`Feature registered: ${feature.id}`, 'LazyLoader', {
      strategy: feature.strategy,
      priority: feature.priority,
    });
  }

  /**
   * Load a feature by ID
   */
  async loadFeature<T = unknown>(featureId: string): Promise<LoadResult<T>> {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    // Check cache first
    if (this.config.enableCaching && this.cache.has(featureId)) {
      const cached = this.cache.get(featureId)!;
      cached.lastAccessed = Date.now();
      cached.accessCount++;

      return {
        featureId,
        success: true,
        module: cached.module as T,
        loadTime: 0,
        cached: true,
      };
    }

    // Check if already loading
    if (this.activeLoads.has(featureId)) {
      return this.waitForActiveLoad<T>(featureId);
    }

    // Check if already loaded
    if (this.loadedFeatures.has(featureId)) {
      const cached = this.cache.get(featureId);
      return {
        featureId,
        success: true,
        module: cached?.module as T,
        loadTime: 0,
        cached: true,
      };
    }

    // Check conditions
    const conditionsMet = await this.checkConditions(feature);
    if (!conditionsMet) {
      throw new Error(`Conditions not met for feature: ${featureId}`);
    }

    // Check dependencies
    await this.loadDependencies(feature);

    // Add to queue or load immediately
    if (this.activeLoads.size >= this.config.maxConcurrentLoads) {
      return this.queueLoad<T>(feature);
    }

    return this.executeLoad<T>(feature);
  }

  /**
   * Preload features based on strategy
   */
  preloadFeatures(
    priorities: LoadableFeature['priority'][] = ['high', 'medium']
  ): void {
    if (!this.config.enablePreloading) return;

    const featuresToPreload = Array.from(this.features.values()).filter(
      (feature) =>
        priorities.includes(feature.priority) &&
        (feature.strategy === 'preload' || feature.strategy === 'prefetch') &&
        !this.loadedFeatures.has(feature.id) &&
        !this.activeLoads.has(feature.id)
    );

    featuresToPreload.forEach((feature) => {
      this.loadFeature(feature.id).catch((error) => {
        debugLogger.warn(`Preload failed for ${feature.id}:`, error);
      });
    });
  }

  /**
   * Load features on user interaction
   */
  loadOnInteraction(featureIds: string[]): void {
    const handleInteraction = (): void => {
      featureIds.forEach((id) => {
        const feature = this.features.get(id);
        if (feature && feature.strategy === 'on-interaction') {
          this.loadFeature(id);
        }
      });

      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    document.addEventListener('scroll', handleInteraction, { once: true });
  }

  /**
   * Get feature by ID
   */
  getFeature(featureId: string): LoadableFeature | undefined {
    return this.features.get(featureId);
  }

  /**
   * Check if feature is loaded
   */
  isLoaded(featureId: string): boolean {
    return this.loadedFeatures.has(featureId);
  }

  /**
   * Get loaded module
   */
  getModule<T = unknown>(featureId: string): T | undefined {
    const cacheEntry = this.cache.get(featureId);
    return cacheEntry?.module as T;
  }

  /**
   * Get loading statistics
   */
  getStats(): LoadingStats {
    // Update real-time stats
    this.stats.loadedFeatures = this.loadedFeatures.size;
    this.stats.failedFeatures = this.failedFeatures.size;
    this.stats.pendingFeatures = this.activeLoads.size;

    if (this.stats.loadedFeatures > 0) {
      this.stats.averageLoadTime =
        this.stats.totalLoadTime / this.stats.loadedFeatures;
    }

    const totalCacheAccess = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    this.stats.cacheHitRate =
      totalCacheAccess > 0 ? (this.cache.size / totalCacheAccess) * 100 : 0;

    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    debugLogger.info('LazyLoader cache cleared', 'LazyLoader');
  }

  /**
   * Dispose lazy loader
   */
  dispose(): void {
    // Clear observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Clear idle callback
    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback);
      this.idleCallback = null;
    }

    // Clear cache
    this.clearCache();

    // Clear collections
    this.features.clear();
    this.activeLoads.clear();
    this.loadedFeatures.clear();
    this.failedFeatures.clear();
    this.loadingQueue = [];

    debugLogger.info('LazyLoader disposed', 'LazyLoader');
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Execute feature load
   */
  private async executeLoad<T = unknown>(
    feature: LoadableFeature
  ): Promise<LoadResult<T>> {
    const startTime = performance.now();
    this.activeLoads.add(feature.id);
    this.emit('feature-loading', feature);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Load timeout for feature: ${feature.id}`));
        }, feature.timeout || this.config.defaultTimeout);
      });

      // Load module with timeout
      const loadPromise = import(feature.modulePath);
      const module = await Promise.race([loadPromise, timeoutPromise]);

      const loadTime = performance.now() - startTime;
      const result: LoadResult<T> = {
        featureId: feature.id,
        success: true,
        module: module as T,
        loadTime,
        cached: false,
      };

      // Cache the module
      if (this.config.enableCaching) {
        this.cacheModule(feature, module, feature.estimatedSize || 1024);
      }

      // Update stats
      this.loadedFeatures.add(feature.id);
      this.stats.totalLoadTime += loadTime;
      this.stats.totalBytesLoaded += feature.estimatedSize || 1024;

      this.emit('feature-loaded', result);
      debugLogger.info(
        `Feature loaded: ${feature.id}`,
        'LazyLoader',
        {
          loadTime: `${loadTime.toFixed(2)}ms`,
        }
      );

      return result;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      const result: LoadResult<T> = {
        featureId: feature.id,
        success: false,
        loadTime,
        error: error as Error,
        cached: false,
      };

      this.failedFeatures.add(feature.id);
      this.emit('feature-failed', result);
      debugLogger.error(`Feature load failed: ${feature.id}`, 'LazyLoader', error);

      throw error;
    } finally {
      this.activeLoads.delete(feature.id);
      this.processQueue();
    }
  }

  /**
   * Queue feature load
   */
  private queueLoad<T = unknown>(
    feature: LoadableFeature
  ): Promise<LoadResult<T>> {
    return new Promise((resolve, reject) => {
      this.loadingQueue.push({
        feature,
        resolve: resolve as (result: LoadResult) => void,
        reject,
        startTime: performance.now(),
      });

      // Sort queue by priority
      this.loadingQueue.sort((a, b) => {
        const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorities[a.feature.priority] - priorities[b.feature.priority];
      });
    });
  }

  /**
   * Process loading queue
   */
  private processQueue(): void {
    while (
      this.loadingQueue.length > 0 &&
      this.activeLoads.size < this.config.maxConcurrentLoads
    ) {
      const item = this.loadingQueue.shift()!;

      this.executeLoad(item.feature).then(item.resolve).catch(item.reject);
    }
  }

  /**
   * Wait for active load
   */
  private async waitForActiveLoad<T = unknown>(
    featureId: string
  ): Promise<LoadResult<T>> {
    return new Promise((resolve) => {
      const checkLoad = (): void => {
        if (!this.activeLoads.has(featureId)) {
          const cached = this.cache.get(featureId);
          resolve({
            featureId,
            success: true,
            module: cached?.module as T,
            loadTime: 0,
            cached: true,
          });
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });
  }

  /**
   * Check loading conditions
   */
  private async checkConditions(feature: LoadableFeature): Promise<boolean> {
    if (!feature.conditions) return true;

    for (const condition of feature.conditions) {
      let conditionMet = false;

      switch (condition.type) {
        case 'viewport':
          conditionMet = this.checkViewportCondition(condition);
          break;
        case 'interaction':
          conditionMet = this.checkInteractionCondition(condition);
          break;
        case 'performance':
          conditionMet = this.checkPerformanceCondition(condition);
          break;
        case 'network':
          conditionMet = this.checkNetworkCondition(condition);
          break;
        case 'custom':
          if (condition.check) {
            conditionMet = await condition.check();
          }
          break;
      }

      if (!conditionMet) return false;
    }

    return true;
  }

  /**
   * Load feature dependencies
   */
  private async loadDependencies(feature: LoadableFeature): Promise<void> {
    if (!feature.dependencies) return;

    const dependencyPromises = feature.dependencies.map((depId) => {
      if (!this.isLoaded(depId)) {
        return this.loadFeature(depId);
      }
      return Promise.resolve();
    });

    await Promise.all(dependencyPromises);
  }

  /**
   * Cache loaded module
   */
  private cacheModule(
    feature: LoadableFeature,
    module: unknown,
    size: number
  ): void {
    // Check cache size limit
    const currentCacheSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    if (currentCacheSize + size > this.config.maxCacheSize) {
      this.evictCache(size);
    }

    this.cache.set(feature.id, {
      module,
      size,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Evict cache entries to make space
   */
  private evictCache(neededSpace: number): void {
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    let freedSpace = 0;
    for (const [id, entry] of entries) {
      this.cache.delete(id);
      freedSpace += entry.size;

      if (freedSpace >= neededSpace) break;
    }

    if (freedSpace >= neededSpace) {
      this.emit('cache-full', this.getStats());
    }
  }

  /**
   * Setup idle monitoring
   */
  private setupIdleMonitoring(): void {
    if (typeof requestIdleCallback === 'undefined') return;

    const scheduleIdleLoad = (): void => {
      this.idleCallback = requestIdleCallback(
        () => {
          this.loadIdleFeatures();
          scheduleIdleLoad(); // Schedule next idle check
        },
        { timeout: this.config.preloadThreshold }
      );
    };

    scheduleIdleLoad();
  }

  /**
   * Load features during idle time
   */
  private loadIdleFeatures(): void {
    const idleFeatures = Array.from(this.features.values()).filter(
      (feature) =>
        feature.strategy === 'on-idle' &&
        !this.loadedFeatures.has(feature.id) &&
        !this.activeLoads.has(feature.id)
    );

    idleFeatures.forEach((feature) => {
      this.loadFeature(feature.id).catch((error) => {
        debugLogger.warn(`Idle load failed for ${feature.id}:`, error);
      });
    });
  }

  /**
   * Schedule preload
   */
  private schedulePreload(feature: LoadableFeature): void {
    setTimeout(() => {
      if (!this.loadedFeatures.has(feature.id)) {
        this.loadFeature(feature.id).catch((error) => {
          debugLogger.warn(`Preload failed for ${feature.id}:`, error);
        });
      }
    }, this.config.preloadThreshold);
  }

  /**
   * Observe for visibility
   */
  private observeForVisibility(_feature: LoadableFeature): void {
    // This would need a DOM element to observe
    // In a real implementation, this would be connected to specific DOM elements
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const featureId = entry.target.getAttribute('data-lazy-feature');
        if (featureId && this.features.has(featureId)) {
          this.loadFeature(featureId);
        }
      }
    });
  }

  /**
   * Check viewport condition
   */
  private checkViewportCondition(_condition: LoadingCondition): boolean {
    // Simplified viewport check
    return true;
  }

  /**
   * Check interaction condition
   */
  private checkInteractionCondition(_condition: LoadingCondition): boolean {
    // Check if user has interacted
    return document.readyState === 'complete';
  }

  /**
   * Check performance condition
   */
  private checkPerformanceCondition(_condition: LoadingCondition): boolean {
    if (!this.config.enablePerformanceMonitoring) return true;

    // Check performance metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize > 100 * 1024 * 1024) {
      // 100MB
      return false;
    }

    return true;
  }

  /**
   * Check network condition
   */
  private checkNetworkCondition(_condition: LoadingCondition): boolean {
    if (!this.networkInfo) return true;

    const effectiveType = this.networkInfo.effectiveType;
    const slowConnections = ['slow-2g', '2g'];

    return !slowConnections.includes(effectiveType || '');
  }
}
