/**
 * @fileoverview VelocityTracker - Optimized velocity calculation
 *
 * Extracted from main branch useMouseDrag.ts velocity tracking patterns.
 * Provides throttled, accurate velocity calculations for gesture recognition
 * and momentum-based animations. Handles smoothing and noise reduction.
 *
 * @version 1.0.0
 */

import { PHYSICS, PERFORMANCE, INPUT } from '../core/constants';

/**
 * Velocity sample for tracking motion
 */
export interface VelocitySample {
  /** Timestamp of the sample */
  timestamp: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Calculated velocity at this point */
  velocity: number;
  /** Distance from previous sample */
  distance: number;
}

/**
 * Configuration for velocity tracking
 * Pattern from main branch throttling and sampling
 */
export interface VelocityConfig {
  /** Sample buffer size for smoothing */
  bufferSize: number;
  /** Throttle interval in milliseconds (for 60fps = 16ms) */
  throttleInterval: number;
  /** Minimum distance for meaningful motion */
  minDistance: number;
  /** Maximum velocity cap */
  maxVelocity: number;
  /** Smoothing factor (0-1, higher = more smoothing) */
  smoothingFactor: number;
}

/**
 * Result of velocity calculation
 */
export interface VelocityResult {
  /** Current velocity magnitude */
  velocity: number;
  /** Velocity direction (radians) */
  direction: number;
  /** X component of velocity */
  velocityX: number;
  /** Y component of velocity */
  velocityY: number;
  /** Smoothed velocity (noise-reduced) */
  smoothedVelocity: number;
  /** Average velocity over sample buffer */
  averageVelocity: number;
}

/**
 * Optimized velocity calculation with smoothing and throttling
 *
 * Based on patterns from:
 * - useMouseDrag.ts: throttled event handling and velocity calculation
 * - Main branch: gesture recognition and momentum calculations
 * - Performance optimization: sample buffering and smoothing
 */
export class VelocityTracker {
  private config: VelocityConfig;
  private samples: VelocitySample[] = [];
  private lastThrottleTime: number = 0;
  private lastPosition: { x: number; y: number } | null = null;
  private smoothedVelocity: number = 0;

  constructor(config: Partial<VelocityConfig> = {}) {
    this.config = {
      bufferSize: PERFORMANCE.SAMPLE_BUFFER_SIZE,
      throttleInterval: PERFORMANCE.THROTTLE_INTERVAL,
      minDistance: INPUT.MIN_MOVEMENT_THRESHOLD,
      maxVelocity: PHYSICS.MAX_VELOCITY,
      smoothingFactor: 0.3,
      ...config,
    };
  }

  /**
   * Calculate velocity between two points
   * Pattern from main branch velocity calculations
   */
  static calculateVelocity(
    x1: number,
    y1: number,
    t1: number,
    x2: number,
    y2: number,
    t2: number
  ): number {
    const deltaTime = t2 - t1;
    if (deltaTime <= 0) return 0;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    return distance / (deltaTime / 1000); // Convert to pixels per second
  }

  /**
   * Calculate velocity direction in radians
   */
  static calculateDirection(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.atan2(deltaY, deltaX);
  }

  /**
   * Apply exponential smoothing to velocity
   * Pattern for noise reduction
   */
  private applySmoothingFilter(newVelocity: number): number {
    this.smoothedVelocity =
      this.smoothedVelocity * (1 - this.config.smoothingFactor) +
      newVelocity * this.config.smoothingFactor;

    return this.smoothedVelocity;
  }

  /**
   * Check if motion should be tracked (throttling)
   * Pattern from main branch useMouseDrag.ts throttling
   */
  private shouldTrackMotion(currentTime: number): boolean {
    return currentTime - this.lastThrottleTime >= this.config.throttleInterval;
  }

  /**
   * Add a velocity sample
   * Pattern from main branch motion tracking
   */
  addSample(x: number, y: number, timestamp: number = Date.now()): boolean {
    // Apply throttling
    if (!this.shouldTrackMotion(timestamp)) {
      return false;
    }

    this.lastThrottleTime = timestamp;

    // Calculate distance and velocity if we have a previous position
    let velocity = 0;
    let distance = 0;

    if (this.lastPosition) {
      distance = Math.sqrt(
        Math.pow(x - this.lastPosition.x, 2) +
          Math.pow(y - this.lastPosition.y, 2)
      );

      // Only track meaningful motion
      if (distance < this.config.minDistance) {
        return false;
      }

      // Get the most recent sample for velocity calculation
      const lastSample = this.samples[this.samples.length - 1];
      if (lastSample) {
        velocity = VelocityTracker.calculateVelocity(
          lastSample.x,
          lastSample.y,
          lastSample.timestamp,
          x,
          y,
          timestamp
        );

        // Cap velocity to maximum
        velocity = Math.min(velocity, this.config.maxVelocity);
      }
    }

    // Create new sample
    const sample: VelocitySample = {
      timestamp,
      x,
      y,
      velocity,
      distance,
    };

    // Add to buffer
    this.samples.push(sample);

    // Maintain buffer size
    if (this.samples.length > this.config.bufferSize) {
      this.samples.shift();
    }

    // Update position tracking
    this.lastPosition = { x, y };

    return true;
  }

  /**
   * Get current velocity calculation
   * Main method for retrieving velocity data
   */
  getVelocity(): VelocityResult {
    if (this.samples.length < 2) {
      return {
        velocity: 0,
        direction: 0,
        velocityX: 0,
        velocityY: 0,
        smoothedVelocity: 0,
        averageVelocity: 0,
      };
    }

    const latestSample = this.samples[this.samples.length - 1];
    const currentVelocity = latestSample.velocity;

    // Calculate direction using last two samples
    const previousSample = this.samples[this.samples.length - 2];
    const direction = VelocityTracker.calculateDirection(
      previousSample.x,
      previousSample.y,
      latestSample.x,
      latestSample.y
    );

    // Calculate velocity components
    const velocityX = currentVelocity * Math.cos(direction);
    const velocityY = currentVelocity * Math.sin(direction);

    // Apply smoothing
    const smoothedVelocity = this.applySmoothingFilter(currentVelocity);

    // Calculate average velocity over the buffer
    const averageVelocity =
      this.samples.reduce((sum, sample) => sum + sample.velocity, 0) /
      this.samples.length;

    return {
      velocity: currentVelocity,
      direction,
      velocityX,
      velocityY,
      smoothedVelocity,
      averageVelocity,
    };
  }

  /**
   * Get peak velocity over the buffer
   * Useful for momentum calculations
   */
  getPeakVelocity(): number {
    if (this.samples.length === 0) return 0;

    return Math.max(...this.samples.map((sample) => sample.velocity));
  }

  /**
   * Determine if motion qualifies as a swipe
   * Pattern from main branch swipe detection
   */
  isSwipeGesture(
    minVelocity: number = PHYSICS.VELOCITY_THRESHOLD,
    minDistance: number = INPUT.SWIPE_THRESHOLD
  ): boolean {
    if (this.samples.length < 2) return false;

    const velocity = this.getVelocity();
    const totalDistance = this.getTotalDistance();

    return velocity.velocity >= minVelocity || totalDistance >= minDistance;
  }

  /**
   * Get total distance traveled
   */
  getTotalDistance(): number {
    return this.samples.reduce((total, sample) => total + sample.distance, 0);
  }

  /**
   * Get motion duration
   */
  getMotionDuration(): number {
    if (this.samples.length < 2) return 0;

    const firstSample = this.samples[0];
    const lastSample = this.samples[this.samples.length - 1];

    return lastSample.timestamp - firstSample.timestamp;
  }

  /**
   * Predict future position based on current velocity
   * Pattern for momentum calculations
   */
  predictPosition(timeAhead: number): { x: number; y: number } {
    if (!this.lastPosition || this.samples.length < 2) {
      return this.lastPosition || { x: 0, y: 0 };
    }

    const velocity = this.getVelocity();
    const distance = velocity.velocity * (timeAhead / 1000);

    return {
      x: this.lastPosition.x + distance * Math.cos(velocity.direction),
      y: this.lastPosition.y + distance * Math.sin(velocity.direction),
    };
  }

  /**
   * Get velocity samples for debugging or analysis
   */
  getSamples(): VelocitySample[] {
    return [...this.samples];
  }

  /**
   * Reset tracking state
   */
  reset(): void {
    this.samples = [];
    this.lastThrottleTime = 0;
    this.lastPosition = null;
    this.smoothedVelocity = 0;
  }

  /**
   * Update tracking configuration
   */
  updateConfig(config: Partial<VelocityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current tracking configuration
   */
  getConfig(): VelocityConfig {
    return { ...this.config };
  }
}
