[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [context/SliderContext](../README.md) / withSlider

# Function: withSlider()

> **withSlider**\<`P`\>(`WrappedComponent`): (`props`) => `unknown`

Defined in: [context/SliderContext.tsx:263](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/context/SliderContext.tsx#L263)

Higher-order component that wraps a component with SliderProvider.
Provides slider context to the wrapped component.

## Type Parameters

### P

`P` *extends* `object`

Props type of the wrapped component

## Parameters

### WrappedComponent

`ComponentType`\<`P`\>

Component to wrap with slider context

## Returns

`Function`

Wrapped component with slider context

### Parameters

#### props

`P` & `Omit`\<[`SliderProviderProps`](../../../types/context/interfaces/SliderProviderProps.md), `"children"`\>

### Returns

`unknown`

## Example

```tsx
const SliderWithContext = withSlider(Slider);

function _App(): unknown  {
  return <SliderWithContext items={slides} config={config} />;
}
```
