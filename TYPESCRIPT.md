# TypeScript Configuration

This document outlines the TypeScript configuration setup for the project.

## Configuration Files

- `tsconfig.json` - Base TypeScript configuration for the project
- `tsconfig.test.json` - Configuration for general tests (extends base)
- `tsconfig.testing.json` - Enhanced configuration specifically for React/JSX testing

## Testing Configuration

For test files that use React and JSX, we use a specialized configuration in `tsconfig.testing.json` that:

1. Sets `jsx` to `react` mode (rather than `preserve` used in the main project)
2. Ensures `esModuleInterop` and `allowSyntheticDefaultImports` are enabled
3. Includes test-specific type definitions (vitest, jest, testing-library)
4. Relaxes certain rules like `noUnusedLocals` and `noUnusedParameters` for tests

## Common Issues

### JSX/React Import Issues

If you encounter errors like:
- `JSX cannot be used unless the '--jsx' flag is provided`
- `Module can only be default-imported using the 'esModuleInterop' flag`

Use the `test:types` script which checks types using the correct configuration:

```bash
npm run test:types
```

Or check a specific file:

```bash
npx tsc -p tsconfig.testing.json --noEmit path/to/file.tsx
```

### Vitest Integration

The Vitest configuration in `vitest.config.ts` is set up to use the `tsconfig.testing.json` configuration specifically for tests.

## Best Practices

1. Always import React explicitly in test files:
   ```typescript
   import React from 'react';
   ```

2. Use proper type imports for components under test:
   ```typescript
   import type { ComponentProps } from 'react';
   import { YourComponent } from '../../components/YourComponent';
   ```

3. For mocked components, ensure they mirror the real component's props:
   ```typescript
   function MockComponent(props: ComponentProps<typeof RealComponent>) {
     // Mock implementation
   }
   ``` 