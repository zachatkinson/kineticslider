// Import testing library utilities
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia with modern implementation
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Modern ResizeObserver mock with better type support
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  unobserveAll() {}
}
global.ResizeObserver = ResizeObserverMock;

// Modern IntersectionObserver mock with better type support
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  unobserveAll() {}
  takeRecords() { return []; }
}
global.IntersectionObserver = IntersectionObserverMock;

// Modern requestAnimationFrame implementation with better timing
let rafId = 0;
global.requestAnimationFrame = (callback) => {
  rafId += 1;
  setTimeout(() => callback(Date.now()), 0);
  return rafId;
};
global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Modern console handling with better filtering
const originalError = console.error;
const originalWarn = console.warn;

const filteredConsole = (original, filterPatterns) => (...args) => {
  if (
    typeof args[0] === 'string' &&
    filterPatterns.some(pattern => args[0].includes(pattern))
  ) {
    return;
  }
  original.call(console, ...args);
};

beforeAll(() => {
  const filterPatterns = [
    'Warning: ReactDOM.render is no longer supported',
    'Warning: ReactDOM.hydrate is no longer supported',
    'Warning: ReactDOM.unmountComponentAtNode is no longer supported',
    'Warning: ReactDOM.findDOMNode is no longer supported',
    'Warning: ReactDOM.createPortal is no longer supported',
  ];

  console.error = filteredConsole(originalError, filterPatterns);
  console.warn = filteredConsole(originalWarn, filterPatterns);
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Modern PIXI.js mock with better type support and async handling
jest.mock('pixi.js', () => ({
  Application: jest.fn().mockImplementation(() => ({
    view: document.createElement('canvas'),
    stage: {
      addChild: jest.fn(),
      removeChild: jest.fn(),
      children: [],
    },
    renderer: {
      resize: jest.fn(),
      plugins: {
        interaction: {
          on: jest.fn(),
          off: jest.fn(),
        },
      },
      view: document.createElement('canvas'),
    },
    destroy: jest.fn(),
    ticker: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  })),
  Container: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    removeChild: jest.fn(),
    children: [],
    filters: [],
    destroy: jest.fn(),
  })),
  Sprite: jest.fn().mockImplementation(() => ({
    anchor: { set: jest.fn() },
    position: { set: jest.fn() },
    scale: { set: jest.fn() },
    texture: null,
    filters: [],
    width: 100,
    height: 100,
    destroy: jest.fn(),
  })),
  Texture: {
    from: jest.fn().mockImplementation(() => ({
      baseTexture: {},
      width: 100,
      height: 100,
      destroy: jest.fn(),
    })),
    WHITE: 'WHITE-TEXTURE',
  },
  Assets: {
    load: jest.fn().mockImplementation(() => Promise.resolve({})),
    unload: jest.fn(),
  },
  Filter: jest.fn(),
  DisplacementFilter: jest.fn().mockImplementation(() => ({
    scale: { x: 0, y: 0 },
  })),
}));

// Modern GSAP mock with better type support and async handling
jest.mock('gsap', () => ({
  to: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    kill: jest.fn(),
  })),
  from: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    kill: jest.fn(),
  })),
  fromTo: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    kill: jest.fn(),
  })),
  timeline: jest.fn().mockImplementation(() => ({
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    restart: jest.fn(),
    reverse: jest.fn(),
    kill: jest.fn(),
    progress: jest.fn(),
    add: jest.fn().mockReturnThis(),
  })),
  set: jest.fn(),
  getProperty: jest.fn(),
  setProperty: jest.fn(),
  registerPlugin: jest.fn(),
  Power2: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
  config: {
    autoSleep: 60,
    force3D: false,
    nullTargetWarn: true,
    units: {
      lineHeight: '',
      rotation: 'deg',
      xPercent: '%',
      yPercent: '%',
    },
  },
}));

// Modern environment setup with better type support
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC'; // Ensure consistent timezone in tests

// Add modern Jest matchers
expect.extend({
  toHaveBeenCalledWithMatch(received, ...expected) {
    const pass = received.mock.calls.some(call =>
      expected.every((arg, index) => {
        if (arg instanceof RegExp) {
          return arg.test(call[index]);
        }
        return call[index] === arg;
      })
    );

    return {
      message: () =>
        `expected ${received.getMockName()} to have been called with matching arguments`,
      pass,
    };
  },
}); 