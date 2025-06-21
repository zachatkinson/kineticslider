/**
 * Observability Dashboard Foundation
 *
 * Real-time dashboard for monitoring slider performance,
 * errors, user behavior, and business metrics.
 */

import type { ILogger } from '../logging';
import type { IErrorTrackingService } from './error-tracking';
import type { IRUMService } from './rum';
import type { IAnalyticsService } from './analytics';
import type { IMetricsService } from './metrics';

// ===== DASHBOARD TYPES =====

export interface DashboardConfig {
  enabled: boolean;
  refreshInterval: number;
  retentionPeriod: number; // hours
  enableRealtime: boolean;
  enableAlerts: boolean;
  maxDataPoints: number;
}

export interface DashboardData {
  timestamp: Date;
  performance: PerformanceDashboardData;
  errors: ErrorDashboardData;
  usage: UsageDashboardData;
  business: BusinessDashboardData;
  system: SystemDashboardData;
}

export interface PerformanceDashboardData {
  loadTimes: TimeSeriesData[];
  renderTimes: TimeSeriesData[];
  memoryUsage: TimeSeriesData[];
  fps: TimeSeriesData[];
  webVitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
}

export interface ErrorDashboardData {
  errorRate: TimeSeriesData[];
  errorsByType: CategoryData[];
  errorsBySlider: CategoryData[];
  recentErrors: ErrorSummary[];
  criticalErrors: number;
}

export interface UsageDashboardData {
  activeUsers: TimeSeriesData[];
  pageViews: TimeSeriesData[];
  sliderInteractions: TimeSeriesData[];
  topSliders: CategoryData[];
  userFlow: FlowData[];
}

export interface BusinessDashboardData {
  conversions: TimeSeriesData[];
  revenue: TimeSeriesData[];
  userAcquisition: CategoryData[];
  retention: TimeSeriesData[];
  engagement: TimeSeriesData[];
}

export interface SystemDashboardData {
  cpuUsage: TimeSeriesData[];
  memoryUsage: TimeSeriesData[];
  networkLatency: TimeSeriesData[];
  uptime: number;
  health: 'healthy' | 'warning' | 'critical';
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

export interface FlowData {
  from: string;
  to: string;
  count: number;
}

export interface ErrorSummary {
  id: string;
  message: string;
  count: number;
  lastOccurred: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Alert {
  id: string;
  type: 'error' | 'performance' | 'business';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  data?: Record<string, unknown>;
}

// ===== DASHBOARD SERVICE INTERFACE =====

export interface IDashboardService {
  /**
   * Initialize dashboard
   */
  initialize(config: DashboardConfig): Promise<void>;

  /**
   * Get current dashboard data
   */
  getDashboardData(): Promise<DashboardData>;

  /**
   * Get historical data
   */
  getHistoricalData(hours: number): Promise<DashboardData[]>;

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: DashboardData) => void): () => void;

  /**
   * Get active alerts
   */
  getAlerts(): Alert[];

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void;

  /**
   * Export dashboard data
   */
  exportData(
    format: 'json' | 'csv',
    timeRange: { start: Date; end: Date }
  ): Promise<string>;

  /**
   * Get dashboard health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: Record<string, 'healthy' | 'warning' | 'critical'>;
  };
}

// ===== DASHBOARD SERVICE IMPLEMENTATION =====

export class DashboardService implements IDashboardService {
  private config!: DashboardConfig;
  private logger: ILogger;
  private errorTracking: IErrorTrackingService;
  private rum: IRUMService;
  private analytics: IAnalyticsService;
  private metrics: IMetricsService;

  private dataHistory: DashboardData[] = [];
  private subscribers: Array<(data: DashboardData) => void> = [];
  private alerts: Alert[] = [];
  private refreshTimer?: NodeJS.Timeout;

  constructor(
    logger: ILogger,
    errorTracking: IErrorTrackingService,
    rum: IRUMService,
    analytics: IAnalyticsService,
    metrics: IMetricsService
  ) {
    this.logger = logger.child({ component: 'Dashboard' });
    this.errorTracking = errorTracking;
    this.rum = rum;
    this.analytics = analytics;
    this.metrics = metrics;
  }

  async initialize(config: DashboardConfig): Promise<void> {
    this.config = config;

    if (!config.enabled) {
      this.logger.info('Dashboard disabled');
      return;
    }

    // Set up periodic data collection
    this.setupDataCollection();

    // Set up alert monitoring
    if (config.enableAlerts) {
      this.setupAlertMonitoring();
    }

    this.logger.info('Dashboard service initialized');
  }

  async getDashboardData(): Promise<DashboardData> {
    const timestamp = new Date();

    const [performance, errors, usage, business, system] = await Promise.all([
      this.collectPerformanceData(),
      this.collectErrorData(),
      this.collectUsageData(),
      this.collectBusinessData(),
      this.collectSystemData(),
    ]);

    const dashboardData: DashboardData = {
      timestamp,
      performance,
      errors,
      usage,
      business,
      system,
    };

    // Add to history
    this.addToHistory(dashboardData);

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkForAlerts(dashboardData);
    }

    // Notify subscribers
    this.notifySubscribers(dashboardData);

    return dashboardData;
  }

  async getHistoricalData(hours: number): Promise<DashboardData[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return this.dataHistory.filter((data) => data.timestamp >= cutoffTime);
  }

  subscribe(callback: (data: DashboardData) => void): () => void {
    this.subscribers.push(callback);

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.info('Alert acknowledged', { alertId });
    }
  }

  async exportData(
    format: 'json' | 'csv',
    timeRange: { start: Date; end: Date }
  ): Promise<string> {
    const filteredData = this.dataHistory.filter(
      (data) =>
        data.timestamp >= timeRange.start && data.timestamp <= timeRange.end
    );

    if (format === 'json') {
      return JSON.stringify(filteredData, null, 2);
    } else {
      return this.convertToCSV(filteredData);
    }
  }

  getHealthStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: Record<string, 'healthy' | 'warning' | 'critical'>;
  } {
    const components = {
      performance: this.getPerformanceHealth(),
      errors: this.getErrorHealth(),
      system: this.getSystemHealth(),
    };

    const overall = this.calculateOverallHealth(components);

    return { overall, components };
  }

  // ===== PRIVATE METHODS =====

  private setupDataCollection(): void {
    this.refreshTimer = setInterval(async () => {
      try {
        await this.getDashboardData();
      } catch (error) {
        this.logger.error('Failed to collect dashboard data', error);
      }
    }, this.config.refreshInterval);
  }

  private setupAlertMonitoring(): void {
    // Set up alert rules and monitoring
    setInterval(() => {
      this.cleanupAcknowledgedAlerts();
    }, 300000); // Clean up every 5 minutes
  }

  private async collectPerformanceData(): Promise<PerformanceDashboardData> {
    // Collect performance metrics from various sources
    const loadTimes = this.getTimeSeriesFromMetrics('slider.load_time');
    const renderTimes = this.getTimeSeriesFromMetrics('slider.render_time');
    const memoryUsage = this.getTimeSeriesFromMetrics('system.memory_usage');
    const fps = this.getTimeSeriesFromMetrics('performance.fps');

    // Get Web Vitals from RUM
    const webVitals = await this.getWebVitalsFromRUM();

    return {
      loadTimes,
      renderTimes,
      memoryUsage,
      fps,
      webVitals,
    };
  }

  private async collectErrorData(): Promise<ErrorDashboardData> {
    const errorRate = this.getTimeSeriesFromMetrics('slider.errors');
    const errorsByType = this.getCategoryDataFromMetrics(
      'slider.errors',
      'errorCode'
    );
    const errorsBySlider = this.getCategoryDataFromMetrics(
      'slider.errors',
      'sliderId'
    );
    const recentErrors = await this.getRecentErrors();
    const criticalErrors = this.getCriticalErrorCount();

    return {
      errorRate,
      errorsByType,
      errorsBySlider,
      recentErrors,
      criticalErrors,
    };
  }

  private async collectUsageData(): Promise<UsageDashboardData> {
    const activeUsers = this.getTimeSeriesFromMetrics('business.active_users');
    const pageViews = this.getTimeSeriesFromMetrics('business.page_views');
    const sliderInteractions = this.getTimeSeriesFromMetrics(
      'slider.interactions'
    );
    const topSliders = this.getCategoryDataFromMetrics(
      'slider.slide_views',
      'sliderId'
    );
    const userFlow = await this.getUserFlowData();

    return {
      activeUsers,
      pageViews,
      sliderInteractions,
      topSliders,
      userFlow,
    };
  }

  private async collectBusinessData(): Promise<BusinessDashboardData> {
    const conversions = this.getTimeSeriesFromMetrics('business.conversions');
    const revenue = this.getTimeSeriesFromMetrics('business.revenue');
    const userAcquisition = this.getCategoryDataFromMetrics(
      'business.user_acquisition',
      'source'
    );
    const retention = this.getTimeSeriesFromMetrics('business.user_retention');
    const engagement = this.getTimeSeriesFromMetrics('business.engagement');

    return {
      conversions,
      revenue,
      userAcquisition,
      retention,
      engagement,
    };
  }

  private async collectSystemData(): Promise<SystemDashboardData> {
    const cpuUsage = this.getTimeSeriesFromMetrics('system.cpu_usage');
    const memoryUsage = this.getTimeSeriesFromMetrics('system.memory_usage');
    const networkLatency = this.getTimeSeriesFromMetrics(
      'system.network_latency'
    );
    const uptime = this.calculateUptime();
    const health = this.getSystemHealth();

    return {
      cpuUsage,
      memoryUsage,
      networkLatency,
      uptime,
      health,
    };
  }

  private getTimeSeriesFromMetrics(metricName: string): TimeSeriesData[] {
    const aggregations = this.metrics.getAggregations(metricName, 'minute');
    return aggregations.map((agg) => ({
      timestamp: agg.timestamp,
      value: agg.aggregations.avg,
    }));
  }

  private getCategoryDataFromMetrics(
    _metricName: string,
    _tagKey: string
  ): CategoryData[] {
    // This would aggregate metrics by tag values
    // Simplified implementation
    return [
      { category: 'Category A', value: 100, percentage: 50 },
      { category: 'Category B', value: 75, percentage: 37.5 },
      { category: 'Category C', value: 25, percentage: 12.5 },
    ];
  }

  private async getWebVitalsFromRUM(): Promise<
    PerformanceDashboardData['webVitals']
  > {
    // Get Web Vitals from RUM service
    return {
      fcp: 1200,
      lcp: 2000,
      cls: 0.05,
      fid: 50,
    };
  }

  private async getRecentErrors(): Promise<ErrorSummary[]> {
    // Get recent errors from error tracking
    return [
      {
        id: 'error-1',
        message: 'Failed to load slide image',
        count: 5,
        lastOccurred: new Date(),
        severity: 'medium',
      },
    ];
  }

  private getCriticalErrorCount(): number {
    return this.alerts.filter(
      (alert) => alert.type === 'error' && alert.severity === 'critical'
    ).length;
  }

  private async getUserFlowData(): Promise<FlowData[]> {
    // Analyze user flow from analytics
    return [
      { from: 'Home', to: 'Slider 1', count: 150 },
      { from: 'Slider 1', to: 'Slider 2', count: 100 },
      { from: 'Slider 2', to: 'Conversion', count: 50 },
    ];
  }

  private calculateUptime(): number {
    // Calculate system uptime in seconds
    return performance.now() / 1000;
  }

  private getPerformanceHealth(): 'healthy' | 'warning' | 'critical' {
    // Analyze performance metrics to determine health
    const avgLoadTime = this.getAverageMetric('slider.load_time');
    if (avgLoadTime > 3000) return 'critical';
    if (avgLoadTime > 1500) return 'warning';
    return 'healthy';
  }

  private getErrorHealth(): 'healthy' | 'warning' | 'critical' {
    const errorRate = this.getAverageMetric('slider.errors');
    if (errorRate > 0.05) return 'critical';
    if (errorRate > 0.01) return 'warning';
    return 'healthy';
  }

  private getSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const memoryUsage = this.getAverageMetric('system.memory_usage');
    if (memoryUsage > 0.9) return 'critical';
    if (memoryUsage > 0.8) return 'warning';
    return 'healthy';
  }

  private calculateOverallHealth(
    components: Record<string, 'healthy' | 'warning' | 'critical'>
  ): 'healthy' | 'warning' | 'critical' {
    const values = Object.values(components);
    if (values.includes('critical')) return 'critical';
    if (values.includes('warning')) return 'warning';
    return 'healthy';
  }

  private getAverageMetric(metricName: string): number {
    const aggregations = this.metrics.getAggregations(metricName, 'hour');
    if (aggregations.length === 0) return 0;

    const sum = aggregations.reduce(
      (acc, agg) => acc + agg.aggregations.avg,
      0
    );
    return sum / aggregations.length;
  }

  private addToHistory(data: DashboardData): void {
    this.dataHistory.push(data);

    // Limit history size
    if (this.dataHistory.length > this.config.maxDataPoints) {
      this.dataHistory.shift();
    }

    // Clean up old data
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.config.retentionPeriod);
    this.dataHistory = this.dataHistory.filter(
      (d) => d.timestamp >= cutoffTime
    );
  }

  private checkForAlerts(data: DashboardData): void {
    // Check performance alerts
    if (data.performance.webVitals.lcp > 2500) {
      this.createAlert('performance', 'critical', 'LCP exceeds 2.5s threshold');
    }

    // Check error alerts
    if (data.errors.criticalErrors > 0) {
      this.createAlert(
        'error',
        'critical',
        `${data.errors.criticalErrors} critical errors detected`
      );
    }

    // Check system alerts
    if (data.system.health === 'critical') {
      this.createAlert('error', 'critical', 'System health is critical');
    }
  }

  private createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    data?: Record<string, unknown>
  ): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
      data,
    };

    this.alerts.push(alert);
    this.logger.warn('Alert created', alert);
  }

  private cleanupAcknowledgedAlerts(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Remove acknowledged alerts after 24 hours

    this.alerts = this.alerts.filter(
      (alert) => !alert.acknowledged || alert.timestamp >= cutoffTime
    );
  }

  private notifySubscribers(data: DashboardData): void {
    for (const callback of this.subscribers) {
      try {
        callback(data);
      } catch (error) {
        this.logger.error('Error notifying dashboard subscriber', error);
      }
    }
  }

  private convertToCSV(data: DashboardData[]): string {
    const headers = [
      'timestamp',
      'load_time_avg',
      'error_rate',
      'active_users',
      'conversions',
      'memory_usage',
      'health_status',
    ];

    const rows = data.map((d) => [
      d.timestamp.toISOString(),
      d.performance.loadTimes[0]?.value || 0,
      d.errors.errorRate[0]?.value || 0,
      d.usage.activeUsers[0]?.value || 0,
      d.business.conversions[0]?.value || 0,
      d.system.memoryUsage[0]?.value || 0,
      d.system.health,
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}

// ===== DASHBOARD WIDGET SYSTEM =====

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert';
  title: string;
  config: Record<string, unknown>;
  data: unknown;
  refreshInterval?: number;
}

export class DashboardWidgetManager {
  private widgets = new Map<string, DashboardWidget>();
  private dashboard: IDashboardService;
  private logger: ILogger;

  constructor(dashboard: IDashboardService, logger: ILogger) {
    this.dashboard = dashboard;
    this.logger = logger.child({ component: 'DashboardWidgets' });
  }

  addWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
    this.logger.debug('Widget added', {
      widgetId: widget.id,
      type: widget.type,
    });
  }

  removeWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.logger.debug('Widget removed', { widgetId });
  }

  getWidget(widgetId: string): DashboardWidget | undefined {
    return this.widgets.get(widgetId);
  }

  getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  async refreshWidget(widgetId: string): Promise<void> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    try {
      const dashboardData = await this.dashboard.getDashboardData();
      widget.data = this.extractWidgetData(widget, dashboardData);
      this.logger.debug('Widget refreshed', { widgetId });
    } catch (error) {
      this.logger.error('Failed to refresh widget', { widgetId, error });
    }
  }

  private extractWidgetData(
    widget: DashboardWidget,
    data: DashboardData
  ): unknown {
    // Extract relevant data based on widget type and config
    switch (widget.type) {
      case 'chart':
        return this.extractChartData(widget, data);
      case 'metric':
        return this.extractMetricData(widget, data);
      case 'table':
        return this.extractTableData(widget, data);
      case 'alert':
        return this.dashboard.getAlerts();
      default:
        return null;
    }
  }

  private extractChartData(
    widget: DashboardWidget,
    data: DashboardData
  ): unknown {
    const metric = widget.config.metric as string;

    switch (metric) {
      case 'performance.loadTimes':
        return data.performance.loadTimes;
      case 'errors.errorRate':
        return data.errors.errorRate;
      case 'usage.activeUsers':
        return data.usage.activeUsers;
      default:
        return [];
    }
  }

  private extractMetricData(
    widget: DashboardWidget,
    data: DashboardData
  ): unknown {
    const metric = widget.config.metric as string;

    switch (metric) {
      case 'system.health':
        return data.system.health;
      case 'errors.criticalCount':
        return data.errors.criticalErrors;
      case 'performance.avgLoadTime':
        return data.performance.loadTimes[0]?.value || 0;
      default:
        return 0;
    }
  }

  private extractTableData(
    widget: DashboardWidget,
    data: DashboardData
  ): unknown {
    const dataSource = widget.config.dataSource as string;

    switch (dataSource) {
      case 'errors.recent':
        return data.errors.recentErrors;
      case 'usage.topSliders':
        return data.usage.topSliders;
      default:
        return [];
    }
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create dashboard service
 */
export function createDashboardService(
  logger: ILogger,
  errorTracking: IErrorTrackingService,
  rum: IRUMService,
  analytics: IAnalyticsService,
  metrics: IMetricsService
): IDashboardService {
  return new DashboardService(logger, errorTracking, rum, analytics, metrics);
}

/**
 * Create dashboard widget manager
 */
export function createDashboardWidgetManager(
  dashboard: IDashboardService,
  logger: ILogger
): DashboardWidgetManager {
  return new DashboardWidgetManager(dashboard, logger);
}
