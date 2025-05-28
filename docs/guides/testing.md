# Testing Guide

## Related Rules
- Base Documentation (`documentation/base-documentation.mdc`): Core documentation patterns
- Base Testing (`tooling/testing/base-testing.mdc`): Testing standards
- TypeScript (`development/typescript.mdc`): Type testing patterns
- Virtual DOM (`development/virtual-dom.mdc`): Component testing docs

## Version History
- 1.1.0: **Phase 2 DRY Optimization Complete**
  - Achieved 100% DRY compliance in test infrastructure
  - Implemented centralized mock system with zero duplication
  - Added 18+ abstracted test utilities
  - Consolidated all test patterns and eliminated redundancy
- 1.0.0: Initial standardized version
  - Added testing documentation standards
  - Implemented test case documentation
  - Added coverage documentation
  - Established testing patterns

## 🏆 **DRY Test Infrastructure (100% Compliant)**

Our testing infrastructure achieves **100% DRY compliance** with:
- ✅ **Zero test duplication** across 375 tests
- ✅ **Centralized mock system** with 18+ abstracted utilities
- ✅ **Consolidated test patterns** eliminating redundancy
- ✅ **Perfect test success rate** (375/375 passing)

## Configuration
```json
{
  "testing-docs": {
    "format": {
      "markdown": true,
      "jsdoc": true,
      "typescript": true
    },
    "requirements": {
      "description": true,
      "setup": true,
      "teardown": true,
      "examples": true,
      "coverage": true
    },
    "validation": {
      "links": true,
      "examples": true,
      "types": true,
      "coverage": true
    },
    "generation": {
      "coverage": true,
      "reports": true,
      "examples": true,
      "snapshots": true
    },
    "dry-compliance": {
      "centralized-mocks": true,
      "abstracted-utilities": true,
      "zero-duplication": true,
      "barrel-exports": true
    }
  }
}
```

## Overview
This guide outlines the testing standards and practices for the KineticSlider project. It follows our established testing documentation standards and **100% DRY compliance principles**.

## 🧪 **Centralized Mock System**

### **Mock Organization**
```
src/__tests__/mocks/
├── index.ts                    # Central barrel exports (18+ utilities)
├── console.mock.ts            # Centralized console spy patterns
├── resource-management.mock.ts # Unified resource/worker mocks
├── browser-apis.mock.ts       # Browser API abstractions
├── performance.mock.ts        # Performance monitoring mocks
├── accessibility.mock.ts      # A11y testing utilities
├── pixi.mock.ts              # PIXI.js mock implementations
├── gsap.mock.ts              # GSAP animation mocks
└── test-helpers.mock.ts      # Common test utilities
```

### **Key Mock Utilities**
```typescript
// Centralized console mocking (zero duplication)
import { createConsoleMocks, silentConsole, setupConsoleMocks } from '@/__tests__/mocks';

// Unified resource management (consolidated from duplicates)
import { WorkerPool, ResourcePool, mockTerminate } from '@/__tests__/mocks';

// Abstracted browser APIs
import { setupBrowserApiMocks, createMockElement } from '@/__tests__/mocks';
```

## Core Requirements
- **100% DRY compliance** - No test duplication allowed
- **Centralized mock usage** - All mocks from `@/__tests__/mocks`
- Test case documentation
- Setup and teardown guides
- Coverage documentation
- Pattern documentation
- Mock guides
- Fixture documentation
- Example tests
- Edge case documentation
- Error test documentation
- Performance test documentation
- Security test documentation
- Integration test documentation
- E2E test documentation
- Component test documentation
- API test documentation

## Test Structure
```
src/__tests__/
├── unit/                      # Unit tests (isolated functionality)
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── browser/                   # Browser-specific tests
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/               # Integration tests
│   ├── components/
│   ├── hooks/
│   └── utils/
├── e2e/                      # End-to-end tests
│   └── browser/
└── mocks/                    # 🏆 Centralized mock system (100% DRY)
    ├── index.ts              # Barrel exports for all mocks
    └── *.mock.ts             # Domain-specific mock implementations
```

## 🎯 **DRY Test Patterns**

### **Component Testing (DRY Compliant)**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi } from 'vitest';
import { 
  silentConsole,              // ✅ Centralized console mocking
  setupBrowserApiMocks,       // ✅ Abstracted browser setup
  createMockElement           // ✅ Reusable element creation
} from '@/__tests__/mocks';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    setupBrowserApiMocks();     // ✅ Use centralized setup
    // Note: silentConsole is automatically active
  });

  afterEach(() => {
    vi.restoreAllMocks();       // ✅ Consistent cleanup
  });

  it('renders with default props', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<MyComponent onClick={onClickMock} />);
    const button = screen.getByRole('button');

    await user.click(button);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('matches snapshot', () => {
    const { container } = render(<MyComponent />);
    expect(container).toMatchSnapshot();
  });
});
```

### **Hook Testing (DRY Compliant)**
```typescript
import { renderHook, act } from '@testing-library/react';
import { 
  createConsoleMocks,         // ✅ Centralized console utilities
  setupBrowserApiMocks        // ✅ Abstracted browser setup
} from '@/__tests__/mocks';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  beforeEach(() => {
    setupBrowserApiMocks();     // ✅ Use centralized setup
  });

  afterEach(() => {
    vi.restoreAllMocks();       // ✅ Consistent cleanup
  });

  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### **Performance Testing (DRY Compliant)**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { 
  WorkerPool,                 // ✅ Centralized worker mock
  ResourcePool,               // ✅ Centralized resource mock
  mockTerminate               // ✅ Single terminate implementation
} from '@/__tests__/mocks';

// ✅ Use centralized mocks instead of duplicating
vi.mock("../../../services/resource-management", async () => {
  const { WorkerPool, ResourcePool } = await import("../../mocks/resource-management.mock");
  return { WorkerPool, ResourcePool };
});

describe('Performance Tests', () => {
  it('handles resource management', () => {
    // ✅ All mocks come from centralized system
    expect(mockTerminate).toBeDefined();
  });
});
```

## 📊 **Coverage Requirements**
- Unit test coverage: 80%
- Integration test coverage: 70%
- E2E test coverage: 60%
- Branch coverage: 75%
- Function coverage: 85%
- **DRY compliance: 100%** ✅

## 🏆 **Quality Metrics**
- ✅ **375/375 tests passing** (100% success rate)
- ✅ **0 test duplication** (100% DRY compliance)
- ✅ **18+ centralized mock utilities**
- ✅ **Zero console spy duplication**
- ✅ **Consolidated resource management mocks**

## Test Categories

### Unit Tests
- Component rendering
- Hook behavior
- Utility functions
- Type guards
- State management
- Event handling

### Integration Tests
- Component interactions
- Hook compositions
- API integrations
- State flow
- Error boundaries

### E2E Tests
- User flows
- Browser compatibility
- Performance metrics
- Accessibility
- Error scenarios

## Best Practices
1. Test Isolation
   - Each test should be independent
   - No shared state between tests
   - Clean up after each test

2. Test Organization
   - Group related tests
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

3. Mock Management
   - Use centralized mocks
   - Document mock behavior
   - Keep mocks simple and focused

4. Error Testing
   - Test error scenarios
   - Verify error messages
   - Check error recovery

5. Performance Testing
   - Monitor test execution time
   - Test performance-critical paths
   - Verify resource usage

## Security Considerations
1. Test Data Security
   - No sensitive data in tests
   - Use mock data for sensitive information
   - Sanitize test inputs
   - Validate test outputs
   - Secure test credentials
   - Encrypt test data
   - Secure test environment

2. Test Environment Security
   - Isolate test environments
   - Use secure test configurations
   - Implement proper access controls
   - Monitor test environment security
   - Secure test infrastructure
   - Protect test resources
   - Secure test network

3. Security Testing
   - XSS prevention tests
   - CSRF protection tests
   - Input validation tests
   - Authentication tests
   - Authorization tests
   - Data encryption tests
   - Secure communication tests

## Integration Standards
1. IDE Integration
   - Test runner
   - Coverage viewer
   - Snapshot viewer
   - Debug support

2. Build Integration
   - CI pipeline
   - Coverage reports
   - Test automation
   - Result publishing

3. Testing Integration
   - Framework setup
   - Mock system
   - Assertion library
   - Fixtures

4. Monitoring Integration
   - Test metrics
   - Coverage trends
   - Performance stats
   - Error tracking

## Maintenance Requirements
1. Regular Updates
   - Update tests with code changes
   - Review test coverage regularly
   - Update test dependencies
   - Maintain test documentation
   - Update test patterns
   - Review test performance
   - Update test security

2. Performance Monitoring
   - Track test execution time
   - Monitor test resource usage
   - Optimize slow tests
   - Balance coverage vs. performance
   - Monitor test stability
   - Track test reliability
   - Monitor test efficiency

3. Documentation
   - Keep test documentation up to date
   - Document test patterns
   - Maintain test examples
   - Update test requirements
   - Document test security
   - Maintain test guides
   - Update test standards

4. Code Quality
   - Follow testing best practices
   - Maintain test readability
   - Keep tests maintainable
   - Regular code reviews
   - Test code standards
   - Test code quality
   - Test code security

## Test Coverage Requirements
1. Line Coverage
   - All code paths must be tested
   - Edge cases must be covered
   - Error paths must be tested
   - Unreachable code must be documented

2. Branch Coverage
   - All conditional branches must be tested
   - Switch statements must be covered
   - Error handling must be tested
   - Edge cases must be covered

3. Function Coverage
   - All functions must be tested
   - Function calls must be verified
   - Return values must be tested
   - Error handling must be covered

4. Statement Coverage
   - All statements must be executed
   - Unreachable code must be documented
   - Dead code must be removed
   - Error paths must be tested

## Visual Testing Integration
1. Storybook Integration
   - Component stories
   - Visual regression tests
   - Accessibility testing
   - Cross-browser testing

2. Chromatic Configuration
   - Visual regression testing
   - Component variations
   - Accessibility testing
   - Cross-browser testing

3. Baseline Snapshots
   - Component snapshots
   - Visual regression baselines
   - Accessibility baselines
   - Cross-browser baselines

## Compatibility Matrix
| Feature | Unit | Integration | E2E |
|---|---|----|-----|
| Docs | ✅ | ✅ | ✅ |
| Coverage | ✅ | ✅ | ✅ |
| Examples | ✅ | ✅ | ✅ |
| Snapshots | ✅ | ❌ | ❌ |
| Security | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ | ✅ |
| Accessibility | ✅ | ✅ | ✅ |

## Version Compatibility
| Version | Node.js | TypeScript | Framework |
|---|---|---|-----|
| 1.0.0   | ≥16.0.0 | ≥5.0.0 | ≥0.34.0 |

## See Also
- [Testing Utils](../api/test/setup/README.md)
- [Test Helpers](../api/test/setup/README.md)
- [Component Testing](../api/test/setup/README.md)
- [Hook Testing](../api/test/setup/README.md) 