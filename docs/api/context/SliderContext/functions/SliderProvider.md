[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [context/SliderContext](../README.md) / SliderProvider

# Function: SliderProvider()

> **SliderProvider**(`__namedParameters`): `void`

Defined in: [context/SliderContext.tsx:162](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/context/SliderContext.tsx#L162)

Provider component for the Slider context.
Manages state and provides actions for slider functionality.

## Parameters

### \_\_namedParameters

#### children

`any`

#### config?

`any`

#### items

`any`

## Returns

`void`

The function return value

## Description

*

## Example

```tsx
<SliderProvider items={slides} config={{ loop: true }}>
  <Slider />
</SliderProvider>
```

## Description

* - Memoized callback functions
- Optimized state updates
- Efficient context value computation

## Description

* - Supports keyboard navigation
- Announces slide changes
- ARIA attributes for controls
 *
