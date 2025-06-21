/**
 * Observability Infrastructure Index
 *
 * Central export point for all observability services including
 * error tracking, RUM, analytics, metrics, dashboard, and telemetry.
 */

// ===== ERROR TRACKING =====
export {
  type IErrorTrackingService,
  type ErrorTrackingConfig,
  type ErrorContext,
  type PerformanceTransaction,
  SentryErrorTrackingService,
  MockErrorTrackingService,
  SliderErrorTracker,
  createErrorTrackingService,
  createSliderErrorTracker,
} from './error-tracking';

// ===== REAL USER MONITORING =====
export {
  type IRUMService,
  type RUMConfig,
  type UserSession,
  type DeviceInfo,
  type BrowserInfo,
  type PerformanceMetric,
  type UserInteraction,
  type PageView,
  type ErrorEvent,
  type ResourceTiming,
  RUMService,
  createRUMService,
  createSliderRUMService,
} from './rum';

// ===== ANALYTICS =====
export {
  type IAnalyticsService,
  type AnalyticsConfig,
  type AnalyticsProvider,
  type AnalyticsEvent,
  type AnalyticsContext,
  type ConsentManager,
  AnalyticsService,
  SliderAnalyticsTracker,
  ConsoleAnalyticsProvider,
  GA4AnalyticsProvider,
  createAnalyticsService,
  createSliderAnalyticsTracker,
  createDefaultAnalyticsProviders,
} from './analytics';

// ===== METRICS =====
export {
  type IMetricsService,
  type MetricsConfig,
  type Metric,
  type Counter,
  type Gauge,
  type Histogram,
  type Timer,
  type MetricType,
  type MetricAggregation,
  MetricsService,
  SliderMetricsTracker,
  BusinessMetricsTracker,
  createMetricsService,
  createSliderMetricsTracker,
  createBusinessMetricsTracker,
} from './metrics';

// ===== DASHBOARD =====
export {
  type IDashboardService,
  type DashboardConfig,
  type DashboardData,
  type PerformanceDashboardData,
  type ErrorDashboardData,
  type UsageDashboardData,
  type BusinessDashboardData,
  type SystemDashboardData,
  type TimeSeriesData,
  type CategoryData,
  type FlowData,
  type ErrorSummary,
  type Alert,
  type DashboardWidget,
  DashboardService,
  createDashboardService,
} from './dashboard';

// ===== TELEMETRY =====
export {
  type ITelemetryService,
  type TelemetryConfig,
  type TelemetryEvent,
  type TelemetryEventType,
  type TelemetryContext,
  type PerformanceTelemetry,
  type ResourceTelemetry,
  type MemoryTelemetry,
  type LongTaskTelemetry,
  type TelemetrySummary,
  TelemetryService,
  SliderTelemetryTracker,
  createTelemetryService,
  createSliderTelemetryTracker,
} from './telemetry';

// ===== OBSERVABILITY MANAGER =====

import type { ILogger } from '../logging';
import type { SliderDomainEvent } from '../../domain/models';
import {
  createErrorTrackingService,
  createSliderErrorTracker,
  SliderErrorTracker,
  type IErrorTrackingService,
  type ErrorTrackingConfig,
} from './error-tracking';
import {
  createRUMService,
  createSliderRUMService,
  type IRUMService,
  type RUMConfig,
} from './rum';
import {
  createAnalyticsService,
  createSliderAnalyticsTracker,
  SliderAnalyticsTracker,
  createDefaultAnalyticsProviders,
  type IAnalyticsService,
  type AnalyticsConfig,
} from './analytics';
import {
  createMetricsService,
  createSliderMetricsTracker,
  SliderMetricsTracker,
  createBusinessMetricsTracker,
  BusinessMetricsTracker,
  type IMetricsService,
  type MetricsConfig,
} from './metrics';
import {
  createDashboardService,
  type IDashboardService,
  type DashboardConfig,
} from './dashboard';
import {
  createTelemetryService,
  createSliderTelemetryTracker,
  SliderTelemetryTracker,
  type ITelemetryService,
  type TelemetryConfig,
} from './telemetry';

/**
 * Comprehensive observability configuration
 */
export interface ObservabilityConfig {
  errorTracking: ErrorTrackingConfig;
  rum: RUMConfig;
  analytics: AnalyticsConfig;
  metrics: MetricsConfig;
  dashboard: DashboardConfig;
  telemetry: TelemetryConfig;
}

/**
 * Observability services collection
 */
export interface ObservabilityServices {
  errorTracking: IErrorTrackingService;
  rum: IRUMService;
  analytics: IAnalyticsService;
  metrics: IMetricsService;
  dashboard: IDashboardService;
  telemetry: ITelemetryService;
}

/**
 * Slider-specific observability trackers
 */
export interface SliderObservabilityTrackers {
  errorTracker: SliderErrorTracker;
  rumTracker: {
    rum: IRUMService;
    trackSliderEvent: (event: SliderDomainEvent) => void;
  };
  analyticsTracker: SliderAnalyticsTracker;
  metricsTracker: SliderMetricsTracker;
  businessTracker: BusinessMetricsTracker;
  telemetryTracker: SliderTelemetryTracker;
}

/**
 * Main observability manager that coordinates all observability services
 */
export class ObservabilityManager {
  private logger: ILogger;
  private services!: ObservabilityServices;
  private trackers!: SliderObservabilityTrackers;
  private initialized = false;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'ObservabilityManager' });
  }

  /**
   * Initialize all observability services
   */
  async initialize(config: ObservabilityConfig): Promise<void> {
    try {
      // Create core services
      this.services = {
        errorTracking: createErrorTrackingService(
          this.logger,
          config.errorTracking
        ),
        rum: createRUMService(this.logger),
        analytics: createAnalyticsService(this.logger),
        metrics: createMetricsService(this.logger),
        dashboard: createDashboardService(
          this.logger,
          this.services?.errorTracking,
          this.services?.rum,
          this.services?.analytics,
          this.services?.metrics
        ),
        telemetry: createTelemetryService(this.logger),
      };

      // Initialize services
      await Promise.all([
        this.services.errorTracking.initialize(config.errorTracking),
        this.services.rum.initialize(config.rum),
        this.services.analytics.initialize({
          ...config.analytics,
          providers:
            config.analytics.providers.length > 0
              ? config.analytics.providers
              : createDefaultAnalyticsProviders(),
        }),
        this.services.metrics.initialize(config.metrics),
        this.services.dashboard.initialize(config.dashboard),
        this.services.telemetry.initialize(config.telemetry),
      ]);

      // Create slider-specific trackers
      this.trackers = {
        errorTracker: createSliderErrorTracker(
          this.services.errorTracking,
          this.logger
        ),
        rumTracker: createSliderRUMService(this.services.rum, this.logger),
        analyticsTracker: createSliderAnalyticsTracker(
          this.services.analytics,
          this.logger
        ),
        metricsTracker: createSliderMetricsTracker(
          this.services.metrics,
          this.logger
        ),
        businessTracker: createBusinessMetricsTracker(
          this.services.metrics,
          this.logger
        ),
        telemetryTracker: createSliderTelemetryTracker(
          this.services.telemetry,
          this.logger
        ),
      };

      this.initialized = true;
      this.logger.info('Observability manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize observability manager', error);
      throw error;
    }
  }

  /**
   * Get observability services
   */
  getServices(): ObservabilityServices {
    if (!this.initialized) {
      throw new Error('Observability manager not initialized');
    }
    return this.services;
  }

  /**
   * Get slider trackers
   */
  getTrackers(): SliderObservabilityTrackers {
    if (!this.initialized) {
      throw new Error('Observability manager not initialized');
    }
    return this.trackers;
  }

  /**
   * Track a slider domain event across all relevant services
   */
  async trackSliderEvent(event: SliderDomainEvent): Promise<void> {
    if (!this.initialized) return;

    try {
      // Track in parallel across all services
      await Promise.allSettled([
        this.trackers.errorTracker.trackDomainEvent(event),
        this.trackers.rumTracker.trackSliderEvent(event),
        this.trackers.analyticsTracker.trackDomainEvent(event),
        this.trackers.metricsTracker.trackDomainEvent(event),
        this.trackers.telemetryTracker.trackDomainEvent(event),
      ]);
    } catch (error) {
      this.logger.error('Failed to track slider event', { event, error });
    }
  }

  /**
   * Set user context across all services
   */
  setUserContext(user: {
    id?: string;
    email?: string;
    username?: string;
  }): void {
    if (!this.initialized) return;

    try {
      this.services.analytics.identify(user.id || '', {
        email: user.email,
        username: user.username,
      });
      this.trackers.errorTracker.setUser(user);
    } catch (error) {
      this.logger.error('Failed to set user context', { user, error });
    }
  }

  /**
   * Set slider context across all services
   */
  setSliderContext(sliderId: string, config: Record<string, unknown>): void {
    if (!this.initialized) return;

    try {
      this.services.analytics.setContext({
        slider: {
          id: sliderId,
          ...config,
        },
      });
      this.trackers.telemetryTracker.setSliderContext(sliderId, config);
    } catch (error) {
      this.logger.error('Failed to set slider context', {
        sliderId,
        config,
        error,
      });
    }
  }

  /**
   * Flush all pending data
   */
  async flush(): Promise<void> {
    if (!this.initialized) return;

    try {
      await Promise.allSettled([
        this.services.analytics.flush(),
        this.services.metrics.flush(),
        this.services.telemetry.flush(),
        this.services.errorTracking.flush(5000),
      ]);
    } catch (error) {
      this.logger.error('Failed to flush observability data', error);
    }
  }

  /**
   * Get observability health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    services: Record<string, 'healthy' | 'warning' | 'critical'>;
  } {
    if (!this.initialized) {
      return {
        overall: 'critical',
        services: {
          observability: 'critical',
        },
      };
    }

    const dashboardHealth = this.services.dashboard.getHealthStatus();

    return {
      overall: dashboardHealth.overall,
      services: {
        ...dashboardHealth.components,
        observability: 'healthy',
      },
    };
  }

  /**
   * Create default observability configuration
   */
  static createDefaultConfig(): ObservabilityConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      errorTracking: {
        environment: isDevelopment ? 'development' : 'production',
        sampleRate: isDevelopment ? 1.0 : 0.1,
        tracesSampleRate: isDevelopment ? 1.0 : 0.01,
        enableUserFeedback: !isDevelopment,
        enablePerformanceMonitoring: true,
      },
      rum: {
        enabled: true,
        sampleRate: isDevelopment ? 1.0 : 0.1,
        enablePerformanceTracking: true,
        enableUserInteractionTracking: true,
        enableErrorTracking: true,
        enableResourceTracking: true,
        sessionTimeout: 30,
      },
      analytics: {
        enabled: true,
        providers: [],
        enableDebugMode: isDevelopment,
        batchSize: 10,
        flushInterval: 5000,
        enableConsentManagement: !isDevelopment,
        defaultConsent: isDevelopment,
      },
      metrics: {
        enabled: true,
        flushInterval: 30000,
        batchSize: 100,
        enableAggregation: true,
        retentionPeriod: 7,
      },
      dashboard: {
        enabled: true,
        refreshInterval: 30000,
        retentionPeriod: 24,
        enableRealtime: true,
        enableAlerts: true,
        maxDataPoints: 1000,
      },
      telemetry: {
        enabled: true,
        sampleRate: isDevelopment ? 1.0 : 0.1,
        batchSize: 50,
        flushInterval: 30000,
        enableResourceTiming: true,
        enableUserTiming: true,
        enableNavigationTiming: true,
        enablePaintTiming: true,
        enableLongTaskTiming: true,
        enableMemoryTiming: true,
      },
    };
  }
}

/**
 * Create observability manager with default configuration
 */
export function createObservabilityManager(
  logger: ILogger,
  config?: Partial<ObservabilityConfig>
): ObservabilityManager {
  const manager = new ObservabilityManager(logger);

  // Initialize with merged config if provided
  if (config) {
    const defaultConfig = ObservabilityManager.createDefaultConfig();
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      errorTracking: {
        ...defaultConfig.errorTracking,
        ...config.errorTracking,
      },
      rum: { ...defaultConfig.rum, ...config.rum },
      analytics: { ...defaultConfig.analytics, ...config.analytics },
      metrics: { ...defaultConfig.metrics, ...config.metrics },
      dashboard: { ...defaultConfig.dashboard, ...config.dashboard },
      telemetry: { ...defaultConfig.telemetry, ...config.telemetry },
    };

    // Initialize asynchronously
    manager.initialize(mergedConfig).catch((error) => {
      logger.error('Failed to initialize observability manager', error);
    });
  }

  return manager;
}
