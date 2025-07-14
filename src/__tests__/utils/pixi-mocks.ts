/**
 * @fileoverview Shared PIXI.js Mocks for Testing
 *
 * Centralized mock definitions following DRY principles to ensure
 * consistent mocking across all test files.
 */

import { vi } from 'vitest';

/**
 * Creates a mock texture object with all required properties
 */
export const createMockTexture = (width = 256, height = 256) => ({
  source: { width, height },
  destroy: vi.fn(),
  baseTexture: {
    width,
    height,
    resource: {
      width,
      height,
    },
  },
  width,
  height,
});

/**
 * Creates a mock sprite object with all required properties
 */
export const createMockSprite = () => ({
  anchor: { set: vi.fn() },
  position: { set: vi.fn(), x: 0, y: 0 },
  scale: { set: vi.fn(), x: 1, y: 1 },
  rotation: 0,
  alpha: 1,
  visible: true,
  tint: 0xffffff,
  filters: [],
  mask: null,
  parent: null,
  texture: null,
  destroy: vi.fn(),
  removeFromParent: vi.fn(),
});

/**
 * Creates a mock PIXI Application
 */
export const createMockApplication = (): Record<string, unknown> => ({
  init: vi.fn().mockResolvedValue(undefined),
  canvas: document.createElement('canvas'),
  screen: { width: 800, height: 600 },
  stage: {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    children: [],
  },
  renderer: {
    resize: vi.fn(),
    render: vi.fn(),
  },
  ticker: {
    add: vi.fn(),
    remove: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
  destroy: vi.fn(),
  render: vi.fn(),
  resizeTo: vi.fn(),
  resize: vi.fn(),
  queueResize: vi.fn(),
  cancelResize: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
});

/**
 * Creates a mock GlProgram
 */
export const createMockGlProgram = () => ({
  vertex: '',
  fragment: '',
  destroy: vi.fn(),
});

/**
 * Standard PIXI.js mock configuration
 * Use this in vi.mock('pixi.js', () => createPixiMock())
 */
export const createPixiMock = () => ({
  Application: vi.fn(() => createMockApplication()),
  Texture: {
    fromURL: vi.fn().mockResolvedValue(createMockTexture()),
    WHITE: createMockTexture(1, 1),
  },
  Sprite: vi.fn(() => createMockSprite()),
  Assets: {
    load: vi.fn().mockResolvedValue(createMockTexture()),
  },
  Program: vi.fn(() => createMockGlProgram()),
  GlProgram: vi.fn(() => createMockGlProgram()),
});

/**
 * Sets up responsive mocks that resolve immediately to avoid timeouts
 */
export const setupFastMocks = () => {
  const mockTexture = createMockTexture();

  // Make Assets.load resolve immediately
  vi.mocked(vi.importActual('pixi.js')).then(async () => {
    const { Assets } = await import('pixi.js');
    vi.mocked(Assets.load).mockImplementation(() =>
      Promise.resolve(mockTexture)
    );
  });

  return mockTexture;
};

/**
 * Mock fetch for testing
 */
export const createMockFetch = () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve('mock response'),
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  });

  global.fetch = mockFetch;
  return mockFetch;
};

