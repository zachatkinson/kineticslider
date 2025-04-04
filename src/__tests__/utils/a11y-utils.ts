import { vi } from 'vitest';

import { act } from 'react';

import type { A11yCheckOptions, A11yCheckResult } from '@/types/a11y';

/**
 *
 * @param element
 * @param options
 * @returns {ReturnType} The return value
 */
export async function _checkA11y(
  element: HTMLElement,
  options: Partial<A11yCheckOptions & { 
    minTouchTarget?: number;
    checkFocus?: boolean;
    checkAria?: boolean;
  }> = {}
): Promise<A11yCheckResult> {
  // Create proper options object with required element
  const _a11yOptions: A11yCheckOptions = {
    element: element,
    includeWarnings: options.includeWarnings,
    excludeRules: options.excludeRules,
    customRules: options.customRules
  };
  
  const {
    minTouchTarget = 44, // WCAG 2.1 minimum touch target size
    checkFocus = true,
    checkAria = true,
  } = options;

  const violations = [];

  // Check touch target size
  const rect = element.getBoundingClientRect();
  if(rect.width < minTouchTarget || rect.height < minTouchTarget) {
    violations.push(
      `Touch target size(${rect.width}x${rect.height}) is smaller than minimum ${minTouchTarget}px`
    );
  }

  // Check focus management
  if(checkFocus) {
    await act(async () => {
      element.focus();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    if(document.activeElement !== element) {
      violations.push('Element is not focusable');
    }
  }

  // Check ARIA attributes
  if(checkAria) {
    const requiredAriaAttrs = ['role', 'aria-label', 'aria-labelledby'];
    const missingAttrs = requiredAriaAttrs.filter(
      (attr) => !element.hasAttribute(attr)
    );

    if(missingAttrs.length > 0) {
      violations.push(`Missing required ARIA attributes: ${missingAttrs.join(', ')}`
      );
    }
  }

  // Format violations to match A11yCheckResult.violations structure
  const formattedViolations = violations.map(message => ({
    id: 'test-violation',
    impact: 'moderate' as const,
    description: message,
    nodes: [{
      html: element.outerHTML,
      target: element.tagName.toLowerCase()
    }]
  }));

  return {
    passed: violations.length === 0,
    violations: formattedViolations,
    warnings: []
  };
}

/**
 *
 * @param prefersReduced
 * @returns {ReturnType} The return value
 */
export function _mockReducedMotion(prefersReduced = true): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query === '(prefers-reduced-motion: reduce)' ? prefersReduced : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/**
 *
 * @param message
 * @returns {unknown} The function return value
 */
export function _announceMessage(message: string): { cleanup: () => void } {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  document.body.appendChild(liveRegion);

  act(() => {
    liveRegion.textContent = message;
  });

  return {
    cleanup: () => {
      document.body.removeChild(liveRegion);
    },
  };
}
