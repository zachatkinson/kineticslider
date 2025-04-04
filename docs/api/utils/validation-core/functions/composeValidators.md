[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-core](../README.md) / composeValidators

# Function: composeValidators()

> **composeValidators**\<`T`\>(...`validators`, `unknown`, `ValidationResult`): `any`

Defined in: utils/validation-core.ts:92

Composes multiple validators into one

## Type Parameters

### T

`T`

## Parameters

### validators

...(`value`, `context`?) => `any`[]

The validators to compose

### unknown

`any`

### ValidationResult

`any`

## Returns

`any`

A composed validator function
