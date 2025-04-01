# Testing Documentation

## Overview

This document outlines the testing standards and practices for the KineticSlider project. We use a comprehensive testing approach that includes unit tests, integration tests, and end-to-end tests.

## Test Types

### 1. Unit Tests

Unit tests focus on testing individual components, hooks, and utilities in isolation.

```tsx
// Example component test
import { render, screen } from '@testing-library/react';
import { KineticSlider } from '../components/KineticSlider';

describe('KineticSlider', () => {
  it('renders slides correctly', () => {
    const slides = [
      { id: '1', content: 'Slide 1' },
      { id: '2', content: 'Slide 2' }
    ];
    
    render(<KineticSlider slides={slides} />);
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });
  
  it('handles slide navigation', async () => {
    const onSlideChange = jest.fn();
    render(
      <KineticSlider
        slides={slides}
        onSlideChange={onSlideChange}
      />
    );
    
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });
});
```

### 2. Integration Tests

Integration tests verify that different parts of the application work together correctly.

```tsx
// Example integration test
describe('Slider Integration', () => {
  it('integrates with gesture system', async () => {
    const { container } = render(<KineticSlider slides={slides} />);
    
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: container },
      { coords: { x: -100, y: 0 } },
      { keys: '[/MouseLeft]' }
    ]);
    
    expect(screen.getByText('Slide 2')).toBeVisible();
  });
  
  it('integrates with keyboard navigation', () => {
    render(<KineticSlider slides={slides} enableKeyboard />);
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('Slide 2')).toBeVisible();
  });
});
```

### 3. End-to-End Tests

E2E tests verify the application works correctly in a real browser environment.

```typescript
// Example Cypress test
describe('Slider E2E', () => {
  beforeEach(() => {
    cy.visit('/slider');
  });
  
  it('supports touch interactions', () => {
    cy.get('[data-testid="slider"]')
      .trigger('touchstart', { touches: [{ clientX: 200 }] })
      .trigger('touchmove', { touches: [{ clientX: 100 }] })
      .trigger('touchend');
    
    cy.get('[data-testid="slide-2"]').should('be.visible');
  });
  
  it('handles keyboard navigation', () => {
    cy.get('body').type('{rightarrow}');
    cy.get('[data-testid="slide-2"]').should('be.visible');
  });
});
```

## Test Coverage

We maintain high test coverage across the codebase:

- Unit Tests: > 90% coverage
- Integration Tests: > 80% coverage
- E2E Tests: All critical user paths

### Coverage Requirements

```typescript
// Example Jest configuration
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Testing Utilities

### 1. Test Helpers

```typescript
// test/helpers.ts
export const createTestSlides = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i),
    content: `Slide ${i + 1}`
  }));

export const simulateGesture = async (
  element: HTMLElement,
  { x, y }: { x: number; y: number }
) => {
  fireEvent.mouseDown(element, { clientX: 0, clientY: 0 });
  fireEvent.mouseMove(element, { clientX: x, clientY: y });
  fireEvent.mouseUp(element);
};
```

### 2. Test Hooks

```typescript
// test/hooks.ts
export const renderHook = (hook: () => any) => {
  let result: any;
  
  function TestComponent() {
    result = hook();
    return null;
  }
  
  render(<TestComponent />);
  return result;
};
```

## Performance Testing

### 1. Render Performance

```typescript
describe('Performance', () => {
  it('renders within budget', async () => {
    const start = performance.now();
    render(<KineticSlider slides={slides} />);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

### 2. Animation Performance

```typescript
describe('Animation Performance', () => {
  it('maintains 60fps during transitions', async () => {
    const { container } = render(<KineticSlider slides={slides} />);
    const frames: number[] = [];
    
    requestAnimationFrame(function measure(time) {
      frames.push(time);
      if (frames.length < 60) {
        requestAnimationFrame(measure);
      }
    });
    
    // Trigger animation
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Wait for frames
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate FPS
    const fps = frames.length;
    expect(fps).toBeGreaterThanOrEqual(58);
  });
});
```

## Accessibility Testing

### 1. ARIA Compliance

```typescript
describe('Accessibility', () => {
  it('has correct ARIA attributes', () => {
    render(<KineticSlider slides={slides} />);
    
    const slider = screen.getByRole('region');
    expect(slider).toHaveAttribute('aria-label');
    expect(slider).toHaveAttribute('aria-live', 'polite');
  });
  
  it('supports keyboard navigation', () => {
    render(<KineticSlider slides={slides} />);
    
    const slider = screen.getByRole('region');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    
    expect(screen.getByText('Slide 2')).toHaveAttribute('aria-selected', 'true');
  });
});
```

### 2. Focus Management

```typescript
describe('Focus Management', () => {
  it('maintains focus during navigation', () => {
    render(<KineticSlider slides={slides} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    nextButton.focus();
    fireEvent.click(nextButton);
    
    expect(nextButton).toHaveFocus();
  });
});
```

## Error Testing

### 1. Error Boundaries

```typescript
describe('Error Handling', () => {
  it('catches and handles errors', () => {
    const onError = jest.fn();
    const BuggyComponent = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary onError={onError}>
        <BuggyComponent />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

### 2. Async Error Handling

```typescript
describe('Async Errors', () => {
  it('handles async failures', async () => {
    const failingOperation = () => Promise.reject(new Error('Test error'));
    
    await expect(
      handleAsyncError(failingOperation, 3, 1000)
    ).rejects.toThrow('Test error');
  });
});
```

## Continuous Integration

We use GitHub Actions for continuous integration:

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
      - run: npm run test:coverage
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests.
2. **Cleanup**: Clean up after each test to prevent state leakage.
3. **Mocking**: Use mocks sparingly and prefer integration tests when possible.
4. **Coverage**: Write meaningful tests rather than focusing solely on coverage numbers.
5. **Documentation**: Document test setup and any non-obvious test scenarios. 