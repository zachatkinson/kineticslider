/**
 * Mock implementations for PIXI.js
 */
import { vi } from "vitest";

// Define proper types for PIXI options
interface MockApplicationOptions {
  width?: number;
  height?: number;
  view?: HTMLCanvasElement;
  backgroundColor?: number;
  resolution?: number;
}

interface MockTexture {
  destroy: () => void;
  width: number;
  height: number;
  valid: boolean;
}

// Mock PIXI.js Application
const mockApplication = vi.fn().mockImplementation((options?: MockApplicationOptions) => {
  const mockStage = {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
    destroy: vi.fn(),
  };

  const app = {
    destroy: vi.fn(),
    renderer: {
      resize: vi.fn(),
      view: options?.view || document.createElement("canvas"),
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    },
    stage: mockStage,
    view: options?.view || document.createElement("canvas"),
    screen: {
      width: options?.width || 800,
      height: options?.height || 600,
    },
  };
  
  return app;
});

// Mock PIXI.js Container
const mockContainer = vi.fn().mockImplementation(() => ({
  addChild: vi.fn(),
  removeChild: vi.fn(),
  destroy: vi.fn(),
  visible: true,
  alpha: 1,
  children: [],
  position: {
    set: vi.fn(),
    x: 0,
    y: 0,
  },
  scale: {
    set: vi.fn(),
    x: 1,
    y: 1,
  },
}));

// Mock PIXI.js Sprite
const mockSprite = vi.fn().mockImplementation((texture?: MockTexture) => ({
  anchor: {
    set: vi.fn(),
    x: 0.5,
    y: 0.5,
  },
  position: {
    set: vi.fn(),
    x: 0,
    y: 0,
  },
  scale: {
    set: vi.fn(),
    x: 1,
    y: 1,
  },
  destroy: vi.fn(),
  texture: texture || { 
    destroy: vi.fn(), 
    width: 800, 
    height: 600,
    valid: true,
  },
  visible: true,
  alpha: 1,
}));

// Mock PIXI.js Assets
const mockAssets = {
  load: vi.fn().mockImplementation((url: string) => {
    if (url === "error.jpg") {
      return Promise.reject(new Error("Failed to load texture"));
    }
    return Promise.resolve({ 
      destroy: vi.fn(), 
      width: 800, 
      height: 600,
      valid: true,
    });
  }),
  add: vi.fn(),
  get: vi.fn(),
};

// Create the complete PIXI namespace mock
const pixiNamespaceMock = {
  Application: mockApplication,
  Container: mockContainer,
  Sprite: mockSprite,
  Assets: mockAssets,
  // Add other PIXI classes that might be used
  Graphics: vi.fn(),
  Text: vi.fn(),
  Texture: {
    from: vi.fn(),
    EMPTY: { destroy: vi.fn() },
  },
  Loader: {
    shared: {
      add: vi.fn(),
      load: vi.fn(),
    },
  },
};

// Export as both default and named exports to handle different import styles
export default pixiNamespaceMock;

// Named exports for compatibility
export const Application = mockApplication;
export const Container = mockContainer;
export const Sprite = mockSprite;
export const Assets = mockAssets;
