/* eslint-env vitest */
import { vi as _vi } from 'vitest';
import * as _ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Store root instances to allow cleanup
const roots = new Map<Element | Document, ReactDOMClient.Root>();

// In React 19, ReactDOM.render is removed, so we should use createRoot API directly
// We're not adding any polyfills, just exporting the needed testing utilities

// Export a render function for tests that still expect the old pattern
/**
 *
 * @param element
 * @param container
 * @param callback
 * @returns {void} The function return value
 */
export function render(
  element: React.ReactNode,
  container: Element | DocumentFragment,
  callback?: () => void
): null {
  // Clean up any previous root
  if (roots.has(container as Element)) {
    roots.get(container as Element)?.unmount();
    roots.delete(container as Element);
  }

  // Create a new root and render
  const root = ReactDOMClient.createRoot(container as Element);
  roots.set(container as Element, root);
  
  // Render the element
  root.render(element);
  
  // Run callback if provided
  if(callback && typeof callback === 'function') {
    callback();
  }
  
  return null;
}

// Export unmount function for cleanup
/**
 *
 * @param container
 * @returns {boolean} The function return value
 */
export function _unmountComponentAtNode(container: Element): boolean {
  if (roots.has(container)) {
    roots.get(container)?.unmount();
    roots.delete(container);
    return true;
  }
  return false;
}

// Log success
console.warn('React 19 compatible test utilities initialized');

// Ensure we re-export everything from the main setup
export * from './setup'; 