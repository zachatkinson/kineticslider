# KineticSlider

[![npm version](https://img.shields.io/npm/v/kineticslider.svg)][npm-url]
[![npm downloads](https://img.shields.io/npm/dm/kineticslider.svg)][npm-url]
[![Build Status](https://github.com/zach/kineticslider/workflows/CI/badge.svg)][ci-url]
[![Coverage Status](https://coveralls.io/repos/github/zach/kineticslider/badge.svg?branch=main)][coverage-url]
[![License](https://img.shields.io/npm/l/kineticslider.svg)][license-url]
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)][ts-url]
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)][contributing-url]

A modern, accessible, and performant slider component for React applications.

## Features

- 🎨 Smooth animations powered by GSAP
- 📱 Touch and swipe gestures support
- ♿️ Accessible by default
- 🎯 TypeScript support
- 🔄 Infinite loop option
- 🎮 Customizable controls and animations

## Installation

```bash
npm install kineticslider
# or
yarn add kineticslider
# or
pnpm add kineticslider
```

## Usage

```tsx
import { KineticSlider } from 'kineticslider';

function App() {
  return (
    <KineticSlider>
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </KineticSlider>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | The slides to be rendered in the slider |
| `className` | `string` | `''` | Custom class name for the slider container |
| `style` | `CSSProperties` | `undefined` | Custom inline styles for the slider container |
| `duration` | `number` | `0.5` | Animation duration in seconds |
| `ease` | `string` | `'power2.out'` | Animation easing function |
| `enableGestures` | `boolean` | `true` | Whether to enable touch/swipe gestures |
| `onChange` | `(index: number) => void` | `undefined` | Callback fired when the active slide changes |
| `initialIndex` | `number` | `0` | Initial active slide index |
| `infinite` | `boolean` | `true` | Whether to enable infinite looping |

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## License

MIT © [Zach](LICENSE)

## Overview

KineticSlider is a highly performant React slider component that prioritizes accessibility, smooth animations, and developer experience. It's built with TypeScript and uses GSAP for fluid animations, making it perfect for modern web applications.

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

- Chrome ≥ 92
- Firefox ≥ 90
- Safari ≥ 15
- Edge ≥ 92
- iOS Safari ≥ 15
- Android Chrome ≥ 92

## Development

### Prerequisites

- Node.js ≥ 18.x
- pnpm ≥ 8.x

### Project Structure

The project follows a standard React library structure:

```bash
kineticslider/
├── src/           # Source code
├── dist/          # Built package output
├── tests/         # Test files
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
| `pnpm validate` | Run type check, lint, and tests |
| `pnpm size` | Check bundle size |
| `pnpm docs` | Generate documentation |

### Dependencies

The project uses the following key dependencies:

- GSAP for smooth animations
- Pixi.js for advanced rendering capabilities
- React ≥ 18.0.0 (peer dependency)

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