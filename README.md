# KineticSlider

A high-performance, accessible React slider component with smooth GSAP animations and touch support.

## Features

- 🎯 Smooth GSAP-powered animations
- 🔄 Infinite looping support
- 📱 Touch and mouse gesture controls
- ⌨️ Full keyboard navigation
- ♿ WCAG 2.1 compliant accessibility
- 🚀 Performance optimized with debouncing and lazy loading
- 🎨 Customizable animation settings
- 📦 TypeScript support

## Installation

```bash
npm install @scope/kinetic-slider gsap
# or
yarn add @scope/kinetic-slider gsap
# or
pnpm add @scope/kinetic-slider gsap
```

## Usage

```tsx
import { KineticSlider } from '@scope/kinetic-slider';

function App() {
  const handleSlideChange = (index: number) => {
    console.log(`Current slide: ${index}`);
  };

  return (
    <KineticSlider
      duration={0.5}
      ease="power2.out"
      enableGestures={true}
      onChange={handleSlideChange}
      infinite={true}
      lazyLoad={true}
    >
      <div style={{ background: '#ff6b6b' }}>Slide 1</div>
      <div style={{ background: '#4ecdc4' }}>Slide 2</div>
      <div style={{ background: '#45b7d1' }}>Slide 3</div>
    </KineticSlider>
  );
}
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | The slides to be rendered in the slider |
| className | string | '' | Custom class name for the slider container |
| style | CSSProperties | undefined | Custom inline styles for the slider container |
| duration | number | 0.5 | Animation duration in seconds |
| ease | string | 'power2.out' | GSAP easing function |
| enableGestures | boolean | true | Enable touch/swipe gestures |
| onChange | (index: number) => void | undefined | Callback fired when the active slide changes |
| initialIndex | number | 0 | Initial active slide index |
| infinite | boolean | true | Enable infinite looping |
| lazyLoad | boolean | false | Enable lazy loading of slides |

## Accessibility

KineticSlider is built with accessibility in mind and follows WCAG 2.1 guidelines:

- Keyboard navigation using arrow keys
- ARIA labels and roles for screen readers
- Focus management
- Live region announcements for slide changes
- High contrast navigation controls
- Touch target sizes following WCAG guidelines

## Performance

The component is optimized for performance:

- Debounced drag events for smooth animations
- Lazy loading support for large slideshows
- Efficient GSAP animations
- Memory leak prevention
- Event listener cleanup
- Touch event optimization

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ≥90 |
| Firefox | ≥88 |
| Safari | ≥14 |
| Edge | ≥90 |

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build
```

### Testing

The component includes comprehensive tests:

- Unit tests for core functionality
- Integration tests for user interactions
- Accessibility tests
- Performance tests
  - Animation performance (60fps target)
  - Gesture responsiveness (<50ms latency)
  - Memory management (<2MB heap growth)
- Edge case handling

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Your Name] 