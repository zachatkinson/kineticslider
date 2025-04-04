[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [components/FocusRestoreExample](../README.md) / FocusRestoreExample

# Variable: FocusRestoreExample

> `const` **FocusRestoreExample**: `React.FC`

Defined in: [components/FocusRestoreExample.tsx:37](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/FocusRestoreExample.tsx#L37)

Example component demonstrating focus management in a modal dialog using the FocusManager component.
This component serves as a reference implementation for proper focus management in modal dialogs.

## Description

*

## Example

```tsx
<FocusRestoreExample />
```

## Description

* - Implements ARIA dialog pattern
- Manages focus trap in modal
- Restores focus on close
- Supports keyboard navigation
- Uses semantic HTML structure
- Provides ARIA labels

## Description

* - Manages modal open/close state
- Controls focus state
- Handles dialog visibility

 onChange
- Modal open/close events
- Focus trap activation
- Focus restoration
- Escape key handling

## Description

* - Uses React state for modal
- Implements conditional rendering
- Manages DOM focus efficiently

## See

{@link: FocusManager} For focus management implementation
