// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Setup test environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      MODE: string;
    }
  }
}

// Set default environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MODE = 'test';

// Mock PIXI.js v8
jest.mock('pixi.js', () => ({
  // New renderer system
  Application: jest.fn().mockImplementation(() => ({
    stage: {
      addChild: jest.fn(),
      removeChild: jest.fn(),
      destroy: jest.fn(),
      children: []
    },
    renderer: {
      render: jest.fn(),
      resize: jest.fn(),
      view: document.createElement('canvas'),
      events: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      destroy: jest.fn(),
    },
    view: document.createElement('canvas'),
    screen: {
      width: 800,
      height: 600
    },
    destroy: jest.fn(),
  })),

  // Scene graph
  Stage: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    removeChild: jest.fn(),
    destroy: jest.fn(),
    children: []
  })),

  Container: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    removeChild: jest.fn(),
    destroy: jest.fn(),
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1, set: jest.fn() },
    getChildIndex: jest.fn().mockReturnValue(0),
    addChildAt: jest.fn(),
  })),

  Sprite: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1, set: jest.fn() },
    anchor: { set: jest.fn() },
    alpha: 1,
    visible: true,
    texture: null,
    parent: null,
  })),

  // New asset system
  Assets: {
    init: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue({}),
    unload: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue({}),
    add: jest.fn(),
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      has: jest.fn().mockReturnValue(false),
      clear: jest.fn(),
    },
    // Bundle handling
    addBundle: jest.fn(),
    loadBundle: jest.fn().mockResolvedValue({}),
    backgroundLoad: jest.fn().mockResolvedValue({}),
    backgroundLoadBundle: jest.fn().mockResolvedValue({}),
  },

  // Textures
  Texture: {
    from: jest.fn().mockReturnValue({}),
    WHITE: {},
  },

  // Updated filter system
  BlurFilter: jest.fn().mockImplementation((options = {}) => ({
    blurX: options.blurX || 8,
    blurY: options.blurY || 8,
    quality: options.quality || 4,
    resolution: options.resolution || 1,
    destroy: jest.fn(),
  })),

  // Filter namespace
  filters: {
    BlurFilter: jest.fn().mockImplementation((options = {}) => ({
      blurX: options.blurX || 8,
      blurY: options.blurY || 8,
      quality: options.quality || 4,
      resolution: options.resolution || 1,
      destroy: jest.fn(),
    })),
    DisplacementFilter: jest.fn().mockImplementation(() => ({
      scale: { x: 0, y: 0 },
      destroy: jest.fn(),
    })),
    ColorMatrixFilter: jest.fn().mockImplementation(() => ({
      matrix: new Float32Array(20),
      destroy: jest.fn(),
    })),
  },

  // Settings
  settings: {
    PREFER_ENV: 'webgl2',
    STRICT_TEXTURE_CACHE: false,
    RENDER_OPTIONS: {},
  },

  // Texture formats
  TEXTURE_FORMAT: {
    RGB: 'rgb',
    RGBA: 'rgba',
  },

  // Events system
  EventSystem: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    destroy: jest.fn(),
  })),
}));

// Mock window.requestAnimationFrame
window.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));

// Mock window.cancelAnimationFrame
window.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Add fetch to global scope for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: 'http://localhost/',
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    text: () => Promise.resolve(''),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    bodyUsed: false,
    body: null,
    clone: function() { return this; },
  } as Response)
);
