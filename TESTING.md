# Testing KineticSlider

This document outlines the testing strategy, tools, and practices for the KineticSlider component.

## Testing Stack

The KineticSlider project uses the following testing tools:

- **Jest**: Main testing framework
- **React Testing Library**: For testing React components
- **jest-canvas-mock**: For mocking canvas and WebGL operations
- **Mock implementations**: For PIXI.js, GSAP, and other complex dependencies

## Getting Started with Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The project aims for 80% code coverage across the codebase. Critical paths should have 95% coverage.

To view coverage:
1. Run `npm run test:coverage`
2. Open the generated report in `coverage/lcov-report/index.html`

## Test Organization

Tests are organized to match the source structure:

```
src/
  __tests__/               # Test files
    hooks/                 # Tests for hooks
    filters/               # Tests for filters
    managers/              # Tests for manager classes
    KineticSlider.test.tsx # Main component tests
```

## Testing Guidelines

### Component Testing

- Test props validation and rendering
- Test lifecycle methods
- Test component interactions
- Focus on public API, not implementation details

### Hook Testing

- Use `renderHook` from `@testing-library/react-hooks`
- Mock dependencies
- Test state changes and side effects
- Verify cleanup

### WebGL/PIXI Testing

- Use mocks for PIXI classes and WebGL
- Focus on behavior rather than actual rendering
- Test resource creation and cleanup
- Verify animations are created/destroyed properly

### Testing Filters and Effects

- Test filter creation and parameter handling
- Verify filter changes are applied
- Test performance optimization features

## Mocking Strategy

The project relies heavily on mocking for external dependencies:

1. **PIXI.js**: Custom mocks for Sprite, Container, etc.
2. **GSAP**: Mocked timeline and animation methods
3. **Browser APIs**: Mocks for canvas, requestAnimationFrame, etc.

See `jest.setup.js` for detailed mock implementations.

## Writing New Tests

When writing new tests:

1. Start with basic functionality tests
2. Add edge cases and error handling tests
3. Consider performance implications
4. Test resource cleanup and memory management

Example:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useSomeHook } from '../hooks/useSomeHook';

describe('useSomeHook', () => {
  test('should initialize correctly', () => {
    const { result } = renderHook(() => useSomeHook());
    expect(result.current).toHaveProperty('someProperty');
  });
});
```

## Continuous Integration

Tests are run automatically on GitHub Actions for:
- Pull requests to main branch
- Push to main branch

The CI pipeline runs `npm run test:ci` which generates coverage reports.

## Troubleshooting Common Issues

### Canvas/WebGL Errors

If you encounter errors related to canvas or WebGL:
- Check that jest-canvas-mock is properly configured
- Verify PIXI mocks include necessary methods
- Consider additional mock implementations

### Asynchronous Test Issues

For issues with async tests:
- Use `async/await` or `act()` when testing state updates
- Increase timeout for tests that need it with `jest.setTimeout()`
- Use `waitFor` for assertions that may take time to become true 