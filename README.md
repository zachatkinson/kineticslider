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
- 🎬 Modular animation system with useAnimation hook

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
      slides={[
        {
          id: 'slide1' as SlideId,
          title: 'Slide 1',
          image: '/images/slide1.jpg',
          alt: 'Slide 1 description'
        },
        {
          id: 'slide2' as SlideId,
          title: 'Slide 2',
          image: '/images/slide2.jpg',
          alt: 'Slide 2 description'
        },
        {
          id: 'slide3' as SlideId,
          title: 'Slide 3',
          image: '/images/slide3.jpg',
          alt: 'Slide 3 description'
        }
      ]}
    />
  );
}
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| slides | Slide[] | required | Array of slide objects to be rendered in the slider |
| className | string | '' | Custom class name for the slider container |
| style | CSSProperties | {} | Custom inline styles for the slider container |
| duration | number | 0.5 | Animation duration in seconds (must be positive) |
| ease | string | 'power2.out' | GSAP easing function |
| enableGestures | boolean | true | Enable touch/swipe gestures |
| enableKeyboard | boolean | true | Enable keyboard navigation |
| onSlideChange | (index: number) => void | undefined | Callback fired when the active slide changes |
| onAnimationComplete | () => void | undefined | Callback fired when animation completes |
| onError | (error: Error) => void | undefined | Callback fired when an error occurs |
| initialSlide | number | 0 | Initial active slide index (must be valid) |
| lazyLoad | boolean | false | Enable lazy loading of slides |

## Slide Object

Each slide in the slides array should have the following structure:

| Property | Type | Description |
|------|------|-------------|
| id | SlideId | Unique identifier for the slide |
| title | string | Title of the slide |
| description | string (optional) | Description text for the slide |
| image | string | URL of the slide image |
| alt | string | Alt text for the image (for accessibility) |

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

### Animation System
The component uses a modular animation system through the `useAnimation` hook:
- Encapsulated GSAP animations with proper cleanup
- Momentum-based animations with velocity tracking
- Hardware-accelerated transforms with force3D
- Efficient drag gesture handling
- Automatic timeline management
- Proper memory cleanup

```typescript
// Example usage of useAnimation hook
const {
  isAnimating,
  animateToSlide,
  setupContainer,
  setupSlides,
  handleDragStart,
  handleDragMove,
  handleDragEnd
} = useAnimation({
  duration: 0.8,
  ease: 'power3.out',
  infinite: true,
  onAnimationStart: () => console.log('Animation started'),
  onAnimationComplete: (index) => console.log(`Animated to slide ${index}`)
});
```

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
The component implements a robust error handling system through a dedicated `ErrorBoundary` component:

- Progressive error handling with fallbacks
- Multiple recovery paths with state tracking
- Detailed error analytics and monitoring
- Graceful degradation strategies
- Dedicated `ErrorBoundary` component with configurable props:

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  fallbackRender?: (props: FallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

The `ErrorBoundary` component provides flexible error handling with two primary options:
1. `fallback`: Accepts a React node or a function that receives error and retry callback
2. `fallbackRender`: A more flexible approach that receives a props object with error details and reset function

Example usage with `fallbackRender`:

```tsx
<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try Again</button>
      <button onClick={() => reportError(error)}>Report Error</button>
    </div>
  )}
  onError={(error, errorInfo) => logError(error, errorInfo)}
  maxRetries={3}
>
  <YourComponent />
</ErrorBoundary>
```

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

### Animation Types (`hooks/useAnimation.ts`)
```typescript
interface UseAnimationConfig {
  duration?: number;
  ease?: string;
  infinite?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: (index: number) => void;
}

interface UseAnimationReturn {
  isAnimating: boolean;
  animateToSlide: (targetIndex: number, speed?: number) => void;
  setupContainer: (container: HTMLElement) => void;
  setupSlides: (slides: HTMLElement[]) => void;
  cleanupAnimations: () => void;
  handleResize: () => void;
  getPosition: () => number;
  handleDragStart: (x: number) => void;
  handleDragMove: (x: number) => void;
  handleDragEnd: () => void;
  getVelocity: () => number;
}
```

### Core Types (`types/slider.ts`)
```typescript
interface KineticSliderProps {
  slides: Slide[];
  onSlideChange?: (currentIndex: number) => void;
  onAnimationComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  enableKeyboard?: boolean;
  enableGestures?: boolean;
  initialSlide?: number;
  duration?: number;
  ease?: string;
  lazyLoad?: boolean;
}

interface Slide {
  id: SlideId;
  title: string;
  description?: string;
  image: string;
  alt: string;
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

### Error Handling Types (`types/components.ts`)
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  fallbackRender?: (props: FallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

### Test Types (`types/test.ts`)
```typescript
interface MockGsap {
  to: Mock;
  set: Mock;
  quickSetter: Mock;
  killTweensOf: Mock;
}
```

## License

MIT © Your Name 