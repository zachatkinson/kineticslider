/**
 * FilterManager Service
 * 
 * Manages PIXI filters with integration to our existing resource management
 * architecture, providing performance optimization and clean abstractions.
 * 
 * @module FilterManager
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../utils/event-emitter';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { logger } from '../utils/logger';
import type { 
  FilterType, 
  FilterId, 
  FilterConfig,
  FilterResult,
  FilterModuleEntry,
  FilterInstance,
  FilterManagerConfig,
  FilterPerformanceMetrics,
  FilterEventType,
  FilterEvent,
  FilterIntensity
} from '../types/filters';
import { 
  createFilterId,
  createFilterCacheKey
} from '../types/filters';

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
 * FilterManager Service
 *
 * Provides centralized management of PIXI filters with:
 * - Lazy loading of filter modules
 * - Resource pooling and optimization
 * - Performance monitoring
 * - Memory management
 * - Event-driven architecture
 *
 * @example
 * const filterManager = FilterManager.getInstance();
 * const filter = await filterManager.createFilter({
 *   type: 'glow',
 *   enabled: true,
 *   intensity: createFilterIntensity(7)
 * });
 */
export class FilterManager extends SimpleEventEmitter {
  private static instance: FilterManager | null = null;
  
  private readonly config: Required<FilterManagerConfig>;
  private readonly performanceMonitor: PerformanceMonitor;
  
  // Filter management
  private readonly moduleRegistry = new Map<FilterType, FilterModuleEntry>();
  private readonly filterCache = new Map<string, FilterResult>();
  private readonly activeFilters = new Map<FilterId, FilterInstance>();
  
  // Performance tracking
  private performanceMetrics: FilterPerformanceMetrics = {
    activeFilters: 0,
    creationTimeMs: 0,
    averageUpdateTimeMs: 0,
    memoryUsageMB: 0,
    cacheHitRate: 0,
    shaderCompilations: 0
  };
  
  // Cleanup management
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isDisposed = false;

  /**
   * Filter module paths for dynamic imports
   */
  private static readonly MODULE_PATHS: Record<FilterType, string> = {
    // Core visual effects
    'displacement': './filters/DisplacementFilter',
    'blur': './filters/BlurFilter',
    'glow': './filters/GlowFilter',
    'glitch': './filters/GlitchFilter',
    'rgbSplit': './filters/RGBSplitFilter',
    'distortion': './filters/DistortionFilter',
    
    // Color manipulation
    'adjustment': './filters/AdjustmentFilter',
    'colorMatrix': './filters/ColorMatrixFilter',
    'colorOverlay': './filters/ColorOverlayFilter',
    'colorReplace': './filters/ColorReplaceFilter',
    'colorGradient': './filters/ColorGradientFilter',
    'colorMap': './filters/ColorMapFilter',
    'grayscale': './filters/GrayscaleFilter',
    'hsl': './filters/HSLFilter',
    'multiColorReplace': './filters/MultiColorReplaceFilter',
    
    // Blur effects
    'advancedBloom': './filters/AdvancedBloomFilter',
    'bloom': './filters/BloomFilter',
    'kawaseBlur': './filters/KawaseBlurFilter',
    'motionBlur': './filters/MotionBlurFilter',
    'radialBlur': './filters/RadialBlurFilter',
    'tiltShift': './filters/TiltShiftFilter',
    'zoomBlur': './filters/ZoomBlurFilter',
    'backdropBlur': './filters/BackdropBlurFilter',
    
    // Distortion effects
    'bulgePinch': './filters/BulgePinchFilter',
    'twist': './filters/TwistFilter',
    'shockwave': './filters/ShockwaveFilter',
    'reflection': './filters/ReflectionFilter',
    
    // Artistic effects
    'ascii': './filters/ASCIIFilter',
    'crossHatch': './filters/CrossHatchFilter',
    'crt': './filters/CRTFilter',
    'dot': './filters/DotFilter',
    'emboss': './filters/EmbossFilter',
    'oldFilm': './filters/OldFilmFilter',
    'pixelate': './filters/PixelateFilter',
    'outline': './filters/OutlineFilter',
    
    // Lighting effects
    'godray': './filters/GodrayFilter',
    'simpleLightmap': './filters/SimpleLightmapFilter',
    'bevel': './filters/BevelFilter',
    'dropShadow': './filters/DropShadowFilter',
    
    // Noise effects
    'noise': './filters/NoiseFilter',
    'simplexNoise': './filters/SimplexNoiseFilter',
    
    // Utility filters
    'alpha': './filters/AlphaFilter',
    'convolution': './filters/ConvolutionFilter'
  };

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: FilterManagerConfig = {}) {
    super();
    
    this.config = {
      maxConcurrentFilters: config.maxConcurrentFilters ?? 50,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableCaching: config.enableCaching ?? true,
      cacheSize: config.cacheSize ?? 100,
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 30000
    };
    
    // Initialize dependencies
    this.performanceMonitor = new PerformanceMonitor();
    
    this.initializeModuleRegistry();
    this.startCleanupTimer();
    
    logger.info('FilterManager initialized', { config: this.config });
  }

  /**
   * Get the singleton instance of FilterManager
   *
   * @param config - Optional configuration for the FilterManager
   *
   * @returns The FilterManager instance
   *
   */
  public static getInstance(config?: FilterManagerConfig): FilterManager {
    if (!FilterManager.instance) {
      FilterManager.instance = new FilterManager(config);
    }
    return FilterManager.instance;
  }

  /**
   * Initialize the module registry
   */
  private initializeModuleRegistry(): void {
    Object.keys(FilterManager.MODULE_PATHS).forEach(type => {
      const filterType = type as FilterType;
      this.moduleRegistry.set(filterType, {
        state: FilterModuleState.UNLOADED,
        lastUsed: 0,
        useCount: 0
      });
    });
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    if (!this.config.enableAutoCleanup) return;
    
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform cleanup of unused resources
   */
  private performCleanup(): void {
    if (this.isDisposed) return;
    
    const now = Date.now();
    const cleanupThreshold = 60000; // 1 minute
    
    // Clean up unused filter instances
    for (const [id, instance] of this.activeFilters) {
      if (now - instance.lastUsed > cleanupThreshold && instance.useCount === 0) {
        this.disposeFilter(id);
      }
    }
    
    // Clean up cache if it's too large
    if (this.filterCache.size > this.config.cacheSize) {
      const entries = Array.from(this.filterCache.entries());
      const toRemove = entries.slice(0, entries.length - this.config.cacheSize);
      
      for (const [key] of toRemove) {
        this.filterCache.delete(key);
      }
    }
    
    logger.debug('FilterManager cleanup completed', {
      activeFilters: this.activeFilters.size,
      cacheSize: this.filterCache.size
    });
  }

  /**
   * Load a filter module dynamically
   *
   * @param type - Filter type to load
   *
   * @returns Promise resolving to creator function
   *
   */
  private async loadFilterModule(type: FilterType): Promise<(config: FilterConfig) => FilterResult> {
    const entry = this.moduleRegistry.get(type);
    if (!entry) {
      throw new Error(`Unknown filter type: ${type}`);
    }
    
    if (entry.state === FilterModuleState.LOADED && entry.creator) {
      return entry.creator;
    }
    
    if (entry.state === FilterModuleState.LOADING && entry.loadPromise) {
      return entry.loadPromise as Promise<(config: FilterConfig) => FilterResult>;
    }
    
    return this.importFilterModule(type);
  }

  /**
   * Import filter module using dynamic import
   *
   * @param type - Filter type to import
   *
   * @returns Promise resolving to creator function
   *
   */
  private async importFilterModule(type: FilterType): Promise<(config: FilterConfig) => FilterResult> {
    const entry = this.moduleRegistry.get(type);
    if (!entry) {
      throw new Error(`Unknown filter type: ${type}`);
    }
    
    if (entry.state === FilterModuleState.LOADED && entry.creator) {
      return entry.creator;
    }
    
    if (entry.state === FilterModuleState.LOADING && entry.loadPromise) {
      return entry.loadPromise;
    }
    
    entry.state = FilterModuleState.LOADING;
    entry.lastUsed = Date.now();
    
    const loadStartTime = performance.now();
    
    try {
      const modulePath = FilterManager.MODULE_PATHS[type];
      const loadPromise = import(modulePath);
      entry.loadPromise = loadPromise;
      
      const module = await loadPromise;
      const loadTime = performance.now() - loadStartTime;
      
      entry.state = FilterModuleState.LOADED;
      entry.creator = module.createFilter || module.default;
      entry.loadTime = loadTime;
      entry.useCount++;
      
      logger.debug(`Filter module loaded: ${type}`, { loadTime });
      
      if (!entry.creator) {
        throw new Error(`No creator function found in module: ${type}`);
      }
      
      return entry.creator;
    } catch (error) {
      entry.state = FilterModuleState.ERROR;
      entry.error = error as Error;
      
      logger.error(`Failed to load filter module: ${type}`, error as Error);
      throw error;
    }
  }

  /**
   * Create a filter with the given configuration
   *
   * @param config - Filter configuration
   *
   * @returns Promise resolving to FilterResult
   *
   */
  public async createFilter<T extends FilterConfig>(config: T): Promise<FilterResult> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cacheKey = createFilterCacheKey(config);
        const cached = this.filterCache.get(cacheKey);
        if (cached) {
          this.performanceMetrics.cacheHitRate = 
            (this.performanceMetrics.cacheHitRate * 0.9) + (1 * 0.1);
          return cached;
        }
      }
      
      // Load filter module
      const creator = await this.loadFilterModule(config.type);
      if (!creator) {
        throw new Error(`No creator function found for filter type: ${config.type}`);
      }
      
      // Create filter instance
      const result = creator(config);
      const filterId = createFilterId(`${config.type}-${Date.now()}-${Math.random()}`);
      
      // Track the instance
      const instance: FilterInstance = {
        id: filterId,
        filter: result.filter,
        config,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 1
      };
      
      this.activeFilters.set(filterId, instance);
      
      // Cache the result
      if (this.config.enableCaching) {
        const cacheKey = createFilterCacheKey(config);
        this.filterCache.set(cacheKey, result);
      }
      
      // Update performance metrics
      const creationTime = performance.now() - startTime;
      this.performanceMetrics.creationTimeMs = 
        (this.performanceMetrics.creationTimeMs * 0.9) + (creationTime * 0.1);
      this.performanceMetrics.activeFilters = this.activeFilters.size;
      
      // Emit event
      this.emitFilterEvent('created', filterId, { config, creationTime });
      
      logger.debug(`Filter created: ${config.type}`, { 
        filterId, 
        creationTime,
        cacheSize: this.filterCache.size 
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to create filter: ${config.type}`, error as Error);
      throw error;
    }
  }

  /**
   * Update filter intensity
   *
   * @param filterId
   *
   * @param intensity
   *
   */
  public updateFilterIntensity(filterId: FilterId, intensity: FilterIntensity): void {
    const instance = this.activeFilters.get(filterId);
    if (!instance) {
      logger.warn(`Filter not found: ${filterId}`);
      return;
    }
    
    const startTime = performance.now();
    
    try {
      // Update the filter configuration
      instance.config.intensity = intensity;
      instance.lastUsed = Date.now();
      instance.useCount++;
      
      // Apply the intensity update (this would be implemented by each filter)
      // For now, we'll assume the filter has an updateIntensity method
      if ('updateIntensity' in instance.filter) {
        (instance.filter as { updateIntensity: (intensity: FilterIntensity) => void }).updateIntensity(intensity);
      }
      
      const updateTime = performance.now() - startTime;
      this.performanceMetrics.averageUpdateTimeMs = 
        (this.performanceMetrics.averageUpdateTimeMs * 0.9) + (updateTime * 0.1);
      
      this.emitFilterEvent('updated', filterId, { intensity, updateTime });
      
    } catch (error) {
      logger.error(`Failed to update filter intensity: ${filterId}`, error as Error);
      this.emitFilterEvent('error', filterId, { error });
    }
  }

  /**
   * Dispose of a filter
   *
   * @param filterId - The filter ID to dispose
   *
   */
  public disposeFilter(filterId: FilterId): void {
    const instance = this.activeFilters.get(filterId);
    if (!instance) {
      return;
    }
    
    try {
      // Dispose of the filter if it has a dispose method
      if ('dispose' in instance.filter && typeof instance.filter.dispose === 'function') {
        instance.filter.dispose();
      }
      
      this.activeFilters.delete(filterId);
      this.performanceMetrics.activeFilters = this.activeFilters.size;
      
      this.emitFilterEvent('disposed', filterId);
      
      logger.debug(`Filter disposed: ${filterId}`);
      
    } catch (error) {
      logger.error(`Failed to dispose filter: ${filterId}`, error as Error);
    }
  }

  /**
   * Get filter by ID
   *
   * @param filterId - The filter ID to look up
   *
   * @returns The filter instance or undefined if not found
   *
   */
  public getFilter(filterId: FilterId): FilterInstance | undefined {
    return this.activeFilters.get(filterId);
  }

  /**
   * Get all active filters
   *
   * @returns Array of all active filter instances
   *
   */
  public getActiveFilters(): FilterInstance[] {
    return Array.from(this.activeFilters.values());
  }

  /**
   * Get performance metrics
   *
   * @returns Current performance metrics
   *
   */
  public getPerformanceMetrics(): FilterPerformanceMetrics {
    // Update memory usage
    this.performanceMetrics.memoryUsageMB = this.calculateMemoryUsage();
    return { ...this.performanceMetrics };
  }

  /**
   * Calculate memory usage
   *
   * @returns Estimated memory usage in MB
   *
   */
  private calculateMemoryUsage(): number {
    // This is a simplified calculation
    // In a real implementation, you'd measure actual GPU memory usage
    const filterCount = this.activeFilters.size;
    const cacheSize = this.filterCache.size;
    const estimatedMB = (filterCount * 0.5) + (cacheSize * 0.1);
    return estimatedMB;
  }

  /**
   * Emit filter event
   *
   * @param type
   *
   * @param filterId
   *
   * @param data
   *
   */
  private emitFilterEvent(
    type: FilterEventType, 
    filterId: FilterId, 
    data?: Record<string, unknown>
  ): void {
    const event: FilterEvent = {
      type,
      filterId,
      timestamp: Date.now(),
      data
    };
    
    this.emit('filter-event', event);
    this.emit(type, event);
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.filterCache.clear();
    logger.info('Filter cache cleared');
  }

  /**
   * Dispose of the FilterManager
   */
  public dispose(): void {
    if (this.isDisposed) return;
    
    this.isDisposed = true;
    
    // Clear cleanup timer
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Dispose all active filters
    for (const filterId of this.activeFilters.keys()) {
      this.disposeFilter(filterId);
    }
    
    // Clear caches
    this.filterCache.clear();
    this.moduleRegistry.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    FilterManager.instance = null;
    
    logger.info('FilterManager disposed');
  }
} 