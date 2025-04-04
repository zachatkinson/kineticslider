[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/form-validation](../README.md) / FormValidationState

# Interface: FormValidationState\<T\>

Defined in: [types/form-validation.ts:20](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L20)

Form validation state

## Example

```ts
Example usage
```

## Type Parameters

### T

`T`

## Properties

### \_submitted

> **\_submitted**: `boolean`

Defined in: [types/form-validation.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L26)

Whether form has been _submitted

***

### \_validating

> **\_validating**: `boolean`

Defined in: [types/form-validation.ts:24](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L24)

Whether validation is in progress

***

### getErrorForField()

> **getErrorForField**: (`_fieldName`) => `unknown`

Defined in: [types/form-validation.ts:30](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L30)

Get error for specific field

#### Parameters

##### \_fieldName

`string`

#### Returns

`unknown`

***

### setSubmitted()

> **setSubmitted**: (`_submitted`) => `unknown`

Defined in: [types/form-validation.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L28)

Set _submitted state

#### Parameters

##### \_submitted

`boolean`

#### Returns

`unknown`

***

### validationResult

> **validationResult**: [`ValidationResult`](../../validation/interfaces/ValidationResult.md)

Defined in: [types/form-validation.ts:22](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L22)

Current validation _result

***

### void

> **void**: `any`

Defined in: [types/form-validation.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/form-validation.ts#L28)
