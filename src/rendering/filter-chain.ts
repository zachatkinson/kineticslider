/**
 * @fileoverview FilterChain - Composable filter effects
 *
 * Specialized class for creating and managing chains of PIXI filters.
 * Supports sequential and parallel filter application with performance optimization.
 * Integrates seamlessly with GSAP for smooth filter animations.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import type { Sprite, Container, Filter } from 'pixi.js';
// import type { AnimationConfig } from '../core/types';
import {
  GSAP_DEFAULTS,
  ANIMATION_DURATION,
  EASING,
} from '../core/constants';

/**
 * Filter configuration for chain
 */
export interface FilterConfig {
  /** Unique identifier for the filter in the chain */
  id?: string;
  /** Filter priority (higher = applied first) */
  priority?: number;
  /** Whether the filter is enabled */
  enabled?: boolean;
  /** Animation properties for the filter */
  animationProperties?: Record<string, number>;
  /** Duration for filter animations */
  duration?: number;
  /** Easing function for animations */
  ease?: string;
  /** Whether to animate this filter when applying chain */
  animated?: boolean;
  /** Blend mode for the filter */
  blendMode?: number;
  /** Custom update function called each frame */
  onUpdate?: (filter: Filter, progress: number) => void;
}

/**
 * Filter chain configuration options
 */
export interface FilterChainOptions {
  /** Chain name for identification */
  name?: string;
  /** Application mode: sequential or parallel */
  mode?: 'sequential' | 'parallel';
  /** Stagger delay for sequential mode (seconds) */
  staggerDelay?: number;
  /** Whether to auto-optimize filter order */
  autoOptimize?: boolean;
  /** Maximum filters allowed in chain */
  maxFilters?: number;
  /** Whether to enable performance monitoring */
  enableMetrics?: boolean;
  /** Default animation duration */
  defaultDuration?: number;
  /** Default easing function */
  defaultEase?: string;
}

/**
 * Filter chain node for internal management
 */
interface FilterNode {
  /** Filter instance */
  filter: Filter;
  /** Filter configuration */
  config: FilterConfig;
  /** Current animation timeline */
  timeline?: gsap.core.Timeline;
  /** Performance metrics */
  metrics?: {
    executionTime: number;
    memoryUsage: number;
  };
}

/**
 * Chain execution result
 */
export interface ChainExecutionResult {
  /** Master timeline for all animations */
  timeline: gsap.core.Timeline;
  /** Individual filter timelines */
  filterTimelines: Map<string, gsap.core.Timeline>;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Applied filters count */
  appliedCount: number;
}

/**
 * Performance metrics for filter chain
 */
export interface FilterChainMetrics {
  /** Total filters in chain */
  filterCount: number;
  /** Active animations count */
  activeAnimations: number;
  /** Average execution time */
  avgExecutionTime: number;
  /** Total memory usage estimate */
  memoryUsage: number;
  /** Chain complexity score (0-1) */
  complexityScore: number;
}

/**
 * FilterChain - Composable filter effects
 *
 * Provides a powerful system for creating and managing complex filter
 * compositions with optimal performance and flexibility.
 */
export class FilterChain {
  private filters: Map<string, FilterNode> = new Map();
  private options: Required<FilterChainOptions>;
  private chainIdCounter = 0;
  private activeTimelines: Map<string, gsap.core.Timeline> = new Map();
  private performanceData: number[] = [];
  private disposed = false;

  /**
   * Creates a new filter chain
   *
   * @param options - Configuration options for the filter chain
   */
  constructor(options: FilterChainOptions = {}) {
    this.options = {
      name: options.name ?? `chain_${Date.now()}`,
      mode: options.mode ?? 'sequential',
      staggerDelay: options.staggerDelay ?? 0.1,
      autoOptimize: options.autoOptimize ?? true,
      maxFilters: options.maxFilters ?? 10,
      enableMetrics: options.enableMetrics ?? true,
      defaultDuration: options.defaultDuration ?? ANIMATION_DURATION.STANDARD,
      defaultEase: options.defaultEase ?? EASING.EASE_OUT,
    };
  }

  /**
   * Adds a filter to the chain
   *
   * @param filter - The filter to add
   * @param config - Configuration for the filter
   * @returns This filter chain for method chaining
   */
  addFilter(filter: Filter, config: FilterConfig = {}): FilterChain {
    if (this.disposed) {
      throw new Error('Cannot add filter to disposed chain');
    }

    if (this.filters.size >= this.options.maxFilters) {
      throw new Error(
        `Maximum filter limit (${this.options.maxFilters}) reached`
      );
    }

    const id = config.id ?? `filter_${++this.chainIdCounter}`;

    // Check for duplicate IDs
    if (this.filters.has(id)) {
      throw new Error(`Filter with ID "${id}" already exists in chain`);
    }

    const node: FilterNode = {
      filter,
      config: {
        ...config,
        id,
        priority: config.priority ?? 0,
        enabled: config.enabled ?? true,
        animated: config.animated ?? true,
        duration: config.duration ?? this.options.defaultDuration,
        ease: config.ease ?? this.options.defaultEase,
      },
    };

    this.filters.set(id, node);

    // Auto-optimize if enabled
    if (this.options.autoOptimize) {
      this.optimizeFilterOrder();
    }

    return this;
  }

  /**
   * Removes a filter from the chain
   *
   * @param filterId - ID of the filter to remove
   * @returns This filter chain for method chaining
   */
  removeFilter(filterId: string): FilterChain {
    const node = this.filters.get(filterId);
    if (node) {
      // Kill any active timeline
      if (node.timeline) {
        node.timeline.kill();
      }
      this.filters.delete(filterId);
    }
    return this;
  }

  /**
   * Updates filter configuration
   *
   * @param filterId - ID of the filter to update
   * @param config - New configuration values
   * @returns This filter chain for method chaining
   */
  updateFilter(filterId: string, config: Partial<FilterConfig>): FilterChain {
    const node = this.filters.get(filterId);
    if (node) {
      node.config = { ...node.config, ...config };

      // Re-optimize if priority changed
      if (config.priority !== undefined && this.options.autoOptimize) {
        this.optimizeFilterOrder();
      }
    }
    return this;
  }

  /**
   * Enables a filter in the chain
   *
   * @param filterId - ID of the filter to enable
   * @returns This filter chain for method chaining
   */
  enableFilter(filterId: string): FilterChain {
    return this.updateFilter(filterId, { enabled: true });
  }

  /**
   * Disables a filter in the chain
   *
   * @param filterId - ID of the filter to disable
   * @returns This filter chain for method chaining
   */
  disableFilter(filterId: string): FilterChain {
    return this.updateFilter(filterId, { enabled: false });
  }

  /**
   * Applies the filter chain to a sprite or container
   *
   * @param target - The sprite or container to apply the filter chain to
   * @returns Chain execution result with timeline and metrics
   */
  applyTo(target: Sprite | Container): ChainExecutionResult {
    if (this.disposed) {
      throw new Error('Cannot apply disposed filter chain');
    }

    const startTime = performance.now();
    const executionId = `execution_${Date.now()}`;

    // Get enabled filters sorted by priority
    const enabledFilters = this.getEnabledFiltersSorted();

    if (enabledFilters.length === 0) {
      return {
        timeline: gsap.timeline(),
        filterTimelines: new Map(),
        executionTime: 0,
        appliedCount: 0,
      };
    }

    // Apply filters to target
    const currentFilters = Array.isArray(target.filters)
      ? target.filters
      : target.filters
        ? [target.filters]
        : [];

    const newFilters = enabledFilters.map((node) => node.filter);
    target.filters = [...currentFilters, ...newFilters];

    // Create master timeline
    const masterTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onComplete: () => {
        this.activeTimelines.delete(executionId);
      },
    });

    const filterTimelines = new Map<string, gsap.core.Timeline>();

    // Apply based on mode
    if (this.options.mode === 'sequential') {
      this.applySequential(enabledFilters, masterTimeline, filterTimelines);
    } else {
      this.applyParallel(enabledFilters, masterTimeline, filterTimelines);
    }

    // Track active timeline
    this.activeTimelines.set(executionId, masterTimeline);

    // Record performance metrics
    const executionTime = performance.now() - startTime;
    if (this.options.enableMetrics) {
      this.performanceData.push(executionTime);
      // Keep only last 100 measurements
      if (this.performanceData.length > 100) {
        this.performanceData.shift();
      }
    }

    return {
      timeline: masterTimeline,
      filterTimelines,
      executionTime,
      appliedCount: enabledFilters.length,
    };
  }

  /**
   * Removes all filters from a target
   *
   * @param target - The sprite or container to remove filters from
   * @param animated - Whether to animate the removal
   * @returns Promise that resolves when removal is complete
   */
  async removeFrom(
    target: Sprite | Container,
    animated: boolean = true
  ): Promise<void> {
    const currentFilters = Array.isArray(target.filters)
      ? target.filters
      : target.filters
        ? [target.filters]
        : [];

    const chainFilters = Array.from(this.filters.values()).map(
      (node) => node.filter
    );
    const remainingFilters = currentFilters.filter(
      (f) => !chainFilters.includes(f)
    );

    if (animated && chainFilters.length > 0) {
      const timeline = gsap.timeline();

      // Animate filters to neutral state
      chainFilters.forEach((filter) => {
        const neutralProps = this.getNeutralProperties(filter);
        timeline.to(
          filter,
          {
            ...neutralProps,
            duration: ANIMATION_DURATION.FAST,
            ease: EASING.EASE_IN,
          },
          0
        );
      });

      await timeline.then(() => {
        target.filters = remainingFilters.length > 0 ? remainingFilters : [];
      });
    } else {
      target.filters = remainingFilters.length > 0 ? remainingFilters : [];
    }
  }

  /**
   * Clear all filters from the chain
   */
  clear(): void {
    // Kill all active timelines
    this.filters.forEach((node) => {
      if (node.timeline) {
        node.timeline.kill();
      }
    });

    this.filters.clear();
    this.activeTimelines.forEach((timeline) => timeline.kill());
    this.activeTimelines.clear();
  }

  /**
   * Clone the filter chain
   *
   * @returns New FilterChain instance with same configuration
   */
  clone(): FilterChain {
    const newChain = new FilterChain(this.options);

    this.filters.forEach((node, id) => {
      newChain.filters.set(id, {
        filter: node.filter,
        config: { ...node.config },
      });
    });

    return newChain;
  }

  /**
   * Get filter by ID
   *
   * @param filterId - ID of the filter to get
   * @returns Filter instance or null
   */
  getFilter(filterId: string): Filter | null {
    const node = this.filters.get(filterId);
    return node ? node.filter : null;
  }

  /**
   * Get all filter IDs in the chain
   *
   * @returns Array of filter IDs
   */
  getFilterIds(): string[] {
    return Array.from(this.filters.keys());
  }

  /**
   * Get performance metrics for the chain
   *
   * @returns Performance metrics object
   */
  getMetrics(): FilterChainMetrics {
    const enabledCount = Array.from(this.filters.values()).filter(
      (node) => node.config.enabled
    ).length;

    const avgExecutionTime =
      this.performanceData.length > 0
        ? this.performanceData.reduce((a, b) => a + b, 0) /
          this.performanceData.length
        : 0;

    // Estimate memory usage (2KB per filter as baseline)
    const memoryUsage = this.filters.size * 2048;

    // Calculate complexity score based on filter count and type
    const complexityScore = Math.min(1, enabledCount / this.options.maxFilters);

    return {
      filterCount: this.filters.size,
      activeAnimations: this.activeTimelines.size,
      avgExecutionTime,
      memoryUsage,
      complexityScore,
    };
  }

  /**
   * Kill all active animations
   */
  killAnimations(): void {
    this.activeTimelines.forEach((timeline) => timeline.kill());
    this.activeTimelines.clear();

    this.filters.forEach((node) => {
      if (node.timeline) {
        node.timeline.kill();
        node.timeline = undefined;
      }
    });
  }

  /**
   * Dispose of the filter chain and cleanup resources
   */
  dispose(): void {
    this.killAnimations();
    this.clear();
    this.disposed = true;
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Get enabled filters sorted by priority
   */
  private getEnabledFiltersSorted(): FilterNode[] {
    return Array.from(this.filters.values())
      .filter((node) => node.config.enabled)
      .sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0));
  }

  /**
   * Apply filters sequentially
   */
  private applySequential(
    filters: FilterNode[],
    masterTimeline: gsap.core.Timeline,
    filterTimelines: Map<string, gsap.core.Timeline>
  ): void {
    let position = 0;

    filters.forEach((node, _index) => {
      if (node.config.animated && node.config.animationProperties) {
        const filterTimeline = gsap.timeline();

        // Set initial properties
        const initialProps = this.getInitialProperties(node.filter);
        Object.assign(node.filter, initialProps);

        // Animate to target properties
        filterTimeline.to(node.filter, {
          ...node.config.animationProperties,
          duration: node.config.duration,
          ease: node.config.ease,
          onUpdate: node.config.onUpdate
            ? (): void => {
                const progress = filterTimeline.progress();
                node.config.onUpdate!(node.filter, progress);
              }
            : undefined,
        });

        masterTimeline.add(filterTimeline, position);
        filterTimelines.set(node.config.id!, filterTimeline);

        position += node.config.duration! + this.options.staggerDelay;
        node.timeline = filterTimeline;
      }
    });
  }

  /**
   * Apply filters in parallel
   */
  private applyParallel(
    filters: FilterNode[],
    masterTimeline: gsap.core.Timeline,
    filterTimelines: Map<string, gsap.core.Timeline>
  ): void {
    filters.forEach((node) => {
      if (node.config.animated && node.config.animationProperties) {
        const filterTimeline = gsap.timeline();

        // Set initial properties
        const initialProps = this.getInitialProperties(node.filter);
        Object.assign(node.filter, initialProps);

        // Animate to target properties
        filterTimeline.to(node.filter, {
          ...node.config.animationProperties,
          duration: node.config.duration,
          ease: node.config.ease,
          onUpdate: node.config.onUpdate
            ? (): void => {
                const progress = filterTimeline.progress();
                node.config.onUpdate!(node.filter, progress);
              }
            : undefined,
        });

        masterTimeline.add(filterTimeline, 0);
        filterTimelines.set(node.config.id!, filterTimeline);
        node.timeline = filterTimeline;
      }
    });
  }

  /**
   * Optimize filter order based on performance characteristics
   */
  private optimizeFilterOrder(): void {
    // Sort by priority, but also consider filter type performance
    // This is a simplified optimization - real implementation would
    // analyze filter computational complexity
    const sorted = Array.from(this.filters.entries()).sort(([, a], [, b]) => {
      const aPriority = a.config.priority ?? 0;
      const bPriority = b.config.priority ?? 0;
      return bPriority - aPriority;
    });

    this.filters.clear();
    sorted.forEach(([id, node]) => {
      this.filters.set(id, node);
    });
  }

  /**
   * Get initial properties for a filter
   */
  private getInitialProperties(filter: Filter): Record<string, unknown> {
    // Return current filter state as initial properties
    const props: Record<string, unknown> = {};

    // Common filter properties
    if ('alpha' in filter) props.alpha = (filter as unknown as Record<string, unknown>).alpha;
    if ('blendMode' in filter) props.blendMode = (filter as unknown as Record<string, unknown>).blendMode;
    if ('enabled' in filter) props.enabled = (filter as unknown as Record<string, unknown>).enabled;

    return props;
  }

  /**
   * Get neutral properties for filter removal
   */
  private getNeutralProperties(filter: Filter): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    // Set common properties to neutral values
    if ('alpha' in filter) props.alpha = 1;
    if ('blur' in filter) props.blur = 0;
    if ('scale' in filter) {
      props.scale = { x: 0, y: 0 };
    }

    return props;
  }
}
