/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '^@/__mocks__/(.*)$': '<rootDir>/src/__mocks__/$1',
    '^pixi-filters$': '<rootDir>/__mocks__/pixi-filters.js',
    '^../utils/environment$': '<rootDir>/src/__mocks__/environment.ts',
    '^./utils/environment$': '<rootDir>/src/__mocks__/environment.ts',
    '^gsap$': '<rootDir>/__mocks__/gsap.js',
    '^gsap/PixiPlugin$': '<rootDir>/__mocks__/gsap.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@pixi|pixi.js|pixi-filters)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  resolver: undefined
};

export default config;
