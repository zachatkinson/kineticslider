[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [components/pixi/PixiErrorBoundary](../README.md) / PixiErrorBoundary

# Class: PixiErrorBoundary

Defined in: [components/pixi/PixiErrorBoundary.tsx:45](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiErrorBoundary.tsx#L45)

Error boundary component specifically designed for Pixi.js related errors in the slider.
Catches and handles runtime errors in Pixi.js components and their children.

## Description

*

## Version

1.0.0

## Example

```tsx
<PixiErrorBoundary />
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => unknown console.error(error, errorInfo)}
>
  <PixiSlider slides={slides} />
</PixiErrorBoundary>
```

## Description

* - Uses role="alert" for error messages
- Provides clear error messaging
- Includes instructions for user recovery
- Shows detailed error info in development mode

## Description

* - Catches and handles Pixi.js specific runtime errors
- Prevents entire app from crashing
- Provides fallback UI
- Supports custom error handling

## Description

* - Sanitizes error messages in production
- Only shows detailed error info in development
- Prevents exposure of sensitive stack traces

## Description

* - Lightweight error boundary implementation
- Minimal impact on normal operation
- Efficient error state management

## See

 - PixiSlider - Main component this error boundary protects
 - SliderError - Custom error type used for Pixi.js errors

## Extends

- `any`

## Constructors

### Constructor

> **new PixiErrorBoundary**(): `PixiErrorBoundary`

#### Returns

`PixiErrorBoundary`

#### Inherited from

`Component<PixiErrorBoundaryProps, PixiErrorBoundaryState>.constructor`

## Properties

### state

> **state**: [`PixiErrorBoundaryState`](../../../../types/components/interfaces/PixiErrorBoundaryState.md)

Defined in: [components/pixi/PixiErrorBoundary.tsx:50](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiErrorBoundary.tsx#L50)

Initial state of the error boundary.

## Methods

### getDerivedStateFromError()

> `static` **getDerivedStateFromError**(`error`): [`PixiErrorBoundaryState`](../../../../types/components/interfaces/PixiErrorBoundaryState.md)

Defined in: [components/pixi/PixiErrorBoundary.tsx:62](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiErrorBoundary.tsx#L62)

Static method to derive error state from caught errors.
Called when an error occurs during rendering.

#### Parameters

##### error

`Error`

The error that was caught

#### Returns

[`PixiErrorBoundaryState`](../../../../types/components/interfaces/PixiErrorBoundaryState.md)

New state with error information

***

### componentDidCatch()

> **componentDidCatch**(`error`, `errorInfo`): `unknown`

Defined in: [components/pixi/PixiErrorBoundary.tsx:76](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiErrorBoundary.tsx#L76)

Lifecycle method called after an error has been caught.
Handles error logging and custom error callbacks.

#### Parameters

##### error

`Error`

The error that was caught

##### errorInfo

`ErrorInfo`

Additional information about the error

#### Returns

`unknown`

***

### render()

> **render**(): `unknown`

Defined in: [components/pixi/PixiErrorBoundary.tsx:87](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiErrorBoundary.tsx#L87)

Renders either the error UI or the children components.
Provides a fallback UI when an error occurs.

#### Returns

`unknown`

The rendered content
