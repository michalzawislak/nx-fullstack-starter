import baseConfig from '../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // Lint fixtures are strings with forbidden code; the tooling itself runs only in Node.
    files: ['**/*.mts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
];
