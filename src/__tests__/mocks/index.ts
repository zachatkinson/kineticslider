/**
 * Central exports for all mock utilities
 */

// Browser API mocks
export * from "./browser-apis.mock";

// Console mocks
export * from "./console.mock";

// Test data mocks
export * from "./test-data.mock";

// Test helper mocks
export * from "./test-helpers.mock";

// E2E test helper mocks
export * from "./e2e-test-helpers.mock";

// Test setup mocks
export * from "./test-setup.mock";

// Resource management mocks
export * from "./resource-management.mock";

// Performance mocks
export * from "./performance.mock";
export * from "./performance-monitor.mock";

// Component-specific mocks
export * from "./accessibility.mock";
export * from "./analytics.mock";
export * from "./form-validation.mock";
export * from "./gestures.mock";
export * from "./gsap.mock";
export * from "./keyboard.mock";
export * from "./pixi.mock";
export * from "./slideValidation.mock";
export * from "./validation.mock";

// Export mock functions with specific names to avoid conflicts
export { mockFunctions as kineticSliderMockFunctions } from "./kinetic-slider.mock";
export { mockFunctions as sliderMockFunctions } from "./slider.mock";

// Re-export commonly used mock utilities with descriptive names
export {
  setupBrowserApiMocks,
  createMockElement,
  createMockRef,
  createMockFunction,
  createAsyncMock,
  createAsyncErrorMock,
  mockTimers,
} from "./test-helpers.mock";

export {
  mockSlides,
  mockSlidesWithContent,
  createMockSlides,
  createMockSlidesWithProps,
} from "./test-data.mock";

export {
  createConsoleMocks,
  silentConsole,
  collectingConsole,
  setupConsoleMocks,
} from "./console.mock";

export {
  WorkerPool,
  ResourcePool,
  mockTerminate,
  createResourceManagementMock,
  cleanupResources,
  allocateResources,
  deallocateResources,
} from "./resource-management.mock"; 