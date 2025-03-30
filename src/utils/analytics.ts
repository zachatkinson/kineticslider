/**
 * Analytics event types for the slider
 */
import {
  AnalyticsConfigType,
  AnalyticsEventType,
  SliderEventType,
} from '../types/analytics';

const DEFAULT_CONFIG: AnalyticsConfigType = {
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
 */
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private config: AnalyticsConfigType;
  private eventQueue: AnalyticsEventType[] = [];
  private batchInterval: number | null = null;
  private sessionId: string;

  private constructor(config: Partial<AnalyticsConfigType> = {}) {
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

  public static getInstance(
    config?: Partial<AnalyticsConfigType>
  ): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager(config);
    }
    return AnalyticsManager.instance;
  }

  public getConfig(): AnalyticsConfigType {
    return { ...this.config };
  }

  public updateConfig(config: Partial<AnalyticsConfigType>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    // Start or stop batch processing based on enabled state change
    if (!wasEnabled && this.config.enabled) {
      this.startBatchProcessing();
    } else if (wasEnabled && !this.config.enabled) {
      this.stopBatchProcessing();
    }
  }

  public trackEvent(
    event: Omit<AnalyticsEventType, 'timestamp' | 'sessionId'>
  ): void {
    if (!this.config.enabled) return;

    const fullEvent: AnalyticsEventType = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      componentId: event.componentId || undefined,
    };

    if (this.config.debug) {
      console.warn('[Analytics]', fullEvent);
    }

    this.eventQueue.push(fullEvent);

    // Send immediately if batch size reached or not batching
    if (
      !this.config.batchEvents ||
      this.eventQueue.length >= this.config.batchSize
    ) {
      this.sendBatch();
    }
  }

  public trackError(error: Error, context: Record<string, unknown> = {}): void {
    if (!this.config.enabled || !this.config.enableErrors) return;

    this.trackEvent({
      type: SliderEventType.ERROR,
      data: {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        ...context,
      },
    });
  }

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
        if (this.config.onEvent) {
          this.config.onEvent(event);
        }
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
        // For immediate sends (like before page unload), use sendBeacon if available
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

// Helper hooks and utilities
export const trackEvent = (
  type: SliderEventType,
  data: Record<string, unknown> = {},
  componentId?: string
): void => {
  analytics.trackEvent({ type, data, componentId });
};

export const trackError = (
  error: Error,
  context: Record<string, unknown> = {}
): void => {
  analytics.trackError(error, context);
};

// Export the SliderEventType enum directly
export { SliderEventType } from '../types/analytics';

// Reset the singleton instance for testing purposes
export const resetAnalyticsForTesting = (): void => {
  // @ts-ignore - accessing private property for testing
  AnalyticsManager.instance = undefined;
};
