/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Set the test environment
  testEnvironment: 'node',
  
  // Root directory for Jest to scan for tests and modules
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        strict: true,
        module: 'commonjs',
        target: 'es2020',
        skipLibCheck: false
      }
    }]
  },
  
  
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 50,
      lines: 70,
      statements: 70
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