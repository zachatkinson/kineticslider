/**
 * PIXI-related test type definitions
 *
 * @module
 * @version 1.0.0
 */

import type { Mock } from "vitest";

/**
 * Mock PIXI Container interface
 *
 * @example Example usage
 */
export interface MockPixiContainer {
  addChild: Mock;
  removeChild: Mock;
  children: unknown[];
  x: number;
  y: number;
  _width: number;
  _height: number;
  scale: {
    x: number;
    y: number;
  };
}

/**
 * Mock PIXI Application interface
 *
 * @example Example usage
 */
export interface MockPixiApplication {
  stage: MockPixiContainer;
  renderer: {
    resize: (_width: number, _height: number) => void;
    view: HTMLCanvasElement;
  };
  destroy: () => void;
}

/**
 * Mock PIXI Sprite interface
 *
 * @example Example usage
 */
export interface MockPixiSprite {
  texture: unknown;
  anchor: {
    x: number;
    y: number;
  };
  position: {
    x: number;
    y: number;
  };
  scale: {
    x: number;
    y: number;
  };
  alpha: number;
  visible: boolean;
  destroy: () => void;
}
