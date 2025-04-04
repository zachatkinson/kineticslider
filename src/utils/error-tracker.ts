import { SliderError } from './errors';
import type { ErrorTrackerContext, ErrorTrackerReport } from '../types/error';

/**
 * Error tracking utility that provides comprehensive error monitoring
 * and reporting capabilities.
 * @example Example usage
 */
export class ErrorTracker {
  private static instance: ErrorTracker;
  private readonly reports: ErrorTrackerReport[] = [];
  private readonly maxReports: number;
  private errorListeners: Set<(report: ErrorTrackerReport) => void> = new Set();

  /**
   * Get singleton instance
   * @returns {ErrorTracker} The singleton ErrorTracker instance
   */
  public static getInstance(): ErrorTracker {
    if(!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Create a new ErrorTracker instance
   * @param maxReports - Maximum number of reports to store
   * @returns {void}
   */
  constructor(maxReports = 100) {
    this.maxReports = maxReports;
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error and unhandled rejection handlers
   */
  private setupGlobalHandlers(): void {
    if(typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureError(error || new Error(String(message)), {
          component: 'window',
          data: { source, lineno, colno },
        });
      };

      window.onunhandledrejection = (event) => {
        this.captureError(event.reason, {
          component: 'promise',
          data: { type: 'unhandledRejection' },
        });
      };
    }
  }

  /**
   * Capture and track an error
   * @param error - Error instance or message
   * @param context - Error context
   */
  public captureError(error: Error | string,
    context: Partial<ErrorTrackerContext> = {}
  ): void {
    const errorInstance = typeof error === 'string' ? new Error(error) : error;
    const report: ErrorTrackerReport = {
      error: errorInstance instanceof SliderError ? errorInstance : new SliderError(errorInstance.message, 'UNKNOWN_ERROR', errorInstance),
      context: {
        ...context,
        severity: context.severity || 'error',
        timestamp: Date.now(),
      } as ErrorTrackerContext,
      stackTrace: errorInstance.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.addReport(report);
  }

  /**
   * Capture and track a warning
   * @param warning - Warning instance or message
   * @param context - Warning context
   */
  public captureWarning(warning: Error | string,
    context: Partial<ErrorTrackerContext> = {}
  ): void {
    const warningInstance = typeof warning === 'string' ? new Error(warning) : warning;
    const report: ErrorTrackerReport = {
      error: warningInstance instanceof SliderError ? warningInstance : new SliderError(warningInstance.message, 'UNKNOWN_WARNING', warningInstance),
      context: {
        ...context,
        severity: 'warning',
        timestamp: Date.now(),
      } as ErrorTrackerContext,
      stackTrace: warningInstance.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.addReport(report);
  }

  /**
   * Add error listener
   * @param listener - Error listener callback
   */
  public addErrorListener(listener: (report: ErrorTrackerReport) => void): void {
    this.errorListeners.add(listener);
  }

  /**
   * Remove error listener
   * @param listener - Error listener callback
   */
  public removeErrorListener(listener: (report: ErrorTrackerReport) => void): void {
    this.errorListeners.delete(listener);
  }

  /**
   * Notify all error listeners
   * @param report - Error report
   */
  private notifyListeners(report: ErrorTrackerReport): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(report);
      } catch(error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  /**
   * Get all captured errors
   * @returns Array of error reports
   */
  public getReports(): ErrorTrackerReport[] {
    return [...this.reports];
  }

  /**
   * Get errors filtered by severity
   * @param severity - Error severity
   * @returns Filtered error reports
   */
  public getErrorsBySeverity(severity: ErrorTrackerContext['severity']): ErrorTrackerReport[] {
    return this.reports.filter((report) => report.context.severity === severity);
  }

  /**
   * Get errors for a specific component
   * @param component - Component name
   * @returns Filtered error reports
   */
  public getErrorsByComponent(component: string): ErrorTrackerReport[] {
    return this.reports.filter((report) => report.context.component === component);
  }

  /**
   * Clear all captured errors
   */
  public clearReports(): void {
    this.reports.length = 0;
  }

  /**
   * Create error boundary handler
   * @param component - Component name
   * @returns Error boundary handler
   */
  public createErrorBoundaryHandler(component: string) {
    return (error: Error, errorInfo: React.ErrorInfo) => {
      this.captureError(error, {
        component,
        severity: 'error',
        data: { errorInfo },
      });
    };
  }

  private addReport(report: ErrorTrackerReport): void {
    this.reports.push(report);

    if(this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    this.logReport(report);
  }

  private logReport(report: ErrorTrackerReport): void {
    const { error, context, stackTrace } = report;
    const timestamp = new Date(context.timestamp).toISOString();

    console.warn(`[${timestamp}] ${context.severity.toUpperCase()}: ${error.message}`);
    if (context.component) console.warn('Component:', context.component);
    if (context.action) console.warn('Action:', context.action);
    if (context.data) console.warn('Data:', context.data);
    if (stackTrace) console.warn('Stack Trace:', stackTrace);

    this.notifyListeners(report);
  }
} 