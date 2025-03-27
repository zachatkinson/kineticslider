/** @type {import('jest').Config} */
const config = {
  // Test environment and setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    './jest.setup.js',
    '@testing-library/jest-dom/extend-expect'
  ],
  globalSetup: './jest.global-setup.js',
  globalTeardown: './jest.global-teardown.js',

  // Module resolution
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@test-utils/(.*)$': '<rootDir>/src/test-utils/$1',

    // Static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',

    // Mock directories
    '^@/__mocks__/(.*)$': '<rootDir>/src/__mocks__/$1',

    // External libraries
    '^pixi-filters$': '<rootDir>/__mocks__/pixi-filters.js',
    '^gsap$': '<rootDir>/__mocks__/gsap.js',
    '^gsap/PixiPlugin$': '<rootDir>/__mocks__/gsap.js',
    '^../utils/environment$': '<rootDir>/src/__mocks__/environment.ts',
    '^./utils/environment$': '<rootDir>/src/__mocks__/environment.ts'
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json',
      diagnostics: {
        ignoreCodes: [151001]
      },
      isolatedModules: true,
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: { metaObjectReplacement: { url: 'https://localhost' } }
          }
        ]
      }
    }]
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@pixi|pixi.js|pixi-filters|gsap)/)'
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test matching patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.integration.{js,jsx,ts,tsx}',
    '<rootDir>/e2e/**/*.test.{js,jsx,ts,tsx}'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
    '!src/test-utils/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
    customExportConditions: ['node', 'node-addons'],
    testURL: 'http://localhost',
    html: true
  },

  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects'
  ],

  // Verbose output and error handling
  verbose: true,
  bail: 5,
  testTimeout: 10000,
  maxWorkers: '50%',
  maxConcurrency: 5,

  // Cache and performance
  cacheDirectory: '.jest-cache',
  cache: true,
  detectOpenHandles: true,
  forceExit: true,

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  resetModules: true,

  // Directory configuration
  rootDir: '.',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/',
    '/e2e/'
  ],
  modulePaths: ['<rootDir>/src'],
  roots: ['<rootDir>/src'],

  // Snapshot configuration
  snapshotSerializers: [
    '@testing-library/jest-dom/serializer',
    'jest-serializer-html'
  ],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: false,
    minified: true
  },

  // Reporting configuration
  testResultsProcessor: 'jest-sonar-reporter',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-sonar-reporter', {
      outputDirectory: 'coverage',
      outputName: 'sonar-report.xml',
      reportedFilePathStyle: 'relative'
    }],
    ['jest-html-reporter', {
      pageTitle: 'Test Report',
      outputPath: 'coverage/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],

  // Error handling
  errorOnDeprecated: true,
  notify: true,
  notifyMode: 'failure-change',

  // Projects configuration for monorepo support
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.{ts,tsx}']
    }
  ]
};

export default config; 