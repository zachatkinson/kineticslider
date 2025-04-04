[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/hoc](../README.md) / withErrorBoundary

# Function: withErrorBoundary()

> **withErrorBoundary**\<`P`\>(`Component`, `errorBoundaryProps`): `any`

Defined in: [utils/hoc.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/hoc.ts#L12)

Higher-order component that wraps a component with an ErrorBoundary

## Type Parameters

### P

`P` *extends* `object`

## Parameters

### Component

`ComponentType`\<`P`\>

The component to wrap

### errorBoundaryProps

`Omit`\<[`ErrorBoundaryProps`](../../../types/components/interfaces/ErrorBoundaryProps.md), `"children"`\>

Props to pass to the ErrorBoundary

## Returns

`any`

A wrapped component with error boundary protection
