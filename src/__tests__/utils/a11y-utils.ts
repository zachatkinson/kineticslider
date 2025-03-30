import { vi } from 'vitest';

import { act } from 'react';

import { A11yCheckOptions, A11yCheckResult } from '../../types/a11y';

export async function checkA11y(
  element: HTMLElement,
  options: A11yCheckOptions = {}
): Promise<A11yCheckResult> {
  const {
    minTouchTarget = 44, // WCAG 2.1 minimum touch target size
    checkFocus = true,
    checkAria = true,
  } = options;

  const violations: string[] = [];

  // Check touch target size
  const rect = element.getBoundingClientRect();
  if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
    violations.push(
      `Touch target size (${rect.width}x${rect.height}) is smaller than minimum ${minTouchTarget}px`
    );
  }

  // Check focus management
  if (checkFocus) {
    await act(async () => {
      element.focus();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    if (document.activeElement !== element) {
      violations.push('Element is not focusable');
    }
  }

  // Check ARIA attributes
  if (checkAria) {
    const requiredAriaAttrs = ['role', 'aria-label', 'aria-labelledby'];
    const missingAttrs = requiredAriaAttrs.filter(
      (attr) => !element.hasAttribute(attr)
    );

    if (missingAttrs.length > 0) {
      violations.push(
        `Missing required ARIA attributes: ${missingAttrs.join(', ')}`
      );
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function mockReducedMotion(prefersReduced = true): void {
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

export function announceMessage(message: string): { cleanup: () => void } {
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
