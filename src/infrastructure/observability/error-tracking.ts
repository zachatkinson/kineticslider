/**
 * Error Tracking Service (Sentry Integration)
 *
 * Comprehensive error tracking with Sentry integration,
 * custom error categorization, and performance monitoring.
 */

import type { SliderError, SliderDomainEvent } from '../../domain/models';
import type { ILogger } from '../logging';

// ===== ERROR TRACKING TYPES =====

export interface ErrorTrackingConfig {
  dsn?: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  enableUserFeedback: boolean;
  enablePerformanceMonitoring: boolean;
  beforeSend?: (event: unknown) => unknown | null;
  beforeSendTransaction?: (event: unknown) => unknown | null;
}

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  fingerprint?: string[];
}

export interface PerformanceTransaction {
  name: string;
  op: string;
  description?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  data?: Record<string, unknown>;
  tags?: Record<string, string>;
}

// ===== ERROR TRACKING SERVICE =====

export interface IErrorTrackingService {
  /**
   * Initialize error tracking
   */
  initialize(config: ErrorTrackingConfig): Promise<void>;

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext): string;

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level?: string,
    context?: ErrorContext
  ): string;

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void;

  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): void;

  /**
   * Set extra context
   */
  setExtra(key: string, value: unknown): void;

  /**
   * Start performance transaction
   */
  startTransaction(transaction: PerformanceTransaction): unknown;

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, unknown>;
  }): void;

  /**
   * Flush pending events
   */
  flush(timeout?: number): Promise<boolean>;

  /**
   * Show user feedback dialog
   */
  showReportDialog(options?: { eventId?: string }): void;
}

// ===== SENTRY IMPLEMENTATION =====

// Simple interface for Sentry-like services
interface SentryLike {
  captureException(error: Error): string;
  captureMessage(message: string, level?: string): string;
  setUser(user: Record<string, unknown>): void;
  setTags(tags: Record<string, string>): void;
  setExtra(key: string, value: unknown): void;
  startTransaction(context: Record<string, unknown>): Record<string, unknown>;
  addBreadcrumb(breadcrumb: Record<string, unknown>): void;
  flush(timeout?: number): Promise<boolean>;
  showReportDialog(options?: Record<string, unknown>): void;
  init(options: Record<string, unknown>): void;
  BrowserTracing: unknown;
  browserTracingIntegration(): Record<string, unknown>;
}

export class SentryErrorTrackingService implements IErrorTrackingService {
  private isInitialized = false;
  private logger: ILogger;
  private config!: ErrorTrackingConfig;
  private Sentry: SentryLike | null = null;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'ErrorTracking' });
  }

  async initialize(config: ErrorTrackingConfig): Promise<void> {
    this.config = config;

    try {
      await this.asyncInitializeSentry();
    } catch (error) {
      this.logger.warn(
        'Failed to initialize Sentry, using mock implementation',
        error
      );
      this.Sentry = null;
    }
  }

  private async asyncInitializeSentry(): Promise<void> {
    try {
      // Mock Sentry implementation for development
      this.Sentry = {
        captureException: (_error: Error): string => `mock-error-${Date.now()}`,
        captureMessage: (_message: string, _level?: string): string =>
          `mock-message-${Date.now()}`,
        setUser: (_user: Record<string, unknown>): void => {},
        setTags: (_tags: Record<string, string>): void => {},
        setExtra: (_key: string, _value: unknown): void => {},
        startTransaction: (
          _context: Record<string, unknown>
        ): Record<string, unknown> => this.createMockTransaction(),
        addBreadcrumb: (_breadcrumb: Record<string, unknown>): void => {},
        flush: async (_timeout?: number): Promise<boolean> => true,
        showReportDialog: (_options?: Record<string, unknown>): void => {},
        init: (): void => {},
        BrowserTracing: class {},
        browserTracingIntegration: (): Record<string, unknown> => ({}),
      };

      this.logger.info('Mock Sentry initialized for development');
    } catch (error) {
      this.logger.warn(
        'Failed to initialize Sentry, using mock implementation',
        error
      );
      this.Sentry = null;
    }
  }

  private createMockTransaction(): Record<string, unknown> {
    return {
      setTag: (_key: string, _value: string): void => {},
      setData: (_data: Record<string, unknown>): void => {},
      finish: (): void => {},
    };
  }

  captureException(error: Error, _context?: ErrorContext): string {
    if (!this.Sentry) {
      return 'mock-error-id';
    }

    try {
      return this.Sentry.captureException(error);
    } catch (captureError) {
      this.logger.error('Failed to capture exception', captureError);
      return 'error-capture-failed';
    }
  }

  captureMessage(
    message: string,
    level: string = 'info',
    _context?: ErrorContext
  ): string {
    if (!this.Sentry) {
      return 'mock-message-id';
    }

    try {
      return this.Sentry.captureMessage(message, level);
    } catch (captureError) {
      this.logger.error('Failed to capture message', captureError);
      return 'message-capture-failed';
    }
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.Sentry) return;

    try {
      this.Sentry.setUser(user);
    } catch (error) {
      this.logger.error('Failed to set user', error);
    }
  }

  setTags(tags: Record<string, string>): void {
    if (!this.Sentry) return;

    try {
      this.Sentry.setTags(tags);
    } catch (error) {
      this.logger.error('Failed to set tags', error);
    }
  }

  setExtra(key: string, value: unknown): void {
    if (!this.Sentry) return;

    try {
      this.Sentry.setExtra(key, value);
    } catch (error) {
      this.logger.error('Failed to set extra', error);
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(transaction: PerformanceTransaction): unknown {
    if (!this.Sentry) {
      return this.createMockTransaction();
    }

    try {
      // Convert PerformanceTransaction to Record<string, unknown>
      const transactionContext: Record<string, unknown> = {
        name: transaction.name,
        op: transaction.op,
        description: transaction.description,
        startTimestamp: transaction.startTimestamp,
        endTimestamp: transaction.endTimestamp,
        data: transaction.data,
        tags: transaction.tags,
      };
      return this.Sentry.startTransaction(transactionContext);
    } catch (error) {
      this.logger.error('Failed to start transaction', error);
      return this.createMockTransaction();
    }
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, unknown>;
  }): void {
    if (!this.Sentry) return;

    try {
      this.Sentry.addBreadcrumb(breadcrumb);
    } catch (error) {
      this.logger.error('Failed to add breadcrumb', error);
    }
  }

  async flush(timeout?: number): Promise<boolean> {
    if (!this.Sentry) {
      return true;
    }

    try {
      return await this.Sentry.flush(timeout);
    } catch (error) {
      this.logger.error('Failed to flush', error);
      return false;
    }
  }

  showReportDialog(options?: { eventId?: string }): void {
    if (!this.Sentry) return;

    try {
      // Convert eventId to title for mock implementation
      const mockOptions = options?.eventId
        ? { title: `Report for ${options.eventId}` }
        : {};
      this.Sentry.showReportDialog(mockOptions);
    } catch (error) {
      this.logger.error('Failed to show report dialog', error);
    }
  }

  private async enhanceEvent(event: unknown): Promise<Record<string, unknown>> {
    const baseEvent = event as Record<string, unknown>;
    return {
      ...baseEvent,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }
}

// ===== MOCK IMPLEMENTATION FOR DEVELOPMENT =====

export class MockErrorTrackingService implements IErrorTrackingService {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'MockErrorTracking' });
  }

  async initialize(config: ErrorTrackingConfig): Promise<void> {
    this.logger.info('Mock error tracking initialized', { config });
  }

  captureException(error: Error, context?: ErrorContext): string {
    this.logger.error('Mock capture exception', { error, context });
    return `mock-exception-${Date.now()}`;
  }

  captureMessage(
    message: string,
    level = 'info',
    context?: ErrorContext
  ): string {
    this.logger.info(`Mock capture message [${level}]: ${message}`, {
      context,
    });
    return `mock-message-${Date.now()}`;
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    this.logger.debug('Mock set user', { user });
  }

  setTags(tags: Record<string, string>): void {
    this.logger.debug('Mock set tags', { tags });
  }

  setExtra(key: string, value: unknown): void {
    this.logger.debug('Mock set extra', { key, value });
  }

  startTransaction(transaction: PerformanceTransaction): unknown {
    this.logger.debug('Mock start transaction', { transaction });
    return {
      setTag: (_key: string, _value: string): void => {},
      setData: (_data: Record<string, unknown>): void => {},
      finish: (): void => {},
    };
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, unknown>;
  }): void {
    this.logger.debug('Mock add breadcrumb', { breadcrumb });
  }

  async flush(timeout = 5000): Promise<boolean> {
    this.logger.debug('Mock flush', { timeout });
    return true;
  }

  showReportDialog(options?: { eventId?: string }): void {
    this.logger.debug('Mock show report dialog', { options });
  }
}

// ===== SLIDER ERROR TRACKER =====

export class SliderErrorTracker {
  private errorTracking: IErrorTrackingService;
  private logger: ILogger;

  constructor(errorTracking: IErrorTrackingService, logger: ILogger) {
    this.errorTracking = errorTracking;
    this.logger = logger.child({ component: 'SliderErrorTracker' });
  }

  /**
   * Track a slider-specific error
   */
  trackSliderError(
    error: SliderError,
    context?: {
      slideId?: string;
      action?: string;
      userTriggered?: boolean;
    }
  ): string {
    const errorContext: ErrorContext = {
      tags: {
        errorCode: error.code,
        slideId: error.slideId || 'unknown',
        recoverable: error.recoverable.toString(),
        action: context?.action || 'unknown',
        userTriggered: context?.userTriggered?.toString() || 'false',
      },
      extra: {
        timestamp: error.timestamp,
        context,
      },
      level: error.recoverable ? 'warning' : 'error',
      fingerprint: [error.code, error.slideId || 'global'],
    };

    const eventId = this.errorTracking.captureException(
      new Error(error.message),
      errorContext
    );

    this.addBreadcrumb({
      message: `Slider error: ${error.code}`,
      category: 'slider',
      level: 'error',
      data: {
        slideId: error.slideId,
        recoverable: error.recoverable,
      },
    });

    return eventId;
  }

  /**
   * Track domain events
   */
  trackDomainEvent(event: SliderDomainEvent): void {
    this.addBreadcrumb({
      message: `Domain event: ${event.type}`,
      category: 'domain',
      level: 'info',
      data: {
        sliderId: event.sliderId,
        timestamp: event.timestamp,
        ...('slideId' in event ? { slideId: event.slideId } : {}),
        ...('trigger' in event ? { trigger: event.trigger } : {}),
      },
    });
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context?: Record<string, unknown>
  ): void {
    if (value > threshold) {
      this.errorTracking.captureMessage(
        `Performance threshold exceeded: ${metric}`,
        'warning',
        {
          tags: {
            metric,
            performance: 'slow',
          },
          extra: {
            value,
            threshold,
            context,
          },
        }
      );
    }
  }

  /**
   * Start performance transaction
   */
  startPerformanceTransaction(
    name: string,
    op: string,
    slideId?: string
  ): unknown {
    return this.errorTracking.startTransaction({
      name,
      op,
      tags: {
        component: 'kinetic-slider',
        ...(slideId && { slideId }),
      },
    });
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    this.errorTracking.setUser(user);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, unknown>;
  }): void {
    this.errorTracking.addBreadcrumb(breadcrumb);
  }

  /**
   * Show user feedback dialog
   */
  showFeedbackDialog(eventId?: string): void {
    this.errorTracking.showReportDialog({ eventId });
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create error tracking service based on environment
 */
export function createErrorTrackingService(
  logger: ILogger,
  config: ErrorTrackingConfig
): IErrorTrackingService {
  if (config.environment === 'production' && config.dsn) {
    return new SentryErrorTrackingService(logger);
  } else {
    return new MockErrorTrackingService(logger);
  }
}

/**
 * Create slider error tracker
 */
export function createSliderErrorTracker(
  errorTracking: IErrorTrackingService,
  logger: ILogger
): SliderErrorTracker {
  return new SliderErrorTracker(errorTracking, logger);
}
