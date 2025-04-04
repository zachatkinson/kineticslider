[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [hooks/useFormValidation](../README.md) / useFormValidation

# Function: useFormValidation()

> **useFormValidation**\<`T`\>(`formData`, `validationFn`?, `options`?): [`FormValidationState`](../../../types/form-validation/interfaces/FormValidationState.md)\<`T`\>

Defined in: [hooks/useFormValidation.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/hooks/useFormValidation.ts#L26)

Hook for handling form validation with debounce

## Type Parameters

### T

`T`

## Parameters

### formData

`T`

The form data to validate

### validationFn?

(`data`) => `Promise`\<[`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md)\>

Optional custom validation function

### options?

[`FormValidationOptions`](../../../types/form-validation/interfaces/FormValidationOptions.md)

Validation options

## Returns

[`FormValidationState`](../../../types/form-validation/interfaces/FormValidationState.md)\<`T`\>

Object containing validation: state, result and helper functions
