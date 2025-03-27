/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: [
    '@commitlint/config-conventional',
    '@commitlint/config-lerna-scopes'
  ],
  plugins: [
    '@commitlint/ensure-jira-ticket',
    '@commitlint/ensure-semantic-release'
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Code change that improves performance
        'test',     // Adding missing tests or correcting existing tests
        'build',    // Changes that affect the build system or external dependencies
        'ci',       // Changes to our CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
        'security', // Security improvements
        'deps',     // Dependencies updates
        'i18n',     // Internationalization and localization
        'a11y',     // Accessibility improvements
      ],
    ],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower'],
    'scope-enum': [2, 'always', [
      'core',
      'ui',
      'api',
      'auth',
      'data',
      'utils',
      'config',
      'deps',
      'tests',
      'types',
      'docs',
      'ci',
      'build',
      'release',
      'security',
      'perf',
      'i18n',
      'a11y',
      '*'
    ]],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
    'header-case': [2, 'always', 'lower'],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'references-empty': [2, 'never']
  },
  defaultIgnores: true,
  helpUrl:
    'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  prompt: {
    settings: {
      enableMultipleScopes: true,
      scopeEnumSeparator: ','
    },
    messages: {
      skip: ':skip',
      max: 'upper %d chars',
      min: '%d chars at least',
      emptyWarning: 'can not be empty',
      upperLimitWarning: 'over limit',
      lowerLimitWarning: 'below limit'
    },
    questions: {
      type: {
        description: "Select the type of change you're committing"
      },
      scope: {
        description: 'Denote the scope of this change (optional)'
      },
      subject: {
        description: 'Write a short, imperative tense description of the change'
      },
      body: {
        description: 'Provide a longer description of the change (optional)'
      },
      breaking: {
        description: 'List any breaking changes (optional)'
      },
      issues: {
        description: 'Add issue references (optional)'
      }
    }
  }
};

module.exports = config; 