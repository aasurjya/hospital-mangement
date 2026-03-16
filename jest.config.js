/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Allow ts-jest to transpile even with noEmit
        noEmit: false,
        // Use CommonJS modules for Jest compatibility
        module: 'commonjs',
        moduleResolution: 'node',
      },
    }],
  },
  moduleNameMapper: {
    // Resolve the @/* path alias declared in tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Only pick up files in __tests__ directories or *.test.ts files
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  // Coverage collection for the chat feature
  collectCoverageFrom: [
    'src/app/hospital/chat/actions.ts',
    'src/lib/chat/schemas.ts',
    'src/lib/chat/constants.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
}

module.exports = config
