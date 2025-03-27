# KineticSlider

[![npm version](https://img.shields.io/npm/v/kineticslider.svg)](https://www.npmjs.com/package/kineticslider)
[![npm downloads](https://img.shields.io/npm/dm/kineticslider.svg)](https://www.npmjs.com/package/kineticslider)
[![Build Status](https://github.com/zach/kineticslider/workflows/CI/badge.svg)](https://github.com/zach/kineticslider/actions)
[![Coverage Status](https://coveralls.io/repos/github/zach/kineticslider/badge.svg?branch=main)](https://coveralls.io/github/zach/kineticslider?branch=main)
[![License](https://img.shields.io/npm/l/kineticslider.svg)](https://github.com/zach/kineticslider/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/zach/kineticslider/blob/main/CONTRIBUTING.md)

A modern, accessible, and performant slider component for React applications. Built with TypeScript and optimized for performance.

## Features

- 🎯 Fully accessible (ARIA compliant)
- 🚀 High performance with GSAP animations
- 🎨 Customizable styling
- 📱 Responsive design
- 🔧 TypeScript support
- 📦 Tree-shakeable
- 🧪 Comprehensive test coverage
- 📚 Detailed documentation

## Installation

```bash
npm install kineticslider
# or
yarn add kineticslider
# or
pnpm add kineticslider
```

## Quick Start

```tsx
import { KineticSlider } from 'kineticslider';

function App() {
  return (
    <KineticSlider
      items={[
        { id: 1, content: 'Slide 1' },
        { id: 2, content: 'Slide 2' },
        { id: 3, content: 'Slide 3' },
      ]}
      options={{
        animation: 'fade',
        duration: 0.5,
        autoplay: true,
      }}
    />
  );
}
```

## Documentation

For detailed documentation, visit our [documentation site](https://kineticslider.dev).

### API Reference

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `Array<SliderItem>` | `[]` | Array of items to display in the slider |
| options | `SliderOptions` | `{}` | Configuration options for the slider |
| className | `string` | `''` | Additional CSS classes |
| style | `CSSProperties` | `{}` | Additional inline styles |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| animation | `'fade' \| 'slide' \| 'zoom'` | `'fade'` | Animation type |
| duration | `number` | `0.5` | Animation duration in seconds |
| autoplay | `boolean` | `false` | Enable autoplay |
| interval | `number` | `5000` | Autoplay interval in milliseconds |
| pauseOnHover | `boolean` | `true` | Pause autoplay on hover |
| showArrows | `boolean` | `true` | Show navigation arrows |
| showDots | `boolean` | `true` | Show navigation dots |

## Examples

### Basic Usage
```tsx
<KineticSlider items={items} />
```

### Custom Animation
```tsx
<KineticSlider
  items={items}
  options={{
    animation: 'zoom',
    duration: 0.8,
  }}
/>
```

### Autoplay with Custom Interval
```tsx
<KineticSlider
  items={items}
  options={{
    autoplay: true,
    interval: 3000,
    pauseOnHover: true,
  }}
/>
```

## Performance

KineticSlider is optimized for performance:
- Uses GSAP for smooth animations
- Implements virtual rendering for large lists
- Minimizes re-renders with React.memo
- Supports tree-shaking
- Zero unnecessary dependencies

## Browser Support

- Chrome >= 88
- Firefox >= 87
- Safari >= 14
- Edge >= 88

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Zach](https://github.com/zach)

## Support

- [Documentation](https://kineticslider.dev)
- [GitHub Issues](https://github.com/zach/kineticslider/issues)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Project Configuration

This project uses several configuration files to ensure consistent development:

#### npm Configuration (.npmrc)

The project uses specific npm settings to ensure reproducible builds and prevent common issues:

```npmrc
# Ensure exact versions are saved
save-exact=true

# Use package-lock.json for reproducible builds
package-lock=true

# Enforce Node.js version from package.json
engine-strict=true

# Allow legacy peer deps for React compatibility
legacy-peer-deps=true

# Prevent accidental publishing
access=restricted
```

These settings:
- Maintain exact dependency versions for reproducible builds
- Enforce Node.js version requirements
- Handle React peer dependency conflicts
- Prevent accidental package publishing

#### TypeScript Configuration (tsconfig.json)

The project uses strict TypeScript settings for better type safety:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Key features:
- Modern ECMAScript target
- Strict type checking
- Path aliases for cleaner imports
- React JSX support
- Module resolution optimization

#### ESLint Configuration (eslint.config.js)

The project uses ESLint with strict rules for code quality:

```js
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      // React rules
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Accessibility rules
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
];
```

Key features:
- Modern flat config format
- React and React Hooks rules
- Accessibility rules
- TypeScript integration
- Strict code quality rules

#### Prettier Configuration (prettier.config.js)

The project uses Prettier for consistent code formatting:

```js
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 100,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
};
```

Key features:
- Consistent quote style
- Modern JavaScript features
- React-specific formatting
- Import sorting
- File-specific overrides

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier 