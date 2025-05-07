# KineticSlider

A high-performance, accessible React slider component with smooth GSAP animations and touch support.

## Features

- 🎯 Smooth GSAP-powered animations with hardware acceleration
- 🔄 Infinite looping support
- 📱 Touch and mouse gesture controls
- ⌨️ Keyboard navigation support
- ♿ WCAG 2.1 compliant accessibility
- 🚀 Performance optimized with transform3d
- 🎨 Customizable animation settings
- 📦 TypeScript support

## Installation

```bash
npm install @gsap/shockingly
# or
yarn add @gsap/shockingly
```

## Usage

```tsx
import { KineticSlider } from './components/KineticSlider';

function App() {
  return (
    <KineticSlider
      slides={[
        {
          id: 'slide1',
          content: <div>Slide 1 Content</div>
        },
        {
          id: 'slide2',
          content: <div>Slide 2 Content</div>
        },
        {
          id: 'slide3',
          content: <div>Slide 3 Content</div>
        }
      ]}
      options={{
        duration: 1,
        ease: "power2.inOut"
      }}
    />
  );
}
```

## Props

### KineticSlider Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| slides | Slide[] | required | Array of slide objects to be rendered |
| options | SliderOptions | {} | Configuration options for the slider |

### Slide Object

| Property | Type | Description |
|------|------|-------------|
| id | string | Unique identifier for the slide |
| content | ReactNode | Content to be rendered in the slide |

### SliderOptions

| Property | Type | Default | Description |
|------|------|---------|-------------|
| duration | number | 1 | Animation duration in seconds |
| ease | string | "power2.inOut" | GSAP easing function |

## Dependencies

- React ≥18.0.0
- GSAP ≥3.12.0

## Browser Support

Supports all modern browsers (Chrome, Firefox, Safari, Edge) and their mobile variants.

## Accessibility

KineticSlider is built with accessibility in mind:
- Keyboard navigation using arrow keys
- ARIA attributes for screen readers
- Focus management
- Touch-friendly controls

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Worker Build & Test Workflow

- The production worker script (`src/workers/pool-worker.ts`) is built to `dist/workers/pool-worker.js` using Vite.
- The worker is automatically built before running any tests (see the `pretest` script in `package.json`).
- To manually build the worker, run:

```bash
pnpm build:worker
```

- Integration tests require the built worker. Unit tests use a mock worker and do not require the real worker build.

## License

MIT 