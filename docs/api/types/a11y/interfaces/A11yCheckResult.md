[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/a11y](../README.md) / A11yCheckResult

# Interface: A11yCheckResult

Defined in: types/a11y.ts:67

Result of an accessibility check

## Example

```ts
Example usage
```

## Properties

### passed

> **passed**: `boolean`

Defined in: types/a11y.ts:71

Whether the element passed all accessibility checks

***

### violations

> **violations**: `object`[]

Defined in: types/a11y.ts:76

Violations found during the accessibility check

#### description

> **description**: `string`

#### id

> **id**: `string`

#### impact

> **impact**: `"minor"` \| `"moderate"` \| `"serious"` \| `"critical"`

#### nodes

> **nodes**: `object`[]

***

### warnings

> **warnings**: `object`[]

Defined in: types/a11y.ts:89

Warnings found during the accessibility check

#### description

> **description**: `string`

#### id

> **id**: `string`

#### nodes

> **nodes**: `object`[]
