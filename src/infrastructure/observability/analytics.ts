/**
 * Analytics Event Framework
 *
 * Comprehensive analytics system for tracking user behavior,
 * business metrics, and conversion events.
 */

import { createLogger, LogLevel, type ILogger } from '../logging.js';
import type { SliderDomainEvent } from '../../domain/models';

// Create a logger for analytics
const analyticsLogger = createLogger(
  { component: 'Analytics' },
  { level: LogLevel.Info }
);

// ===== ANALYTICS TYPES =====

export interface AnalyticsConfig {
  enabled: boolean;
  providers: AnalyticsProvider[];
  enableDebugMode: boolean;
  batchSize: number;
  flushInterval: number;
  enableConsentManagement: boolean;
  defaultConsent: boolean;
}

export interface AnalyticsProvider {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  initialize: (config: Record<string, unknown>) => Promise<void>;
  track: (event: AnalyticsEvent) => Promise<void>;
  identify: (userId: string, traits?: Record<string, unknown>) => Promise<void>;
  page: (name: string, properties?: Record<string, unknown>) => Promise<void>;
  flush: () => Promise<void>;
}

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  page?: {
    url: string;
    title: string;
    referrer?: string;
  };
  user?: {
    id?: string;
    anonymousId?: string;
    traits?: Record<string, unknown>;
  };
  device?: {
    type: string;
    model?: string;
    vendor?: string;
  };
  browser?: {
    name: string;
    version: string;
  };
  campaign?: {
    name?: string;
    source?: string;
    medium?: string;
    content?: string;
  };
  slider?: {
    id: string;
    version?: string;
    slideCount?: number;
  };
}

export interface ConsentManager {
  hasConsent(category: string): boolean;
  setConsent(category: string, granted: boolean): void;
  onConsentChange(
    callback: (consents: Record<string, boolean>) => void
  ): () => void;
}

// ===== ANALYTICS SERVICE INTERFACE =====

export interface IAnalyticsService {
  /**
   * Initialize analytics
   */
  initialize(config: AnalyticsConfig): Promise<void>;

  /**
   * Track an event
   */
  track(name: string, properties?: Record<string, unknown>): Promise<void>;

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, unknown>): Promise<void>;

  /**
   * Track page view
   */
  page(name: string, properties?: Record<string, unknown>): Promise<void>;

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, unknown>): void;

  /**
   * Set context properties
   */
  setContext(context: Partial<AnalyticsContext>): void;

  /**
   * Flush pending events
   */
  flush(): Promise<void>;

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void;

  /**
   * Get current context
   */
  getContext(): AnalyticsContext;
}

// ===== ANALYTICS SERVICE IMPLEMENTATION =====

export class AnalyticsService implements IAnalyticsService {
  private config!: AnalyticsConfig;
  private logger: ILogger;
  private providers: Map<string, AnalyticsProvider> = new Map();
  private context: AnalyticsContext = {};
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private enabled = true;
  private consentManager?: ConsentManager;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'Analytics' });
  }

  async initialize(config: AnalyticsConfig): Promise<void> {
    this.config = config;
    this.enabled = config.enabled;

    if (!config.enabled) {
      this.logger.info('Analytics tracking disabled');
      return;
    }

    // Initialize consent management
    if (config.enableConsentManagement) {
      this.setupConsentManagement();
    }

    // Initialize providers
    for (const provider of config.providers) {
      if (provider.enabled) {
        try {
          await provider.initialize(provider.config);
          this.providers.set(provider.name, provider);
          this.logger.info(`Analytics provider initialized: ${provider.name}`);
        } catch (error) {
          this.logger.error(
            `Failed to initialize provider: ${provider.name}`,
            error
          );
        }
      }
    }

    // Set up default context
    this.setupDefaultContext();

    // Set up periodic flushing
    this.setupPeriodicFlush();

    this.logger.info('Analytics service initialized');
  }

  async track(
    name: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.enabled || !this.hasConsentForTracking()) {
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      context: { ...this.context },
    };

    // Add to queue
    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flush();
    }

    this.logger.debug('Event tracked', { name, properties });
  }

  async identify(
    userId: string,
    traits: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.enabled || !this.hasConsentForTracking()) {
      return;
    }

    // Update context
    this.context.user = {
      ...this.context.user,
      id: userId,
      traits: { ...this.context.user?.traits, ...traits },
    };

    // Send to providers
    const promises = Array.from(this.providers.values()).map((provider) =>
      provider
        .identify(userId, traits)
        .catch((error) =>
          this.logger.error(`Provider ${provider.name} identify failed`, error)
        )
    );

    await Promise.allSettled(promises);
    this.logger.debug('User identified', { userId, traits });
  }

  async page(
    name: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.enabled || !this.hasConsentForTracking()) {
      return;
    }

    // Update page context
    this.context.page = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      ...properties,
    };

    // Send to providers
    const promises = Array.from(this.providers.values()).map((provider) =>
      provider
        .page(name, { ...properties, ...this.context.page })
        .catch((error) =>
          this.logger.error(`Provider ${provider.name} page failed`, error)
        )
    );

    await Promise.allSettled(promises);
    this.logger.debug('Page tracked', { name, properties });
  }

  setUserProperties(properties: Record<string, unknown>): void {
    this.context.user = {
      ...this.context.user,
      traits: { ...this.context.user?.traits, ...properties },
    };
  }

  setContext(context: Partial<AnalyticsContext>): void {
    this.context = { ...this.context, ...context };
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Send events to all providers
    const promises = Array.from(this.providers.values()).map(
      async (provider) => {
        try {
          for (const event of events) {
            await provider.track(event);
          }
          await provider.flush();
        } catch (error) {
          this.logger.error(`Provider ${provider.name} flush failed`, error);
          // Re-queue failed events (with limit)
          if (this.eventQueue.length < 1000) {
            this.eventQueue.unshift(...events.slice(0, 100));
          }
        }
      }
    );

    await Promise.allSettled(promises);
    this.logger.debug('Events flushed', { count: events.length });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.info(`Analytics tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  getContext(): AnalyticsContext {
    return { ...this.context };
  }

  // ===== PRIVATE METHODS =====

  private setupConsentManagement(): void {
    // This would integrate with a consent management platform
    this.consentManager = {
      hasConsent: (category: string): boolean => {
        // Check localStorage or cookie for consent
        const consent = localStorage.getItem(`consent_${category}`);
        return consent === 'true' || this.config.defaultConsent;
      },
      setConsent: (category: string, granted: boolean): void => {
        localStorage.setItem(`consent_${category}`, granted.toString());
      },
      onConsentChange: (
        callback: (consents: Record<string, boolean>) => void
      ): (() => void) => {
        // Set up listener for consent changes
        const handler = (event: StorageEvent): void => {
          if (event.key?.startsWith('consent_')) {
            const consents = new Map<string, boolean>();
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('consent_')) {
                const category = key.replace('consent_', '');
                const consentValue = localStorage.getItem(key);
                if (consentValue !== null) {
                  consents.set(category, consentValue === 'true');
                }
              }
            }
            // Convert Map to Record for callback
            const consentRecord: Record<string, boolean> =
              Object.fromEntries(consents);
            callback(consentRecord);
          }
        };

        window.addEventListener('storage', handler);
        return (): void => window.removeEventListener('storage', handler);
      },
    };
  }

  private setupDefaultContext(): void {
    this.context = {
      page: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
      user: {
        anonymousId: this.getAnonymousId(),
      },
      device: {
        type: this.getDeviceType(),
      },
      browser: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
      },
      campaign: this.getCampaignData(),
    };
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval((): void => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', (): void => {
      this.flush();
    });
  }

  private hasConsentForTracking(): boolean {
    if (!this.consentManager) return true;
    return this.consentManager.hasConsent('analytics');
  }

  private getAnonymousId(): string {
    let anonymousId = localStorage.getItem('analytics_anonymous_id');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
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

  private getCampaignData(): AnalyticsContext['campaign'] {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      name: urlParams.get('utm_campaign') || undefined,
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      content: urlParams.get('utm_content') || undefined,
    };
  }
}

// ===== SLIDER ANALYTICS TRACKER =====

export class SliderAnalyticsTracker {
  private analytics: IAnalyticsService;
  private logger: ILogger;

  constructor(analytics: IAnalyticsService, logger: ILogger) {
    this.analytics = analytics;
    this.logger = logger.child({ component: 'SliderAnalytics' });
  }

  /**
   * Track slider initialization
   */
  async trackSliderInit(
    sliderId: string,
    config: {
      slideCount: number;
      autoplay: boolean;
      responsive: boolean;
    }
  ): Promise<void> {
    await this.analytics.track('slider_initialized', {
      sliderId,
      slideCount: config.slideCount,
      autoplay: config.autoplay,
      responsive: config.responsive,
    });
  }

  /**
   * Track slide view
   */
  async trackSlideView(
    sliderId: string,
    slideId: string,
    slideIndex: number
  ): Promise<void> {
    await this.analytics.track('slide_viewed', {
      sliderId,
      slideId,
      slideIndex,
    });
  }

  /**
   * Track slide navigation
   */
  async trackSlideNavigation(
    sliderId: string,
    fromIndex: number,
    toIndex: number,
    trigger: 'user' | 'autoplay' | 'programmatic'
  ): Promise<void> {
    await this.analytics.track('slide_navigation', {
      sliderId,
      fromIndex,
      toIndex,
      direction: toIndex > fromIndex ? 'forward' : 'backward',
      trigger,
    });
  }

  /**
   * Track user interaction
   */
  async trackUserInteraction(
    sliderId: string,
    action: string,
    element?: string
  ): Promise<void> {
    await this.analytics.track('slider_interaction', {
      sliderId,
      action,
      element,
    });
  }

  /**
   * Track autoplay events
   */
  async trackAutoplayEvent(
    sliderId: string,
    action: 'started' | 'stopped' | 'paused' | 'resumed'
  ): Promise<void> {
    await this.analytics.track('slider_autoplay', {
      sliderId,
      action,
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    sliderId: string,
    metric: string,
    value: number,
    unit: string
  ): Promise<void> {
    await this.analytics.track('slider_performance', {
      sliderId,
      metric,
      value,
      unit,
    });
  }

  /**
   * Track error events
   */
  async trackError(
    sliderId: string,
    errorCode: string,
    errorMessage: string,
    slideId?: string
  ): Promise<void> {
    await this.analytics.track('slider_error', {
      sliderId,
      errorCode,
      errorMessage,
      slideId,
    });
  }

  /**
   * Track domain events
   */
  async trackDomainEvent(event: SliderDomainEvent): Promise<void> {
    const eventName = `slider_${event.type.replace('-', '_')}`;

    await this.analytics.track(eventName, {
      sliderId: event.sliderId,
      timestamp: event.timestamp,
      ...('slideId' in event ? { slideId: event.slideId } : {}),
      ...('trigger' in event ? { trigger: event.trigger } : {}),
      ...('previousIndex' in event
        ? { previousIndex: event.previousIndex }
        : {}),
      ...('currentIndex' in event ? { currentIndex: event.currentIndex } : {}),
      ...('loadTime' in event ? { loadTime: event.loadTime } : {}),
    });
  }

  /**
   * Set slider context
   */
  setSliderContext(sliderId: string, config: Record<string, unknown>): void {
    this.analytics.setContext({
      slider: {
        id: sliderId,
        ...config,
      },
    });
  }
}

// ===== BUILT-IN PROVIDERS =====

/**
 * Console analytics provider for debugging
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = 'console';
  enabled = true;
  config: Record<string, unknown> = {};

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config;
    analyticsLogger.info('Console Analytics Provider initialized');
  }

  async track(event: AnalyticsEvent): Promise<void> {
    analyticsLogger.info('Track', {
      event: event.name,
      properties: event.properties,
    });
  }

  async identify(
    userId: string,
    traits?: Record<string, unknown>
  ): Promise<void> {
    analyticsLogger.info('Identify', { userId, traits });
  }

  async page(
    name: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    analyticsLogger.info('Page', { name, properties });
  }

  async flush(): Promise<void> {
    analyticsLogger.info('Flush: Console provider');
  }
}

/**
 * Google Analytics 4 provider
 */
export class GA4AnalyticsProvider implements AnalyticsProvider {
  name = 'ga4';
  enabled = true;
  config: Record<string, unknown> = {};
  private gtag?: (...args: unknown[]) => void;

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config;
    const measurementId = config.measurementId as string;

    if (!measurementId) {
      throw new Error('GA4 measurementId is required');
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as unknown as { dataLayer: unknown[] }).dataLayer =
      (window as unknown as { dataLayer: unknown[] }).dataLayer || [];
    this.gtag = function (...args: unknown[]): void {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(args);
    };

    this.gtag('js', new Date());
    this.gtag('config', measurementId);
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.gtag) return;

    this.gtag('event', event.name, {
      ...event.properties,
      custom_parameter_slider_id: event.context.slider?.id,
    });
  }

  async identify(
    userId: string,
    traits?: Record<string, unknown>
  ): Promise<void> {
    if (!this.gtag) return;

    this.gtag('config', this.config.measurementId, {
      user_id: userId,
      custom_map: traits,
    });
  }

  async page(
    name: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    if (!this.gtag) return;

    this.gtag('config', this.config.measurementId, {
      page_title: name,
      page_location: properties?.url,
    });
  }

  async flush(): Promise<void> {
    // GA4 handles flushing automatically
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create analytics service with default providers
 */
export function createAnalyticsService(logger: ILogger): IAnalyticsService {
  return new AnalyticsService(logger);
}

/**
 * Create slider analytics tracker
 */
export function createSliderAnalyticsTracker(
  analytics: IAnalyticsService,
  logger: ILogger
): SliderAnalyticsTracker {
  return new SliderAnalyticsTracker(analytics, logger);
}

/**
 * Create default analytics providers
 */
export function createDefaultAnalyticsProviders(): AnalyticsProvider[] {
  return [new ConsoleAnalyticsProvider()];
}
