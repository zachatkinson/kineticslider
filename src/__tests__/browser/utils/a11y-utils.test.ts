import { describe, it, expect, beforeEach } from "vitest";
import { checkA11y } from "./a11y-utils";

describe("checkA11y", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("passes when element meets all accessibility requirements", async () => {
    const element = document.createElement("button");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "50px";
    element.style.height = "50px";
    container.appendChild(element);
    // Mock getBoundingClientRect
    element.getBoundingClientRect = () => ({
      width: 50,
      height: 50,
      top: 0,
      left: 0,
      right: 50,
      bottom: 50,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    const result = await checkA11y(element);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("fails when touch target is too small", async () => {
    const element = document.createElement("button");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "30px";
    element.style.height = "30px";
    container.appendChild(element);

    const result = await checkA11y(element);
    expect(result.passed).toBe(false);
    const violationMessages = result.violations.map((v) => v.description);
    expect(
      violationMessages.some((msg) => msg.includes("Touch target size")),
    ).toBe(true);
  });

  it("fails when element is not focusable", async () => {
    const element = document.createElement("div");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "50px";
    element.style.height = "50px";
    container.appendChild(element);

    const result = await checkA11y(element);
    expect(result.passed).toBe(false);
    const violationMessages = result.violations.map((v) => v.description);
    expect(violationMessages).toContain("Element is not focusable");
  });

  it("fails when required ARIA attributes are missing", async () => {
    const element = document.createElement("button");
    element.style.width = "50px";
    element.style.height = "50px";
    container.appendChild(element);

    const result = await checkA11y(element);
    expect(result.passed).toBe(false);
    const violationMessages = result.violations.map((v) => v.description);
    expect(
      violationMessages.some((msg) =>
        msg.toLowerCase().includes("missing required aria attributes"),
      ),
    ).toBe(true);
  });

  it("allows customizing minimum touch target size", async () => {
    const element = document.createElement("button");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "40px";
    element.style.height = "40px";
    container.appendChild(element);
    // Mock getBoundingClientRect
    element.getBoundingClientRect = () => ({
      width: 40,
      height: 40,
      top: 0,
      left: 0,
      right: 40,
      bottom: 40,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    const result = await checkA11y(element, { minTouchTarget: 35 });
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("can skip focus check", async () => {
    const element = document.createElement("div");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "50px";
    element.style.height = "50px";
    container.appendChild(element);

    const result = await checkA11y(element, { checkFocus: false });
    // Should not include focusable violation
    const violationMessages = result.violations.map((v) => v.description);
    expect(violationMessages.includes("Element is not focusable")).toBe(false);
  });

  it("can skip ARIA check", async () => {
    const element = document.createElement("button");
    element.style.width = "50px";
    element.style.height = "50px";
    container.appendChild(element);

    const result = await checkA11y(element, { checkAria: false });
    // Should not include ARIA violation
    const violationMessages = result.violations.map((v) => v.description);
    expect(
      violationMessages.some((msg) => msg.toLowerCase().includes("aria")),
    ).toBe(false);
  });

  it("fails when element has zero dimensions", async () => {
    const element = document.createElement("button");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "0";
    element.style.height = "0";
    container.appendChild(element);

    const result = await checkA11y(element);
    expect(result.passed).toBe(false);
    const violationMessages = result.violations.map((v) => v.description);
    expect(violationMessages).toContain("Element has zero dimensions");
  });

  it("fails when element is not connected to DOM", async () => {
    const element = document.createElement("button");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Test button");
    element.style.width = "50px";
    element.style.height = "50px";

    const result = await checkA11y(element);
    expect(result.passed).toBe(false);
    const violationMessages = result.violations.map((v) => v.description);
    expect(violationMessages).toContain("Element is not connected to the DOM");
  });
});
