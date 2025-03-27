# KineticSlider

[![npm version](https://img.shields.io/npm/v/kineticslider.svg)][npm-url]
[![npm downloads](https://img.shields.io/npm/dm/kineticslider.svg)][npm-url]
[![Build Status](https://github.com/zach/kineticslider/workflows/CI/badge.svg)][ci-url]
[![Coverage Status](https://coveralls.io/repos/github/zach/kineticslider/badge.svg?branch=main)][coverage-url]
[![License](https://img.shields.io/npm/l/kineticslider.svg)][license-url]
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)][ts-url]
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)][contributing-url]

A modern, accessible, and performant slider component for React applications. Built with TypeScript and optimized for performance using GSAP animations.

## Overview

KineticSlider is a highly performant React slider component that prioritizes accessibility, smooth animations, and developer experience. It's built with TypeScript and uses GSAP for fluid animations, making it perfect for modern web applications.

## Features

- 🎯 **Accessibility**: Fully WCAG 2.1 compliant with ARIA support
- 🚀 **Performance**: Optimized with GSAP animations and virtual rendering
- 🎨 **Customization**: Extensive styling options and animation controls
- 📱 **Responsive**: Adaptive design with touch support
- 🔧 **TypeScript**: Full type safety with comprehensive definitions
- 📦 **Bundle Size**: Tree-shakeable with minimal dependencies
- 🧪 **Testing**: 100% test coverage with Jest and Testing Library
- 📚 **Documentation**: Extensive docs with live examples

## Installation

```bash
# Using npm
npm install kineticslider

# Using yarn
yarn add kineticslider

# Using pnpm
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

Visit our [documentation site][docs-url] for comprehensive guides and API references.

### Component API

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| items | `Array<SliderItem>` | Yes | `[]` | Array of items to display |
| options | `SliderOptions` | No | `{}` | Configuration options |
| className | `string` | No | `''` | Additional CSS classes |
| style | `CSSProperties` | No | `{}` | Inline styles |
| onSlideChange | `(index: number) => void` | No | - | Slide change callback |
| onInit | `() => void` | No | - | Initialization callback |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| animation | `'fade' \| 'slide' \| 'zoom'` | `'fade'` | Animation type |
| duration | `number` | `0.5` | Animation duration (seconds) |
| autoplay | `boolean` | `false` | Enable autoplay |
| interval | `number` | `5000` | Autoplay interval (ms) |
| pauseOnHover | `boolean` | `true` | Pause on hover |
| showArrows | `boolean` | `true` | Show navigation arrows |
| showDots | `boolean` | `true` | Show navigation dots |
| easing | `string` | `'power2.out'` | GSAP easing function |

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
    easing: 'elastic.out(1, 0.3)',
  }}
/>
```

### Autoplay Configuration
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

## Technical Details

### Performance Optimizations

- GSAP-powered animations for smooth transitions
- Virtual DOM rendering for large lists
- Optimized React re-renders using memo and callbacks
- Tree-shaking support for minimal bundle size
- Lazy-loaded images with blur placeholder
- Touch event optimization for mobile devices

### Accessibility Features

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader announcements
- Focus management
- High contrast support
- Motion reduction respecting
- RTL language support

### Browser Support

- Chrome ≥ 88
- Firefox ≥ 87
- Safari ≥ 14
- Edge ≥ 88
- iOS Safari ≥ 14
- Android Chrome ≥ 88

## Development

### Prerequisites

- Node.js ≥ 18.x
- pnpm ≥ 8.x

### Project Structure

This project is set up as a monorepo using pnpm workspaces. The main packages are located in the `packages` directory:

```bash
kineticslider/
├── packages/         # Workspace packages
├── pnpm-workspace.yaml
└── package.json
```

### Setup

1. Clone the repository
```bash
git clone https://github.com/zach/kineticslider.git
cd kineticslider
```

2. Install dependencies
```bash
pnpm install
```

3. Start development server
```bash
pnpm dev
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run test suite |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code |
| `pnpm storybook` | Start Storybook |

## Contributing

We welcome contributions! Please see our [Contributing Guide][contributing-url] for details.

### Development Process

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

- [Documentation][docs-url]
- [GitHub Issues][issues-url]
- [Security Policy][security-url]
- [Code of Conduct][conduct-url]

## License

[MIT][license-url] © [Zach][author-url]

## Changelog

See [CHANGELOG.md][changelog-url] for release history.

[npm-url]: https://www.npmjs.com/package/kineticslider
[ci-url]: https://github.com/zach/kineticslider/actions
[coverage-url]: https://coveralls.io/github/zach/kineticslider?branch=main
[license-url]: https://github.com/zach/kineticslider/blob/main/LICENSE
[ts-url]: https://www.typescriptlang.org
[contributing-url]: https://github.com/zach/kineticslider/blob/main/CONTRIBUTING.md
[docs-url]: https://kineticslider.dev
[issues-url]: https://github.com/zach/kineticslider/issues
[security-url]: https://github.com/zach/kineticslider/blob/main/SECURITY.md
[conduct-url]: https://github.com/zach/kineticslider/blob/main/CODE_OF_CONDUCT.md
[changelog-url]: https://github.com/zach/kineticslider/blob/main/CHANGELOG.md
[author-url]: https://github.com/zach 