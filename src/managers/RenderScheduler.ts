/**
 * @file RenderScheduler.ts
 * @description Provides centralized render scheduling and batching for optimized UI updates.
 * Coordinates the timing of visual effects to minimize rendering overhead and improve performance.
 */

import { UpdateType, getPriorityForUpdateType, createUpdateId } from './UpdateTypes';
import { FrameThrottler, ThrottleStrategy, type ThrottlerConfig } from './FrameThrottler';

/**
 * Priority levels for rendering updates.
 * Higher numbers indicate higher priority.
 * @enum {number}
 */
export enum UpdatePriority {
    /** Background, non-visual updates */
    LOW = 0,
    /** Standard visual updates */
    NORMAL = 1,
    /** Important visual feedback */
    HIGH = 2,
    /** Must-run-immediately updates */
    CRITICAL = 3
}

/**
 * Interface for update tasks managed by the scheduler.
 * @interface
 */
export interface UpdateTask {
    /** Unique identifier for the task */
    id: string;
    /** Function to execute when the task runs */
    callback: () => void;
    /** Priority level determining execution order */
    priority: UpdatePriority;
    /** Timestamp when the task was added to the queue */
    timestamp: number;
}

/**
 * Coordinates and batches render updates for KineticSlider.
 * This helps reduce unnecessary render cycles by grouping related updates
 * and executing them at the optimal time.
 *
 * @example
 * ```typescript
 * // Get the scheduler instance
 * const scheduler = RenderScheduler.getInstance();
 *
 * // Schedule a normal priority update
 * scheduler.scheduleUpdate('my-component-update', () => {
 *   // Update logic here
 * });
 *
 * // Schedule a high priority update with a specific update type
 * scheduler.scheduleTypedUpdate('my-component', UpdateType.MOUSE_RESPONSE, () => {
 *   // Mouse response update logic
 * });
 * ```
 */
export class RenderScheduler {
    /** Singleton instance of the scheduler */
    private static instance: RenderScheduler;

    /** Map of task IDs to pending update tasks */
    private updateQueue: Map<string, UpdateTask> = new Map();

    /** Whether the processing loop is active */
    private isProcessing: boolean = false;

    /** Current requestAnimationFrame ID or null if not active */
    private rafId: number | null = null;

    /** Timestamp of the last frame execution */
    private lastFrameTime: number = 0;

    /** Minimum time between frames in milliseconds (~60fps default) */
    private frameThrottle: number = 16;

    /** Frame throttler for advanced timing control */
    private frameThrottler: FrameThrottler;

    /**
     * Get the singleton instance of the RenderScheduler.
     * @returns {RenderScheduler} The singleton instance
     */
    public static getInstance(): RenderScheduler {
        if (!RenderScheduler.instance) {
            RenderScheduler.instance = new RenderScheduler();
        }
        return RenderScheduler.instance;
    }

    /**
     * Private constructor for singleton pattern.
     * @private
     */
    private constructor() {
        // Initialize
        this.lastFrameTime = performance.now();
        // Initialize frame throttler with default settings
        this.frameThrottler = new FrameThrottler({
            targetFps: 60,
            strategy: ThrottleStrategy.PRIORITY,
            enableMonitoring: true
        });
    }

    /**
     * Schedule a task for execution.
     * If a task with the same ID already exists, it will be replaced.
     *
     * @param {string} id - Unique identifier for the task
     * @param {() => void} callback - Function to execute
     * @param {UpdatePriority} [priority=UpdatePriority.NORMAL] - Priority level
     * @returns {RenderScheduler} The scheduler instance for chaining
     *
     * @example
     * ```typescript
     * scheduler.scheduleUpdate('update-text', () => {
     *   element.textContent = 'Updated text';
     * }, UpdatePriority.NORMAL);
     * ```
     */
    public scheduleUpdate(
        id: string,
        callback: () => void,
        priority: UpdatePriority = UpdatePriority.NORMAL
    ): RenderScheduler {
        this.updateQueue.set(id, {
            id,
            callback,
            priority,
            timestamp: performance.now()
        });

        // Start processing if not already running
        this.startProcessing();

        return this;
    }

    /**
     * Schedule an update using a standard update type.
     * This provides a more semantic API for scheduling updates.
     *
     * @param {string} componentId - ID of the component requesting the update
     * @param {UpdateType} updateType - Type of update
     * @param {() => void} callback - Function to execute
     * @param {string} [suffix] - Optional suffix for the update ID
     * @returns {RenderScheduler} The scheduler instance for chaining
     *
     * @example
     * ```typescript
     * scheduler.scheduleTypedUpdate(
     *   'slider',
     *   UpdateType.SLIDE_TRANSFORM,
     *   () => updateSlidePosition()
     * );
     * ```
     */
    public scheduleTypedUpdate(
        componentId: string,
        updateType: UpdateType,
        callback: () => void,
        suffix?: string
    ): RenderScheduler {
        const id = createUpdateId(componentId, updateType, suffix);
        const priority = getPriorityForUpdateType(updateType);

        return this.scheduleUpdate(id, callback, priority);
    }

    /**
     * Cancel a scheduled update.
     *
     * @param {string} id - ID of the task to cancel
     * @returns {boolean} True if a task was found and removed
     *
     * @example
     * ```typescript
     * const wasRemoved = scheduler.cancelUpdate('update-text');
     * console.log(`Update was ${wasRemoved ? 'successfully' : 'not'} canceled`);
     * ```
     */
    public cancelUpdate(id: string): boolean {
        return this.updateQueue.delete(id);
    }

    /**
     * Cancel an update that was scheduled with a standard update type.
     *
     * @param {string} componentId - ID of the component that scheduled the update
     * @param {UpdateType} updateType - Type of update to cancel
     * @param {string} [suffix] - Optional suffix from the update ID
     * @returns {boolean} True if a task was found and removed
     *
     * @example
     * ```typescript
     * scheduler.cancelTypedUpdate('slider', UpdateType.SLIDE_TRANSFORM);
     * ```
     */
    public cancelTypedUpdate(
        componentId: string,
        updateType: UpdateType,
        suffix?: string
    ): boolean {
        const id = createUpdateId(componentId, updateType, suffix);
        return this.cancelUpdate(id);
    }

    /**
     * Immediately execute a task with CRITICAL priority.
     * Bypasses the queue but still respects frame throttling.
     *
     * @param {() => void} callback - Function to execute immediately
     *
     * @example
     * ```typescript
     * scheduler.executeImmediate(() => {
     *   // Handle urgent user input
     *   processCriticalUserAction();
     * });
     * ```
     */
    public executeImmediate(callback: () => void): void {
        // For truly immediate execution, add to queue with CRITICAL priority
        const id = `immediate-${performance.now()}`;
        this.scheduleUpdate(id, callback, UpdatePriority.CRITICAL);

        // Force processing on next available frame
        this.processQueue();
    }

    /**
     * Start the processing loop if not already running.
     * @private
     */
    private startProcessing(): void {
        if (this.isProcessing || this.updateQueue.size === 0) return;

        this.isProcessing = true;
        this.processQueue();
    }

    /**
     * Process the queue using requestAnimationFrame for timing.
     * @private
     */
    private processQueue(): void {
        // Cancel any existing frame request
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Schedule next frame
        this.rafId = requestAnimationFrame(() => {
            const now = performance.now();

            // Get highest priority in the queue
            let highestPriority = 0;
            this.updateQueue.forEach(task => {
                if (task.priority > highestPriority) {
                    highestPriority = task.priority;
                }
            });

            // Check if we should process this frame based on throttling settings
            if (this.frameThrottler.shouldProcessFrame(highestPriority)) {
                this.executeQueuedTasks();
                this.frameThrottler.frameProcessed();
                this.lastFrameTime = now;
            }

            // Continue processing if queue is not empty
            if (this.updateQueue.size > 0) {
                this.processQueue();
            } else {
                this.isProcessing = false;
                this.rafId = null;
            }
        });
    }

    /**
     * Execute all queued tasks in priority order.
     * @private
     */
    private executeQueuedTasks(): void {
        if (this.updateQueue.size === 0) return;

        // Get all tasks and sort by priority (highest first) and then by timestamp
        const tasks = Array.from(this.updateQueue.values()).sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // Higher priority first
            }
            return a.timestamp - b.timestamp; // Older tasks first within same priority
        });

        // Clear the queue before executing to avoid potential infinite loops
        this.updateQueue.clear();

        // Execute all tasks
        tasks.forEach(task => {
            try {
                task.callback();
            } catch (error) {
                console.error(`Error executing task ${task.id}:`, error);
            }
        });
    }

    /**
     * Set the frame throttle rate.
     *
     * @param {number} milliseconds - Minimum time between frames
     *
     * @example
     * ```typescript
     * // Set to 30fps (33.33ms between frames)
     * scheduler.setFrameThrottle(33.33);
     * ```
     */
    public setFrameThrottle(milliseconds: number): void {
        this.frameThrottle = Math.max(0, milliseconds);
    }

    /**
     * Get current queue size for debugging.
     *
     * @returns {number} Number of tasks currently in the queue
     *
     * @example
     * ```typescript
     * const queueSize = scheduler.getQueueSize();
     * console.log(`Current queue size: ${queueSize}`);
     * ```
     */
    public getQueueSize(): number {
        return this.updateQueue.size;
    }

    /**
     * Clear all pending updates.
     *
     * @example
     * ```typescript
     * // Cancel all pending updates (e.g., when component unmounts)
     * scheduler.clearQueue();
     * ```
     */
    public clearQueue(): void {
        this.updateQueue.clear();
    }

    /**
     * Configure frame throttling behavior.
     *
     * @param {ThrottlerConfig} config - Throttling configuration options
     *
     * @example
     * ```typescript
     * scheduler.configureThrottling({
     *   targetFps: 30,
     *   strategy: ThrottleStrategy.ADAPTIVE
     * });
     * ```
     */
    public configureThrottling(config: Partial<ThrottlerConfig>): void {
        if (config.strategy !== undefined) {
            this.frameThrottler.setStrategy(config.strategy);
        }

        if (config.targetFps !== undefined) {
            this.frameThrottler.setTargetFps(config.targetFps);
        }
    }

    /**
     * Get current performance metrics.
     *
     * @returns {Object} Performance metrics including queue size and frame rate
     *
     * @example
     * ```typescript
     * const metrics = scheduler.getPerformanceMetrics();
     * console.log(`Current FPS: ${metrics.currentFps}`);
     * ```
     */
    public getPerformanceMetrics(): object {
        return {
            queueSize: this.getQueueSize(),
            ...this.frameThrottler.getPerformanceMetrics()
        };
    }
}

export default RenderScheduler;