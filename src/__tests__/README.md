# Test Documentation

## Directory Structure

- `unit/`: Unit tests for individual components and hooks
- `integration/`: Integration tests for component interactions
- `e2e/`: End-to-end tests using Playwright (planned)
- `fixtures/`: Test data and mock events
- `mocks/`: Mock implementations (GSAP, etc.)
- `utils/`: Test utilities and helpers

## Test Conventions

### File Naming
- Unit tests: `*.test.tsx`
- Integration tests: `*.spec.tsx`
- E2E tests: `*.e2e.ts`
- Test utilities: `*.utils.ts`
- Fixtures: `*.fixtures.ts`
- Mocks: `*.mock.ts`

### Test Structure
```typescript
describe('Component/Hook Name', () => {
  describe('Feature/Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Coverage Requirements
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Running Tests
```bash
# Run tests in watch mode
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Test Utilities

### Custom Render
```typescript
import { render } from '../utils/test-utils';

const { container, getByTestId } = render(<Component />);
```

### Gesture Testing
```typescript
import { mockGestureEvents } from '../fixtures/slider.fixtures';

await act(async () => {
  result.current.handleTouchStart(mockGestureEvents.touchStart);
});
```

### Animation Testing
```typescript
import { waitForAnimationComplete } from '../utils/test-utils';

await waitForAnimationComplete(timelineMock);
```

## Best Practices

1. Use meaningful test descriptions
2. Test edge cases and error conditions
3. Mock external dependencies
4. Clean up after each test
5. Use appropriate assertions
6. Keep tests focused and isolated
7. Use test fixtures for consistent data
8. Test accessibility requirements 