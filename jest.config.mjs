export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/test-utils/setup.ts',
    '<rootDir>/src/test-utils/api-setup.ts'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/test-utils/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!lucide-react|@stripe/react-stripe-js)'
  ],
  globals: {
    'Request': class {},
    'Response': class {},
    'Headers': class {}
  }
}