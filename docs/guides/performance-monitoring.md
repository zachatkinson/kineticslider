# Performance Monitoring Guide

This guide demonstrates how to use the performance monitoring utilities in the KineticSlider library to track, analyze, and optimize your application's performance.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Getting Started](#getting-started)
4. [Performance Hooks](#performance-hooks)
5. [Performance Utilities](#performance-utilities)
6. [Type Guards](#type-guards)
7. [Advanced Usage](#advanced-usage)
8. [Best Practices](#best-practices)

## Overview

The KineticSlider library includes a comprehensive set of performance monitoring tools that help you:

- Track frames per second (FPS)
- Monitor memory usage
- Measure component render times
- Track user interaction responsiveness
- Identify performance bottlenecks
- Set performance thresholds and alerts

## Core Concepts

The performance monitoring system includes several key components:

- **Performance Metrics**: Standard metrics tracked across the application
- **Performance Monitor**: Class that handles metric collection and analysis
- **Performance Hooks**: React hooks that integrate monitoring into components
- **Performance Utilities**: Functions for measuring specific aspects of performance
- **Type Guards**: Functions to validate performance data types

## Getting Started

### Basic Usage

The simplest way to add performance monitoring to a component is with the `usePerformance` hook:

```tsx
import { usePerformance } from 'kineticslider';

function MyComponent() {
  const { metrics, trackRender, trackInteraction } = usePerformance();
  
  // Log current performance metrics
  console.log(`Current FPS: ${metrics.fps}`);
  
  // Use in event handlers to track interaction time
  const handleClick = trackInteraction(() => {
    // Your interaction logic
  });
  
  // Call at the end of the component to track render time
  trackRender();
  
  return <div onClick={handleClick}>My Component</div>;
}
```

### Setting Up Monitoring for a Specific Component

For more targeted performance monitoring, use the `usePerformanceMonitoring` hook for slider components:

```tsx
import { usePerformanceMonitoring } from 'kineticslider';

function SliderComponent() {
  const { metrics, getMetrics } = usePerformanceMonitoring();
  
  // Access current metrics
  const { fps, memoryUsage, transitionDuration, gestureLatency } = metrics;
  
  // Get metrics summary for a specific metric
  const fpsSummary = getMetrics('fps');
  
  return (
    <div>
      <div>Current FPS: {fps}</div>
      <div>Avg FPS: {fpsSummary?.avg.toFixed(1)}</div>
    </div>
  );
}
```

## Performance Hooks

### usePerformance

The `usePerformance` hook provides general-purpose performance monitoring for any component.

```tsx
const { 
  metrics,           // Current performance metrics
  trackInteraction,  // Wrap interaction handlers
  trackRender        // Track render times
} = usePerformance({
  debug: true,                    // Enable debug logging
  logToConsole: true,             // Log metrics to console
  trackMemory: true,              // Track memory usage
  includeWebVitals: true,         // Include Web Vitals metrics
  updateInterval: 1000,           // Update interval in ms
  onMetricsUpdate: (metrics) => { // Callback when metrics update
    // Do something with metrics
  }
});
```

### usePerformanceMonitoring

The `usePerformanceMonitoring` hook provides performance monitoring specifically designed for slider components.

```tsx
const {
  metrics,     // Current metrics
  getMetrics,  // Get statistical summary of metrics
  startTracking,  // Manually start tracking
  stopTracking    // Manually stop tracking
} = usePerformanceMonitoring({
  enabled: true,           // Enable/disable monitoring
  trackFPS: true,          // Track frames per second
  trackMemory: true,       // Track memory usage
  trackTransitions: true,  // Track transition times
  trackGestures: true      // Track gesture responsiveness
});
```

## Performance Utilities

### Measuring Performance

The `measurePerformance` function wraps any function to measure its execution time:

```tsx
import { measurePerformance } from 'kineticslider';

// Wrap a function to measure its performance
const optimizedFunction = measurePerformance(
  myExpensiveFunction,
  'ExpensiveOperation'
);

// Now when called, it will log performance metrics
optimizedFunction(arg1, arg2);
// Console: "ExpensiveOperation execution time: 25.4ms"
```

### Tracking Render Time

Use `trackRenderTime` to measure component render durations:

```tsx
import { trackRenderTime } from 'kineticslider';

function MyComponent() {
  const startTime = performance.now();
  
  // Component logic...
  
  // At the end of the component logic, measure render time
  const renderDuration = trackRenderTime(
    startTime,
    'MyComponent',
    'Initial render',
    true // Log to console
  );
  
  return <div>My Component</div>;
}
```

### Tracking Interaction Time

The `trackInteraction` function helps measure user interaction responsiveness:

```tsx
import { trackInteraction } from 'kineticslider';

// In an event handler
function handleClick(event) {
  const startTime = performance.now();
  
  // Handle the click...
  processClick(event);
  
  // Track the interaction time
  const duration = performance.now() - startTime;
  trackInteraction('button_click', duration, {
    buttonId: 'submit-btn',
    context: 'checkout-form'
  });
}
```

### Creating a Performance Monitor

For advanced use cases, you can create a custom performance monitor:

```tsx
import { createPerformanceMonitor } from 'kineticslider';

// Create a monitor with custom configuration
const cleanup = createPerformanceMonitor({
  onMetricsUpdate: (metrics) => {
    // Process updated metrics
    if (metrics.fps < 30) {
      console.warn('Low frame rate detected');
    }
  },
  trackMemory: true,
  includeWebVitals: true,
  updateInterval: 2000,
  debug: process.env.NODE_ENV === 'development',
  logToConsole: false
});

// Later, clean up the monitor
cleanup();
```

### Performance Utilities for Optimization

Several utilities help optimize rendering and interaction:

```tsx
import { debounce, throttle } from 'kineticslider';

// Debounce a resize handler
const debouncedResize = debounce(handleResize, 250);
window.addEventListener('resize', debouncedResize);

// Throttle a scroll handler
const throttledScroll = throttle(handleScroll, 100);
window.addEventListener('scroll', throttledScroll);
```

## Type Guards

Type guards help ensure type safety when working with performance metrics:

```tsx
import { isPerformanceMetrics } from 'kineticslider';

// Safely check if an object is a valid PerformanceMetrics object
function processMetrics(data: unknown) {
  if (isPerformanceMetrics(data)) {
    // TypeScript now knows that data is PerformanceMetrics
    console.log(`Current FPS: ${data.fps}`);
  } else {
    console.error('Invalid metrics data');
  }
}
```

## Advanced Usage

### PerformanceMonitor Class

For complete control, use the `PerformanceMonitor` class directly:

```tsx
import { PerformanceMonitor } from 'kineticslider';

// Create a new monitor instance
const monitor = new PerformanceMonitor({
  onUpdate: (metrics) => {
    console.log('Updated metrics:', metrics);
  }
});

// Start tracking FPS and memory
const stopFPS = monitor.trackFPS();
const stopMemory = monitor.trackMemory();

// Track custom metrics
monitor.track('renderTime', 12.5);

// Get a summary of collected metrics
const fpsSummary = monitor.getMetricSummary('fps');
console.log(`Average FPS: ${fpsSummary?.avg || 0}`);

// Register observers for cleanup
const resizeObserver = new ResizeObserver(() => {});
monitor.registerObserver(resizeObserver);

// Register custom cleanup tasks
monitor.registerCleanup(() => {
  console.log('Cleaning up resources');
});

// Later, clean up all resources
monitor.cleanup();

// Or stop individual tracking
stopFPS();
stopMemory();
```

## Best Practices

1. **Focus on user-facing metrics**: Prioritize monitoring metrics that directly impact user experience, like FPS and interaction times.

2. **Use appropriate thresholds**: Set realistic performance thresholds based on your application's needs.

3. **Don't over-monitor**: Enable detailed monitoring only when needed, as it can itself impact performance.

4. **Clean up monitors**: Always clean up monitors when components unmount to prevent memory leaks.

5. **Analyze trends**: Look for patterns in performance data over time rather than focusing on individual measurements.

6. **Profile in production-like environments**: Test performance in environments that closely match production for the most accurate results.

7. **Use appropriate intervals**: For continuous monitoring, choose update intervals that balance accuracy and performance impact. 