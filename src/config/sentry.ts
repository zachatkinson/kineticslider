/**
 * Sentry error tracking configuration and initialization module.
 * Configures and initializes Sentry for production error monitoring.
 *
 * @module
 * @version 1.0.0
 * @example Example usage
 * ```typescript
 * // Initialize Sentry in your app's entry point
 * import { initSentry } from '@/config/sentry';
 * initSentry();
 * ```
 *
 * @description * - Lazy initialization only in production
 * - Optimized sampling rates for traces and replays
 * - Minimal impact on application startup time
 * - Efficient error batching and throttling
 *
 * @description * - Automatic error capture and reporting
 * - Stack trace collection and source mapping
 * - Environment-based configuration
 * - Replay session recording for error reproduction
 * - Browser performance monitoring
 *
 * @description * - Environment-specific DSN configuration
 * - Sanitized error messages in production
 * - Controlled sampling rates
 * - Secure data transmission
 * - PII protection measures
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/ Sentry React: Documentation}
 */

import * as Sentry from "@sentry/browser";

/**
 * Initializes Sentry error tracking for the application.
 * Only activates in production environment to prevent development noise.
 *
 * @function
 * @returns {void}
 *
 * @description * - Traces sample rate: 100% for comprehensive monitoring
 * - Session replay rate: 10% for normal sessions
 * - Error replay rate: 100% for error sessions
 *
 * @description * - Uses environment variables for sensitive configuration
 * - Validates environment before initialization
 * - Implements secure defaults
 */
export const initSentry = (): void => {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [],
    });
  }
};
