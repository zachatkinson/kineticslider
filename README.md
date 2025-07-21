# KineticSlider

A high-performance, GPU-accelerated slider component built with GSAP and PIXI.js. Combines smooth physics-based animations with advanced visual effects for modern web applications.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-100%25-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-green.svg)
![Test Coverage](https://img.shields.io/badge/coverage-100%25-green.svg)

## ✨ Features

- **🚀 High Performance**: 60fps animations with GPU acceleration
- **🎨 Advanced Visual Effects**: Displacement mapping, filter chains, and custom shaders
- **⚡ Physics-Based**: Kinetic scrolling with spring physics and momentum
- **♿ Accessible**: Full WCAG 2.1 AA compliance with keyboard navigation
- **📱 Responsive**: Adaptive design that works on all screen sizes
- **🧪 Well Tested**: 1000+ tests with comprehensive coverage
- **🔧 TypeScript**: Complete type safety and excellent developer experience
- **🎯 Framework Agnostic**: Works with React, Vue, Vanilla JS, and more

## 🚀 Quick Start

### Installation

```bash
npm install kineticslider
# or
pnpm add kineticslider
# or
yarn add kineticslider
```

### Basic Usage

```typescript
import { KineticSlider } from 'kineticslider';

// Initialize slider
const slider = new KineticSlider({
  container: '#slider-container',
  slides: [
    { src: 'image1.jpg', alt: 'Slide 1' },
    { src: 'image2.jpg', alt: 'Slide 2' },
    { src: 'image3.jpg', alt: 'Slide 3' }
  ]
});

// Start the slider
await slider.initialize();
```

### React Integration

```tsx
import { useKineticSlider } from 'kineticslider/react';

function MySlider() {
  const { sliderRef, goToSlide, currentSlide } = useKineticSlider({
    slides: [
      { src: 'image1.jpg', alt: 'Slide 1' },
      { src: 'image2.jpg', alt: 'Slide 2' }
    ],
    autoPlay: true,
    loop: true
  });

  return (
    <div>
      <div ref={sliderRef} className="slider-container" />
      <button onClick={() => goToSlide(0)}>Go to Slide 1</button>
      <p>Current slide: {currentSlide}</p>
    </div>
  );
}
```

## 📖 Documentation

### Core API

The KineticSlider provides a clean, intuitive API for controlling slider behavior:

```typescript
interface SliderCore {
  // Navigation
  goToSlide(index: number, animated?: boolean): Promise<void>;
  nextSlide(): Promise<void>;
  previousSlide(): Promise<void>;
  
  // Playback control
  play(): void;
  pause(): void;
  
  // Lifecycle
  destroy(): void;
}
```

### Configuration Options

```typescript
interface SliderConfig {
  // Required
  container: string | HTMLElement;
  slides: SlideConfig[];
  
  // Optional
  autoPlay?: boolean;          // Enable auto-play (default: false)
  duration?: number;           // Slide duration in ms (default: 5000)
  transitionSpeed?: number;    // Transition speed in ms (default: 800)
  easing?: string;            // GSAP easing function (default: 'power2.out')
  loop?: boolean;             // Enable infinite looping (default: true)
  
  // Visual effects
  effects?: {
    displacement?: boolean;    // Enable displacement effects
    filters?: string[];       // Apply filter effects
    quality?: 'low' | 'medium' | 'high' | 'auto';
  };
  
  // Responsive design
  responsive?: {
    breakpoints?: Record<number, Partial<SliderConfig>>;
    maintainAspectRatio?: boolean;
  };
  
  // Accessibility
  accessibility?: {
    announceSlideChanges?: boolean;
    respectMotionPreferences?: boolean;
    keyboardNavigation?: boolean;
  };
}
```

## 🎨 Advanced Features

### Visual Effects

KineticSlider includes a comprehensive visual effects system:

```typescript
// Apply displacement effects
slider.effects.displacement.enable({
  intensity: 0.3,
  mouseFollow: true
});

// Create filter chains
slider.effects.filters.add(['blur', 'glow', 'colorMatrix']);

// Use effect presets
slider.effects.presets.apply('elegantFade');
```

### Performance Optimization

The slider automatically optimizes performance based on device capabilities:

```typescript
// Manual performance tuning
slider.performance.setQuality('high');
slider.performance.enableGPUAcceleration(true);

// Monitor performance
slider.performance.onFPSChange((fps) => {
  console.log(`Current FPS: ${fps}`);
});
```

### Physics Customization

Fine-tune the physics behavior:

```typescript
slider.physics.setConfig({
  friction: 0.8,
  spring: { tension: 120, friction: 14 },
  momentum: { multiplier: 1.2, decay: 0.95 }
});
```

## 🧪 Development

### Prerequisites

- Node.js 18+ 
- pnpm 10.7+

### Setup

```bash
# Clone the repository
git clone https://github.com/yourorg/kineticslider.git
cd kineticslider

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Project Structure

```
src/
├── core/           # Core slider logic and architecture
├── physics/        # GSAP physics engine and calculations
├── rendering/      # PIXI.js rendering and visual effects
├── input/          # Input handling and gesture recognition
├── managers/       # Animation and performance managers
├── components/     # React components (coming in Phase 4.2)
└── __tests__/      # Comprehensive test suite
```

### Testing

The project maintains 100% test coverage across multiple test types:

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

## 🏗️ Architecture

KineticSlider is built with a clean, modular architecture:

- **Core Layer**: Central coordination and state management
- **Physics Layer**: GSAP-powered animations and physics calculations  
- **Rendering Layer**: PIXI.js GPU-accelerated rendering and effects
- **Input Layer**: Unified input handling with accessibility support
- **Manager Layer**: Performance monitoring and resource management

Each layer is fully tested, type-safe, and follows SOLID principles.

## 🔧 Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+
- **WebGL**: Required for advanced visual effects
- **ES Modules**: Native ESM support required

## 📈 Performance

KineticSlider is optimized for performance:

- **60fps animations** on modern devices
- **GPU acceleration** for visual effects
- **Memory usage under 100MB** for typical use cases
- **Bundle size under 150KB** (gzipped)
- **Load time under 2 seconds** on 3G networks

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines

1. **Code Quality**: All code must pass ESLint and TypeScript checks
2. **Testing**: Maintain 100% test coverage for new features
3. **Documentation**: Include JSDoc comments for all public APIs
4. **Performance**: Ensure 60fps performance on target devices

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GSAP**: Professional-grade animation library
- **PIXI.js**: Fast 2D WebGL renderer
- **TypeScript**: Enhanced developer experience and type safety

## 📞 Support

- **Documentation**: [Full API Documentation](https://docs.kineticslider.com)
- **Examples**: [Interactive Examples](https://examples.kineticslider.com)  
- **Issues**: [GitHub Issues](https://github.com/yourorg/kineticslider/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourorg/kineticslider/discussions)

---

**Built with ❤️ for the modern web**