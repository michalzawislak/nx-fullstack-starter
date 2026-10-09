import playwright from 'eslint-plugin-playwright';

import baseConfig from '../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    // Playwright callbacks such as page.evaluate() run in the browser.
    rules: {
      'no-restricted-globals': 'off',
    },
  },
];
