import React from 'react';
import { render, act } from '@testing-library/react';
import KineticSlider from '../KineticSlider';
import { TextPair } from '../types'; // Import the TextPair type
import { jest, describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals';

// Save original values
const originalInnerWidth = window.innerWidth;
const originalInnerHeight = window.innerHeight;

// Mock window properties and methods that might be used by the KineticSlider
beforeAll(() => {
  // Mock the properties
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1024,
    writable: true
  });

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 768,
    writable: true
  });
});

// Restore original values after tests
afterAll(() => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: originalInnerWidth,
    writable: true
  });

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: originalInnerHeight,
    writable: true
  });
});

describe('KineticSlider', () => {
  it('renders without crashing', async () => {
    const images = ['test1.jpg', 'test2.jpg'];
    const texts: TextPair[] = [
      ['Title 1', 'Subtitle 1'],
      ['Title 2', 'Subtitle 2']
    ];

    await act(async () => {
      const { container } = render(
        <KineticSlider
          images={images}
          texts={texts}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
