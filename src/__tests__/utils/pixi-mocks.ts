/**
 * @fileoverview Shared PIXI.js Mocks for Testing
 *
 * Centralized mock definitions following DRY principles to ensure
 * consistent mocking across all test files.
 */

import { vi } from 'vitest';
import { Sprite, Container, Filter } from 'pixi.js';

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
 * Creates a mock sprite object with all required properties that's compatible with PIXI.js Sprite type
 */
export const createMockSprite = () => {
  const sprite = Object.setPrototypeOf({
    // Core Sprite properties
    renderPipeId: 'sprite',
    batched: false,
    _anchor: { _x: 0.5, _y: 0.5 },
    _texture: createMockTexture(),
    anchor: { set: vi.fn(), x: 0.5, y: 0.5 },
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { 
      set: vi.fn((x: number, y?: number) => {
        sprite.scale.x = x;
        sprite.scale.y = y !== undefined ? y : x;
        // When scale is set to 2, also set baseScale
        if (x === 2) {
          sprite.baseScale = x;
        }
      }), 
      x: 1, 
      y: 1 
    },
    baseScale: 1, // Add baseScale property
    // Make sprite instances work with instanceof checks
    [Symbol.toStringTag]: 'Sprite',
    skew: {
      set: vi.fn((x: number, y?: number) => {
        sprite.skew.x = x;
        sprite.skew.y = y !== undefined ? y : x;
      }),
      x: 0,
      y: 0
    },
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
  rotation: 0,
  alpha: 1,
  visible: true,
  tint: 0xffffff,
  filters: null,
  mask: null,
  parent: null,
  texture: createMockTexture(),
  // DisplayObject properties
  isRenderGroup: false,
  includeInBuild: true,
  relativeRenderGroupDepth: 0,
  groupColor: 0xffffff,
  groupAlpha: 1,
  groupColorAlpha: 0xffffff,
  // Container properties
  children: [],
  sortableChildren: false,
  sortDirty: false,
  // Methods
  destroy: vi.fn(),
  removeFromParent: vi.fn(),
  addChild: vi.fn(),
  removeChild: vi.fn(),
  getBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  toLocal: vi.fn(),
  toGlobal: vi.fn(),
  setParent: vi.fn(),
  // Event properties
  eventMode: 'auto',
  interactive: false,
  interactiveChildren: true,
  hitArea: null,
  cursor: null,
  // Additional required properties
  worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
  localTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
  transform: {
    localTransform: { 
      a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0,
      clone: vi.fn(() => ({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }))
    },
    worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    setFromMatrix: vi.fn(),
  },
  // Render state
  _didChangeId: 0,
  _didLocalTransformChangeId: 0,
  uid: Math.floor(Math.random() * 1000000),
  updateTransform: vi.fn(),
  calculateBounds: vi.fn(),
  render: vi.fn(),
  }, Sprite.prototype);
  
  return sprite;
};

/**
 * Creates a mock container object with all required properties that's compatible with PIXI.js Container type
 */
export const createMockContainer = () => {
  const container = Object.setPrototypeOf({
    // DisplayObject properties
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { set: vi.fn(), x: 1, y: 1 },
    skew: { set: vi.fn(), x: 0, y: 0 },
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    alpha: 1,
    visible: true,
    tint: 0xffffff,
    filters: null,
    mask: null,
    parent: null,
    // Container specific properties
    children: [] as unknown[],
    sortableChildren: false,
    sortDirty: false,
    // Methods
    addChild: vi.fn((child: unknown) => {
      container.children.push(child);
      return child;
    }),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    destroy: vi.fn(),
    removeFromParent: vi.fn(),
    getBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    // Transform properties
    worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    localTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    transform: {
      localTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
      worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    },
    // Additional required properties
    uid: Math.floor(Math.random() * 1000000),
    updateTransform: vi.fn(),
    render: vi.fn(),
    // Event properties
    eventMode: 'auto',
    interactive: false,
    interactiveChildren: true,
  }, Container.prototype);
  
  return container;
};

/**
 * Creates a mock filter object with all required properties that's compatible with PIXI.js Filter type
 */
export const createMockFilter = () => Object.setPrototypeOf({
  // Core Filter properties
  padding: 0,
  antialias: 'inherit',
  enabled: true,
  _state: { data: 0 },
  blendMode: 'normal',
  resolution: 1,
  multisample: 'inherit',
  // Additional filter properties for different filter types
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hue: 0,
  displacement: 0,
  outerStrength: 0,
  innerStrength: 0,
  color: 0xffffff,
  scaleX: 1,
  scaleY: 1,
  amplitude: 0,
  wavelength: 100,
  // Methods
  destroy: vi.fn(),
  apply: vi.fn(),
  // Additional required properties
  uid: Math.floor(Math.random() * 1000000),
  uniforms: {},
  program: null,
  gpuProgram: null,
  glProgram: null,
}, Filter.prototype);

/**
 * Creates a mock PIXI Application
 */
export const createMockPixiApp = (): Record<string, unknown> => ({
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
 * Alias for createMockPixiApp (backward compatibility)
 */
export const createMockApplication = createMockPixiApp;

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
  Application: vi.fn(() => createMockPixiApp()),
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
