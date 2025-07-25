# Error Handling & Recovery System

The KineticSlider includes a comprehensive error handling and recovery system designed to provide graceful degradation and automatic error recovery. This system ensures that users have a smooth experience even when errors occur.

## Overview

The error handling system consists of four main components:

1. **ErrorBoundary** - React-agnostic error boundary for catching and handling errors
2. **ErrorRecovery** - Automatic retry and recovery mechanisms with exponential backoff
3. **ValidationError** - Configuration validation and auto-correction
4. **FallbackRenderer** - Progressive degradation through different rendering modes

## ErrorBoundary

The `ErrorBoundary` class provides comprehensive error catching and recovery capabilities for slider components.

### Basic Usage

```typescript
import { ErrorBoundary } from './components/error-boundary';

const container = document.getElementById('slider-container');
const errorBoundary = new ErrorBoundary(container, {
  onError: (error, errorInfo) => {
    console.error('Slider error:', error);
    // Send to error reporting service
  },
  fallbackUI: (error) => {
    const div = document.createElement('div');
    div.textContent = 'Slider temporarily unavailable';
    return div;
  }
});

// Wrap your slider initialization
errorBoundary.wrap(() => {
  initializeSlider();
});
```

### Configuration Options

```typescript
interface ErrorBoundaryConfig {
  maxErrors?: number;              // Maximum errors before disabling recovery (default: 3)
  enableAutoRecovery?: boolean;    // Whether to attempt automatic recovery (default: true)
  recoveryDelay?: number;          // Delay before attempting recovery in ms (default: 2000)
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: (error: Error, successful: boolean) => void;
  fallbackUI?: (error: Error, errorInfo: ErrorInfo) => HTMLElement;
  logErrors?: boolean;             // Whether to log errors to console (default: true)
}
```

### Methods

- `wrap(renderFn: () => void)` - Wrap a function with error boundary protection
- `reset()` - Reset the error boundary to allow re-rendering
- `getErrorState()` - Get current error state information
- `reportError(error: Error, context?: string)` - Manually report an error
- `destroy()` - Clean up error boundary resources

## ErrorRecovery

The `ErrorRecovery` class provides automatic retry mechanisms with exponential backoff and circuit breaker patterns.

### Basic Usage

```typescript
import { ErrorRecovery } from './core/error-recovery';

const errorRecovery = new ErrorRecovery({
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  enableCircuitBreaker: true
});

// Retry a failed operation
const success = await errorRecovery.retry(async () => {
  // Your operation that might fail
  const result = await loadSliderImages();
  return result;
});
```

### Configuration Options

```typescript
interface ErrorRecoveryConfig {
  maxRetries?: number;             // Maximum retry attempts (default: 3)
  retryDelay?: number;             // Initial delay between retries in ms (default: 1000)
  backoffMultiplier?: number;      // Multiplier for exponential backoff (default: 2)
  enableCircuitBreaker?: boolean;  // Enable circuit breaker pattern (default: false)
  circuitBreakerThreshold?: number; // Failures before opening circuit (default: 5)
  circuitBreakerTimeout?: number;  // Circuit breaker timeout in ms (default: 30000)
}
```

### Circuit Breaker

The circuit breaker prevents cascading failures by temporarily disabling operations after a threshold of failures:

```typescript
const recovery = new ErrorRecovery({
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,      // Open after 5 failures
  circuitBreakerTimeout: 30000     // Stay open for 30 seconds
});
```

## ValidationError

The `ValidationError` class provides configuration validation and automatic error correction.

### Basic Usage

```typescript
import { ValidationError } from './core/validation-error';

const validator = new ValidationError();

// Validate configuration
const config = { autoplayInterval: -1000, enableTouch: 'yes' };
const result = validator.validateConfig(config);

if (!result.isValid) {
  console.log('Validation errors:', result.errors);
  
  // Auto-correct configuration
  const correctedConfig = validator.autoCorrectConfig(config);
  console.log('Corrected config:', correctedConfig);
}
```

### Validation Rules

The validator checks for:

- **Type validation** - Ensures properties have correct types
- **Range validation** - Checks numeric values are within valid ranges
- **Required properties** - Verifies essential configuration is present
- **Logical consistency** - Ensures configuration makes sense together

### Auto-Correction

The system can automatically correct common configuration errors:

```typescript
const invalidConfig = {
  autoplayInterval: 'fast',    // Invalid type → corrected to 3000
  transitionDuration: -100,    // Invalid range → corrected to 800
  enableTouch: 'yes'          // Invalid type → corrected to true
};

const corrected = validator.autoCorrectConfig(invalidConfig);
// Result: { autoplayInterval: 3000, transitionDuration: 800, enableTouch: true }
```

## FallbackRenderer

The `FallbackRenderer` provides progressive degradation through different rendering modes when advanced features fail.

### Rendering Modes

1. **WebGL Mode** - Full hardware-accelerated rendering
2. **Basic Mode** - Simple DOM-based rendering
3. **CSS Animations Mode** - CSS-based transitions
4. **Static Mode** - Static content with no animations

### Basic Usage

```typescript
import { FallbackRenderer } from './rendering/fallback-renderer';

const container = document.getElementById('slider-container');
const fallbackRenderer = new FallbackRenderer(container, {
  mode: 'basic',
  content: '<div class="slide">Static content</div>'
});

// Attempt to render with fallback
const success = await fallbackRenderer.render();
if (!success) {
  console.log('Rendering failed, check fallback content');
}
```

### Progressive Degradation

```typescript
const fallbackRenderer = new FallbackRenderer(container, {
  mode: 'basic',
  fallbackChain: ['webgl', 'basic', 'css-animations', 'static']
});

// Will try each mode in sequence until one succeeds
await fallbackRenderer.render();
```

## Integration with SliderCore

The error handling system is automatically integrated with the main slider:

```typescript
import { SliderCore } from './core/slider-core';

const slider = new SliderCore(container, {
  // Error handling is enabled by default
  errorHandling: {
    enableErrorBoundary: true,
    enableAutoRecovery: true,
    maxRetries: 3,
    onError: (error) => {
      // Custom error handling
      console.error('Slider error:', error);
    }
  }
});
```

## Error Types

The system defines specific error types for different scenarios:

```typescript
import { SliderError, SLIDER_ERROR_CODES } from './core/types';

// Creating specific errors
const configError = new SliderError(
  'Invalid configuration provided',
  SLIDER_ERROR_CODES.INVALID_CONFIG,
  { config: invalidConfig }
);

const initError = new SliderError(
  'Slider not initialized',
  SLIDER_ERROR_CODES.NOT_INITIALIZED
);
```

### Error Codes

- `NOT_INITIALIZED` - Slider not properly initialized
- `INVALID_CONFIG` - Configuration validation failed  
- `INVALID_SLIDE_INDEX` - Slide index out of bounds
- `TRANSITION_IN_PROGRESS` - Operation blocked by ongoing transition
- `TEXTURE_LOAD_FAILED` - Failed to load image textures
- `RENDER_ERROR` - Rendering pipeline error
- `MANUAL_ERROR_REPORT` - Manually reported error

## Best Practices

### 1. Error Boundary Setup

Always wrap your slider initialization in an error boundary:

```typescript
const errorBoundary = new ErrorBoundary(container, {
  onError: (error, errorInfo) => {
    // Log to monitoring service
    logError({
      message: error.message,
      stack: error.stack,
      component: 'KineticSlider',
      timestamp: errorInfo.timestamp,
      recoverable: errorInfo.recoverable
    });
  },
  fallbackUI: (error) => {
    // User-friendly fallback UI
    const fallback = document.createElement('div');
    fallback.className = 'slider-error-fallback';
    fallback.innerHTML = `
      <h3>Gallery Temporarily Unavailable</h3>
      <p>We're experiencing technical difficulties. Please try again.</p>
      <button onclick="location.reload()">Refresh Page</button>
    `;
    return fallback;
  }
});
```

### 2. Configuration Validation

Always validate configuration before initializing:

```typescript
const validator = new ValidationError();
const validationResult = validator.validateConfig(userConfig);

if (!validationResult.isValid) {
  // Auto-correct or show validation errors
  const correctedConfig = validator.autoCorrectConfig(userConfig);
  console.warn('Configuration corrected:', correctedConfig);
  userConfig = correctedConfig;
}
```

### 3. Graceful Degradation

Implement fallback content for when the slider fails:

```typescript
const fallbackRenderer = new FallbackRenderer(container, {
  mode: 'static',
  content: `
    <div class="image-gallery-fallback">
      <h2>Image Gallery</h2>
      <div class="static-images">
        ${images.map(img => `<img src="${img.thumbnail}" alt="${img.alt}">`).join('')}
      </div>
    </div>
  `
});
```

### 4. Accessibility in Error States

Ensure error states are accessible:

```typescript
const errorBoundary = new ErrorBoundary(container, {
  fallbackUI: (error) => {
    const fallback = document.createElement('div');
    fallback.setAttribute('role', 'alert');
    fallback.setAttribute('aria-live', 'polite');
    fallback.innerHTML = `
      <div class="sr-only">Slider error: ${error.message}</div>
      <div class="visible-error">
        <h3>Content temporarily unavailable</h3>
        <button type="button" onclick="this.parentElement.parentElement.querySelector('button[data-retry]').click()">
          Try again
        </button>
      </div>
    `;
    return fallback;
  }
});
```

### 5. Performance Monitoring

Monitor error handling performance:

```typescript
const errorBoundary = new ErrorBoundary(container, {
  onError: (error, errorInfo) => {
    // Track error metrics
    analytics.track('slider_error', {
      error_type: error.constructor.name,
      error_code: error.code,
      recovery_attempts: errorInfo.errorCount,
      timestamp: errorInfo.timestamp
    });
  },
  
  onRecovery: (error, successful) => {
    // Track recovery metrics
    analytics.track('slider_recovery', {
      error_type: error.constructor.name,
      successful,
      timestamp: Date.now()
    });
  }
});
```

## Testing Error Handling

### Unit Testing

```typescript
import { ErrorBoundary } from './components/error-boundary';
import { expect, vi } from 'vitest';

test('should catch and handle errors', () => {
  const container = document.createElement('div');
  const onError = vi.fn();
  
  const boundary = new ErrorBoundary(container, { onError });
  
  boundary.wrap(() => {
    throw new Error('Test error');
  });
  
  expect(onError).toHaveBeenCalled();
  expect(container.innerHTML).toContain('Temporarily Unavailable');
});
```

### Integration Testing

```typescript
test('should recover from transient errors', async () => {
  let attempts = 0;
  const boundary = new ErrorBoundary(container, {
    enableAutoRecovery: true,
    recoveryDelay: 100
  });
  
  boundary.wrap(() => {
    attempts++;
    if (attempts === 1) {
      throw new Error('Transient error');
    }
    container.innerHTML = '<div>Success</div>';
  });
  
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(container.textContent).toContain('Success');
});
```

### E2E Testing

```typescript
// Playwright test
test('should show error UI when slider fails to load', async ({ page }) => {
  await page.route('**/slider-images/**', route => route.abort());
  
  await page.goto('/slider-demo');
  
  const errorFallback = page.locator('.slider-error-fallback');
  await expect(errorFallback).toBeVisible();
  
  const retryButton = page.locator('button:has-text("Try again")');
  await expect(retryButton).toBeVisible();
});
```

## Monitoring and Analytics

### Error Reporting

```typescript
const errorBoundary = new ErrorBoundary(container, {
  onError: (error, errorInfo) => {
    // Send to error reporting service
    Sentry.captureException(error, {
      tags: {
        component: 'KineticSlider',
        boundary_id: errorInfo.boundaryId
      },
      extra: {
        error_count: errorInfo.errorCount,
        recoverable: errorInfo.recoverable,
        component_stack: errorInfo.componentStack
      }
    });
  }
});
```

### Performance Metrics

```typescript
const recovery = new ErrorRecovery({
  onRetry: (attempt, error) => {
    analytics.track('slider_retry', {
      attempt,
      error_type: error.constructor.name,
      timestamp: Date.now()
    });
  },
  
  onSuccess: (attempts, duration) => {
    analytics.track('slider_recovery_success', {
      attempts,
      duration,
      timestamp: Date.now()
    });
  }
});
```

## Troubleshooting

### Common Issues

1. **Error boundary not catching errors**
   - Ensure the error occurs within the wrapped function
   - Check that the error boundary is properly initialized

2. **Auto-recovery not working**
   - Verify `enableAutoRecovery` is set to `true`
   - Check that the error is marked as recoverable
   - Ensure recovery delay is appropriate

3. **Fallback UI not displaying**
   - Verify the fallback UI function returns a valid HTMLElement
   - Check for JavaScript errors in the fallback UI generator

4. **Configuration validation fails**
   - Review validation rules and ensure configuration matches expected types
   - Use auto-correction to fix common issues

### Debug Mode

Enable debug logging for detailed error information:

```typescript
const errorBoundary = new ErrorBoundary(container, {
  logErrors: true,  // Enable console logging
  onError: (error, errorInfo) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Slider Error Debug Info');
      console.error('Error:', error);
      console.log('Error Info:', errorInfo);
      console.log('Stack:', error.stack);
      console.groupEnd();
    }
  }
});
```

## Migration Guide

### From Version 0.x

If you're upgrading from an earlier version without error handling:

1. Wrap your existing slider initialization in an ErrorBoundary
2. Add fallback UI for when the slider fails
3. Configure validation for your existing configuration
4. Test error scenarios in your application

```typescript
// Before
const slider = new SliderCore(container, config);

// After
const errorBoundary = new ErrorBoundary(container);
errorBoundary.wrap(() => {
  const slider = new SliderCore(container, config);
});
```

This comprehensive error handling system ensures that your KineticSlider implementation provides a robust, user-friendly experience even when things go wrong.