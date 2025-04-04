[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/form-helpers](../README.md) / validateAndSubmit

# Function: validateAndSubmit()

> **validateAndSubmit**\<`T`\>(`data`, `validateFn`, `onSave`, `setValidating`, `setValidationResult`, `setSubmitted`): `Promise`\<`void`\>

Defined in: [utils/form-helpers.ts:100](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/form-helpers.ts#L100)

Validate and submit form data

## Type Parameters

### T

`T`

## Parameters

### data

`T`

### validateFn

(`data`) => `Promise`\<[`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md)\>

### onSave

(`data`) => `void`

### setValidating

(`validating`) => `void`

### setValidationResult

(`result`) => `void`

### setSubmitted

(`submitted`) => `void`

*

## Returns

`Promise`\<`void`\>

- The return value
