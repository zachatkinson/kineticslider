/**
 * Stylelint configuration
 *
 * @type {import('stylelint').Config}
 */
import type { Config } from 'stylelint';

const config: Config = {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]+$',
    'value-keyword-case': [
      'lower',
      {
        ignoreFunctions: ['/.+/'],
        ignoreKeywords: ['/.+/'],
        ignoreProperties: ['/^[$]/'],
      },
    ],
  },
};

export default config; 