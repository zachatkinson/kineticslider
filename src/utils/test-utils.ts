import { vi } from "vitest";
import type { Slide, SliderId } from "../types/slider";
import type {
  MockResult,
  MockPixiApplication,
  MockPixiContainer,
  MockPixiSprite,
  MockPixiAssets as _MockPixiAssets,
  MockFunction as _MockFunction,
} from "../types/test/mocks";

/**
 * Creates a mock Pixi application for testing
 *
 * @returns {ReturnType} The return value
 *
 */
export function _createMockPixiApp(): MockPixiApplication {
  const mockContainer: MockPixiContainer = createMockContainer();

  return {
    stage: mockContainer,
    renderer: {
      view: document.createElement("canvas"),
      resize: vi.fn(),
      destroy: vi.fn(),
    },
    view: document.createElement("canvas"),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
}

/**
 * Creates a mock Pixi container for testing
 *
 * @returns {ReturnType} The return value
 *
 */
export function createMockContainer(): MockPixiContainer {
  return {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scale: {
      x: 1,
      y: 1,
    },
  };
}

/**
 * Creates a mock Pixi sprite for testing
 *
 * @returns {ReturnType} The return value
 *
 */
export function _createMockSprite(): MockPixiSprite {
  return {
    x: 0,
    y: 0,
    texture: {
      baseTexture: {
        resource: {
          source: document.createElement("img"),
        },
      },
    },
    anchor: {
      set: vi.fn(),
    },
    scale: {
      x: 1,
      y: 1,
    },
    width: 100,
    height: 100,
    alpha: 1,
  };
}

/**
 * Creates a mock successful result for testing
 *
 * @param data
 *
 * @returns {ReturnType} The return value
 *
 */
export function createSuccessResult<T>(data: T): MockResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a mock error result for testing
 *
 * @param error
 *
 * @returns {unknown} - The return value
 *
 */
export function createErrorResult<T>(error: Error): MockResult<T> {
  return {
    success: false,
    error,
  };
}

/**
 * Creates a mock touch event for testing
 *
 * @param type
 *
 * @param options
 *
 * @param options.clientX
 *
 * @param options.clientY
 *
 * @param options.identifier
 *
 * @param options.target
 *
 * @returns Touch event instance
 *
 */
export function _createTouchEvent(
  type: string,
  options: {
    clientX?: number;
    clientY?: number;
    identifier?: number;
    target?: EventTarget;
  } = {},
): TouchEvent {
  const touch = _createTouch(options);

  return new TouchEvent(type, {
    cancelable: true,
    bubbles: true,
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
  });
}

/**
 * Creates a mock touch for testing
 *
 * @param options
 *
 * @param options.identifier
 *
 * @param options.target
 *
 * @param options.clientX
 *
 * @param options.clientY
 *
 * @returns {ReturnType} The return value
 *
 */
export function _createTouch(options: {
  clientX?: number;
  clientY?: number;
  identifier?: number;
  target?: EventTarget;
}): Touch {
  const {
    clientX = 0,
    clientY = 0,
    identifier = 1,
    target = document.body,
  } = options;

  return new Touch({
    identifier,
    target,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 1,
  });
}

/**
 * Creates a branded slide ID for testing
 *
 * @param id
 *
 * @returns {ReturnType} The return value
 *
 */
export function createSlideId(id: string): SliderId {
  return id as SliderId;
}

/**
 * Creates a mock result object for testing async operations
 *
 * @param data
 *
 * @param error
 *
 * @returns {ReturnType} The return value
 *
 */
export function createMockResult<T>(
  data: T | undefined,
  error?: Error,
): MockResult<T> {
  return {
    success: Boolean(data && !error),
    data: data as T,
    error,
    loading: false,
    failed: Boolean(error),
    value: data as T,
  };
}

/**
 * Generates an array of mock slides for testing
 *
 * @param count
 *
 * @returns Array of mock slides
 *
 */
export function generateMockSlides(count: number): Slide[] {
  return Array.from({ length: count }, (_, index) => ({
    id: createSlideId(`slide-${index}`),
    title: `Slide ${index + 1}`,
    content: `Content for slide ${index + 1}`,
    image: `https://example.com/image-${index + 1}.jpg`,
    alt: `Description for slide ${index + 1}`,
  }));
}

/**
 * Returns a predefined set of mock slides for testing
 *
 * @returns Array of predefined mock slides
 *
 */
export function _getMockSlides(): Slide[] {
  return generateMockSlides(3);
}

/**
 * Helper to create typed mock response objects
 *
 * @param data The data to include in the mock response
 *
 * @returns Mocked API response object
 *
 */
export function _createMockResponse<T>(data: T): {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  json: () => Promise<T>;
  text: () => Promise<string>;
  value: T;
} {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    data: data,
    json: async () => data,
    text: async () => JSON.stringify(data),
    value: data,
  };
}
