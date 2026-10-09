import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // The contract is plain TypeScript and Zod, usable by every app (PRD section 4).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@angular/*',
                '@nestjs/*',
                'rxjs',
                'rxjs/*',
                '@capacitor/*',
              ],
              message:
                'libs/shared/contracts may depend only on zod (PRD section 4).',
            },
            {
              group: ['@starter/web/*', '@starter/api/*'],
              message:
                'libs/shared/contracts must not import frontend or backend code.',
            },
          ],
        },
      ],
    },
  },
];
