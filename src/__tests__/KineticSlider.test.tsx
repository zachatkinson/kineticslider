import React from 'react';
import { render } from '@testing-library/react';
import { KineticSlider } from '../index';
import { TextPair } from '../types'; // Import the TextPair type
import { jest, describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals';

// Mock window properties and methods that might be used by the KineticSlider
// Use Object.defineProperty instead of direct assignment for readonly properties
beforeAll(() => {
    // Save original values
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

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
});

describe('KineticSlider Component', () => {
    const mockImages = ['/images/slide1.jpg', '/images/slide2.jpg'];
    // Explicitly type mockTexts as TextPair[] to ensure it matches the expected type
    const mockTexts: TextPair[] = [
        ['Title 1', 'Subtitle 1'],
        ['Title 2', 'Subtitle 2']
    ];

    beforeEach(() => {
        // Reset any mocks between tests
        jest.clearAllMocks();
    });

    test('renders without crashing', () => {
        render(
            <KineticSlider
                images={mockImages}
                texts={mockTexts}
            />
        );

        // Basic assertion to verify component renders
        expect(document.querySelector('.kineticSlider')).toBeInTheDocument();
    });
});