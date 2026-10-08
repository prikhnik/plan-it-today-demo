// @ts-check
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/test-results/',
      '**/playwright-report/',
      'docs/',
      'reports/',
      'Claude outputs/',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['apps/mini-app/src/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: 'readonly', __APP_BUILD__: 'readonly' },
    },
  },
  {
    files: ['**/*.config.js', '**/scripts/**/*.mjs', '**/test/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Playwright code partly runs inside the page (page.evaluate).
    files: ['apps/mini-app/scripts/**/*.mjs', 'apps/mini-app/e2e/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
