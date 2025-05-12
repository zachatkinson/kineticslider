/**
 * Mock implementations for PIXI.js
 */
import { vi } from "vitest";

// Mock PIXI.js Application
const mockApplication = vi.fn().mockImplementation(() => ({
  destroy: vi.fn(),
  renderer: {
    resize: vi.fn(),
    view: document.createElement("canvas"),
  },
  ticker: {
    add: vi.fn(),
  },
  stage: {
    addChild: vi.fn(),
  },
}));

// Mock PIXI.js Container
const mockContainer = vi.fn().mockImplementation(() => ({
  addChild: vi.fn(),
  destroy: vi.fn(),
  visible: true,
  alpha: 1,
}));

// Mock PIXI.js Sprite
const mockSprite = vi.fn().mockImplementation(() => ({
  anchor: {
    set: vi.fn(),
  },
  position: {
    set: vi.fn(),
  },
  scale: {
    set: vi.fn(),
  },
  destroy: vi.fn(),
  texture: { destroy: vi.fn(), width: 800, height: 600 },
}));

// Mock PIXI.js Assets
const mockAssets = {
  load: vi.fn().mockImplementation((url: string) => {
    if (url === "error.jpg") {
      return Promise.reject(new Error("Failed to load texture"));
    }
    return Promise.resolve({ destroy: vi.fn(), width: 800, height: 600 });
  }),
};

// Export the mock PIXI.js module
export const mockPixi = {
  Application: mockApplication,
  Container: mockContainer,
  Sprite: mockSprite,
  Assets: mockAssets,
};

export default mockPixi;
