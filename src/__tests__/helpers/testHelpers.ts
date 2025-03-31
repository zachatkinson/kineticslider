import { Mock } from 'vitest';
import type { SlideId } from '@/types/branded';

interface MockPixiApplication {
  renderer: {
    resize: Mock;
  };
  stage: {
    addChild: Mock;
  };
  ticker: {
    add: Mock;
  };
  destroy: Mock;
}

interface MockPixiContainer {
  addChild: Mock;
  destroy: Mock;
  visible: boolean;
  alpha: number;
}

interface MockPixiSprite {
  anchor: { set: Mock };
  position: { set: Mock };
  scale: { set: Mock };
  destroy: Mock;
  texture: {
    width: number;
    height: number;
  };
}

export interface MockPixiAssets {
  load: Mock;
}

type MockResult<T> = {
  type: 'return' | 'throw';
  value: T;
};

export const getMockApp = (mock: Mock): MockPixiApplication => {
  const results = mock.mock.results as Array<MockResult<MockPixiApplication>>;
  if (results.length === 0) {
    throw new Error('Mock app not initialized');
  }

  const firstResult = results[0]!;
  if (firstResult.type !== 'return') {
    throw new Error('Mock app initialization failed');
  }

  return firstResult.value;
};

export const getMockContainer = (mock: Mock): MockPixiContainer => {
  const results = mock.mock.results as Array<MockResult<MockPixiContainer>>;
  if (results.length === 0) {
    throw new Error('Mock container not initialized');
  }

  const firstResult = results[0]!;
  if (firstResult.type !== 'return') {
    throw new Error('Mock container initialization failed');
  }

  return firstResult.value;
};

export const getMockSprite = (mock: Mock): MockPixiSprite => {
  const results = mock.mock.results as Array<MockResult<MockPixiSprite>>;
  if (results.length === 0) {
    throw new Error('Mock sprite not initialized');
  }

  const firstResult = results[0]!;
  if (firstResult.type !== 'return') {
    throw new Error('Mock sprite initialization failed');
  }

  return firstResult.value;
};

/**
 * Creates a branded SlideId from a string
 * @param id - The string to convert to a SlideId
 */
export const createSlideId = (id: string): SlideId => id as SlideId; 