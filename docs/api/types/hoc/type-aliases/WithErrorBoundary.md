[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/hoc](../README.md) / WithErrorBoundary

# Type Alias: WithErrorBoundary()

> **WithErrorBoundary** = \<`P`\>(`Component`, `errorBoundaryProps`) => `unknown`

Defined in: [types/hoc.ts:13](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/hoc.ts#L13)

Type for a component wrapped with an error boundary

## Type Parameters

### P

`P` *extends* `object`

## Parameters

### Component

`ComponentType`\<`P`\>

### errorBoundaryProps

`Omit`\<[`ErrorBoundaryProps`](../../components/interfaces/ErrorBoundaryProps.md), `"children"`\>

## Returns

`unknown`
