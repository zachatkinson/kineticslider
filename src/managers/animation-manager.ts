/**
 * @fileoverview Enhanced Animation Manager for Phase 2.3
 *
 * World-class animation coordination system that manages multiple GSAP timelines,
 * coordinates complex animation sequences, and provides priority-based scheduling.
 *
 * @version 2.3.0
 */

import { gsap } from 'gsap';
import { GSAPTimelineFactory } from '../physics/gsap-timeline-factory';
import { SimpleEventEmitter } from '../core/event-emitter';
import { serviceContainer } from '../core/container';
import type {
  AnimationConfig,
  AnimationPriority,
  AnimationState,
  TimelineGroup,
  AnimationContext,
} from '../core/types';
import {
  ANIMATION_DURATION,
  ANIMATION_PRIORITIES,
  PERFORMANCE_THRESHOLDS,
  ANIMATION_ERROR_CODES,
  ANIMATION_EVENTS,
} from '../core/constants';

/**
 * Animation coordination and management system
 */
export class AnimationManager extends SimpleEventEmitter {
  private timelineFactory: GSAPTimelineFactory;
  private activeTimelines = new Map<string, gsap.core.Timeline>();
  private timelineGroups = new Map<string, TimelineGroup>();
  private animationQueue: Array<{
    id: string;
    config: AnimationConfig;
    priority: AnimationPriority;
    context: AnimationContext;
    resolve: (timeline: gsap.core.Timeline) => void;
    reject: (error: Error) => void;
  }> = [];

  // Performance tracking
  private performanceStats = {
    activeAnimations: 0,
    completedAnimations: 0,
    failedAnimations: 0,
    averageExecutionTime: 0,
    peakMemoryUsage: 0,
  };

  // State management
  private isProcessingQueue = false;
  private maxConcurrentAnimations =
    PERFORMANCE_THRESHOLDS.MAX_CONCURRENT_ANIMATIONS;
  private currentAnimationCount = 0;

  constructor(timelineFactory?: GSAPTimelineFactory) {
    super();
    this.timelineFactory = timelineFactory || new GSAPTimelineFactory();
    this.setupPerformanceMonitoring();
  }

  // =============================================================================
  // 🎯 Public API - Animation Coordination
  // =============================================================================

  /**
   * Queue animation with priority-based scheduling
   */
  async queueAnimation(
    id: string,
    config: AnimationConfig,
    priority: AnimationPriority = ANIMATION_PRIORITIES.NORMAL,
    context: AnimationContext = {}
  ): Promise<gsap.core.Timeline> {
    return new Promise((resolve, reject) => {
      // Validate animation config
      if (!this.validateAnimationConfig(config)) {
        const error = new Error(
          `${ANIMATION_ERROR_CODES.INVALID_ANIMATION_CONFIG}: Invalid animation configuration for ${id}`
        );
        this.handleAnimationError(id, error, context);
        reject(error);
        return;
      }

      // Add to priority queue
      this.animationQueue.push({
        id,
        config,
        priority,
        context,
        resolve,
        reject,
      });

      // Sort queue by priority (higher priority first)
      this.animationQueue.sort((a, b) => b.priority - a.priority);

      // Emit queued event
      this.emit(ANIMATION_EVENTS.ANIMATION_QUEUED, {
        id,
        priority,
        queueLength: this.animationQueue.length,
      });

      // Process queue
      this.processAnimationQueue();
    });
  }

  /**
   * Execute immediate animation bypassing queue
   */
  async executeImmediate(
    id: string,
    config: AnimationConfig,
    context: AnimationContext = {}
  ): Promise<gsap.core.Timeline> {
    try {
      // Check resource availability
      if (this.currentAnimationCount >= this.maxConcurrentAnimations) {
        throw new Error(
          `${ANIMATION_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED}: Too many concurrent animations`
        );
      }

      const timeline = await this.createAndExecuteTimeline(id, config, context);
      this.emit(ANIMATION_EVENTS.ANIMATION_EXECUTED, { id, immediate: true });
      return timeline;
    } catch (error) {
      this.handleAnimationError(id, this.toError(error), context);
      throw error;
    }
  }

  /**
   * Create coordinated timeline group with dependency management
   */
  async createTimelineGroup(
    groupId: string,
    configs: Array<{
      id: string;
      config: AnimationConfig;
      dependencies?: string[];
    }>,
    groupOptions: {
      sequential?: boolean;
      stagger?: number;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<gsap.core.Timeline> {
    try {
      // Create master timeline using timeline factory pattern
      const childTimelines: gsap.core.Timeline[] = [];

      const timelineGroup: TimelineGroup = {
        id: groupId,
        masterTimeline: gsap.timeline({
          paused: true,
          onComplete: groupOptions.onComplete,
        }),
        childTimelines: new Map(),
        dependencies: new Map(),
        completedTimelines: new Set(),
        isSequential: groupOptions.sequential || false,
        staggerDelay: groupOptions.stagger || 0,
      };

      // Process configurations and build dependency graph
      for (const { id, config, dependencies = [] } of configs) {
        try {
          const timeline = this.createBasicTimeline(config);
          timelineGroup.childTimelines.set(id, timeline);
          timelineGroup.dependencies.set(id, dependencies);
          childTimelines.push(timeline);

          // Setup completion tracking
          timeline.eventCallback('onComplete', () => {
            this.handleTimelineCompletion(groupId, id);
          });
        } catch (error) {
          const animationError = new Error(
            `Failed to create timeline ${id} in group ${groupId}: ${this.toError(error).message}`
          );
          this.handleAnimationError(id, animationError, { groupId });
          if (groupOptions.onError) {
            groupOptions.onError(animationError);
          }
          throw animationError;
        }
      }

      // Create a managed timeline for the group
      timelineGroup.masterTimeline = gsap.timeline({
        paused: true,
        onComplete: () => {
          // Cleanup child timelines
          childTimelines.forEach((timeline) => {
            if (timeline && timeline.isActive()) {
              timeline.kill();
            }
          });
          if (groupOptions.onComplete) {
            groupOptions.onComplete();
          }
        },
      });

      // Store group and schedule execution
      this.timelineGroups.set(groupId, timelineGroup);
      this.scheduleTimelineGroup(timelineGroup);

      this.emit(ANIMATION_EVENTS.GROUP_CREATED, {
        groupId,
        timelineCount: configs.length,
      });
      return timelineGroup.masterTimeline;
    } catch (error) {
      const groupError = new Error(
        `Failed to create timeline group ${groupId}: ${this.toError(error).message}`
      );
      this.handleAnimationError(groupId, groupError, { isGroup: true });
      throw groupError;
    }
  }

  // =============================================================================
  // 🔧 Private Implementation - Queue Processing
  // =============================================================================

  private async processAnimationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    if (this.currentAnimationCount >= this.maxConcurrentAnimations) {
      return; // Wait for current animations to complete
    }

    this.isProcessingQueue = true;

    try {
      while (
        this.animationQueue.length > 0 &&
        this.currentAnimationCount < this.maxConcurrentAnimations
      ) {
        const queueItem = this.animationQueue.shift();
        if (!queueItem) break;

        try {
          const timeline = await this.createAndExecuteTimeline(
            queueItem.id,
            queueItem.config,
            queueItem.context
          );
          queueItem.resolve(timeline);
        } catch (error) {
          this.handleAnimationError(
            queueItem.id,
            this.toError(error),
            queueItem.context
          );
          queueItem.reject(this.toError(error));
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async createAndExecuteTimeline(
    id: string,
    config: AnimationConfig,
    context: AnimationContext
  ): Promise<gsap.core.Timeline> {
    const startTime = performance.now();
    this.currentAnimationCount++;
    this.performanceStats.activeAnimations++;

    try {
      // Create timeline using basic timeline creation
      const timeline = this.createBasicTimeline(config);

      // Setup completion callback
      timeline.eventCallback('onComplete', () =>
        this.handleAnimationComplete(id, startTime)
      );

      // Track timeline
      this.activeTimelines.set(id, timeline);

      // Start animation
      timeline.play();

      this.emit(ANIMATION_EVENTS.ANIMATION_STARTED, { id, context });
      return timeline;
    } catch (error) {
      this.currentAnimationCount--;
      this.performanceStats.activeAnimations--;
      this.performanceStats.failedAnimations++;
      throw error;
    }
  }

  private createBasicTimeline(config: AnimationConfig): gsap.core.Timeline {
    const timeline = gsap.timeline({
      duration: config.duration || ANIMATION_DURATION.STANDARD,
      ease: config.ease || 'power2.out',
      delay: config.delay || 0,
    });

    // Add animations if provided
    if (config.animations) {
      config.animations.forEach((animation) => {
        timeline.to(animation.targets, {
          ...animation.properties,
          duration:
            animation.duration ||
            config.duration ||
            ANIMATION_DURATION.STANDARD,
          ease: animation.ease || config.ease || 'power2.out',
          delay: animation.delay || 0,
        });
      });
    }

    return timeline;
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private handleAnimationComplete(id: string, startTime: number): void {
    const executionTime = performance.now() - startTime;

    // Update performance stats
    this.currentAnimationCount--;
    this.performanceStats.activeAnimations--;
    this.performanceStats.completedAnimations++;
    this.performanceStats.averageExecutionTime =
      (this.performanceStats.averageExecutionTime + executionTime) / 2;

    // Cleanup
    this.activeTimelines.delete(id);

    this.emit(ANIMATION_EVENTS.ANIMATION_COMPLETED, {
      id,
      executionTime,
      remainingAnimations: this.currentAnimationCount,
    });

    // Process next in queue
    this.processAnimationQueue();
  }

  private scheduleTimelineGroup(group: TimelineGroup): void {
    if (group.isSequential) {
      this.scheduleSequentialGroup(group);
    } else {
      this.scheduleParallelGroup(group);
    }
  }

  private scheduleSequentialGroup(group: TimelineGroup): void {
    // Build execution order based on dependencies
    const executionOrder = this.buildExecutionOrder(group);

    executionOrder.forEach((timelineId, index) => {
      const timeline = group.childTimelines.get(timelineId);
      if (timeline) {
        const delay = index * (group.staggerDelay || 0);
        group.masterTimeline.add(timeline, delay);
      }
    });

    group.masterTimeline.play();
  }

  private scheduleParallelGroup(group: TimelineGroup): void {
    // Add all timelines to master timeline simultaneously
    group.childTimelines.forEach((timeline, id) => {
      const dependencies = group.dependencies.get(id) || [];
      const delay = this.calculateDependencyDelay(group, dependencies);
      group.masterTimeline.add(timeline, delay);
    });

    group.masterTimeline.play();
  }

  private buildExecutionOrder(group: TimelineGroup): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (timelineId: string): void => {
      if (visited.has(timelineId)) return;
      visited.add(timelineId);

      const dependencies = group.dependencies.get(timelineId) || [];
      dependencies.forEach((depId) => {
        if (group.childTimelines.has(depId)) {
          visit(depId);
        }
      });

      order.push(timelineId);
    };

    group.childTimelines.forEach((_, id) => visit(id));
    return order;
  }

  private calculateDependencyDelay(
    group: TimelineGroup,
    dependencies: string[]
  ): number {
    if (dependencies.length === 0) return 0;

    let maxDelay = 0;
    dependencies.forEach((depId) => {
      const depTimeline = group.childTimelines.get(depId);
      if (depTimeline) {
        maxDelay = Math.max(maxDelay, depTimeline.duration());
      }
    });

    return maxDelay;
  }

  private handleTimelineCompletion(groupId: string, timelineId: string): void {
    const group = this.timelineGroups.get(groupId);
    if (!group) return;

    group.completedTimelines.add(timelineId);

    // Check if all timelines in group are complete
    if (group.completedTimelines.size === group.childTimelines.size) {
      this.emit(ANIMATION_EVENTS.GROUP_COMPLETED, { groupId });
      this.cleanupTimelineGroup(groupId);
    }
  }

  private cleanupTimelineGroup(groupId: string): void {
    const group = this.timelineGroups.get(groupId);
    if (!group) return;

    // Cleanup completed group
    this.timelineGroups.delete(groupId);
    this.emit(ANIMATION_EVENTS.GROUP_CLEANED, { groupId });
  }

  private validateAnimationConfig(config: AnimationConfig): boolean {
    return !!(
      config &&
      (config.animations || config.duration || config.ease) &&
      typeof config === 'object'
    );
  }

  private handleAnimationError(
    id: string,
    error: Error,
    context: AnimationContext
  ): void {
    this.performanceStats.failedAnimations++;
    this.emit(ANIMATION_EVENTS.ANIMATION_ERROR, { id, error, context });

    // Log error for debugging (disabled in production)
    // console.error(`Animation error for ${id}:`, error.message, context);
  }

  private setupPerformanceMonitoring(): void {
    // Monitor memory usage periodically
    setInterval(() => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memoryInfo = (
          performance as Performance & { memory: { usedJSHeapSize: number } }
        ).memory;
        this.performanceStats.peakMemoryUsage = Math.max(
          this.performanceStats.peakMemoryUsage,
          memoryInfo.usedJSHeapSize
        );
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    activeAnimations: number;
    completedAnimations: number;
    failedAnimations: number;
    averageExecutionTime: number;
    peakMemoryUsage: number;
    currentAnimationCount: number;
    queueLength: number;
    activeTimelineGroups: number;
    activeTimelines: number;
  } {
    return {
      ...this.performanceStats,
      currentAnimationCount: this.currentAnimationCount,
      queueLength: this.animationQueue.length,
      activeTimelineGroups: this.timelineGroups.size,
      activeTimelines: this.activeTimelines.size,
    };
  }

  /**
   * Get current animation state for debugging
   */
  getAnimationState(): AnimationState {
    return {
      isProcessingQueue: this.isProcessingQueue,
      activeAnimations: Array.from(this.activeTimelines.keys()),
      queuedAnimations: this.animationQueue.map((item) => ({
        id: item.id,
        priority: item.priority,
        context: item.context,
      })),
      timelineGroups: Array.from(this.timelineGroups.keys()),
      performanceStats: this.getPerformanceStats(),
    };
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.activeTimelines.forEach((timeline) => timeline.kill());
    this.activeTimelines.clear();
    this.timelineGroups.forEach((group) => group.masterTimeline.kill());
    this.timelineGroups.clear();
    this.animationQueue.length = 0;
    this.removeAllListeners();
    this.performanceStats = {
      activeAnimations: 0,
      completedAnimations: 0,
      failedAnimations: 0,
      averageExecutionTime: 0,
      peakMemoryUsage: 0,
    };
  }

  private estimateComplexity(config: AnimationConfig): number {
    let complexity = 1;

    if (config.animations) {
      complexity += config.animations.length * 0.5;
    }

    if (config.duration && config.duration > 2000) {
      complexity += 1;
    }

    return Math.min(complexity, 5);
  }

  private updateTimelineGroup(
    groupId: string,
    timeline: gsap.core.Timeline
  ): void {
    const group = this.timelineGroups.get(groupId);
    if (!group) return;

    // Add timeline to group
    group.childTimelines.set(
      timeline.data?.id || `timeline-${Date.now()}`,
      timeline
    );

    // Update master timeline
    group.masterTimeline.add(
      timeline,
      group.isSequential ? `+=${group.staggerDelay}` : 0
    );

    // Check for completion
    timeline.eventCallback('onComplete', () => {
      const timelineId = timeline.data?.id || '';
      group.completedTimelines.add(timelineId);

      // Check if all timelines are complete
      if (group.completedTimelines.size === group.childTimelines.size) {
        this.emit(ANIMATION_EVENTS.TIMELINE_GROUP_COMPLETED, { groupId });
      }
    });
  }

  private logPerformanceWarning(
    executionTime: number,
    _config: AnimationConfig
  ): void {
    // Log performance warning when execution time exceeds threshold
    if (executionTime > PERFORMANCE_THRESHOLDS.EXECUTION_TIME_WARNING) {
      // Performance warning - commented out to avoid console in production
      // console.warn(`Animation took ${executionTime}ms, exceeding warning threshold`);
    }
  }

  private calculatePriority(
    config: AnimationConfig,
    context: AnimationContext
  ): number {
    let priority = ANIMATION_PRIORITIES.NORMAL;

    // Context-based priority adjustment
    const contextData = context.data as { priority?: number } | undefined;
    if (typeof contextData?.priority === 'number') {
      priority = contextData.priority;
    }

    // Config-based priority adjustment
    const configData = config as { priority?: number };
    if (typeof configData.priority === 'number') {
      priority = configData.priority;
    }

    return priority;
  }

  private validateTimelineGroup(_group: TimelineGroup): boolean {
    // Add validation logic here
    return true;
  }

  private validateConfiguration(_config: AnimationConfig): boolean {
    // Add validation logic here
    return true;
  }
}

// Register with service container
serviceContainer.register('AnimationManager', () => new AnimationManager());
