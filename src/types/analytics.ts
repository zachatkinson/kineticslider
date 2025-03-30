/**
 * Analytics types for tracking slider events
 */

/**
 * Event types for slider analytics tracking
 */
export enum SliderEventType {
  SLIDE_CHANGE = 'SLIDE_CHANGE',
  ANIMATION_COMPLETE = 'ANIMATION_COMPLETE',
  SLIDE_INTERACTION = 'SLIDE_INTERACTION',
  GESTURE_DETECTED = 'GESTURE_DETECTED',
  ERROR = 'ERROR',
  ERROR_MAX_RETRIES = 'ERROR_MAX_RETRIES',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
  COMPONENT_MOUNT = 'COMPONENT_MOUNT',
  COMPONENT_UNMOUNT = 'COMPONENT_UNMOUNT',
  USER_INTERACTION = 'USER_INTERACTION',
}

export interface AnalyticsEvent {
  type: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  timestamp?: number;
  properties?: Record<string, unknown>;
}

/**
 * Slider-specific analytics event structure
 */
export interface SliderAnalyticsEvent
  extends Omit<AnalyticsEvent, 'timestamp' | 'type'> {
  type: SliderEventType;
  timestamp: string;
  componentId?: string | undefined;
  sessionId: string;
  data: Record<string, unknown>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  debug?: boolean;
  anonymizeIp?: boolean;
  trackSlideChanges?: boolean;
  trackInteractions?: boolean;
  trackErrors?: boolean;
  trackPerformance?: boolean;
}

/**
 * Extended analytics configuration for slider components
 */
export interface SliderAnalyticsConfig extends AnalyticsConfig {
  debug: boolean;
  trackPerformance: boolean;
  trackInteractions: boolean;
  trackErrors: boolean;
  batchSize: number;
  batchInterval: number;
  endpoint?: string;
  onEvent?: (event: SliderAnalyticsEvent) => void;
  // Additional properties used in tests
  enablePerformance?: boolean;
  enableInteractions?: boolean;
  enableErrors?: boolean;
  batchEvents?: boolean;
}

/**
 * Type aliases for simplified imports in utility files
 */
export type AnalyticsEventType = SliderAnalyticsEvent;
export type AnalyticsConfigType = SliderAnalyticsConfig;
