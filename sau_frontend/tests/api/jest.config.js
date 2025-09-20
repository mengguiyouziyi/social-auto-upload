module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['./setup.js'],
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/setup.js'
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  transform: {},
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  globals: {
    'TEST_CONFIG': {
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5409',
      API_TIMEOUT: parseInt(process.env.API_TIMEOUT) || 30000,
      TEST_MODE: true
    }
  }
};