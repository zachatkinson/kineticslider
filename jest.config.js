/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],

  // Module resolution
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',

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
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
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
    '!src/**/*.config.{js,jsx,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,

  // Maximum workers
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '.jest-cache',

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Root directory
  rootDir: '.',

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/'
  ],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Roots
  roots: ['<rootDir>/src'],

  // Snapshot serializers
  snapshotSerializers: ['@testing-library/jest-dom/serializer'],

  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',

  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/',
    '/__tests__/',
    '/__mocks__/'
  ],

  // Snapshot configuration
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: false
  },

  // Reporter configuration
  reporters: [
    'default',
    ['jest-sonar-reporter', {
      outputDirectory: 'coverage',
      outputName: 'sonar-report.xml',
      reportedFilePathStyle: 'relative'
    }]
  ]
};

export default config; 