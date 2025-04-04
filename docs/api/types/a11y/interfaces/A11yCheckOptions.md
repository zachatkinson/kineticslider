[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/a11y](../README.md) / A11yCheckOptions

# Interface: A11yCheckOptions

Defined in: types/a11y.ts:41

Options for accessibility checks

## Example

```ts
Example usage
```

## Properties

### customRules?

> `optional` **customRules**: `Record`\<`string`, `unknown`\>

Defined in: types/a11y.ts:60

Custom rules to include in the accessibility check

***

### element

> **element**: `HTMLElement`

Defined in: types/a11y.ts:45

The element to check for accessibility issues

***

### excludeRules?

> `optional` **excludeRules**: `string`

Defined in: types/a11y.ts:55

Rules to exclude from the accessibility check

***

### includeWarnings?

> `optional` **includeWarnings**: `boolean`

Defined in: types/a11y.ts:50

Whether to include warnings in the results
