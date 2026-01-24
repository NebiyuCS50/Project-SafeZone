module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'api/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 75
    }
  },
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  verbose: true,
  // ES Module support
  transformIgnorePatterns: [
    'node_modules/(?!(openai|firebase-admin)/)'
  ]
};