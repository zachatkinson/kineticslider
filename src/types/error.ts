import { SliderError } from '../utils/errors';

/**
 * Context information for error tracking
 */
export interface ErrorTrackerContext {
  component?: string;
  action?: string;
  data?: Record<string, unknown>;
  severity: 'error' | 'warning' | 'info';
  timestamp: number;
}

/**
 * Complete error report structure
 */
export interface ErrorTrackerReport {
  error: SliderError;
  context: ErrorTrackerContext;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
} 