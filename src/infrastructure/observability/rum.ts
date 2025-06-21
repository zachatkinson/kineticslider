/**
 * Real User Monitoring (RUM) Service
 *
 * Tracks real user interactions, performance metrics,
 * and behavioral analytics in production environments.
 */

import type { ILogger } from '../logging';
import type { SliderDomainEvent } from '../../domain/models';

// ===== RUM TYPES =====

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export interface RUMConfig {
  enabled: boolean;
  sampleRate: number;
  endpoint?: string;
  apiKey?: string;
  enablePerformanceTracking: boolean;
  enableUserInteractionTracking: boolean;
  enableErrorTracking: boolean;
  enableResourceTracking: boolean;
  sessionTimeout: number; // minutes
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  interactions: number;
  errors: number;
  device: DeviceInfo;
  browser: BrowserInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  os: string;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  memory?: number; // GB
  cores?: number;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  language: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'keyboard' | 'touch' | 'resize';
  element?: string;
  timestamp: Date;
  duration?: number;
  context?: Record<string, unknown>;
}

export interface PageView {
  url: string;
  title: string;
  timestamp: Date;
  loadTime: number;
  timeToInteractive?: number;
  largestContentfulPaint?: number;
  firstContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface ResourceTiming {
  name: string;
  type: string;
  startTime: number;
  duration: number;
  size?: number;
  status?: number;
  timestamp: Date;
}

// ===== RUM SERVICE INTERFACE =====

export interface IRUMService {
  /**
   * Initialize RUM tracking
   */
  initialize(config: RUMConfig): Promise<void>;

  /**
   * Start a new user session
   */
  startSession(userId?: string): UserSession;

  /**
   * End current session
   */
  endSession(): void;

  /**
   * Track page view
   */
  trackPageView(url: string, title: string): void;

  /**
   * Track user interaction
   */
  trackInteraction(interaction: UserInteraction): void;

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void;

  /**
   * Track error
   */
  trackError(error: ErrorEvent): void;

  /**
   * Track resource loading
   */
  trackResource(resource: ResourceTiming): void;

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null;

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, unknown>): void;

  /**
   * Flush pending data
   */
  flush(): Promise<void>;
}

// ===== RUM SERVICE IMPLEMENTATION =====

export class RUMService implements IRUMService {
  private config!: RUMConfig;
  private logger: ILogger;
  private currentSession: UserSession | null = null;
  private buffer: Array<{
    type: string;
    data: unknown;
    timestamp: Date;
  }> = [];
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  constructor(logger: ILogger) {
    this.logger = logger.child({ component: 'RUM' });
  }

  async initialize(config: RUMConfig): Promise<void> {
    this.config = config;

    if (!config.enabled) {
      this.logger.info('RUM tracking disabled');
      return;
    }

    // Start session
    this.startSession();

    // Set up automatic tracking
    this.setupPerformanceTracking();
    this.setupInteractionTracking();
    this.setupErrorTracking();
    this.setupResourceTracking();
    this.setupPageVisibilityTracking();

    // Set up periodic flushing
    this.setupPeriodicFlush();

    this.logger.info('RUM tracking initialized', { config });
  }

  startSession(userId?: string): UserSession {
    const session: UserSession = {
      id: this.generateSessionId(),
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      device: this.getDeviceInfo(),
      browser: this.getBrowserInfo(),
    };

    this.currentSession = session;
    this.addToBuffer('session_start', session);

    this.logger.debug('Started RUM session', { sessionId: session.id });
    return session;
  }

  endSession(): void {
    if (!this.currentSession) return;

    const sessionEnd = {
      sessionId: this.currentSession.id,
      endTime: new Date(),
      duration: Date.now() - this.currentSession.startTime.getTime(),
      pageViews: this.currentSession.pageViews,
      interactions: this.currentSession.interactions,
      errors: this.currentSession.errors,
    };

    this.addToBuffer('session_end', sessionEnd);
    this.flush();

    this.logger.debug('Ended RUM session', sessionEnd);
    this.currentSession = null;
  }

  trackPageView(url: string, title: string): void {
    if (!this.config.enabled || !this.currentSession) return;

    const pageView: PageView = {
      url,
      title,
      timestamp: new Date(),
      loadTime: performance.now(),
    };

    // Add Web Vitals if available
    this.addWebVitals(pageView);

    this.currentSession.pageViews++;
    this.currentSession.lastActivity = new Date();

    this.addToBuffer('page_view', pageView);
    this.logger.debug('Tracked page view', { url, title });
  }

  trackInteraction(interaction: UserInteraction): void {
    if (!this.config.enableUserInteractionTracking || !this.currentSession)
      return;

    this.currentSession.interactions++;
    this.currentSession.lastActivity = new Date();

    this.addToBuffer('interaction', interaction);
    this.logger.debug('Tracked interaction', { type: interaction.type });
  }

  trackPerformance(metric: PerformanceMetric): void {
    if (!this.config.enablePerformanceTracking) return;

    this.addToBuffer('performance', metric);
    this.logger.debug('Tracked performance metric', {
      name: metric.name,
      value: metric.value,
    });
  }

  trackError(error: ErrorEvent): void {
    if (!this.config.enableErrorTracking || !this.currentSession) return;

    this.currentSession.errors++;
    this.addToBuffer('error', error);
    this.logger.debug('Tracked error', { message: error.message });
  }

  trackResource(resource: ResourceTiming): void {
    if (!this.config.enableResourceTracking) return;

    this.addToBuffer('resource', resource);
    this.logger.debug('Tracked resource', {
      name: resource.name,
      duration: resource.duration,
    });
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (!this.currentSession) return;

    this.addToBuffer('user_properties', {
      sessionId: this.currentSession.id,
      properties,
    });
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const data = [...this.buffer];
    this.buffer = [];

    if (this.config.endpoint && this.config.apiKey) {
      try {
        await this.sendToEndpoint(data);
      } catch (error) {
        this.logger.error('Failed to send RUM data', error);
        // Re-add failed data to buffer (with limit)
        if (this.buffer.length < 1000) {
          this.buffer.unshift(...data);
        }
      }
    }
  }

  // ===== PRIVATE METHODS =====

  private setupPerformanceTracking(): void {
    if (!this.config.enablePerformanceTracking) return;

    // Track Web Vitals
    this.trackWebVitals();

    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.trackPerformance({
                name: 'long_task',
                value: entry.duration,
                unit: 'ms',
                timestamp: new Date(),
                context: {
                  startTime: entry.startTime,
                },
              });
            }
          }
        });

        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        this.logger.debug('Long task observation not supported');
      }
    }
  }

  private setupInteractionTracking(): void {
    if (!this.config.enableUserInteractionTracking) return;

    // Click tracking
    document.addEventListener('click', (event) => {
      this.trackInteraction({
        type: 'click',
        element: this.getElementSelector(event.target as Element),
        timestamp: new Date(),
        context: {
          x: event.clientX,
          y: event.clientY,
        },
      });
    });

    // Scroll tracking (throttled)
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction({
          type: 'scroll',
          timestamp: new Date(),
          context: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
          },
        });
      }, 100);
    });

    // Keyboard tracking
    document.addEventListener('keydown', (event) => {
      this.trackInteraction({
        type: 'keyboard',
        timestamp: new Date(),
        context: {
          key: event.key,
          code: event.code,
        },
      });
    });

    // Touch tracking (mobile)
    document.addEventListener('touchstart', (event) => {
      this.trackInteraction({
        type: 'touch',
        timestamp: new Date(),
        context: {
          touches: event.touches.length,
        },
      });
    });

    // Resize tracking
    window.addEventListener('resize', () => {
      this.trackInteraction({
        type: 'resize',
        timestamp: new Date(),
        context: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });
    });
  }

  private setupErrorTracking(): void {
    if (!this.config.enableErrorTracking) return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date(),
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled promise rejection: ${event.reason}`,
        timestamp: new Date(),
        context: {
          reason: event.reason,
        },
      });
    });
  }

  private setupResourceTracking(): void {
    if (!this.config.enableResourceTracking) return;

    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource = entry as PerformanceResourceTiming;
            this.trackResource({
              name: resource.name,
              type: this.getResourceType(resource.name),
              startTime: resource.startTime,
              duration: resource.duration,
              size: resource.transferSize,
              timestamp: new Date(),
            });
          }
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch {
        this.logger.debug('Resource timing observation not supported');
      }
    }
  }

  private setupPageVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush(); // Flush data when page becomes hidden
      }
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private trackWebVitals(): void {
    // This would integrate with web-vitals library
    // For now, we'll track basic performance metrics

    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackPerformance({
              name: entry.name.replace('-', '_'),
              value: entry.startTime,
              unit: 'ms',
              timestamp: new Date(),
            });
          }
        });

        paintObserver.observe({ entryTypes: ['paint'] });
      } catch {
        this.logger.debug('Paint timing observation not supported');
      }
    }
  }

  private addWebVitals(pageView: PageView): void {
    // Add navigation timing if available
    if (performance.timing) {
      const timing = performance.timing;
      pageView.loadTime = timing.loadEventEnd - timing.navigationStart;
      pageView.timeToInteractive =
        timing.domInteractive - timing.navigationStart;
    }
  }

  private getDeviceInfo(): DeviceInfo {
    const screen = window.screen;

    return {
      type: this.getDeviceType(),
      os: this.getOS(),
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1,
      },
      memory: (navigator as NavigatorWithMemory).deviceMemory,
      cores: navigator.hardwareConcurrency,
    };
  }

  private getBrowserInfo(): BrowserInfo {
    return {
      name: this.getBrowserName(),
      version: this.getBrowserVersion(),
      engine: this.getBrowserEngine(),
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    };
  }

  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
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
    // Simplified version detection
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

  private getElementSelector(element: Element): string {
    if (!element) return '';

    const id = element.id;
    if (id) return `#${id}`;

    const className = element.className;
    if (className) return `.${className.split(' ')[0]}`;

    return element.tagName.toLowerCase();
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }

  private generateSessionId(): string {
    return `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToBuffer(type: string, data: unknown): void {
    this.buffer.push({
      type,
      data,
      timestamp: new Date(),
    });

    // Prevent buffer overflow
    if (this.buffer.length > 1000) {
      this.buffer.shift();
    }
  }

  private async sendToEndpoint(
    data: Array<{ type: string; data: unknown; timestamp: Date }>
  ): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        events: data,
        sessionId: this.currentSession?.id,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`RUM endpoint returned ${response.status}`);
    }
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create RUM service
 */
export function createRUMService(logger: ILogger): IRUMService {
  return new RUMService(logger);
}

/**
 * Create slider RUM service
 */
export function createSliderRUMService(
  rum: IRUMService,
  _logger: ILogger
): { rum: IRUMService; trackSliderEvent: (event: SliderDomainEvent) => void } {
  const trackSliderEvent = (event: SliderDomainEvent): void => {
    rum.trackInteraction({
      type: 'click', // Map domain events to interaction types
      element: 'slider',
      timestamp: event.timestamp,
      context: {
        eventType: event.type,
        sliderId: event.sliderId,
        ...('slideId' in event ? { slideId: event.slideId } : {}),
        ...('trigger' in event ? { trigger: event.trigger } : {}),
      },
    });
  };

  return { rum, trackSliderEvent };
}
