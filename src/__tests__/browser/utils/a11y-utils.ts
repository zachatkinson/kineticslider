/**
 * Browser-specific accessibility testing utilities
 * These utilities are designed to run in a real browser environment
 * where we can test actual DOM measurements and focus behavior
 */

import type { A11yCheckOptions, A11yCheckResult } from "@/types/a11y";

/**
 * Checks accessibility of an element in a browser environment
 * Tests touch target size, focus management, and ARIA attributes
 *
 * @param element - The HTML element to check
 *
 * @param options - Configuration options for the accessibility check
 *
 * @returns Promise<A11yCheckResult> - The result of the accessibility check
 *
 */
export async function checkA11y(
  element: HTMLElement,
  options: Partial<
    A11yCheckOptions & {
      minTouchTarget?: number;
      checkFocus?: boolean;
      checkAria?: boolean;
    }
  > = {},
): Promise<A11yCheckResult> {
  const violations: { description: string }[] = [];

  // Check if element is connected to DOM
  const isConnected = element.isConnected;
  console.warn("A11y check: isConnected", isConnected);
  if (!isConnected) {
    violations.push({ description: "Element is not connected to the DOM" });
  }

  // Check dimensions
  const rect = element.getBoundingClientRect();
  console.warn("A11y check: width", rect.width, "height", rect.height);
  if (rect.width === 0 || rect.height === 0) {
    violations.push({ description: "Element has zero dimensions" });
  }

  // Touch target size
  const minTouchTarget = options.minTouchTarget ?? 44;
  if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
    violations.push({
      description: `Touch target size is too small: ${rect.width}x${rect.height}`,
    });
  }

  // Focus check
  if (options.checkFocus !== false) {
    const isFocusable =
      element.tabIndex >= 0 ||
      element.hasAttribute("tabindex") ||
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLAnchorElement;
    console.warn("A11y check: isFocusable", isFocusable);
    if (!isFocusable) {
      violations.push({ description: "Element is not focusable" });
    }
  }

  // ARIA check
  if (options.checkAria !== false) {
    const hasAria =
      element.hasAttribute("aria-label") ||
      element.hasAttribute("aria-labelledby") ||
      element.hasAttribute("aria-describedby");
    console.warn("A11y check: hasAria", hasAria);
    if (!hasAria) {
      violations.push({ description: "Missing required ARIA attributes" });
    }
  }

  const passed = violations.length === 0;
  // Format violations to match expected structure
  const formattedViolations = violations.map((v) => ({
    id: "a11y-check",
    impact: "moderate" as const,
    description: v.description,
    nodes: [{ html: element.outerHTML, target: element.tagName.toLowerCase() }],
  }));
  return { passed, violations: formattedViolations, warnings: [] };
}
