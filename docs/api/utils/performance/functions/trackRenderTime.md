[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/performance](../README.md) / trackRenderTime

# Function: trackRenderTime()

> **trackRenderTime**(`startTime`, `componentId`, `label`?, `logToConsole`?): [`Milliseconds`](../../../types/branded/type-aliases/Milliseconds.md)

Defined in: [utils/performance.ts:106](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance.ts#L106)

Track render time for a component with detailed performance metrics.

## Parameters

### startTime

`number`

High-resolution timestamp when render started

### componentId

`string`

Unique identifier for the component being tracked

### label?

`string`

Optional description of the render operation

### logToConsole?

`boolean` = `false`

Whether to output results to console

## Returns

[`Milliseconds`](../../../types/branded/type-aliases/Milliseconds.md)

The render duration in milliseconds

## Example

```ts
const start = performance.now();
// ... render component ...
const duration = trackRenderTime(start, 'MyComponent', 'Initial render');
```

## Description

* - Uses high-resolution timestamps
- Minimal overhead for timing
- Optional console logging

## Throws

If startTime is not a valid number

## Throws

If componentId is empty or invalid
