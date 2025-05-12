import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Loading } from "@/components/Loading/Loading";

describe("Loading Component", () => {
  it("renders with default text", () => {
    render(<Loading />);

    // Should have spinner with correct accessibility attributes
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-busy", "true");

    // Should have default loading text for screen readers
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Loading...").className).toBe("sr-only");

    // Should have the base class name
    expect(spinner.parentElement).toHaveClass("kinetic-slider-loading");
  });

  it("renders with custom text", () => {
    const customText = "Please wait...";
    render(<Loading text={customText} />);

    // Should have spinner with correct accessibility attributes
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();

    // Should have custom text (multiple elements have this text)
    const textElements = screen.getAllByText(customText);
    expect(textElements.length).toBe(2);

    // First element should be sr-only
    expect(textElements[0].className).toBe("sr-only");

    // Second element should be visible text div
    expect(textElements[1]).toHaveClass("kinetic-slider-loading-text");
  });

  it("applies custom class name", () => {
    const customClass = "custom-loading-class";
    render(<Loading className={customClass} />);

    // Should have both default and custom classes
    const loadingElement = screen.getByRole("status").parentElement;
    expect(loadingElement).toHaveClass("kinetic-slider-loading");
    expect(loadingElement).toHaveClass(customClass);
  });
});
