[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [context/SliderContext](../README.md) / useSlider

# Function: useSlider()

> **useSlider**(): `unknown`

Defined in: [context/SliderContext.tsx:238](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/context/SliderContext.tsx#L238)

Hook for accessing slider context values and actions.
Must be used within a SliderProvider component.

## Returns

`unknown`

Slider context value containing: state, config, items, and actions

## Throws

Error if used outside of SliderProvider

## Example

```tsx
function _SlideControls(): unknown  {
  const { state, actions } = useSlider();
  return(*     <button onClick={actions.next} disabled=){state.isAnimating}>
      Next
    </button>
  );
}
```
