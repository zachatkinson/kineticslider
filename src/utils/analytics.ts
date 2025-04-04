/**
 * Analytics event types for the slider
 */
import type { 
  AnalyticsConfig,
  SliderAnalyticsEventType as _SliderAnalyticsEventType,
  GestureAnalytics,
  SliderAnalyticsData,
  BaseAnalyticsData as _BaseAnalyticsData,
  ErrorAnalytics,
  SliderEventType as _SliderEventType
} from '../types/analytics';
import type { GestureDirection as _GestureDirection } from '../types/gesture';
import type { ErrorType } from '../types/error';

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: false,
  debug: false,
  trackPerformance: false,
  trackInteractions: false,
  trackErrors: false,
  batchSize: 10,
  batchInterval: 5000,
  enablePerformance: false,
  enableInteractions: false,
  enableErrors: false,
  batchEvents: true,
};

/**
 * Analytics manager for KineticSlider
 * @example Example usage
 */
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private config: AnalyticsConfig;
  private eventQueue: SliderAnalyticsData[] = [];
  private batchInterval: number | null = null;
  private sessionId: string;

  /**
   * Creates a new AnalyticsManager instance
   * @param config - Optional analytics configuration
   */
  private constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.startBatchProcessing();
    }

    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendBatch(true);
      });
    }
  }

  /**
   * Gets the singleton instance of AnalyticsManager
   * @param config - Optional analytics configuration
   * @returns {AnalyticsManager} The AnalyticsManager singleton instance
   */
  public static getInstance(
    config?: Partial<AnalyticsConfig>
  ): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager(config);
    }
    return AnalyticsManager.instance;
  }

  /**
   * Gets the current analytics configuration
   * @returns {AnalyticsConfig} The current analytics configuration
   */
  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Updates the analytics configuration
   * @param config - Partial configuration to update
   * @returns {void}
   */
  public updateConfig(config: Partial<AnalyticsConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    // Start or stop batch processing based on enabled state change
    if (!wasEnabled && this.config.enabled) {
      this.startBatchProcessing();
    } else if (wasEnabled && !this.config.enabled) {
      this.stopBatchProcessing();
    }
  }

  /**
   * Tracks an analytics event
   * @param event - The event data to track
   * @returns {void}
   */
  public trackEvent(
    event: Partial<SliderAnalyticsData>
  ): void {
    if (!this.config.enabled) return;

    const baseEvent = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    const fullEvent = {
      ...baseEvent,
      ...event
    } as SliderAnalyticsData;

    if (this.config.debug) {
      console.warn('[Analytics]', fullEvent);
    }

    this.eventQueue.push(fullEvent);

    // Send immediately if batch size reached or not batching
    if (!this.config.batchEvents ||
      this.eventQueue.length >= this.config.batchSize
    ) {
      this.sendBatch();
    }
  }

  /**
   * Tracks an error in the analytics system
   * @param error - The error object to track
   * @param _context - Additional context to include with the error
   * @returns {void}
   */
  public trackError(error: Error, _context: Record<string, unknown> = {}): void {
    if (!this.config.enabled || !this.config.enableErrors) return;

    const errorEvent: ErrorAnalytics = {
      eventType: 'error',
      error,
      errorType: 'unknown' as ErrorType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.trackEvent(errorEvent);
  }

  /**
   * Immediately sends all queued events
   * @returns {void}
   */
  public flushEvents(): void {
    this.sendBatch();
  }

  private startBatchProcessing(): void {
    if (this.batchInterval !== null || !this.config.batchEvents) return;

    this.batchInterval = window.setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
  }

  private stopBatchProcessing(): void {
    if (this.batchInterval === null) return;

    window.clearInterval(this.batchInterval);
    this.batchInterval = null;
  }

  private sendBatch(immediate: boolean = false): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // If a custom event handler is provided, use it
    if (this.config.onEvent) {
      events.forEach((event) => {
        this.config.onEvent?.(event);
      });
      return;
    }

    // If an endpoint is provided, send to it
    if (this.config.endpoint) {
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
        keepalive: immediate,
      };

      if (immediate && navigator.sendBeacon) {
        navigator.sendBeacon(this.config.endpoint, JSON.stringify(events));
      } else {
        fetch(this.config.endpoint, options).catch((error) => {
          console.error('Error sending analytics', error);
        });
      }
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

// Export singleton instance
export const analytics = AnalyticsManager.getInstance();

/**
 * Tracks a custom event
 *
 * @param {('slide_change' | 'animation_complete' | 'gesture_detected' | 'error')} eventName - The name of the event
 * @param {Record<string, unknown>} [data] - Additional data to track with the event
 * @param {string} [componentId] - Optional component ID
 * @returns {void}
 */
export const trackEvent = (
  eventName: 'slide_change' | 'animation_complete' | 'gesture_detected' | 'error',
  data: Record<string, unknown> = {},
  componentId?: string
): void => {
  const event: Partial<SliderAnalyticsData> = {
    eventType: eventName,
    componentId,
    ...data
  };
  analytics.trackEvent(event);
};

/**
 * Tracks an error
 *
 * @param {Error | unknown} error - The error to track
 * @param {Record<string, unknown>} [metadata] - Additional metadata about the error
 * @returns {void}
 */
export const trackError = (error: Error | unknown, metadata?: Record<string, unknown>): void => {
  analytics.trackError(error as Error, metadata || {});
};

// Export types
export type { 
  SliderAnalyticsEventType as _SliderAnalyticsEventType,
  SliderAnalyticsData,
  BaseAnalyticsData as _BaseAnalyticsData,
  SliderEventType as _SliderEventType
} from '../types/analytics';
export type { GestureDirection as _GestureDirection } from '../types/gesture';

// Reset the singleton instance for testing purposes
export const _resetAnalyticsForTesting = (): void => {
  // @ts-ignore - accessing private property for testing
  AnalyticsManager.instance = undefined;
};

/**
 * Tracks a user interaction
 *
 * @param {string} interactionType - The type of interaction
 * @param {Record<string, unknown>} [_data] - Additional data to track with the interaction
 * @returns {void}
 */
export const trackInteraction = (
  interactionType: string,
  _data?: Record<string, unknown>
): void => {
  const analyticsData: GestureAnalytics = {
    eventType: 'gesture_detected',
    timestamp: new Date().toISOString(),
    gestureType: interactionType,
    direction: 'horizontal',
    distance: 0,
    velocity: 0
  };
  analytics.trackEvent(analyticsData);
};
