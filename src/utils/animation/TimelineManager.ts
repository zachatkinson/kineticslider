/**
 * Enhanced Timeline Manager for Phase 3 Animation System
 * 
 * Provides centralized timeline management with performance monitoring,
 * priority-based scheduling, and type-safe API for GSAP timelines.
 */

import { gsap } from 'gsap';
import type {
  TimelineOptions,
  TimelineGroup,
  AnimationType as _AnimationType,
  AnimationMetrics,
  AnimationInstance,
} from '../../types/animation';
import {
  AnimationPriority,
  TimelineState,
  AnimationError,
  AnimationErrorCode
} from '../../types/animation';
import { log } from '../logger';

/**
 * Timeline Manager for coordinating multiple GSAP animations
 * 
 * Provides centralized management of animation timelines with priority-based
 * scheduling, performance monitoring, and resource cleanup.
 * 
 * @example
 * ```typescript
 * const manager = TimelineManager.getInstance();
 * const timelineId = manager.createTimeline({ delay: 0.5 });
 * ```
 */
export class TimelineManager {
  private static instance: TimelineManager | null = null;
  private timelines: Map<string, TimelineGroup> = new Map();
  private globalCounter = 0;
  private maxConcurrentTimelines = 20;
  private performanceMode: 'high' | 'balanced' | 'performance' = 'balanced';
  private isDestroyed = false;

  // Performance tracking
  private startTime = performance.now();
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private maxFpsHistoryLength = 60; // Track last 60 frames

  private constructor() {
    this.setupPerformanceMonitoring();
  }

  /**
   * Get singleton instance
   *
   * @returns The TimelineManager singleton instance
   *
   */
  public static getInstance(): TimelineManager {
    if (!TimelineManager.instance) {
      TimelineManager.instance = new TimelineManager();
    }
    return TimelineManager.instance;
  }

  /**
   * Create a new timeline with enhanced options
   *
   * @param options - Timeline configuration options
   *
   * @returns The unique timeline ID
   *
   */
  public createTimeline(options: TimelineOptions = {}): string {
    if (this.isDestroyed) {
      throw new AnimationError(
        'Timeline manager has been destroyed',
        AnimationErrorCode.INVALID_CONFIG
      );
    }

    // Check concurrent timeline limit
    const activeCount = this.getActiveTimelines().length;
    if (activeCount >= this.maxConcurrentTimelines) {
      log.warn(`Maximum concurrent timelines reached (${this.maxConcurrentTimelines}). Consider cleaning up unused timelines.`);
      
      // Auto-cleanup completed timelines if in performance mode
      if (this.performanceMode === 'performance') {
        this.cleanupCompletedTimelines();
      }
    }

    const id = this.generateTimelineId();
    const timeline = gsap.timeline({
      ...options,
      onStart: () => {
        this.updateTimelineState(id, TimelineState.PLAYING);
        options.onStart?.();
      },
      onComplete: () => {
        this.updateTimelineState(id, TimelineState.COMPLETED);
        options.onComplete?.();
      },
      onUpdate: () => {
        this.updateTimelineState(id, TimelineState.PLAYING);
        const progress = timeline.progress();
        options.onUpdate?.(progress);
      },
      onInterrupt: () => {
        this.updateTimelineState(id, TimelineState.KILLED);
        options.onInterrupt?.();
      },
      onReverseComplete: () => {
        this.updateTimelineState(id, TimelineState.COMPLETED);
        options.onReverseComplete?.();
      }
    });

    const timelineGroup: TimelineGroup = {
      id,
      name: `timeline-${id}`,
      priority: AnimationPriority.NORMAL,
      timeline,
      state: TimelineState.IDLE,
      animations: [],
      metadata: {},
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.timelines.set(id, timelineGroup);
    
    log.debug(`Created timeline: ${id}`, { options });
    
    return id;
  }

  /**
   * Get timeline by ID
   *
   * @param id - Timeline identifier
   *
   * @returns The GSAP timeline instance or null if not found
   *
   */
  public getTimeline(id: string): gsap.core.Timeline | null {
    const timelineGroup = this.timelines.get(id);
    return timelineGroup?.timeline || null;
  }

  /**
   * Get timeline group with metadata
   *
   * @param id - Timeline identifier
   *
   * @returns The timeline group with metadata or null if not found
   *
   */
  public getTimelineGroup(id: string): TimelineGroup | null {
    return this.timelines.get(id) || null;
  }

  /**
   * Kill timeline and clean up resources
   *
   * @param id
   *
   */
  public killTimeline(id: string): void {
    const timelineGroup = this.timelines.get(id);
    if (!timelineGroup) {
      log.warn(`Timeline not found: ${id}`);
      return;
    }

    try {
      timelineGroup.timeline.kill();
      timelineGroup.state = TimelineState.KILLED;
      timelineGroup.lastUpdated = Date.now();
      
      // Clean up animations
      timelineGroup.animations.forEach(animation => {
        if (animation.tween !== null && animation.tween !== undefined) {
          try {
            animation.tween.kill();
          } catch {
            // Ignore errors during cleanup
          }
        }
      });

      this.timelines.delete(id);
      log.debug(`Killed timeline: ${id}`);
    } catch (error) {
      log.error(`Error killing timeline ${id}:`, error as Error);
    }
  }

  /**
   * Pause timeline
   *
   * @param id
   *
   */
  public pauseTimeline(id: string): void {
    const timelineGroup = this.timelines.get(id);
    if (!timelineGroup) {
      throw new AnimationError(
        `Timeline not found: ${id}`,
        AnimationErrorCode.TIMELINE_NOT_FOUND,
        undefined,
        id
      );
    }

    timelineGroup.timeline.pause();
    timelineGroup.state = TimelineState.PAUSED;
    timelineGroup.lastUpdated = Date.now();
    
    log.debug(`Paused timeline: ${id}`);
  }

  /**
   * Resume timeline
   *
   * @param id
   *
   */
  public resumeTimeline(id: string): void {
    const timelineGroup = this.timelines.get(id);
    if (!timelineGroup) {
      throw new AnimationError(
        `Timeline not found: ${id}`,
        AnimationErrorCode.TIMELINE_NOT_FOUND,
        undefined,
        id
      );
    }

    timelineGroup.timeline.resume();
    timelineGroup.state = TimelineState.PLAYING;
    timelineGroup.lastUpdated = Date.now();
    
    log.debug(`Resumed timeline: ${id}`);
  }

  /**
   * Set timeline priority
   *
   * @param id
   *
   * @param priority
   *
   */
  public setTimelinePriority(id: string, priority: AnimationPriority): void {
    const timelineGroup = this.timelines.get(id);
    if (!timelineGroup) {
      throw new AnimationError(
        `Timeline not found: ${id}`,
        AnimationErrorCode.TIMELINE_NOT_FOUND,
        undefined,
        id
      );
    }

    timelineGroup.priority = priority;
    timelineGroup.lastUpdated = Date.now();
    
    // Adjust timeline timing based on priority
    this.adjustTimelineForPriority(timelineGroup);
  }

  /**
   * Add animation to timeline
   *
   * @param timelineId
   *
   * @param animation
   *
   */
  public addAnimation(timelineId: string, animation: AnimationInstance): void {
    const timelineGroup = this.timelines.get(timelineId);
    if (!timelineGroup) {
      throw new AnimationError(
        `Timeline not found: ${timelineId}`,
        AnimationErrorCode.TIMELINE_NOT_FOUND,
        animation.id,
        timelineId
      );
    }

    timelineGroup.animations.push(animation);
    timelineGroup.lastUpdated = Date.now();
    
    log.debug(`Added animation ${animation.id} to timeline ${timelineId}`);
  }

  /**
   * Get all active timelines
   *
   * @returns Array of active timeline groups
   *
   */
  public getActiveTimelines(): TimelineGroup[] {
    return Array.from(this.timelines.values()).filter(
      group => group.state === TimelineState.PLAYING || group.state === TimelineState.PAUSED
    );
  }

  /**
   * Get performance metrics
   *
   * @returns Current animation performance metrics
   *
   */
  public getMetrics(): AnimationMetrics {
    const now = performance.now();
    
    // Calculate FPS
    const deltaTime = now - this.lastFrameTime;
    const currentFps = deltaTime > 0 ? 1000 / deltaTime : 60;
    
    this.fpsHistory.push(currentFps);
    if (this.fpsHistory.length > this.maxFpsHistoryLength) {
      this.fpsHistory.shift();
    }

    const averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    
    this.lastFrameTime = now;

    const memoryUsage = this.getMemoryUsage();

    return {
      fps: Math.round(averageFPS * 100) / 100,
      duration: now - this.startTime,
      frames: this.frameCount,
      memory: {
        jsHeapSizeLimit: memoryUsage > 0 ? 0 : 1073741824, // 1GB default
        totalJSHeapSize: memoryUsage > 0 ? 0 : 16777216, // 16MB default
        usedJSHeapSize: memoryUsage > 0 ? memoryUsage * 1024 * 1024 : 8388608 // 8MB default
      }
    };
  }

  /**
   * Clean up completed timelines
   */
  public cleanupCompletedTimelines(): void {
    const toDelete: string[] = [];
    
    this.timelines.forEach((group, id) => {
      if (group.state === TimelineState.COMPLETED || group.state === TimelineState.KILLED) {
        // Keep completed timelines for a short time for debugging
        const age = Date.now() - group.lastUpdated;
        if (age > 5000) { // 5 seconds
          toDelete.push(id);
        }
      }
    });

    toDelete.forEach(id => {
      this.timelines.delete(id);
    });

    if (toDelete.length > 0) {
      log.debug(`Cleaned up ${toDelete.length} completed timelines`);
    }
  }

  /**
   * Set performance mode
   *
   * @param mode
   *
   */
  public setPerformanceMode(mode: 'high' | 'balanced' | 'performance'): void {
    this.performanceMode = mode;
    
    switch (mode) {
      case 'high':
        this.maxConcurrentTimelines = 30;
        break;
      case 'balanced':
        this.maxConcurrentTimelines = 20;
        break;
      case 'performance':
        this.maxConcurrentTimelines = 10;
        this.cleanupCompletedTimelines();
        break;
    }

    log.info(`Performance mode set to: ${mode}`);
  }

  /**
   * Kill all timelines and clean up
   */
  public destroy(): void {
    log.info('Destroying Timeline Manager...');
    
    // Kill all active timelines
    this.timelines.forEach((group, id) => {
      try {
        group.timeline.kill();
      } catch (error) {
        log.error(`Error killing timeline ${id} during destroy:`, error as Error);
      }
    });

    this.timelines.clear();
    this.isDestroyed = true;
    TimelineManager.instance = null;
    
    log.info('Timeline Manager destroyed');
  }

  // Private methods

  private generateTimelineId(): string {
    return `tl_${++this.globalCounter}_${Date.now()}`;
  }

  private updateTimelineState(id: string, state: TimelineState): void {
    const timelineGroup = this.timelines.get(id);
    if (timelineGroup) {
      timelineGroup.state = state;
      timelineGroup.lastUpdated = Date.now();
    }
  }

  private adjustTimelineForPriority(timelineGroup: TimelineGroup): void {
    // Adjust timeline behavior based on priority
    switch (timelineGroup.priority) {
      case AnimationPriority.CRITICAL:
        // Critical animations get maximum smoothness
        timelineGroup.timeline.eventCallback('onUpdate', () => {
          // Force render update for critical animations
          gsap.ticker.wake();
        });
        break;
      case AnimationPriority.LOW:
        // Low priority animations can be more conservative
        if (this.performanceMode === 'performance') {
          timelineGroup.timeline.timeScale(0.8); // Slightly slower for performance
        }
        break;
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance periodically
    gsap.ticker.add(() => {
      this.frameCount++;
      
      // Auto-cleanup every 1000 frames
      if (this.frameCount % 1000 === 0) {
        this.cleanupCompletedTimelines();
      }
    });
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as Performance & { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
} 