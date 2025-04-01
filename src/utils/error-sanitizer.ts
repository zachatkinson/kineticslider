import type { ErrorType, SanitizedError } from '../types/error';

/**
 * Sanitizes error information for safe client display by removing sensitive data
 * and standardizing the error format.
 */
export function sanitizeErrorForClient(error: Error): SanitizedError {
  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    code: 'SLIDER_ERROR',
    timestamp: new Date().toISOString()
  };
}

/**
 * Determines if an error contains sensitive information that should be redacted
 */
export function containsSensitiveInfo(error: Error): boolean {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /credential/i
  ];
  
  return sensitivePatterns.some(pattern => 
    pattern.test(error.message) || (error.stack ? pattern.test(error.stack) : false)
  );
}

/**
 * Sanitizes error messages by removing potential sensitive information
 * and standardizing the format.
 */
function sanitizeErrorMessage(message: string): string {
  // Remove any potential file paths
  message = message.replace(/(?:\/[\w.-]+)+/g, '[path]');
  
  // Remove any potential stack traces
  message = message.replace(/at\s+[\w\s./<>]+\s+\(.*\)/g, '[stack]');
  
  // Remove any potential database errors
  message = message.replace(/(?:mongodb|postgres|mysql):.*/i, '[database error]');
  
  // Remove any potential API keys or tokens
  message = message.replace(/[a-zA-Z0-9-_]{20,}/g, '[redacted]');
  
  // Remove any potential email addresses
  message = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
  
  // Remove any potential IP addresses
  message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]');

  return message;
}

/**
 * Sanitizes error names by ensuring they're from a known set of error types
 */
function sanitizeErrorName(name: string): string {
  const validErrorTypes = new Set([
    'Error',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'RangeError',
    'URIError',
    'SliderError',
    'ValidationError',
    'NetworkError',
    'AuthenticationError',
    'AuthorizationError'
  ]);

  return validErrorTypes.has(name) ? name : 'Error';
}

/**
 * Creates a standardized error response that's safe to send to clients
 */
export function createSafeErrorResponse(error: Error, errorType: ErrorType) {
  return {
    message: sanitizeErrorMessage(error.message),
    type: errorType,
    timestamp: new Date().toISOString(),
    code: error.name === 'Error' ? 'UNKNOWN_ERROR' : error.name.toUpperCase()
  };
} 