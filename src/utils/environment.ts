/**
 * Detects if the current environment is development mode
 * Supports various frameworks and build tools:
 * - Jest (process.env.NODE_ENV === 'test')
 * - Astro (import.meta.env.MODE)
 * - Vite (import.meta.env.MODE)
 * - Create React App (process.env.NODE_ENV)
 * - Next.js (process.env.NODE_ENV)
 * - Node.js (process.env.NODE_ENV)
 */
export const isDevelopment = (): boolean => {
  try {
    // Check if we're in a test environment first
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true; // Treat test environment as development
    }

    // Astro/Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
      return import.meta.env.MODE === 'development';
    }

    // Node.js/CRA/Next.js environment
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV === 'development';
    }

    // Default to production if environment can't be determined
    return false;
  } catch {
    // If any errors occur while checking (e.g., import.meta not available),
    // default to production for safety
    return false;
  }
};
