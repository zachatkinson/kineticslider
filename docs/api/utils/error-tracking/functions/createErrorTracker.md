[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/error-tracking](../README.md) / \_createErrorTracker

# Function: \_createErrorTracker()

> **\_createErrorTracker**(`componentInfo`, `type`): () => `any`

Defined in: [utils/error-tracking.ts:49](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-tracking.ts#L49)

Creates an error tracker that wraps console.error

## Parameters

### componentInfo

`Record`\<`string`, `unknown`\>

Context information about the component

### type

[`ErrorType`](../../../types/error/enumerations/ErrorType.md)

Type of errors to track

## Returns

`Function`

Cleanup function to restore original console.error

### Returns

`any`
