// Import testing library utilities
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
import { toHaveNoViolations } from 'jest-axe';
import 'jest-canvas-mock';
import 'whatwg-fetch';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 2000,
  computedStyleSupportsPseudoElements: true,
  defaultHidden: true,
});

// Extend Jest matchers
expect.extend({
  toHaveNoViolations,
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
  toMatchPerformanceSnapshot(received) {
    const start = performance.now();
    received();
    const end = performance.now();
    const duration = end - start;

    return {
      message: () => `expected performance to match snapshot`,
      pass: duration <= (this.snapshotData?.duration || Infinity),
    };
  },
});

// Polyfill TextEncoder/TextDecoder for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Modern window.matchMedia implementation
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

// Enhanced ResizeObserver mock with better type support
class ResizeObserverMock {
  #callbacks = new Set();
  
  observe(target, options = {}) {
    this.#callbacks.add({ target, options });
  }
  
  unobserve(target) {
    this.#callbacks.forEach((_entry, _index) => {
      if (_entry.target === target) {
        this.#callbacks.delete(_entry);
      }
    });
  }
  
  disconnect() {
    this.#callbacks.clear();
  }
  
  trigger(entries) {
    this.#callbacks.forEach(({ target }) => {
      const entry = entries.find(e => e.target === target);
      if (entry) {
        this.#callbacks.forEach(callback => callback(entries));
      }
    });
  }
}
global.ResizeObserver = ResizeObserverMock;

// Enhanced IntersectionObserver mock with better type support
class IntersectionObserverMock {
  #callbacks = new Set();
  #options;
  
  constructor(callback, options = {}) {
    this.#callbacks.add(callback);
    this.#options = options;
  }
  
  observe(target) {
    const entry = {
      target,
      isIntersecting: true,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: 1,
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: this.#options.root?.getBoundingClientRect() || null,
      time: Date.now(),
    };
    this.#callbacks.forEach(callback => callback([entry], this));
  }
  
  unobserve(target) {
    this.#callbacks.forEach((_entry, _index) => {
      if (_entry.target === target) {
        this.#callbacks.delete(_entry);
      }
    });
  }
  
  disconnect() {
    this.#callbacks.clear();
  }
  
  takeRecords() {
    return [];
  }
}
global.IntersectionObserver = IntersectionObserverMock;

// Enhanced requestAnimationFrame implementation
const RAF_TIMEOUT = 1000 / 60; // 60fps
let rafId = 0;
global.requestAnimationFrame = (callback) => {
  rafId += 1;
  setTimeout(() => callback(performance.now()), RAF_TIMEOUT);
  return rafId;
};
global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Enhanced console handling with better filtering and logging
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

const createFilteredConsole = (original, filterPatterns) => (...args) => {
  if (
    typeof args[0] === 'string' &&
    filterPatterns.some(pattern => args[0].includes(pattern))
  ) {
    return;
  }
  
  // Add test context to console output
  const testContext = expect.getState();
  const prefix = testContext.currentTestName
    ? `[${testContext.currentTestName}] `
    : '';
    
  original.call(console, prefix, ...args);
};

// Mock GSAP
const timelineMock = {
  to: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  kill: jest.fn().mockReturnThis(),
  pause: jest.fn().mockReturnThis(),
  resume: jest.fn().mockReturnThis(),
  progress: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  reverse: jest.fn().mockReturnThis(),
};

const gsapMock = {
  to: jest.fn().mockReturnValue(timelineMock),
  from: jest.fn().mockReturnValue(timelineMock),
  fromTo: jest.fn().mockReturnValue(timelineMock),
  set: jest.fn().mockReturnValue(timelineMock),
  timeline: jest.fn().mockReturnValue(timelineMock),
  killTweensOf: jest.fn(),
  core: {
    Timeline: jest.fn().mockImplementation(() => timelineMock),
  },
};

// Mock GSAP module
jest.mock('gsap', () => ({
  __esModule: true,
  default: gsapMock,
  ...gsapMock,
}));

// Make the mock available globally for tests
global.gsapMock = gsapMock;
global.timelineMock = timelineMock;

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  Object.values(timelineMock).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
  Object.values(gsapMock).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
});

beforeAll(() => {
  const filterPatterns = [
    'Warning: ReactDOM.render is no longer supported',
    'Warning: ReactDOM.hydrate is no longer supported',
    'Warning: ReactDOM.unmountComponentAtNode is no longer supported',
    'Warning: ReactDOM.findDOMNode is no longer supported',
    'Warning: ReactDOM.createPortal is no longer supported',
    'Warning: Using UNSAFE_',
    'Warning: Legacy context API',
    'Warning: componentWillMount',
    'Warning: componentWillReceiveProps',
    'Warning: componentWillUpdate',
  ];

  console.error = createFilteredConsole(originalError, filterPatterns);
  console.warn = createFilteredConsole(originalWarn, filterPatterns);
  console.log = createFilteredConsole(originalLog, []);
  
  // Setup performance monitoring
  if (typeof window !== 'undefined') {
    window.performance = {
      ...window.performance,
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn().mockReturnValue([]),
      getEntriesByName: jest.fn().mockReturnValue([]),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
    };
  }
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
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

// Modern environment setup
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

// Setup snapshot serializers
expect.addSnapshotSerializer({
  test: (val) => val && val.$$typeof === Symbol.for('react.test.json'),
  print: (val, serialize) => serialize(val.props),
});

// Setup async utilities
global.waitFor = (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const result = await callback();
        resolve(result);
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    };
    check();
  });
};

// Add test environment helpers
global.mockWindowProperty = (property, value) => {
  const { [property]: originalValue } = window;
  delete window[property];
  beforeAll(() => {
    Object.defineProperty(window, property, {
      configurable: true,
      writable: true,
      value,
    });
  });
  afterAll(() => {
    Object.defineProperty(window, property, {
      configurable: true,
      writable: true,
      value: originalValue,
    });
  });
};

// Add cleanup utility
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  // Clear all timers
  jest.clearAllTimers();
  // Clear all fake timers
  if (jest.isFakeTimers()) {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }
}); 