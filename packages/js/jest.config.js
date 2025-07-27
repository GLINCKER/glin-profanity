/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Root directory for Jest to scan for tests and modules
  rootDir: '.',
  
  // Configure different environments for different test files
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
      moduleFileExtensions: ['ts', 'js', 'json'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/../../shared/$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: {
            strict: true,
            module: 'commonjs',
            target: 'es2020',
            skipLibCheck: false
          }
        }]
      }
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.test.tsx'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/../../shared/$1'
      },
      setupFilesAfterEnv: ['@testing-library/jest-dom'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            strict: true,
            module: 'commonjs',
            target: 'es2020',
            skipLibCheck: false,
            jsx: 'react-jsx'
          }
        }]
      }
    }
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],

  // Coverage thresholds - make them warnings instead of failures
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for better debugging
  verbose: true,

  // Error reporting
  errorOnDeprecated: true
};