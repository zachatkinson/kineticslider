[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [constants/validation](../README.md) / VALIDATION\_CSS\_CLASSES

# Variable: VALIDATION\_CSS\_CLASSES

> `const` **VALIDATION\_CSS\_CLASSES**: `object`

Defined in: [constants/validation.ts:94](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/constants/validation.ts#L94)

CSS classes for form validation states.
Provides consistent styling for form validation feedback.

## Type declaration

### BASE

> **BASE**: `string` = `'form-control'`

### FEEDBACK\_INVALID

> **FEEDBACK\_INVALID**: `string` = `'invalid-feedback'`

### FEEDBACK\_VALID

> **FEEDBACK\_VALID**: `string` = `'valid-feedback'`

### FEEDBACK\_WARNING

> **FEEDBACK\_WARNING**: `string` = `'warning-feedback'`

### INVALID

> **INVALID**: `string` = `'form-control is-invalid'`

### VALID

> **VALID**: `string` = `'form-control is-valid'`

### WARNING

> **WARNING**: `string` = `'form-control is-warning'`

## Constant

## Example

```typescript
import { VALIDATION_CSS_CLASSES } from './validation';

const _inputClassName = isValid 
  ? VALIDATION_CSS_CLASSES.VALID 
  : VALIDATION_CSS_CLASSES.INVALID;
```

## Description

* - Uses standard Bootstrap validation classes
- Provides visual feedback for validation states
- Supports screen reader announcements
