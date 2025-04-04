/* eslint-env vitest */
import { vi as _vi } from 'vitest';

// First import the base setup to ensure all mocks are properly registered
import '../setup';
import { render, _unmountComponentAtNode } from '../hooks-setup';

// Import createRoot to verify it's available
import * as ReactDOMClient from 'react-dom/client';

// Verify that createRoot is available
if(typeof ReactDOMClient.createRoot !== 'function') {
  console.error('ReactDOMClient.createRoot is not defined!');
  throw new Error('Testing environment setup failed: createRoot is not available');
}

// Export the React 19 compatible render utilities
export {
  render,
  _unmountComponentAtNode as unmountComponentAtNode
};

// Add additional hook-specific test setup here
// For: example, mocking context providers or hook-specific utilities

// Log success
console.warn('Hooks test setup completed successfully'); 