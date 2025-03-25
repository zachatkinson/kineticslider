import { useEffect, useRef, useCallback } from 'react';
import { Container, Sprite, Filter, AlphaFilter } from 'pixi.js';
import { type FilterConfig, type FilterType, type BaseFilterConfig } from '../filters/types';
import { FilterFactory } from '../filters';
import {
  type HookParams,
  type FilterBatchConfig,
  type FilterDiff
} from '../types';
import ResourceManager from '../managers/ResourceManager';
import { type FilterResult } from '../filters';
import RenderScheduler from '../managers/RenderScheduler';
import { createHookUpdateHelper, UpdateType } from '../managers/UpdateTypes';
import gsap from 'gsap';
import { isDevelopment } from '../utils/environment';

// Development environment check
const devMode = isDevelopment();

// Define the custom event name for filter coordination
const FILTER_COORDINATION_EVENT = 'kinetic-slider:filter-update';

// Interface for filter update event detail
interface FilterUpdateEventDetail {
  type: string;
  intensity: number;
  timestamp?: number;
  source?: string;
  priority?: UpdatePriority;
}

// Define a more specific type for the target objects we're applying filters to
type FilterableObject = Sprite | Container;

// Type to represent a map of objects to their applied filters and control functions
interface FilterMap {
  [id: string]: {
    target: FilterableObject;
    filters: {
      instance: Filter;
      updateIntensity: (intensity: number) => void;
      reset: () => void;
      initialIntensity: number;
    }[];
  };
}

// Type for storing original filter configurations
interface OriginalFilterConfigs {
  image: FilterConfig[];
  text: FilterConfig[];
}

// Type to represent update priority
type UpdatePriority = 'high' | 'normal' | 'low' | 'critical';

// Enhanced filter update type for batch processing
interface BatchFilterUpdate {
  filterId: string;
  changes: Partial<BaseFilterConfig>;
  timestamp: number;
  priority: UpdatePriority;
}

// Interface for the hook's return value
interface UseFiltersResult {
  updateFilterIntensities: (active: boolean, forceUpdate?: boolean) => void;
  resetAllFilters: () => void;
  activateFilterEffects: () => void;
  isInitialized: boolean;
  isActive: boolean;
  setFiltersActive: (active: boolean) => void;
}

export const useFilters = (
  { pixi, props, resourceManager }:
    Omit<HookParams, 'sliderRef'> & { resourceManager?: ResourceManager | null }
): UseFiltersResult => {
  if (devMode) {
    console.log('[useFilters] Hook called with:', {
      hasApp: !!pixi.app.current,
      hasStage: !!(pixi.app.current?.stage),
      slidesCount: pixi.slides.current?.length,
      textContainersCount: pixi.textContainers.current?.length,
      hasResourceManager: !!resourceManager,
      imageFilters: props.imageFilters,
      textFilters: props.textFilters
    });
  }

  // Move all the useRef calls here
  const filterMapRef = useRef<FilterMap>({});
  // Store original filter configurations separately
  const originalConfigsRef = useRef<OriginalFilterConfigs>({ image: [], text: [] });
  const filtersInitializedRef = useRef<boolean>(false);
  const filtersActiveRef = useRef<boolean>(false);
  const debouncedRenderRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Add refs for our filter application functions to avoid circular references
  const applyFiltersToTargetRef = useRef<(target: FilterableObject, configs: FilterConfig[], id: string) => Promise<void>>(null!);
  const applyFiltersToObjectsRef = useRef<(targets: FilterableObject[], configs: FilterConfig[], baseId: string) => Promise<void>>(null!);

  // Store batch resource collections for efficient management
  const batchCollectionRef = useRef<{
    pendingFilters: Filter[];
    pendingObjects: FilterableObject[];
  }>({
    pendingFilters: [],
    pendingObjects: []
  });

  // Batch update queue and configuration
  const batchQueueRef = useRef<BatchFilterUpdate[]>([]);
  const batchConfigRef = useRef<FilterBatchConfig>({
    bufferMs: 16, // One frame at 60fps - will be adjusted dynamically
    maxBatchSize: 10 // Will be adjusted dynamically
  });
  const batchTimeoutRef = useRef<number | null>(null);

  // Performance metrics tracking
  const performanceMetricsRef = useRef<{
    lastProcessTime: number;
    averageProcessTime: number;
    updateCount: number;
    bufferAdjustmentCounter: number;
    totalProcessTime: number;
  }>({
    lastProcessTime: 0,
    averageProcessTime: 0,
    updateCount: 0,
    bufferAdjustmentCounter: 0,
    totalProcessTime: 0
  });

  // Add a cache for filter states to avoid redundant calculations
  const filterStateCache = useRef<Map<string, any>>(new Map());

  // Create a ref to hold the processBatchQueue function
  const processBatchQueueRef = useRef<() => void>(() => {
    const start = performance.now();
    const queue = [...batchQueueRef.current];

    // Clear the queue before processing to avoid duplicates if called twice
    batchQueueRef.current = [];

    if (queue.length === 0) return;

    if (devMode) {
      console.log(`[useFilters] Processing batch of ${queue.length} filter updates`);
    }

    // Group updates by filterId to apply only the latest update for each filter
    const updates: Record<string, BatchFilterUpdate> = {};

    // Define priority order mapping for sorting
    const priorityOrder: Record<UpdatePriority, number> = {
      'low': 0,
      'normal': 1,
      'high': 2,
      'critical': 3
    };

    // Process updates from lowest to highest priority
    queue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Keep only the latest update for each filter, prioritizing higher priority
    for (const update of queue) {
      // If we already have an update for this filter with higher or equal priority, skip
      if (updates[update.filterId] &&
        priorityOrder[updates[update.filterId].priority] >= priorityOrder[update.priority]) {
        continue;
      }

      // Otherwise, keep this update
      updates[update.filterId] = update;
    }

    // Apply all updates
    Object.values(updates).forEach(update => {
      const { filterId, changes } = update;
      const [targetId, filterIndex] = filterId.split('-');

      if (!filterMapRef.current[targetId]) {
        if (devMode) {
          console.warn(`[useFilters] Filter target not found: ${targetId}`);
        }
        return;
      }

      const filterData = filterMapRef.current[targetId].filters[Number(filterIndex)];
      if (!filterData) {
        if (devMode) {
          console.warn(`[useFilters] Filter not found: ${filterId}`);
        }
        return;
      }

      // Apply intensity change if specified
      if (changes.intensity !== undefined) {
        filterData.updateIntensity(changes.intensity);
        if (devMode) {
          console.log(`[useFilters] Set filter ${filterId} to ${changes.enabled ? 'active' : 'inactive'} with intensity ${changes.intensity}`);
        }
      }

      // Apply enabled state if specified
      if (changes.enabled !== undefined) {
        filterData.instance.enabled = changes.enabled;
      }
    });

    // Calculate processing time and update metrics
    const end = performance.now();
    const processingTime = end - start;

    const metrics = performanceMetricsRef.current;
    metrics.lastProcessTime = processingTime;
    metrics.totalProcessTime += processingTime;
    metrics.updateCount += queue.length;
    metrics.averageProcessTime = metrics.totalProcessTime / metrics.updateCount;

    // Dynamically adjust buffer size based on performance
    metrics.bufferAdjustmentCounter++;
    if (metrics.bufferAdjustmentCounter >= 10) {
      metrics.bufferAdjustmentCounter = 0;

      // If processing is taking too long, increase buffer time
      if (metrics.averageProcessTime > 4) { // 4ms is 25% of a 60fps frame
        batchConfigRef.current.bufferMs = Math.min(50, batchConfigRef.current.bufferMs + 4);
        if (devMode) {
          console.log(`[useFilters] Increased batch buffer to ${batchConfigRef.current.bufferMs}ms due to slow processing`);
        }
      } else if (metrics.averageProcessTime < 2 && batchConfigRef.current.bufferMs > 16) {
        // If processing is fast, decrease buffer time, but not below 16ms
        batchConfigRef.current.bufferMs = Math.max(16, batchConfigRef.current.bufferMs - 2);
        if (devMode) {
          console.log(`[useFilters] Decreased batch buffer to ${batchConfigRef.current.bufferMs}ms due to fast processing`);
        }
      }
    }

    // Trigger a render update via the Pixi app ticker if available
    if (pixi.app.current) {
      pixi.app.current.render();
    }
  });

  // Create a ref to hold the scheduleNextBatch function
  const scheduleNextBatchRef = useRef<() => void>(() => {
    // Clear any existing timeout
    if (batchTimeoutRef.current !== null) {
      window.clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // If there are updates in the queue, schedule processing
    if (batchQueueRef.current.length > 0) {
      // If we have critical updates, process immediately
      if (batchQueueRef.current.some(update => update.priority === 'critical')) {
        processBatchQueueRef.current();
        return;
      }

      // If we have high priority updates and enough of them, process sooner
      const highPriorityCount = batchQueueRef.current.filter(update =>
        update.priority === 'high').length;

      if (highPriorityCount > 0 && (
        highPriorityCount >= 3 ||
        batchQueueRef.current.length >= batchConfigRef.current.maxBatchSize
      )) {
        processBatchQueueRef.current();
        return;
      }

      // Otherwise, schedule processing after buffer time
      batchTimeoutRef.current = window.setTimeout(() => {
        processBatchQueueRef.current();
        batchTimeoutRef.current = null;
      }, batchConfigRef.current.bufferMs);
    }
  });

  /**
   * Process filter configurations to normalize them
   *
   * @param filterConfig - Single filter config or array of configs
   * @returns Array of normalized filter configs
   */
  const processFilterConfigs = (filterConfig?: any): FilterConfig[] => {
    if (!filterConfig) {
      return [];
    }

    // Normalize to array
    const configs = Array.isArray(filterConfig) ? filterConfig : [filterConfig];

    // Filter out invalid configs and ensure required properties
    return configs.filter(config => {
      // Must have a type property
      if (!config || !config.type) {
        if (devMode) {
          console.warn('Invalid filter config - missing type:', config);
        }
        return false;
      }

      return true;
    }).map(config => {
      // Create a new object without duplicating properties
      return {
        type: config.type,
        // Set default values only if not defined in config
        enabled: config.enabled ?? true, // Default to enabled if not explicitly disabled
        intensity: config.intensity ?? 1,  // Default intensity 1 if not defined
        ...config // Keep all other properties from config (might override defaults)
      };
    });
  };

  // Add a helper function for type conversion
  const adaptFilterConfig = (config: any): FilterConfig => {
    const { type, enabled = true, intensity = 1, options = {}, ...rest } = config;

    // Merge options with other properties
    const filterProperties = { ...rest, ...options };

    return {
      type: type as FilterType,
      enabled: enabled !== false,
      intensity: intensity || 1,
      ...filterProperties
    } as FilterConfig;
  };

  /**
   * Apply filters to a collection of target objects
   */
  const applyFiltersToObjects = useCallback(async (
    targets: FilterableObject[],
    configs: FilterConfig[],
    baseId: string
  ): Promise<void> => {
    // Skip if no configs or targets provided
    if (!configs || configs.length === 0 || !targets || targets.length === 0) {
      if (devMode) {
        console.log(`No filter configs or targets provided for ${baseId}`);
      }
      return;
    }

    // Safeguard against missing ref
    if (!applyFiltersToTargetRef.current) {
      console.error('[useFilters] applyFiltersToTargetRef.current is not defined');
      return;
    }

    // Convert the configs if necessary
    const processedConfigs = configs.map(c => adaptFilterConfig(c));

    // Process each target
    const applyPromises = targets.map((target, index) => {
      const targetId = `${baseId}-${index}`;
      return applyFiltersToTargetRef.current!(target, processedConfigs, targetId);
    });

    // Wait for all filters to be applied
    await Promise.all(applyPromises);
  }, []);

  // Store the function in the ref
  useEffect(() => {
    applyFiltersToObjectsRef.current = applyFiltersToObjects;
  }, [applyFiltersToObjects]);

  /**
   * Updates the intensity of all filters
   * @param active Whether the filters should be active or inactive
   * @param force Whether to force update all filters
   */
  const updateFilterIntensities = useCallback((active: boolean, force: boolean = false) => {
    if (!filtersInitializedRef.current) {
      if (devMode) {
        console.log('[useFilters] Filters not initialized, skipping intensity update');
      }
      return;
    }

    if (devMode) {
      console.log(`[useFilters] Setting filter intensity to ${active ? 'active' : 'inactive'}`);
    }

    // Create a batch of updates
    const batchUpdates: BatchFilterUpdate[] = [];

    // For each filter, set its enabled state and set appropriate intensity
    Object.entries(filterMapRef.current).forEach(([targetId, filterData]) => {
      try {
        // Add type assertion
        const typedFilterData = filterData as {
          target: FilterableObject;
          filters: {
            instance: Filter;
            updateIntensity: (intensity: number) => void;
            reset: () => void;
            initialIntensity: number;
          }[];
        };

        if (!typedFilterData.target) return;

        const { target, filters } = typedFilterData;

        if (!target || !filters || filters.length === 0) return;

        // Skip if filter is already in the desired state and not forcing
        if (!force && filters.some(f => f.instance.enabled === active)) return;

        // Directly update the filter
        filters.forEach(f => {
          f.instance.enabled = active;
          if (active) {
            // Set intensity based on config
            if (f.initialIntensity !== undefined) {
              f.updateIntensity(f.initialIntensity);
            }
          } else {
            // Set to zero intensity
            f.updateIntensity(0);
          }
        });

        if (devMode) {
          console.log(`[useFilters] Set filter ${targetId} to ${active ? 'active' : 'inactive'} with intensity ${active ? 'initial' : 0}`);
        }

        // Add to batch
        batchUpdates.push({
          filterId: targetId,
          changes: {
            enabled: active
          },
          timestamp: performance.now(),
          priority: force ? 'critical' : 'normal'
        });
      } catch (error) {
        if (devMode) {
          console.error(`[useFilters] Error updating filter ${targetId}:`, error);
        }
      }
    });

    // Process the batch
    if (batchUpdates.length > 0) {
      if (devMode) {
        console.log(`[useFilters] Processing batch of ${batchUpdates.length} filter updates`);
      }
      batchQueueRef.current.push(...batchUpdates);

      // If force is true, process immediately
      if (force) {
        processBatchQueueRef.current();
      } else {
        // Otherwise schedule processing
        scheduleNextBatchRef.current();
      }
    }

    // Update active state
    filtersActiveRef.current = active;
  }, [filtersInitializedRef.current]);

  /**
   * Reset all filters to their default state
   */
  const resetAllFilters = useCallback(() => {
    if (!filtersInitializedRef.current) {
      if (devMode) {
        console.log('[useFilters] Filters not initialized, skipping reset');
      }
      return;
    }

    if (devMode) {
      console.log('[useFilters] Resetting all filters to default state');
    }

    // Prepare batch updates
    const updates: BatchFilterUpdate[] = [];
    const now = performance.now();

    // Queue reset operations for all filters
    Object.entries(filterMapRef.current).forEach(([targetId, filterData]) => {
      const typedFilterData = filterData as {
        target: FilterableObject;
        filters: {
          instance: Filter;
          updateIntensity: (intensity: number) => void;
          reset: () => void;
          initialIntensity: number;
        }[];
      };

      typedFilterData.filters.forEach((filter, index) => {
        const filterId = `${targetId}-${index}`;

        // Add reset operation to batch queue
        updates.push({
          filterId,
          changes: {
            intensity: filter.initialIntensity,
            enabled: true
          },
          timestamp: now,
          priority: 'normal'
        });

        if (devMode) {
          console.log(`[useFilters] Reset filter ${filterId} to default state`);
        }
      });
    });

    // Add updates to the batch queue
    batchQueueRef.current.push(...updates);

    // Schedule processing
    scheduleNextBatchRef.current();

    // Call the reset function on each filter outside the batch
    // This is done separately since reset operations might involve complex state resets
    // that aren't handled by simple property changes
    Object.entries(filterMapRef.current).forEach(([_, filterData]) => {
      const typedFilterData = filterData as {
        target: FilterableObject;
        filters: {
          instance: Filter;
          updateIntensity: (intensity: number) => void;
          reset: () => void;
          initialIntensity: number;
        }[];
      };

      typedFilterData.filters.forEach(filter => {
        filter.reset();
      });
    });
  }, []);

  /**
   * Activate filter effects
   */
  const activateFilterEffects = useCallback(() => {
    try {
      // If filters are already initialized, just update their intensity
      if (filtersInitializedRef.current) {
        updateFilterIntensities(true, true);
        return;
      }

      if (devMode) {
        console.log('[useFilters] Filters not initialized, initializing now before activation');
      }

      // Check if we have the required objects to initialize filters
      if (!pixi.app.current || !pixi.slides.current || !pixi.slides.current.length) {
        console.log('[useFilters] Missing required objects for filter initialization');
        return;
      }

      // Process filter configs
      const imageFilterConfigs = processFilterConfigs(props.imageFilters || []);
      const textFilterConfigs = processFilterConfigs(props.textFilters || []);

      // Store original configs
      originalConfigsRef.current = {
        image: [...imageFilterConfigs],
        text: [...textFilterConfigs]
      };

      console.log(`[useFilters] Initializing filters: ${imageFilterConfigs.length} image filters, ${textFilterConfigs.length} text filters`);

      // Apply filters to slides
      if (pixi.slides.current && pixi.slides.current.length) {
        pixi.slides.current.forEach((slide, index) => {
          if (!slide) return;

          const slideName = `slide-${index}`;
          console.log(`[useFilters] Creating filters for ${slideName}`);

          // Create the filter entry
          filterMapRef.current[slideName] = {
            target: slide,
            filters: []
          };

          // Apply each filter
          imageFilterConfigs.forEach(async (config, filterIndex) => {
            try {
              // Create the filter via FilterFactory
              const filterResult = await FilterFactory.createFilterAsync(config as any);
              const filter = filterResult.filter;
              filter.enabled = true;

              // Add the filter to the slide
              if (!slide.filters) {
                slide.filters = [filter];
              } else if (Array.isArray(slide.filters)) {
                slide.filters.push(filter);
              }

              // Store the filter data
              filterMapRef.current[slideName].filters.push({
                instance: filter,
                updateIntensity: (intensity) => {
                  console.log(`[useFilters] Updated ${slideName} filter ${filterIndex} intensity to ${intensity}`);
                  filterResult.updateIntensity(intensity);
                },
                reset: () => {
                  console.log(`[useFilters] Reset ${slideName} filter ${filterIndex}`);
                  filterResult.reset();
                },
                initialIntensity: config.intensity || 1
              });

              console.log(`[useFilters] Created filter for ${slideName} with type ${config.type}`);
            } catch (err) {
              console.error(`[useFilters] Error creating filter for ${slideName}:`, err);
            }
          });
        });
      }

      // Apply filters to text containers
      if (pixi.textContainers.current && pixi.textContainers.current.length) {
        pixi.textContainers.current.forEach((container, index) => {
          if (!container) return;

          const containerName = `text-container-${index}`;
          console.log(`[useFilters] Creating filters for ${containerName}`);

          // Create the filter entry
          filterMapRef.current[containerName] = {
            target: container,
            filters: []
          };

          // Apply each filter
          textFilterConfigs.forEach(async (config, filterIndex) => {
            try {
              // Create the filter via FilterFactory
              const filterResult = await FilterFactory.createFilterAsync(config as any);
              const filter = filterResult.filter;
              filter.enabled = true;

              // Add the filter to the container
              if (!container.filters) {
                container.filters = [filter];
              } else if (Array.isArray(container.filters)) {
                container.filters.push(filter);
              }

              // Store the filter data
              filterMapRef.current[containerName].filters.push({
                instance: filter,
                updateIntensity: (intensity) => {
                  console.log(`[useFilters] Updated ${containerName} filter ${filterIndex} intensity to ${intensity}`);
                  filterResult.updateIntensity(intensity);
                },
                reset: () => {
                  console.log(`[useFilters] Reset ${containerName} filter ${filterIndex}`);
                  filterResult.reset();
                },
                initialIntensity: config.intensity || 1
              });

              console.log(`[useFilters] Created filter for ${containerName} with type ${config.type}`);
            } catch (err) {
              console.error(`[useFilters] Error creating filter for ${containerName}:`, err);
            }
          });
        });
      }

      // Mark filters as initialized
      filtersInitializedRef.current = true;
      filtersActiveRef.current = true;

      console.log('[useFilters] Filters initialized and activated');
    } catch (error) {
      if (devMode) {
        console.error('Error activating filter effects:', error);
      }
    }
  }, [pixi.app, pixi.slides, pixi.textContainers, props.imageFilters, props.textFilters, updateFilterIntensities]);

  // Handle filter coordination events from other components
  const handleFilterCoordinationEvent = useCallback((event: Event) => {
    // Implementation of the handleFilterCoordinationEvent function
    console.log('[useFilters] Event handler implemented');
  }, []);

  // Set up event listeners for filter coordination
  useEffect(() => {
    // Implementation of the useEffect for setting up event listeners
    window.addEventListener(FILTER_COORDINATION_EVENT, handleFilterCoordinationEvent);

    return () => {
      window.removeEventListener(FILTER_COORDINATION_EVENT, handleFilterCoordinationEvent);
    };
  }, [handleFilterCoordinationEvent]);

  // Initialize a dummy implementation for applyFiltersToTarget
  // This will be replaced with the real implementation after initialization
  applyFiltersToTargetRef.current = async (target, configs, id) => {
    console.warn(`[useFilters] Dummy applyFiltersToTarget called for ${id} - real implementation not yet available`);
    return Promise.resolve();
  };

  // Initialize the RenderScheduler integration
  useEffect(() => {
    const scheduler = RenderScheduler.getInstance();
    const updateHelper = createHookUpdateHelper('useFilters');

    // Process batch queue when requested by RenderScheduler
    const scheduledProcessBatch = () => {
      processBatchQueueRef.current();
    };

    // Schedule batch processing with the central scheduler
    const scheduleBatchProcessing = () => {
      scheduler.scheduleTypedUpdate(
        'useFilters',
        UpdateType.FILTER_UPDATE,
        scheduledProcessBatch
      );
    };

    // Override scheduleNextBatch to use the RenderScheduler for more coordinated updates
    scheduleNextBatchRef.current = () => {
      // For critical updates, use setTimeout for immediate processing
      if (batchQueueRef.current.some(update => update.priority === 'critical')) {
        if (batchTimeoutRef.current !== null) {
          window.clearTimeout(batchTimeoutRef.current);
          batchTimeoutRef.current = null;
        }

        batchTimeoutRef.current = window.setTimeout(() => {
          processBatchQueueRef.current();
          batchTimeoutRef.current = null;
        }, 0);
        return;
      }

      // For high priority, schedule sooner but still coordinate with RenderScheduler
      if (batchQueueRef.current.some(update => update.priority === 'high')) {
        scheduleBatchProcessing();
        return;
      }

      // For normal/low priority, debounce and batch with a delay
      if (batchTimeoutRef.current !== null) {
        window.clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }

      batchTimeoutRef.current = window.setTimeout(() => {
        scheduleBatchProcessing();
        batchTimeoutRef.current = null;
      }, batchConfigRef.current.bufferMs);
    };

    return () => {
      // Clean up any pending timeouts
      if (batchTimeoutRef.current !== null) {
        window.clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }

      // Cancel any scheduled updates
      scheduler.cancelTypedUpdate('useFilters', UpdateType.FILTER_UPDATE);
    };
  }, []);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Clear any pending batch operations
      batchQueueRef.current = [];

      // Clear any pending timeouts
      if (batchTimeoutRef.current !== null) {
        window.clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }

      // Reset all filters if they exist
      if (filtersInitializedRef.current) {
        Object.entries(filterMapRef.current).forEach(([_, filterData]) => {
          const typedFilterData = filterData as {
            target: FilterableObject;
            filters: {
              instance: Filter;
              updateIntensity: (intensity: number) => void;
              reset: () => void;
              initialIntensity: number;
            }[];
          };

          typedFilterData.filters.forEach(filter => {
            try {
              // Disable the filter
              filter.instance.enabled = false;

              // Reset to default state
              filter.reset();
            } catch (err) {
              if (devMode) {
                console.error('[useFilters] Error cleaning up filter:', err);
              }
            }
          });
        });
      }
    };
  }, []);

  // Add an event listener to handle mouse leave events from other components
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handler for filter coordination events from other hooks
    const handleFilterCoordinationEvent = (event: Event) => {
      const customEvent = event as CustomEvent<FilterUpdateEventDetail>;
      const { type, intensity, priority } = customEvent.detail;

      if (devMode) {
        console.log(`[useFilters] Received filter coordination event: ${type} = ${intensity}`);
      }

      // Only respond to background-displacement and cursor-displacement events
      if (type === 'background-displacement' || type === 'cursor-displacement') {
        if (intensity === 0) {
          // Mouse has left the canvas, deactivate filters
          updateFilterIntensities(false, priority === 'critical');
        } else {
          // Mouse is on the canvas, activate filters
          updateFilterIntensities(true, priority === 'critical');
        }
      }
    };

    // Listen for filter coordination events
    window.addEventListener(FILTER_COORDINATION_EVENT, handleFilterCoordinationEvent);

    return () => {
      window.removeEventListener(FILTER_COORDINATION_EVENT, handleFilterCoordinationEvent);
    };
  }, [updateFilterIntensities]);

  return {
    updateFilterIntensities,
    resetAllFilters,
    activateFilterEffects,
    isInitialized: filtersInitializedRef.current,
    isActive: filtersActiveRef.current,
    setFiltersActive: (active: boolean) => {
      filtersActiveRef.current = active;
    }
  };
};
