/**
 * Performance Telemetry Collection System
 *
 * Comprehensive telemetry collection for performance monitoring,
 * resource usage tracking, and optimization insights.
 */

import type { ILogger } from '../logging';
import type { SliderDomainEvent } from '../../domain/models';

// ===== TELEMETRY TYPES =====

export interface TelemetryConfig {
  enabled: boolean;
  sampleRate: number;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
  enableResourceTiming: boolean;
  enableUserTiming: boolean;
  enableNavigationTiming: boolean;
  enablePaintTiming: boolean;
  enableLongTaskTiming: boolean;
  enableMemoryTiming: boolean;
}

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  timestamp: Date;
  data: Record<string, unknown>;
  context: TelemetryContext;
  sessionId: string;
  userId?: string;
}

export type TelemetryEventType =
  | 'performance'
  | 'resource'
  | 'user-timing'
  | 'navigation'
  | 'paint'
  | 'long-task'
  | 'memory'
  | 'slider-performance'
  | 'custom';

export interface TelemetryContext {
  page: {
    url: string;
    title: string;
    loadTime: number;
  };
  device: {
    type: string;
    memory?: number;
    cores?: number;
    connection?: string;
  };
  browser: {
    name: string;
    version: string;
    engine: string;
  };
  viewport: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  slider?: {
    id: string;
    version?: string;
    slideCount?: number;
  };
}

export interface PerformanceTelemetry {
  metric: string;
  value: number;
  unit: string;
  threshold?: number;
  category: 'web-vitals' | 'custom' | 'resource' | 'user-timing';
  tags?: Record<string, string>;
}

export interface ResourceTelemetry {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  status?: number;
  cached: boolean;
}

export interface MemoryTelemetry {
  used: number;
  total: number;
  limit: number;
  pressure?: 'nominal' | 'moderate' | 'critical';
}

export interface LongTaskTelemetry {
  duration: number;
  startTime: number;
  attribution?: string[];
}

// ===== TELEMETRY SERVICE INTERFACE =====

export interface ITelemetryService {
  /**
   * Initialize telemetry collection
   */
  initialize(config: TelemetryConfig): Promise<void>;

  /**
   * Record performance telemetry
   */
  recordPerformance(telemetry: PerformanceTelemetry): void;

  /**
   * Record resource telemetry
   */
  recordResource(telemetry: ResourceTelemetry): void;

  /**
   * Record memory telemetry
   */
  recordMemory(telemetry: MemoryTelemetry): void;

  /**
   * Record long task telemetry
   */
  recordLongTask(telemetry: LongTaskTelemetry): void;

  /**
   * Record custom telemetry
   */
  recordCustom(name: string, data: Record<string, unknown>): void;

  /**
   * Start performance measurement
   */
  startMeasurement(name: string): () => void;

  /**
   * Mark performance milestone
   */
  mark(name: string): void;

  /**
   * Measure between marks
   */
  measure(name: string, startMark: string, endMark?: string): number;

  /**
   * Set context
   */
  setContext(context: Partial<TelemetryContext>): void;

  /**
   * Flush telemetry data
   */
  flush(): Promise<void>;

  /**
   * Get telemetry summary
   */
  getSummary(): TelemetrySummary;
}

export interface TelemetrySummary {
  totalEvents: number;
  eventsByType: Record<TelemetryEventType, number>;
  performanceMetrics: {
    avgLoadTime: number;
    avgRenderTime: number;
    memoryUsage: number;
    longTaskCount: number;
  };
  resourceMetrics: {
    totalSize: number;
    avgLoadTime: number;
    cacheHitRate: number;
  };
  thresholdViolations: {
    metric: string;
    count: number;
    threshold: number;
  }[];
}

// ===== TELEMETRY SERVICE IMPLEMENTATION =====

export class TelemetryService implements ITelemetryService {
  private config!: TelemetryConfig;
  private logger: ILogger;
  private events: TelemetryEvent[] = [];
  private context: TelemetryContext;
  private sessionId: string;
  private observers: PerformanceObserver[] = [];
  private flushTimer?: NodeJS.Timeout;
  private measurements = new Map<string, number>();

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'Telemetry' });
    this.sessionId = this.generateSessionId();
    this.context = this.initializeContext();
  }

  async initialize(config: TelemetryConfig): Promise<void> {
    this.config = config;

    if (!config.enabled) {
      this.logger.info('Telemetry collection disabled');
      return;
    }

    // Set up performance observers
    this.setupPerformanceObservers();

    // Set up periodic flushing
    this.setupPeriodicFlush();

    // Set up page lifecycle tracking
    this.setupPageLifecycleTracking();

    this.logger.info('Telemetry service initialized');
  }

  recordPerformance(telemetry: PerformanceTelemetry): void {
    if (!this.shouldSample()) return;

    const event: TelemetryEvent = {
      id: this.generateEventId(),
      type: 'performance',
      timestamp: new Date(),
      data: {
        metric: telemetry.metric,
        value: telemetry.value,
        unit: telemetry.unit,
        threshold: telemetry.threshold,
        category: telemetry.category,
        tags: telemetry.tags,
        violation: telemetry.threshold && telemetry.value > telemetry.threshold,
      },
      context: { ...this.context },
      sessionId: this.sessionId,
    };

    this.addEvent(event);
  }

  recordResource(telemetry: ResourceTelemetry): void {
    if (!this.shouldSample()) return;

    const event: TelemetryEvent = {
      id: this.generateEventId(),
      type: 'resource',
      timestamp: new Date(),
      data: {
        name: telemetry.name,
        type: telemetry.type,
        size: telemetry.size,
        duration: telemetry.duration,
        startTime: telemetry.startTime,
        status: telemetry.status,
        cached: telemetry.cached,
        efficiency:
          telemetry.size > 0 ? telemetry.duration / telemetry.size : 0,
      },
      context: { ...this.context },
      sessionId: this.sessionId,
    };

    this.addEvent(event);
  }

  recordMemory(telemetry: MemoryTelemetry): void {
    if (!this.shouldSample()) return;

    const event: TelemetryEvent = {
      id: this.generateEventId(),
      type: 'memory',
      timestamp: new Date(),
      data: {
        used: telemetry.used,
        total: telemetry.total,
        limit: telemetry.limit,
        pressure: telemetry.pressure,
        utilization: telemetry.used / telemetry.total,
        available: telemetry.total - telemetry.used,
      },
      context: { ...this.context },
      sessionId: this.sessionId,
    };

    this.addEvent(event);
  }

  recordLongTask(telemetry: LongTaskTelemetry): void {
    if (!this.shouldSample()) return;

    const event: TelemetryEvent = {
      id: this.generateEventId(),
      type: 'long-task',
      timestamp: new Date(),
      data: {
        duration: telemetry.duration,
        startTime: telemetry.startTime,
        attribution: telemetry.attribution,
        severity: this.classifyLongTaskSeverity(telemetry.duration),
      },
      context: { ...this.context },
      sessionId: this.sessionId,
    };

    this.addEvent(event);
  }

  recordCustom(name: string, data: Record<string, unknown>): void {
    if (!this.shouldSample()) return;

    const event: TelemetryEvent = {
      id: this.generateEventId(),
      type: 'custom',
      timestamp: new Date(),
      data: {
        name,
        ...data,
      },
      context: { ...this.context },
      sessionId: this.sessionId,
    };

    this.addEvent(event);
  }

  startMeasurement(name: string): () => void {
    const startTime = performance.now();
    this.measurements.set(name, startTime);

    // Use Performance API if available
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.measurements.delete(name);

      if (performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }

      this.recordPerformance({
        metric: name,
        value: duration,
        unit: 'ms',
        category: 'user-timing',
      });

      return duration;
    };
  }

  mark(name: string): void {
    if (performance.mark) {
      performance.mark(name);
    }

    this.recordPerformance({
      metric: `mark-${name}`,
      value: performance.now(),
      unit: 'ms',
      category: 'user-timing',
    });
  }

  measure(name: string, startMark: string, endMark?: string): number {
    let duration = 0;

    if (performance.measure && performance.getEntriesByName) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        duration = entries[entries.length - 1]?.duration || 0;
      } catch (error) {
        this.logger.warn('Failed to measure performance', {
          name,
          startMark,
          endMark,
          error,
        });
      }
    }

    this.recordPerformance({
      metric: name,
      value: duration,
      unit: 'ms',
      category: 'user-timing',
    });

    return duration;
  }

  setContext(context: Partial<TelemetryContext>): void {
    this.context = { ...this.context, ...context };
  }

  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    if (this.config.endpoint && this.config.apiKey) {
      try {
        await this.sendToEndpoint(eventsToFlush);
      } catch (error) {
        this.logger.error('Failed to send telemetry data', error);
        // Re-add failed events to queue (with limit)
        if (this.events.length < 10000) {
          this.events.unshift(...eventsToFlush.slice(0, 1000));
        }
      }
    }

    this.logger.debug('Telemetry data flushed', {
      count: eventsToFlush.length,
    });
  }

  getSummary(): TelemetrySummary {
    const eventsByType: Record<TelemetryEventType, number> = {
      performance: 0,
      resource: 0,
      'user-timing': 0,
      navigation: 0,
      paint: 0,
      'long-task': 0,
      memory: 0,
      'slider-performance': 0,
      custom: 0,
    };

    const performanceEvents = this.events.filter(
      (e) => e.type === 'performance'
    );
    const resourceEvents = this.events.filter((e) => e.type === 'resource');
    const longTaskEvents = this.events.filter((e) => e.type === 'long-task');
    const memoryEvents = this.events.filter((e) => e.type === 'memory');

    // Count events by type
    for (const event of this.events) {
      eventsByType[event.type]++;
    }

    // Calculate performance metrics
    const loadTimes = performanceEvents
      .filter((e) => e.data.metric === 'load-time')
      .map((e) => e.data.value as number);
    const renderTimes = performanceEvents
      .filter((e) => e.data.metric === 'render-time')
      .map((e) => e.data.value as number);

    const avgLoadTime =
      loadTimes.length > 0
        ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
        : 0;
    const avgRenderTime =
      renderTimes.length > 0
        ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
        : 0;

    const latestMemory = memoryEvents[memoryEvents.length - 1];
    const memoryUsage = latestMemory
      ? (latestMemory.data.utilization as number)
      : 0;

    // Calculate resource metrics
    const totalSize = resourceEvents.reduce(
      (sum, e) => sum + (e.data.size as number),
      0
    );
    const resourceLoadTimes = resourceEvents.map(
      (e) => e.data.duration as number
    );
    const avgResourceLoadTime =
      resourceLoadTimes.length > 0
        ? resourceLoadTimes.reduce((a, b) => a + b, 0) /
          resourceLoadTimes.length
        : 0;
    const cachedResources = resourceEvents.filter((e) => e.data.cached).length;
    const cacheHitRate =
      resourceEvents.length > 0 ? cachedResources / resourceEvents.length : 0;

    // Find threshold violations
    const thresholdViolations = performanceEvents
      .filter((e) => e.data.violation)
      .reduce(
        (acc, e) => {
          const metric = e.data.metric as string;
          const existing = acc.find((v) => v.metric === metric);
          if (existing) {
            existing.count++;
          } else {
            acc.push({
              metric,
              count: 1,
              threshold: e.data.threshold as number,
            });
          }
          return acc;
        },
        [] as TelemetrySummary['thresholdViolations']
      );

    return {
      totalEvents: this.events.length,
      eventsByType,
      performanceMetrics: {
        avgLoadTime,
        avgRenderTime,
        memoryUsage,
        longTaskCount: longTaskEvents.length,
      },
      resourceMetrics: {
        totalSize,
        avgLoadTime: avgResourceLoadTime,
        cacheHitRate,
      },
      thresholdViolations,
    };
  }

  // ===== PRIVATE METHODS =====

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      this.logger.warn('PerformanceObserver not supported');
      return;
    }

    // Resource timing
    if (this.config.enableResourceTiming) {
      this.setupResourceTimingObserver();
    }

    // Navigation timing
    if (this.config.enableNavigationTiming) {
      this.setupNavigationTimingObserver();
    }

    // Paint timing
    if (this.config.enablePaintTiming) {
      this.setupPaintTimingObserver();
    }

    // Long task timing
    if (this.config.enableLongTaskTiming) {
      this.setupLongTaskObserver();
    }

    // Memory monitoring
    if (this.config.enableMemoryTiming) {
      this.setupMemoryMonitoring();
    }
  }

  private setupResourceTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          this.recordResource({
            name: resource.name,
            type: this.getResourceType(resource.name),
            size: resource.transferSize || 0,
            duration: resource.duration,
            startTime: resource.startTime,
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
          });
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      this.logger.warn('Failed to set up resource timing observer', error);
    }
  }

  private setupNavigationTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const nav = entry as PerformanceNavigationTiming;

          this.recordPerformance({
            metric: 'navigation-load-time',
            value: nav.loadEventEnd - nav.fetchStart,
            unit: 'ms',
            category: 'web-vitals',
            threshold: 3000,
          });

          this.recordPerformance({
            metric: 'dom-content-loaded',
            value: nav.domContentLoadedEventEnd - nav.fetchStart,
            unit: 'ms',
            category: 'web-vitals',
            threshold: 1500,
          });
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      this.logger.warn('Failed to set up navigation timing observer', error);
    }
  }

  private setupPaintTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformance({
            metric: entry.name.replace('-', '_'),
            value: entry.startTime,
            unit: 'ms',
            category: 'web-vitals',
            threshold: entry.name === 'first-contentful-paint' ? 1800 : 2500,
          });
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      this.logger.warn('Failed to set up paint timing observer', error);
    }
  }

  private setupLongTaskObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const longTaskEntry = entry as PerformanceEntry & {
            attribution?: Array<{ name: string }>;
          };
          this.recordLongTask({
            duration: entry.duration,
            startTime: entry.startTime,
            attribution:
              longTaskEntry.attribution?.map((attr) => attr.name) || [],
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      this.logger.warn('Failed to set up long task observer', error);
    }
  }

  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      this.logger.warn('Memory API not supported');
      return;
    }

    // Monitor memory usage periodically
    setInterval(() => {
      const performanceWithMemory = performance as Performance & {
        memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      const memory = performanceWithMemory.memory;
      this.recordMemory({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        pressure: this.calculateMemoryPressure(
          memory.usedJSHeapSize / memory.jsHeapSizeLimit
        ),
      });
    }, 30000); // Every 30 seconds
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private setupPageLifecycleTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordCustom('page-visibility-change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      });
    });

    // Track page load completion
    window.addEventListener('load', () => {
      this.recordPerformance({
        metric: 'page-load-complete',
        value: performance.now(),
        unit: 'ms',
        category: 'web-vitals',
      });
    });
  }

  private initializeContext(): TelemetryContext {
    return {
      page: {
        url: window.location.href,
        title: document.title,
        loadTime: performance.now(),
      },
      device: {
        type: this.getDeviceType(),
        memory: (navigator as Navigator & { deviceMemory?: number })
          .deviceMemory,
        cores: navigator.hardwareConcurrency,
        connection: this.getConnectionType(),
      },
      browser: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        engine: this.getBrowserEngine(),
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
      },
    };
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private addEvent(event: TelemetryEvent): void {
    this.events.push(event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private classifyLongTaskSeverity(
    duration: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (duration > 200) return 'critical';
    if (duration > 100) return 'high';
    if (duration > 50) return 'medium';
    return 'low';
  }

  private calculateMemoryPressure(
    utilization: number
  ): 'nominal' | 'moderate' | 'critical' {
    if (utilization > 0.9) return 'critical';
    if (utilization > 0.7) return 'moderate';
    return 'nominal';
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.includes('.json')) return 'xhr';
    return 'other';
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getConnectionType(): string {
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { effectiveType: string };
    };
    return navigatorWithConnection.connection?.effectiveType || 'unknown';
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }

  private getBrowserEngine(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('WebKit')) return 'WebKit';
    if (userAgent.includes('Gecko')) return 'Gecko';
    if (userAgent.includes('Trident')) return 'Trident';
    return 'Unknown';
  }

  private generateSessionId(): string {
    return `tel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToEndpoint(events: TelemetryEvent[]): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        events,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Telemetry endpoint returned ${response.status}`);
    }
  }
}

// ===== SLIDER TELEMETRY TRACKER =====

export class SliderTelemetryTracker {
  private telemetry: ITelemetryService;
  private logger: ILogger;

  constructor(telemetry: ITelemetryService, logger: ILogger) {
    this.telemetry = telemetry;
    this.logger = logger.child({ component: 'SliderTelemetry' });
  }

  /**
   * Track slider initialization performance
   */
  trackSliderInit(sliderId: string, initTime: number): void {
    this.telemetry.recordPerformance({
      metric: 'slider-init-time',
      value: initTime,
      unit: 'ms',
      category: 'custom',
      threshold: 100,
      tags: { sliderId },
    });
  }

  /**
   * Track slide load performance
   */
  trackSlideLoad(sliderId: string, slideId: string, loadTime: number): void {
    this.telemetry.recordPerformance({
      metric: 'slide-load-time',
      value: loadTime,
      unit: 'ms',
      category: 'custom',
      threshold: 500,
      tags: { sliderId, slideId },
    });
  }

  /**
   * Track animation performance
   */
  trackAnimationPerformance(
    sliderId: string,
    animationType: string,
    duration: number
  ): void {
    this.telemetry.recordPerformance({
      metric: 'animation-duration',
      value: duration,
      unit: 'ms',
      category: 'custom',
      threshold: 300,
      tags: { sliderId, animationType },
    });
  }

  /**
   * Track render performance
   */
  trackRenderPerformance(sliderId: string, renderTime: number): void {
    this.telemetry.recordPerformance({
      metric: 'render-time',
      value: renderTime,
      unit: 'ms',
      category: 'custom',
      threshold: 16, // 60fps
      tags: { sliderId },
    });
  }

  /**
   * Track resource loading
   */
  trackResourceLoad(
    sliderId: string,
    resourceType: string,
    size: number,
    loadTime: number
  ): void {
    this.telemetry.recordResource({
      name: `slider-${sliderId}-${resourceType}`,
      type: resourceType,
      size,
      duration: loadTime,
      startTime: performance.now() - loadTime,
      cached: false,
    });
  }

  /**
   * Track domain events
   */
  trackDomainEvent(event: SliderDomainEvent): void {
    this.telemetry.recordCustom(`slider-event-${event.type}`, {
      sliderId: event.sliderId,
      timestamp: event.timestamp,
      ...('slideId' in event ? { slideId: event.slideId } : {}),
      ...('trigger' in event ? { trigger: event.trigger } : {}),
      ...('loadTime' in event ? { loadTime: event.loadTime } : {}),
    });
  }

  /**
   * Set slider context
   */
  setSliderContext(sliderId: string, config: Record<string, unknown>): void {
    this.telemetry.setContext({
      slider: {
        id: sliderId,
        ...config,
      },
    });
  }

  /**
   * Start slider operation measurement
   */
  startMeasurement(operation: string, sliderId: string): () => void {
    return this.telemetry.startMeasurement(`slider-${operation}-${sliderId}`);
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create telemetry service
 */
export function createTelemetryService(logger: ILogger): ITelemetryService {
  return new TelemetryService(logger);
}

/**
 * Create slider telemetry tracker
 */
export function createSliderTelemetryTracker(
  telemetry: ITelemetryService,
  logger: ILogger
): SliderTelemetryTracker {
  return new SliderTelemetryTracker(telemetry, logger);
}
