module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'node_modules',
    '*.d.ts',
    'server/core-rust',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
  },
  overrides: [
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off', // Allow console in scripts
      },
    },
  ],
};