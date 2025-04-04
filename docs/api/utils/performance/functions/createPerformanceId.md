[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/performance](../README.md) / createPerformanceId

# Function: createPerformanceId()

> **createPerformanceId**(`prefix`, `suffix`?): `string`

Defined in: [utils/performance.ts:181](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance.ts#L181)

Create a unique performance tracking ID for a component.

## Parameters

### prefix

`string`

Component name or identifier prefix

### suffix?

`string`

Optional unique suffix

## Returns

`string`

A unique tracking ID

## Example

```ts
const _id = createPerformanceId('Slider', 'main');
// Returns: "Slider_main_1234";
```
