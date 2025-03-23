// src/components/KineticSlider/managers/FrameThrottler.ts

/**
 * @file FrameThrottler.ts
 * @description Provides advanced frame timing controls to optimize rendering performance.
 * Offers various throttling strategies to consolidate updates and reduce GPU load.
 */

/**
 * Frame throttling strategies that determine how updates are scheduled.
 * @enum {string}
 */
export enum ThrottleStrategy {
    /**
     * Fixed frames per second - aims for consistent frame timing
     * by enforcing a fixed interval between frames.
     */
    FIXED_FPS = 'fixed_fps',

    /**
     * Adaptive - adjusts timing based on device performance
     * by monitoring actual frame rates and adjusting accordingly.
     */
    ADAPTIVE = 'adaptive',

    /**
     * Priority-based - only throttles lower priority updates
     * while allowing high-priority updates to bypass throttling.
     */
    PRIORITY = 'priority',

    /**
     * None - no throttling applied (use with caution)
     * as it may lead to performance issues on low-end devices.
     */
    NONE = 'none'
}

/**
 * Configuration options for the FrameThrottler.
 * @interface ThrottlerConfig
 */
export interface ThrottlerConfig {
    /**
     * Target frames per second (for FIXED_FPS strategy).
     * Higher values provide smoother animation but require more processing power.
     */
    targetFps?: number;

    /**
     * Minimum acceptable frames per second (for ADAPTIVE strategy).
     * The throttler will attempt to maintain at least this frame rate.
     */
    minFps?: number;

    /**
     * Maximum acceptable frames per second (for ADAPTIVE strategy).
     * The throttler will cap the frame rate at this value to save resources.
     */
    maxFps?: number;

    /**
     * Selected throttling strategy to use.
     * @see {ThrottleStrategy}
     */
    strategy?: ThrottleStrategy;

    /**
     * Enable performance monitoring and auto-adjustment.
     * When enabled, the throttler will collect metrics and adjust settings dynamically.
     */
    enableMonitoring?: boolean;
}

/**
 * Default configuration values for the throttler.
 * @type {ThrottlerConfig}
 */
const DEFAULT_CONFIG: ThrottlerConfig = {
    targetFps: 60,
    minFps: 30,
    maxFps: 120,
    strategy: ThrottleStrategy.FIXED_FPS,
    enableMonitoring: true
};

/**
 * Performance data for monitoring and auto-adjustment.
 * @interface PerformanceData
 * @private
 */
interface PerformanceData {
    /**
     * Array of recent frame durations in milliseconds.
     * Used to calculate average performance over time.
     */
    frameTimes: number[];

    /**
     * Current average FPS calculated from recent frame times.
     */
    currentFps: number;

    /**
     * Number of frames processed since initialization.
     */
    frameCount: number;

    /**
     * Timestamp of last performance adjustment in milliseconds.
     */
    lastAdjustment: number;

    /**
     * Current throttle interval in milliseconds.
     */
    currentInterval: number;
}

/**
 * Manages frame timing and throttling for optimal performance.
 * This class helps reduce GPU load by controlling when frames are processed.
 */
export class FrameThrottler {
    /** Active configuration */
    private config: ThrottlerConfig;

    /** Performance monitoring data */
    private performance: PerformanceData;

    /** Timestamp of the last processed frame */
    private lastFrameTime: number = 0;

    /**
     * Create a new FrameThrottler with the specified configuration.
     *
     * @param {ThrottlerConfig} [config] - Configuration options for the throttler
     *
     * @example
     * // Create a throttler with default settings (60fps, FIXED_FPS strategy)
     * const throttler = new FrameThrottler();
     *
     * @example
     * // Create a throttler with custom settings
     * const throttler = new FrameThrottler({
     *   targetFps: 30,
     *   strategy: ThrottleStrategy.ADAPTIVE,
     *   minFps: 15,
     *   maxFps: 60
     * });
     */
    constructor(config?: Partial<ThrottlerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Initialize performance data
        this.performance = {
            frameTimes: [],
            currentFps: this.config.targetFps!,
            frameCount: 0,
            lastAdjustment: performance.now(),
            currentInterval: this.calculateInterval(this.config.targetFps!)
        };

        this.lastFrameTime = performance.now();
    }

    /**
     * Calculate the frame interval in milliseconds from FPS.
     *
     * @param {number} fps - Frames per second
     * @returns {number} Interval in milliseconds between frames
     * @private
     */
    private calculateInterval(fps: number): number {
        return 1000 / fps;
    }

    /**
     * Check if enough time has passed to process the next frame.
     *
     * @param {number} [priority] - Optional priority level to consider (higher values bypass more throttling)
     * @returns {boolean} True if the frame should be processed, false if it should be skipped
     *
     * @example
     * // Basic usage in animation loop
     * if (throttler.shouldProcessFrame()) {
     *   // Process frame
     *   render();
     *   throttler.frameProcessed();
     * }
     *
     * @example
     * // Usage with priority (3 is highest priority)
     * if (throttler.shouldProcessFrame(2)) {
     *   // Process high-priority frame
     *   renderImportantElements();
     *   throttler.frameProcessed();
     * }
     */
    public shouldProcessFrame(priority?: number): boolean {
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;

        // Handle different strategies
        switch (this.config.strategy) {
            case ThrottleStrategy.NONE:
                return true;

            case ThrottleStrategy.PRIORITY:
                // High priority updates bypass throttling
                if (priority !== undefined && priority >= 2) {
                    return true;
                }
                // Otherwise use fixed fps throttling
                return elapsed >= this.performance.currentInterval;

            case ThrottleStrategy.ADAPTIVE:
                // Adaptively adjust the interval based on recent performance
                this.updateAdaptivePerformance(now);
                return elapsed >= this.performance.currentInterval;

            case ThrottleStrategy.FIXED_FPS:
            default:
                // Simple fixed interval throttling
                return elapsed >= this.performance.currentInterval;
        }
    }

    /**
     * Mark the current frame as processed and update timing metrics.
     * Should be called after processing a frame that passed the shouldProcessFrame check.
     *
     * @example
     * if (throttler.shouldProcessFrame()) {
     *   // Process frame
     *   render();
     *   throttler.frameProcessed();
     * }
     */
    public frameProcessed(): void {
        const now = performance.now();
        const frameDuration = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Update performance metrics
        if (this.config.enableMonitoring) {
            this.updatePerformanceMetrics(frameDuration);
        }
    }

    /**
     * Update performance metrics with the latest frame duration.
     *
     * @param {number} frameDuration - Duration of the last frame in milliseconds
     * @private
     */
    private updatePerformanceMetrics(frameDuration: number): void {
        // Add to the frame times array (keep last 60 frames)
        this.performance.frameTimes.push(frameDuration);
        if (this.performance.frameTimes.length > 60) {
            this.performance.frameTimes.shift();
        }

        // Calculate current FPS
        const avgFrameDuration = this.performance.frameTimes.reduce((sum, time) => sum + time, 0) /
            this.performance.frameTimes.length;
        this.performance.currentFps = 1000 / avgFrameDuration;

        // Increment frame count
        this.performance.frameCount++;
    }

    /**
     * Update adaptive performance settings based on recent metrics.
     * This method adjusts the frame rate based on the device's capabilities.
     *
     * @param {number} now - Current timestamp in milliseconds
     * @private
     */
    private updateAdaptivePerformance(now: number): void {
        // Only adjust every 1 second
        if (now - this.performance.lastAdjustment < 1000 ||
            this.performance.frameTimes.length < 10) {
            return;
        }

        // Calculate average FPS
        const avgFps = this.performance.currentFps;

        // Adjust based on performance
        let targetFps = this.config.targetFps!;

        if (avgFps < this.config.minFps!) {
            // Performance is too low, reduce target FPS
            targetFps = Math.max(this.config.minFps!, targetFps * 0.8);
        } else if (avgFps > this.config.maxFps!) {
            // Performance is very good, increase target FPS up to max
            targetFps = Math.min(this.config.maxFps!, targetFps * 1.2);
        } else if (avgFps > targetFps * 1.2) {
            // We have headroom, gradually increase target FPS
            targetFps = Math.min(this.config.maxFps!, targetFps * 1.1);
        }

        // Update the interval
        this.performance.currentInterval = this.calculateInterval(targetFps);
        this.performance.lastAdjustment = now;
    }

    /**
     * Set a specific throttling strategy.
     *
     * @param {ThrottleStrategy} strategy - The throttling strategy to use
     *
     * @example
     * // Switch to adaptive strategy based on device capability
     * if (isLowEndDevice) {
     *   throttler.setStrategy(ThrottleStrategy.ADAPTIVE);
     * }
     */
    public setStrategy(strategy: ThrottleStrategy): void {
        this.config.strategy = strategy;
    }

    /**
     * Set a specific target FPS.
     *
     * @param {number} fps - Target frames per second (must be > 0)
     *
     * @example
     * // Reduce target FPS to save battery
     * if (isBatteryLow) {
     *   throttler.setTargetFps(30);
     * } else {
     *   throttler.setTargetFps(60);
     * }
     */
    public setTargetFps(fps: number): void {
        this.config.targetFps = Math.max(1, fps);

        // Update the interval if using fixed FPS
        if (this.config.strategy === ThrottleStrategy.FIXED_FPS) {
            this.performance.currentInterval = this.calculateInterval(this.config.targetFps);
        }
    }

    /**
     * Get current performance metrics for monitoring and debugging.
     *
     * @returns {Object} Performance information including current FPS, interval, frame count, and strategy
     *
     * @example
     * // Log performance metrics
     * console.log(throttler.getPerformanceMetrics());
     * // Example output: { currentFps: 58.2, targetInterval: 16.67, frameCount: 1242, strategy: 'fixed_fps' }
     */
    public getPerformanceMetrics(): {
        currentFps: number;
        targetInterval: number;
        frameCount: number;
        strategy: ThrottleStrategy;
    } {
        return {
            currentFps: this.performance.currentFps,
            targetInterval: this.performance.currentInterval,
            frameCount: this.performance.frameCount,
            strategy: this.config.strategy!
        };
    }
}