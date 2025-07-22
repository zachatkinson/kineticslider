/* eslint-disable react-refresh/only-export-components */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Test wrapper component for providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data factories
export const createMockSlide = (overrides = {}): Record<string, unknown> => ({
  id: 'test-slide-1',
  type: 'image' as const,
  src: '/test-image.jpg',
  alt: 'Test image',
  ...overrides,
});

export const createMockVideoSlide = (
  overrides = {}
): Record<string, unknown> => ({
  id: 'test-video-1',
  type: 'video' as const,
  src: '/test-video.mp4',
  poster: '/test-poster.jpg',
  ...overrides,
});

// Test helpers
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockIntersectionObserver = (): void => {
  global.IntersectionObserver = class IntersectionObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof IntersectionObserver;
};

export const mockResizeObserver = (): void => {
  global.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as typeof ResizeObserver;
};
