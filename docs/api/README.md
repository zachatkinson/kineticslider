# KineticSlider API Documentation

## Components

### KineticSlider

The main slider component that provides smooth, kinetic scrolling with touch and mouse support.

```tsx
import { KineticSlider } from '@kineticslider/core';

<KineticSlider
  slides={slides}
  initialSlide={0}
  enableKeyboard
  enableGestures
  duration={0.5}
  ease="power2.out"
  infiniteLoop
  lazyLoad
  onSlideChange={(index) => console.log(`Active slide: ${index}`)}
  onAnimationComplete={() => console.log('Animation complete')}
  onError={(error) => console.error('Slider error:', error)}
/>
```

#### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| slides | `Slide[]` | Required | Array of slide objects to render |
| initialSlide | `SlideIndex` | `0` | Initial active slide index |
| enableKeyboard | `boolean` | `true` | Enable keyboard navigation |
| enableGestures | `boolean` | `true` | Enable touch/mouse gestures |
| duration | `number` | `0.5` | Animation duration in seconds |
| ease | `string` | `'power2.out'` | GSAP easing function |
| infiniteLoop | `boolean` | `false` | Enable infinite looping |
| lazyLoad | `boolean` | `true` | Enable lazy loading of slides |
| onSlideChange | `(index: SlideIndex) => void` | - | Slide change callback |
| onAnimationComplete | `() => void` | - | Animation complete callback |
| onError | `(error: Error) => void` | - | Error handling callback |

### FocusManager

A component that manages focus within a container, providing focus trapping and keyboard navigation.

```tsx
import { FocusManager } from '@kineticslider/core';

<FocusManager
  trapFocus
  autoFocus
  escapeDeactivates
  onEscape={() => setIsOpen(false)}
>
  <div role="dialog">
    <button>First focusable</button>
    <button>Second focusable</button>
  </div>
</FocusManager>
```

#### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| trapFocus | `boolean` | `false` | Enable focus trapping |
| autoFocus | `boolean` | `true` | Auto-focus first element |
| escapeDeactivates | `boolean` | `true` | Allow escape key to deactivate |
| initialFocus | `string \| HTMLElement` | - | Element to focus initially |
| returnFocusTo | `string \| HTMLElement` | - | Element to return focus to |
| onActivate | `() => void` | - | Activation callback |
| onDeactivate | `() => void` | - | Deactivation callback |
| onEscape | `() => void` | - | Escape key callback |

## Hooks

### useKineticSlider

```tsx
const {
  currentSlide,
  isAnimating,
  next,
  prev,
  handleGesture,
  sliderRef
} = useKineticSlider({
  slides,
  initialSlide,
  onSlideChange,
  onAnimationComplete,
  duration,
  ease,
  infiniteLoop
});
```

### useAnimation

```tsx
const {
  isAnimating,
  play,
  pause,
  reverse,
  restart
} = useAnimation({
  duration: 0.5,
  ease: 'power2.out',
  onComplete: () => console.log('Animation complete')
});
```

### useKeyboard

```tsx
const {
  isKeyPressed,
  lastKey,
  addKeyBinding,
  removeKeyBinding
} = useKeyboard({
  target: containerRef,
  preventDefault: true
});
```

## Utilities

### Performance

```tsx
import {
  trackRenderTime,
  trackInteraction,
  createPerformanceId
} from '@kineticslider/core';

// Track component render time
const duration = trackRenderTime(
  startTime,
  'MyComponent',
  'Initial render'
);

// Create unique performance ID
const id = createPerformanceId('Slider', 'main');
```

### Error Handling

```tsx
import {
  handleComponentError,
  createError,
  withErrorHandling,
  handleAsyncError
} from '@kineticslider/core';

// Create standardized error
const error = createError(
  'Failed to load slide',
  'SLIDE_LOAD_ERROR',
  { slideId: '123' }
);

// Wrap function with error handling
const safeFunction = withErrorHandling(
  () => riskyOperation(),
  ErrorType.OPERATION
);

// Handle async errors with retry
const result = await handleAsyncError(
  () => fetchData(),
  3,
  1000
);
```

## Types

### Slide

```typescript
interface Slide {
  id: string;
  content: React.ReactNode;
  metadata?: Record<string, unknown>;
}
```

### Error Types

```typescript
enum ErrorType {
  RENDER = 'render',
  ASYNC = 'async',
  ANIMATION = 'animation',
  VALIDATION = 'validation',
  RESOURCE = 'resource',
  INTERACTION = 'interaction',
  STATE = 'state',
  OPERATION = 'operation'
}

interface ComponentError extends Error {
  code?: string;
  type?: ErrorType;
  severity?: ErrorSeverity;
  componentInfo?: {
    name?: string;
    props?: Record<string, unknown>;
    state?: Record<string, unknown>;
  };
}
```

## Integration

### With Next.js

```tsx
// pages/slider.tsx
import { KineticSlider } from '@kineticslider/core';

export default function SliderPage() {
  return (
    <KineticSlider
      slides={slides}
      enableGestures
      infiniteLoop
    />
  );
}
```

### With TypeScript

```tsx
import type {
  Slide,
  SlideIndex,
  KineticSliderProps,
  UseKineticSliderReturn
} from '@kineticslider/core';

const MySlider: React.FC<KineticSliderProps> = (props) => {
  // Implementation
};
```

## Error Handling

### Error Boundaries

```tsx
import { withErrorBoundary } from '@kineticslider/core';

const SafeSlider = withErrorBoundary(KineticSlider, {
  fallback: <div>Something went wrong</div>,
  onError: (error) => console.error(error)
});
```

### Async Error Handling

```tsx
try {
  await handleAsyncError(
    async () => {
      const data = await fetchSlides();
      setSlides(data);
    },
    3,
    1000
  );
} catch (error) {
  console.error('Failed to load slides:', error);
}
```

## Performance Optimization

### Render Tracking

```tsx
const MyComponent: React.FC = () => {
  const startTime = performance.now();
  
  useEffect(() => {
    trackRenderTime(
      startTime,
      'MyComponent',
      'Initial render',
      true
    );
  }, []);
  
  return <div>Content</div>;
};
```

### Performance Monitoring

```tsx
const cleanup = initializePerformanceMonitoring('MyComponent', {
  enableLogging: true,
  sampleRate: 0.1,
  handlers: {
    onMeasure: (name, duration) => {
      console.log(`${name}: ${duration}ms`);
    }
  }
});

// Cleanup on unmount
useEffect(() => cleanup, []);
``` 