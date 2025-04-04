[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [components/SlideForm](../README.md) / SlideForm

# Variable: SlideForm

> `const` **SlideForm**: `React.FC`\<[`SlideFormProps`](../../../types/form/interfaces/SlideFormProps.md)\>

Defined in: [components/SlideForm.tsx:58](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/SlideForm.tsx#L58)

A form component for creating and editing slider slides with validation and accessibility support.

## Description

*

## Example

```tsx
<SlideForm
  initialSlide={{ title: 'Example', image: 'https://example.com/image.jpg' }} />
  onSave={(slide) => handleSave(slide)}
  onCancel={() => handleCancel()}
/>
```

## Description

* - Uses semantic form elements
- Provides ARIA labels and descriptions
- Shows validation feedback
- Supports keyboard navigation
- Uses required field indicators

## Description

* - Manages form field values
- Tracks validation state
- Handles submission state
- Manages error states

 onChange
- onSave: Fired when form is valid and submitted
- onCancel: Fired when form is cancelled
- onChange: Internal field change handling

## Description

* - Real-time field validation
- Debounced validation checks
- Error message display
- Field-level feedback
- Form-level validation

## Description

* - Displays validation errors
- Shows warning messages
- Provides error suggestions
- Prevents invalid submissions

## See

 - {@link: useSlideValidation} For validation hook implementation
 - {@link: validateSlide} For validation logic
