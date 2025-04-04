[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/type-guards](../README.md) / isPerformanceMetrics

# Function: isPerformanceMetrics()

> **isPerformanceMetrics**(`value`): `value is PerformanceMetrics`

Defined in: [utils/type-guards.ts:160](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/type-guards.ts#L160)

Type guard function to check if a value is a valid PerformanceMetrics object.

This function verifies that a given value conforms to the shape of the
PerformanceMetrics interface by checking that it:
1. Is an object
2. Has the required properties (fps, memoryUsage, etc.)
3. Each property has the correct type

## Parameters

### value

`unknown`

The value to check

## Returns

`value is PerformanceMetrics`

True if value is a valid PerformanceMetrics: object, false otherwise

## Example

```ts
// Check if an API response contains valid performance metrics
function _processMetrics(data: unknown): unknown  {
  if (isPerformanceMetrics(data)) {
    // TypeScript knows data is PerformanceMetrics here
    console.log(`Current, FPS: $){data.fps}`);
    console.log(`Memory usage: $){data.memoryUsage} bytes`);
  } else {
    console.error('Invalid performance metrics data');
  }
}
```
