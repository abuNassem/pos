export default {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/auth/integration/env.js'],
  testTimeout: 30000, // bcrypt بـ 12 rounds بطيء نسبيًا
};