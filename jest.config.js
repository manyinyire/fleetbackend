const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Shared config
const sharedConfig = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/tests/setup/'],
}

// Component tests use jsdom
const componentConfig = {
  ...sharedConfig,
  displayName: 'components',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/components/**/*.{js,jsx,ts,tsx}',
  ],
}

// API, unit, security, integration tests use node
const serverConfig = {
  ...sharedConfig,
  displayName: 'server',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/unit/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/api/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/security/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/performance/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/e2e/**/*.{js,jsx,ts,tsx}',
  ],
}

module.exports = async () => {
  const baseConfig = await createJestConfig(sharedConfig)()
  return {
    ...baseConfig,
    projects: [
      await createJestConfig(componentConfig)(),
      await createJestConfig(serverConfig)(),
    ],
  }
}
