/**
 * Logging and Monitoring Infrastructure
 *
 * A comprehensive logging system with structured logging,
 * performance monitoring, and observability features.
 */

// ===== LOGGING TYPES =====

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: LogContext;
  error?: Error;
  traceId?: string;
  spanId?: string;
}

export interface LogContext {
  sliderId?: string;
  slideId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface LoggerOptions {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableStructured: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxBufferSize: number;
}

// ===== LOGGER INTERFACE =====

export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error | unknown): void;
  fatal(message: string, error?: Error | unknown): void;
  setLevel(level: LogLevel): void;
  child(context: Partial<LogContext>): ILogger;
  flush(): Promise<void>;
}

// ===== LOGGER IMPLEMENTATION =====

export class Logger implements ILogger {
  private buffer: LogEntry[] = [];
  private context: LogContext;
  private options: LoggerOptions;
  private flushTimer?: NodeJS.Timeout;

  constructor(context: LogContext = {}, options: Partial<LoggerOptions> = {}) {
    this.context = context;
    this.options = {
      level: LogLevel.Info,
      enableConsole: true,
      enableRemote: false,
      enableStructured: true,
      batchSize: 10,
      flushInterval: 5000,
      maxBufferSize: 100,
      ...options,
    };

    this.setupAutoFlush();
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.Debug, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.Info, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.Warn, message, data);
  }

  error(message: string, error?: Error | unknown): void {
    this.log(
      LogLevel.Error,
      message,
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  fatal(message: string, error?: Error | unknown): void {
    this.log(
      LogLevel.Fatal,
      message,
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  child(context: Partial<LogContext>): ILogger {
    return new Logger({ ...this.context, ...context }, this.options);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    if (this.options.enableRemote && this.options.remoteEndpoint) {
      await this.sendToRemote(entries);
    }
  }

  // ===== PRIVATE METHODS =====

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    if (level < this.options.level) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context: this.context,
      error,
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
    };

    // Console logging
    if (this.options.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer for remote logging
    if (this.options.enableRemote) {
      this.addToBuffer(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const levelName = this.getLogLevelName(entry.level);
    const timestamp = entry.timestamp.toISOString();

    if (this.options.enableStructured) {
      const structured = {
        timestamp,
        level: levelName,
        message: entry.message,
        context: entry.context,
        data: entry.data,
        traceId: entry.traceId,
        spanId: entry.spanId,
      };

      switch (entry.level) {
        case LogLevel.Debug:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.debug('🔍', structured);
          break;
        case LogLevel.Info:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.info('ℹ️', structured);
          break;
        case LogLevel.Warn:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.warn('⚠️', structured);
          break;
        case LogLevel.Error:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.error('❌', structured, entry.error);
          break;
        case LogLevel.Fatal:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.error('💀', structured, entry.error);
          break;
      }
    } else {
      const contextStr = entry.context
        ? ` [${JSON.stringify(entry.context)}]`
        : '';
      const message = `${timestamp} ${levelName}${contextStr}: ${entry.message}`;

      switch (entry.level) {
        case LogLevel.Debug:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.debug(message, entry.data);
          break;
        case LogLevel.Info:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.info(message, entry.data);
          break;
        case LogLevel.Warn:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.warn(message, entry.data);
          break;
        case LogLevel.Error:
        case LogLevel.Fatal:
          // eslint-disable-next-line no-console -- This is the logging service output mechanism
          console.error(message, entry.data, entry.error);
          break;
      }
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);

    // Prevent buffer overflow
    if (this.buffer.length > this.options.maxBufferSize) {
      this.buffer.shift();
    }

    // Flush if batch size reached
    if (this.buffer.length >= this.options.batchSize) {
      this.flush();
    }
  }

  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    try {
      await fetch(this.options.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch {
      // eslint-disable-next-line no-console -- Fallback error logging when remote endpoint fails
      console.error('Failed to send logs to remote endpoint:');
    }
  }

  private setupAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  private getLogLevelName(level: LogLevel): string {
    const levelNames = ['Debug', 'Info', 'Warn', 'Error', 'Fatal'] as const;
    return levelNames.at(level) ?? 'Unknown';
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

// ===== PERFORMANCE MONITORING =====

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: LogContext;
  tags?: Record<string, string>;
}

export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  context?: LogContext;
}

export class PerformanceMonitor {
  private measurements = new Map<string, PerformanceMeasurement>();
  private metrics: PerformanceMetric[] = [];
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'PerformanceMonitor' });
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string, context?: LogContext): void {
    const measurement: PerformanceMeasurement = {
      name,
      startTime: performance.now(),
      context,
    };

    this.measurements.set(name, measurement);
    this.logger.debug(`Started measurement: ${name}`);
  }

  /**
   * End a performance measurement
   */
  endMeasurement(name: string): number {
    const measurement = this.measurements.get(name);
    if (!measurement) {
      this.logger.warn(`No measurement found for: ${name}`);
      return 0;
    }

    measurement.endTime = performance.now();
    measurement.duration = measurement.endTime - measurement.startTime;

    this.recordMetric(name, measurement.duration, 'ms', measurement.context);
    this.measurements.delete(name);

    this.logger.debug(`Completed measurement: ${name}`, {
      duration: measurement.duration,
      context: measurement.context,
    });

    return measurement.duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = '',
    context?: LogContext,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context,
      tags,
    };

    this.metrics.push(metric);

    // Log significant metrics
    if (this.isSignificantMetric(metric)) {
      this.logger.info(`Performance metric: ${name}`, {
        value,
        unit,
        tags,
      });
    }
  }

  /**
   * Mark a performance milestone
   */
  mark(name: string, context?: LogContext): void {
    const timestamp = performance.now();
    this.recordMetric(name, timestamp, 'ms', context);

    // Use Performance API if available
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByPattern(pattern: RegExp): PerformanceMetric[] {
    return this.metrics.filter((metric) => pattern.test(metric.name));
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.measurements.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageValues: Record<string, number>;
    slowestOperations: PerformanceMetric[];
  } {
    const averageValuesMap = new Map<string, number>();
    const metricGroups = new Map<string, number[]>();

    // Group metrics by name
    for (const metric of this.metrics) {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric.value);
    }

    // Calculate averages using Map
    for (const [name, values] of metricGroups) {
      averageValuesMap.set(
        name,
        values.reduce((a, b) => a + b, 0) / values.length
      );
    }

    // Convert Map to Record for return value
    const averageValues: Record<string, number> =
      Object.fromEntries(averageValuesMap);

    // Find slowest operations (top 5)
    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalMetrics: this.metrics.length,
      averageValues,
      slowestOperations,
    };
  }

  private isSignificantMetric(metric: PerformanceMetric): boolean {
    // Define thresholds for significant metrics using Map
    const thresholds = new Map<string, number>([
      ['slide-load', 1000], // 1 second
      ['animation', 100], // 100ms
      ['navigation', 50], // 50ms
    ]);

    for (const [pattern, threshold] of thresholds) {
      if (metric.name.includes(pattern) && metric.value > threshold) {
        return true;
      }
    }

    return false;
  }
}

// ===== OBSERVABILITY MANAGER =====

export class ObservabilityManager {
  private logger: ILogger;
  private performanceMonitor: PerformanceMonitor;
  private errorCount = 0;
  private sessionStart = Date.now();

  constructor(options: Partial<LoggerOptions> = {}) {
    this.logger = new Logger({}, options);
    this.performanceMonitor = new PerformanceMonitor(this.logger);

    this.setupGlobalErrorHandling();
    this.setupPerformanceObservation();
  }

  getLogger(): ILogger {
    return this.logger;
  }

  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Get observability summary
   */
  getSummary(): {
    session: {
      duration: number;
      errorCount: number;
      startTime: Date;
    };
    performance: {
      totalMetrics: number;
      averageValues: Record<string, number>;
      slowestOperations: PerformanceMetric[];
    };
    system: {
      userAgent: string;
      language: string;
      platform: string;
      memoryUsage: {
        used: number;
        total: number;
        limit: number;
      } | null;
    };
  } {
    const sessionDuration = Date.now() - this.sessionStart;
    const performanceSummary = this.performanceMonitor.getSummary();

    return {
      session: {
        duration: sessionDuration,
        errorCount: this.errorCount,
        startTime: new Date(this.sessionStart),
      },
      performance: performanceSummary,
      system: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        memoryUsage: (performance as PerformanceWithMemory).memory
          ? {
              used: (performance as PerformanceWithMemory).memory!
                .usedJSHeapSize,
              total: (performance as PerformanceWithMemory).memory!
                .totalJSHeapSize,
              limit: (performance as PerformanceWithMemory).memory!
                .jsHeapSizeLimit,
            }
          : null,
      },
    };
  }

  private setupGlobalErrorHandling(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.errorCount++;
      this.logger.error('Unhandled error', event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount++;
      this.logger.error('Unhandled promise rejection', event.reason);
    });
  }

  private setupPerformanceObservation(): void {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Longer than 50ms
              this.performanceMonitor.recordMetric(
                'long-task',
                entry.duration,
                'ms',
                { component: 'browser' }
              );
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        this.logger.debug('Long task observation not supported');
      }

      // Observe navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            this.performanceMonitor.recordMetric(
              'navigation-load',
              navEntry.loadEventEnd - navEntry.fetchStart,
              'ms',
              { component: 'navigation' }
            );
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch {
        this.logger.debug('Navigation timing observation not supported');
      }
    }
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create a logger with default configuration
 */
export function createLogger(
  context?: LogContext,
  options?: Partial<LoggerOptions>
): ILogger {
  return new Logger(context, options);
}

/**
 * Create an observability manager
 */
export function createObservabilityManager(
  options?: Partial<LoggerOptions>
): ObservabilityManager {
  return new ObservabilityManager(options);
}

/**
 * Create a performance monitor
 */
export function createPerformanceMonitor(logger: ILogger): PerformanceMonitor {
  return new PerformanceMonitor(logger);
}
