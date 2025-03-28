# KineticSlider

A high-performance, accessible React slider component with smooth GSAP animations and touch support.

## Features

- 🎯 Smooth GSAP-powered animations with hardware acceleration
- 🔄 Infinite looping support with edge case handling
- 📱 Touch and mouse gesture controls with debounced events
- ⌨️ Full keyboard navigation and focus management
- ♿ WCAG 2.1 compliant accessibility with ARIA support
- 🚀 Performance optimized with transform3d and lazy loading
- 🎨 Customizable animation settings with validation
- 📦 TypeScript support with strict type checking
- 🛡️ Advanced error handling with circuit breaker pattern
- 📊 Comprehensive performance monitoring
- 🧪 Extensive test coverage with analytics integration

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
| children | ReactNode[] \| ReactNode | required | The slides to be rendered in the slider |
| className | string | '' | Custom class name for the slider container |
| style | CSSProperties | {} | Custom inline styles for the slider container |
| duration | number | 0.5 | Animation duration in seconds (must be positive) |
| ease | string | 'power2.out' | GSAP easing function |
| enableGestures | boolean | true | Enable touch/swipe gestures |
| enableKeyboard | boolean | true | Enable keyboard navigation |
| onChange | (index: number) => void | undefined | Callback fired when the active slide changes |
| initialIndex | number | 0 | Initial active slide index (must be valid) |
| infinite | boolean | true | Enable infinite looping |
| lazyLoad | boolean | false | Enable lazy loading of slides |

## Dependencies

- React ≥18.0.0
- GSAP ≥3.12.0
- Modern browser support (see Browser Support section)

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | ≥90 |
| Firefox | ≥88 |
| Safari  | ≥14 |
| Edge    | ≥90 |
| iOS Safari | ≥14 |
| Chrome Android | ≥90 |

## Advanced Features

### Circuit Breaker Pattern
The component implements an advanced circuit breaker pattern for robust error handling:
- Exponential backoff with configurable thresholds
- State transitions: closed -> half-open -> open
- Automatic recovery with analytics tracking

### Performance Monitoring
Built-in performance tracking capabilities:
- Real-time FPS tracking during animations
- Frame time distribution analysis
- Memory usage monitoring
- CPU utilization tracking
- Dropped frame detection

### Error Recovery
Comprehensive error handling system:
- Progressive error handling with fallbacks
- Multiple recovery paths with state tracking
- Detailed error analytics and monitoring
- Graceful degradation strategies

## Accessibility

KineticSlider is built with accessibility in mind and follows WCAG 2.1 guidelines:

- Keyboard navigation using arrow keys and tab focus
- Comprehensive ARIA attributes for screen readers:
  - `role="region"` with `aria-roledescription="carousel"`
  - `aria-label` for slider and controls
  - `aria-hidden` for non-visible slides
  - `aria-current` for active slide indicators
- Focus management with proper tab order
- Live region announcements for slide changes
- High contrast navigation controls
- Touch target sizes following WCAG guidelines

## Performance

The component is optimized for performance:

- Hardware-accelerated animations using transform3d
- Debounced resize handling (32ms threshold)
- Efficient GSAP animations with optimized settings:
  - Force3D enabled for GPU acceleration
  - Lazy rendering for off-screen slides
  - Proper cleanup of GSAP resources
- Memory leak prevention:
  - Automatic timeline cleanup
  - Event listener cleanup
  - ResizeObserver disconnection
- Touch event optimization with RAF throttling
- Type-safe event handling

## Types and Interfaces

The component uses TypeScript with strict type checking. Types are organized across the following files:

### Core Types (`types.ts`)
```typescript
interface KineticSliderProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  duration?: number;
  ease?: string;
  enableGestures?: boolean;
  enableKeyboard?: boolean;
  onChange?: (index: number) => void;
  initialIndex?: number;
  infinite?: boolean;
  lazyLoad?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

interface NormalizedPointerEvent {
  clientX: number;
  clientY: number;
  type: string;
  target: EventTarget | null;
  preventDefault: () => void;
}

interface ExtendedPerformanceMetrics {
  initialRenderTime: number;
  averageFrameTime: number;
  droppedFrames: number;
  memoryUsage: number;
  gestureProcessingTime: number;
  FCP?: number;  // First Contentful Paint
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  TTI?: number;  // Time to Interactive
  TBT?: number;  // Total Blocking Time
}
```

### Test Types (`types/test.d.ts`)
```typescript
interface MockGsap {
  to: Mock;
  set: Mock;
  quickSetter: Mock;
  killTweensOf: Mock;
}

interface MockTimeline {
  to: Mock;
  kill: Mock;
  eventCallback: Mock;
  play: Mock;
}
```

### Error Types (`types.ts`)
```typescript
class SliderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SliderError';
  }
}

enum SliderErrorType {
  VALIDATION = 'validation',
  ANIMATION = 'animation',
  GESTURE = 'gesture',
  RENDER = 'render',
  MEMORY = 'memory'
}
```

All types are properly exported and imported where needed, ensuring type safety across the codebase. The organization follows these principles:
- Core component types in `types.ts`
- Test-specific types in `types/test.d.ts`
- Proper type imports to avoid duplication
- Comprehensive JSDoc documentation for all types

## Error Handling

The component includes robust error handling:

- Advanced error handling system:
  - Custom `SliderError` class for type-safe error handling
  - Enumerated error types for precise error categorization
  - Detailed error context with component stack traces
  - Automatic error reporting to analytics services
- Circuit breaker pattern implementation:
  - Exponential backoff with configurable thresholds
  - State transitions: closed -> half-open -> open
  - Automatic recovery with analytics tracking
- Cascading error recovery system:
  - Progressive error handling with fallbacks
  - Multiple recovery paths with state tracking
  - Detailed error analytics and monitoring
- Graceful degradation strategy:
  - Multiple animation fallback levels
  - Progressive enhancement based on capabilities
  - Performance-based feature adjustment
- Comprehensive error tracking:
  - Detailed error context and stack traces
  - Recovery attempt tracking
  - Analytics integration for monitoring

## Performance Monitoring

The component includes advanced performance tracking:

- Web Vitals Integration:
  - First Contentful Paint (FCP) tracking
  - Largest Contentful Paint (LCP) monitoring
  - First Input Delay (FID) measurement
  - Cumulative Layout Shift (CLS) tracking
  - Time to Interactive (TTI) metrics
  - Total Blocking Time (TBT) analysis
- Frame Rate Monitoring:
  - Real-time FPS tracking during animations
  - Frame time distribution analysis
  - Dropped frame detection
- Memory Usage Tracking:
  - Heap size monitoring
  - Memory leak detection
  - Garbage collection impact analysis
- CPU Utilization:
  - Task duration monitoring
  - Long task detection
  - Background CPU usage tracking
- Resource Cleanup Verification:
  - Event listener cleanup validation
  - Animation resource management
  - Memory allocation patterns

## Accessibility Enhancements

The component follows WCAG 2.1 Level AA guidelines with enhanced features:

- Dynamic Focus Management:
  - Focus tracking during transitions
  - Focus trap in modal contexts
  - Focus restoration after updates
- Comprehensive ARIA Implementation:
  - Live region announcements
  - Role and state management
  - Dynamic attribute updates
- Motion Sensitivity:
  - Reduced motion preference support
  - Animation speed adjustment
  - Alternative transition styles
- Touch Target Optimization:
  - WCAG 2.1 size requirements (44x44px)
  - Proper spacing between targets
  - Touch area enhancement

## Testing

The component includes comprehensive tests with analytics integration:

- Unit and Integration Tests:
  - Core functionality validation
  - User interaction simulation
  - Edge case handling
- Performance Tests:
  - Frame rate benchmarks
  - Memory usage patterns
  - CPU utilization metrics
- Accessibility Tests:
  - WCAG 2.1 compliance
  - Screen reader compatibility
  - Keyboard navigation
- Error Recovery Tests:
  - Circuit breaker validation
  - Cascading error handling
  - Degradation strategies
- Analytics Integration:
  - Performance metrics tracking
  - Error handling monitoring
  - Accessibility compliance

See our [Test Documentation](src/__tests__/README.md) for detailed information about test patterns and assertions.

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

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Your Name] 