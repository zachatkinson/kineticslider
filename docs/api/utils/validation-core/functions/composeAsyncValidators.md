[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-core](../README.md) / composeAsyncValidators

# Function: composeAsyncValidators()

> **composeAsyncValidators**\<`T`\>(...`validators`, `Promise`, ``, `ValidationResult`): `any`

Defined in: utils/validation-core.ts:118

Composes multiple async validators into one

## Type Parameters

### T

`T`

## Parameters

### validators

...(`value`, `context`?) => `unknown`[]

The async validators to compose

### Promise

`any`

### 

`any`

### ValidationResult

`any`

## Returns

`any`

A composed async validator function
