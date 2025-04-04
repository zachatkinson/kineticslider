[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-extras](../README.md) / createValidator

# Function: createValidator()

> **createValidator**\<`T`\>(`validator`, `ValidationResult`): (`value`) => `unknown`

Defined in: utils/validation-extras.ts:16

Create a type-guard function from a validator
This allows using a validator as a TypeScript type guard

## Type Parameters

### T

`T`

## Parameters

### validator

(`value`, `context`?) => `unknown`

The validator function to convert to a type guard

### ValidationResult

`any`

## Returns

`Function`

A type guard function

### Parameters

#### value

`unknown`

### Returns

`unknown`
