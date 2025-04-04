[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/accessibility](../README.md) / FocusManagerProps

# Interface: FocusManagerProps

Defined in: [types/accessibility.ts:10](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L10)

Props for the FocusManager component

## Example

```ts
Example usage
```

## Properties

### autoFocus?

> `optional` **autoFocus**: `boolean`

Defined in: [types/accessibility.ts:24](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L24)

Whether to auto-focus the first focusable element

***

### children

> **children**: `ReactNode`

Defined in: [types/accessibility.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L12)

Child components to render

***

### escapeDeactivates?

> `optional` **escapeDeactivates**: `boolean`

Defined in: [types/accessibility.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L26)

Whether pressing escape should deactivate the focus trap

***

### initialFocus?

> `optional` **initialFocus**: `string` \| `HTMLElement` \| () => `null` \| `HTMLElement`

Defined in: [types/accessibility.ts:18](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L18)

Initial element to focus

***

### onActivate()?

> `optional` **onActivate**: () => `void`

Defined in: [types/accessibility.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L28)

Callback when focus trap is activated

#### Returns

`void`

***

### onDeactivate()?

> `optional` **onDeactivate**: () => `void`

Defined in: [types/accessibility.ts:30](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L30)

Callback when focus trap is deactivated

#### Returns

`void`

***

### onEscape()?

> `optional` **onEscape**: () => `void`

Defined in: [types/accessibility.ts:32](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L32)

Callback when escape key is pressed

#### Returns

`void`

***

### restoreFocus?

> `optional` **restoreFocus**: `boolean`

Defined in: [types/accessibility.ts:22](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L22)

Whether to restore focus when unmounted

***

### returnFocusTo?

> `optional` **returnFocusTo**: `string` \| `HTMLElement` \| () => `null` \| `HTMLElement`

Defined in: [types/accessibility.ts:20](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L20)

Element to return focus to when unmounted

***

### trapFocus?

> `optional` **trapFocus**: `boolean`

Defined in: [types/accessibility.ts:14](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L14)

Whether to trap focus within the container

***

### trapOptions?

> `optional` **trapOptions**: [`FocusTrapOptions`](../../keyboard/interfaces/FocusTrapOptions.md)

Defined in: [types/accessibility.ts:16](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/accessibility.ts#L16)

Focus trap configuration options
