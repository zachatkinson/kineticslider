/**
 * Business Metrics Tracking System
 *
 * Comprehensive metrics collection for business KPIs,
 * performance indicators, and operational metrics.
 */

import type { ILogger } from '../logging';
import type { SliderDomainEvent } from '../../domain/models';

// ===== METRICS TYPES =====

export interface MetricsConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  flushInterval: number;
  batchSize: number;
  enableAggregation: boolean;
  retentionPeriod: number; // days
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  context?: Record<string, unknown>;
}

export interface Counter extends Metric {
  type: 'counter';
  increment: number;
}

export interface Gauge extends Metric {
  type: 'gauge';
  current: number;
}

export interface Histogram extends Metric {
  type: 'histogram';
  buckets: number[];
  counts: number[];
}

export interface Timer extends Metric {
  type: 'timer';
  duration: number;
  startTime: number;
  endTime: number;
}

export type MetricType = Counter | Gauge | Histogram | Timer;

export interface MetricAggregation {
  name: string;
  period: 'minute' | 'hour' | 'day';
  aggregations: {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
  timestamp: Date;
}

// ===== METRICS SERVICE INTERFACE =====

export interface IMetricsService {
  /**
   * Initialize metrics service
   */
  initialize(config: MetricsConfig): Promise<void>;

  /**
   * Increment a counter
   */
  increment(name: string, value?: number, tags?: Record<string, string>): void;

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * Start a timer
   */
  startTimer(name: string, tags?: Record<string, string>): () => void;

  /**
   * Record a timing
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void;

  /**
   * Record a custom metric
   */
  record(metric: MetricType): void;

  /**
   * Get metric aggregations
   */
  getAggregations(name: string, period: string): MetricAggregation[];

  /**
   * Flush metrics
   */
  flush(): Promise<void>;

  /**
   * Clear all metrics
   */
  clear(): void;
}

// ===== METRICS SERVICE IMPLEMENTATION =====

export class MetricsService implements IMetricsService {
  private config!: MetricsConfig;
  private logger: ILogger;
  private metrics: MetricType[] = [];
  private aggregations = new Map<string, MetricAggregation[]>();
  private timers = new Map<string, number>();
  private flushTimer?: NodeJS.Timeout;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'Metrics' });
  }

  async initialize(config: MetricsConfig): Promise<void> {
    this.config = config;

    if (!config.enabled) {
      this.logger.info('Metrics tracking disabled');
      return;
    }

    // Set up periodic flushing
    this.setupPeriodicFlush();

    // Set up aggregation if enabled
    if (config.enableAggregation) {
      this.setupAggregation();
    }

    this.logger.info('Metrics service initialized');
  }

  increment(name: string, value = 1, tags: Record<string, string> = {}): void {
    const metric: Counter = {
      type: 'counter',
      name,
      value,
      increment: value,
      unit: 'count',
      timestamp: new Date(),
      tags,
    };

    this.record(metric);
  }

  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: Gauge = {
      type: 'gauge',
      name,
      value,
      current: value,
      unit: 'value',
      timestamp: new Date(),
      tags,
    };

    this.record(metric);
  }

  histogram(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    const buckets = this.generateHistogramBuckets(value);
    const counts = new Array(buckets.length).fill(0);

    // Find appropriate bucket using safe array methods
    const bucketIndex = buckets.findIndex((bucket) => value <= bucket);
    if (bucketIndex !== -1) {
      counts.splice(bucketIndex, 1, 1);
    }

    const metric: Histogram = {
      type: 'histogram',
      name,
      value,
      buckets,
      counts,
      unit: 'value',
      timestamp: new Date(),
      tags,
    };

    this.record(metric);
  }

  startTimer(name: string, tags: Record<string, string> = {}): () => void {
    const startTime = performance.now();
    const timerId = `${name}_${Date.now()}_${Math.random()}`;

    this.timers.set(timerId, startTime);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.timers.delete(timerId);
      this.timing(name, duration, tags);
    };
  }

  timing(
    name: string,
    duration: number,
    tags: Record<string, string> = {}
  ): void {
    const metric: Timer = {
      type: 'timer',
      name,
      value: duration,
      duration,
      startTime: 0,
      endTime: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags,
    };

    this.record(metric);
  }

  record(metric: MetricType): void {
    if (!this.config.enabled) return;

    this.metrics.push(metric);

    // Update aggregations if enabled
    if (this.config.enableAggregation) {
      this.updateAggregations(metric);
    }

    // Auto-flush if batch size reached
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }

    this.logger.debug('Metric recorded', {
      name: metric.name,
      type: metric.type,
      value: metric.value,
    });
  }

  getAggregations(name: string, period: string): MetricAggregation[] {
    const key = `${name}_${period}`;
    return this.aggregations.get(key) || [];
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    if (this.config.endpoint && this.config.apiKey) {
      try {
        await this.sendToEndpoint(metricsToFlush);
      } catch (error) {
        this.logger.error('Failed to send metrics', error);
        // Re-add failed metrics to queue (with limit)
        if (this.metrics.length < 10000) {
          this.metrics.unshift(...metricsToFlush.slice(0, 1000));
        }
      }
    }

    this.logger.debug('Metrics flushed', { count: metricsToFlush.length });
  }

  clear(): void {
    this.metrics = [];
    this.aggregations.clear();
    this.timers.clear();
  }

  // ===== PRIVATE METHODS =====

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private setupAggregation(): void {
    // Set up periodic aggregation
    setInterval(() => {
      this.performAggregation();
    }, 60000); // Every minute
  }

  private updateAggregations(metric: MetricType): void {
    const periods = ['minute', 'hour', 'day'] as const;

    for (const period of periods) {
      const key = `${metric.name}_${period}`;
      const aggregations = this.aggregations.get(key) || [];

      // Find or create aggregation for current period
      const periodStart = this.getPeriodStart(metric.timestamp, period);
      let aggregation = aggregations.find(
        (agg) => agg.timestamp.getTime() === periodStart.getTime()
      );

      if (!aggregation) {
        aggregation = {
          name: metric.name,
          period,
          aggregations: {
            count: 0,
            sum: 0,
            avg: 0,
            min: Infinity,
            max: -Infinity,
            p50: 0,
            p95: 0,
            p99: 0,
          },
          timestamp: periodStart,
        };
        aggregations.push(aggregation);
      }

      // Update aggregation
      aggregation.aggregations.count++;
      aggregation.aggregations.sum += metric.value;
      aggregation.aggregations.avg =
        aggregation.aggregations.sum / aggregation.aggregations.count;
      aggregation.aggregations.min = Math.min(
        aggregation.aggregations.min,
        metric.value
      );
      aggregation.aggregations.max = Math.max(
        aggregation.aggregations.max,
        metric.value
      );

      this.aggregations.set(key, aggregations);
    }
  }

  private performAggregation(): void {
    // Calculate percentiles for all aggregations
    for (const [, aggregations] of this.aggregations) {
      for (const aggregation of aggregations) {
        // This is a simplified percentile calculation
        // In a real implementation, you'd maintain value arrays
        aggregation.aggregations.p50 = aggregation.aggregations.avg;
        aggregation.aggregations.p95 = aggregation.aggregations.avg * 1.5;
        aggregation.aggregations.p99 = aggregation.aggregations.avg * 2;
      }
    }

    // Clean up old aggregations
    this.cleanupOldAggregations();
  }

  private cleanupOldAggregations(): void {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - this.config.retentionPeriod);

    for (const [key, aggregations] of this.aggregations) {
      const filtered = aggregations.filter(
        (agg) => agg.timestamp >= cutoffTime
      );
      this.aggregations.set(key, filtered);
    }
  }

  private getPeriodStart(
    timestamp: Date,
    period: 'minute' | 'hour' | 'day'
  ): Date {
    const date = new Date(timestamp);

    switch (period) {
      case 'minute':
        date.setSeconds(0, 0);
        break;
      case 'hour':
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
    }

    return date;
  }

  private generateHistogramBuckets(value: number): number[] {
    // Generate exponential buckets
    const buckets = [];
    let bucket = 1;
    while (bucket <= value * 10) {
      buckets.push(bucket);
      bucket *= 2;
    }
    buckets.push(Infinity);
    return buckets;
  }

  private async sendToEndpoint(metrics: MetricType[]): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        metrics,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Metrics endpoint returned ${response.status}`);
    }
  }
}

// ===== SLIDER METRICS TRACKER =====

export class SliderMetricsTracker {
  private metrics: IMetricsService;
  private logger: ILogger;

  constructor(metrics: IMetricsService, logger: ILogger) {
    this.metrics = metrics;
    this.logger = logger.child({ component: 'SliderMetrics' });
  }

  /**
   * Track slider initialization
   */
  trackSliderInit(sliderId: string): void {
    this.metrics.increment('slider.initialized', 1, {
      sliderId,
    });
  }

  /**
   * Track slide views
   */
  trackSlideView(sliderId: string, slideId: string): void {
    this.metrics.increment('slider.slide_views', 1, {
      sliderId,
      slideId,
    });
  }

  /**
   * Track navigation events
   */
  trackNavigation(sliderId: string, trigger: string): void {
    this.metrics.increment('slider.navigations', 1, {
      sliderId,
      trigger,
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(sliderId: string, action: string): void {
    this.metrics.increment('slider.interactions', 1, {
      sliderId,
      action,
    });
  }

  /**
   * Track autoplay metrics
   */
  trackAutoplay(sliderId: string, action: string): void {
    this.metrics.increment('slider.autoplay', 1, {
      sliderId,
      action,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(sliderId: string, metric: string, value: number): void {
    this.metrics.histogram(`slider.performance.${metric}`, value, {
      sliderId,
    });
  }

  /**
   * Track load times
   */
  trackLoadTime(sliderId: string, slideId: string, loadTime: number): void {
    this.metrics.timing('slider.load_time', loadTime, {
      sliderId,
      slideId,
    });
  }

  /**
   * Track errors
   */
  trackError(sliderId: string, errorCode: string): void {
    this.metrics.increment('slider.errors', 1, {
      sliderId,
      errorCode,
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(sliderId: string, timeSpent: number): void {
    this.metrics.histogram('slider.engagement.time_spent', timeSpent, {
      sliderId,
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(
    sliderId: string,
    slideId: string,
    conversionType: string
  ): void {
    this.metrics.increment('slider.conversions', 1, {
      sliderId,
      slideId,
      conversionType,
    });
  }

  /**
   * Track resource usage
   */
  trackResourceUsage(sliderId: string, resource: string, usage: number): void {
    this.metrics.gauge(`slider.resources.${resource}`, usage, {
      sliderId,
    });
  }

  /**
   * Track domain events
   */
  trackDomainEvent(event: SliderDomainEvent): void {
    const metricName = `slider.events.${event.type.replace('-', '_')}`;

    this.metrics.increment(metricName, 1, {
      sliderId: event.sliderId,
      ...('slideId' in event ? { slideId: event.slideId } : {}),
      ...('trigger' in event ? { trigger: event.trigger } : {}),
    });

    // Track specific metrics based on event type
    if ('loadTime' in event) {
      this.trackLoadTime(event.sliderId, event.slideId, event.loadTime);
    }

    if ('currentIndex' in event && 'previousIndex' in event) {
      this.trackNavigation(event.sliderId, event.trigger || 'unknown');
    }
  }

  /**
   * Start timing a slider operation
   */
  startTimer(operation: string, sliderId: string): () => void {
    return this.metrics.startTimer(`slider.operations.${operation}`, {
      sliderId,
    });
  }

  /**
   * Get slider metrics summary
   */
  getSliderMetrics(_sliderId: string): {
    views: MetricAggregation[];
    interactions: MetricAggregation[];
    performance: MetricAggregation[];
    errors: MetricAggregation[];
  } {
    return {
      views: this.metrics.getAggregations('slider.slide_views', 'hour'),
      interactions: this.metrics.getAggregations('slider.interactions', 'hour'),
      performance: this.metrics.getAggregations('slider.performance', 'hour'),
      errors: this.metrics.getAggregations('slider.errors', 'hour'),
    };
  }
}

// ===== BUSINESS METRICS TRACKER =====

export class BusinessMetricsTracker {
  private metrics: IMetricsService;
  private logger: ILogger;

  constructor(metrics: IMetricsService, logger: ILogger) {
    this.metrics = metrics;
    this.logger = logger.child({ component: 'BusinessMetrics' });
  }

  /**
   * Track user acquisition
   */
  trackUserAcquisition(source: string, medium: string): void {
    this.metrics.increment('business.user_acquisition', 1, {
      source,
      medium,
    });
  }

  /**
   * Track user retention
   */
  trackUserRetention(userId: string, daysSinceFirstVisit: number): void {
    this.metrics.increment('business.user_retention', 1, {
      userId,
      cohort: this.getCohortBucket(daysSinceFirstVisit),
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, userId?: string): void {
    this.metrics.increment('business.feature_usage', 1, {
      feature,
      ...(userId && { userId }),
    });
  }

  /**
   * Track conversion funnel
   */
  trackFunnelStep(step: string, userId?: string): void {
    this.metrics.increment('business.funnel', 1, {
      step,
      ...(userId && { userId }),
    });
  }

  /**
   * Track revenue metrics
   */
  trackRevenue(amount: number, currency: string, source: string): void {
    this.metrics.gauge('business.revenue', amount, {
      currency,
      source,
    });
  }

  /**
   * Track engagement metrics
   */
  trackEngagement(metric: string, value: number, userId?: string): void {
    this.metrics.histogram(`business.engagement.${metric}`, value, {
      ...(userId && { userId }),
    });
  }

  private getCohortBucket(days: number): string {
    if (days <= 1) return 'day1';
    if (days <= 7) return 'week1';
    if (days <= 30) return 'month1';
    if (days <= 90) return 'quarter1';
    return 'longterm';
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create metrics service
 */
export function createMetricsService(logger: ILogger): IMetricsService {
  return new MetricsService(logger);
}

/**
 * Create slider metrics tracker
 */
export function createSliderMetricsTracker(
  metrics: IMetricsService,
  logger: ILogger
): SliderMetricsTracker {
  return new SliderMetricsTracker(metrics, logger);
}

/**
 * Create business metrics tracker
 */
export function createBusinessMetricsTracker(
  metrics: IMetricsService,
  logger: ILogger
): BusinessMetricsTracker {
  return new BusinessMetricsTracker(metrics, logger);
}
