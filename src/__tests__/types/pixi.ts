import { describe, test, expect } from '@jest/globals';

// Basic types for PixiJS v8 mocks in tests
export interface Texture {
  width: number;
  height: number;
  valid: boolean;
  destroy: jest.Mock;
  update: jest.Mock;
  source: {
    width: number;
    height: number;
    resource: any;
  };
}

export interface Filter {
  enabled: boolean;
  destroy: jest.Mock;
  apply: jest.Mock;
}

export interface Container {
  addChild: jest.Mock;
  removeChild: jest.Mock;
  destroy: jest.Mock;
  children: any[];
  filters: Filter[] | null;
  width: number;
  height: number;
}

export interface Renderer {
  width: number;
  height: number;
  backgroundColor: number;
  render: jest.Mock;
  resize: jest.Mock;
  view: HTMLCanvasElement;
  events: {
    add: jest.Mock;
    remove: jest.Mock;
  };
  destroy: jest.Mock;
  screen: {
    width: number;
    height: number;
  };
}

export interface Stage extends Container {
  // Stage is just a special container
}

export interface Application {
  stage: Stage;
  renderer: Renderer;
  view: HTMLCanvasElement;
  screen: {
    width: number;
    height: number;
  };
  destroy: jest.Mock;
  init: jest.Mock;
}

// Add a simple test to satisfy Jest's requirement
describe('Pixi Types', () => {
  test('Stage interface has required properties', () => {
    const mockStage: Stage = {
      addChild: jest.fn(),
      removeChild: jest.fn(),
      destroy: jest.fn(),
      children: [],
      filters: null,
      width: 0,
      height: 0
    };

    expect(mockStage.addChild).toBeDefined();
    expect(mockStage.removeChild).toBeDefined();
    expect(mockStage.destroy).toBeDefined();
    expect(Array.isArray(mockStage.children)).toBe(true);
    expect(mockStage.width).toBeDefined();
    expect(mockStage.height).toBeDefined();
  });
});
