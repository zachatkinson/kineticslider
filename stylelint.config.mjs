/**
 * Stylelint configuration
 * @type {import('stylelint').Config}
 */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-class-pattern': null,
    'value-keyword-case': [
      'lower',
      {
        ignoreKeywords: ['currentColor']
      }
    ]
  }
}; 