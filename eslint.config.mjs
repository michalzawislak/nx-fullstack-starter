import nx from '@nx/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

/**
 * Module boundaries (PRD section 4).
 * Every project has one `scope:*` and one `type:*` tag; a dependency must satisfy
 * the constraints of both tags of the importing project.
 */
const depConstraints = [
  {
    sourceTag: 'scope:web',
    onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'],
  },
  {
    sourceTag: 'scope:api',
    onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'],
  },
  { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:ui',
      'type:core',
      'type:data-access',
      'type:util',
      'type:contracts',
    ],
  },
  { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:contracts'] },
  {
    allSourceTags: ['scope:web', 'type:feature'],
    onlyDependOnLibsWithTags: ['type:ui', 'type:core', 'type:contracts'],
  },
  {
    // Backend features may use each other (auth depends on users).
    allSourceTags: ['scope:api', 'type:feature'],
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:data-access',
      'type:util',
      'type:contracts',
    ],
  },
  {
    sourceTag: 'type:ui',
    onlyDependOnLibsWithTags: ['type:ui', 'type:contracts'],
  },
  {
    sourceTag: 'type:core',
    onlyDependOnLibsWithTags: ['type:core', 'type:contracts'],
  },
  {
    sourceTag: 'type:data-access',
    onlyDependOnLibsWithTags: [
      'type:data-access',
      'type:util',
      'type:contracts',
    ],
  },
  {
    sourceTag: 'type:util',
    onlyDependOnLibsWithTags: ['type:util', 'type:contracts'],
  },
  { sourceTag: 'type:contracts', onlyDependOnLibsWithTags: ['type:contracts'] },
];

/** Import order (PRD QA-6). Groups are separated by a blank line. */
const importGroups = [
  ['^\\u0000'],
  ['^node:'],
  ['^@angular/(core|common)(/.*)?$'],
  ['^rxjs(/.*)?$'],
  ['^@angular/'],
  ['^@nestjs/'],
  ['^@?\\w'],
  ['^@starter/(web|api)/core(/.*)?$', '^@starter/(web|api)/'],
  ['^@starter/shared/'],
  ['environments?/'],
  ['^\\.'],
];

/** Platform access is allowed only in libs/web/core/platform (PRD FE-9, FE-26, QA-4). */
/**
 * Zod: always `zod/mini` (ADR-0015). Classic `zod` adds about 80 kB to the web bundle, and its
 * named import `{ z }` defeats tree-shaking entirely.
 */
const classicZodRestriction = {
  name: 'zod',
  message: "Use `import * as z from 'zod/mini'` (ADR-0015).",
};

const platformRestrictedImports = {
  paths: [classicZodRestriction],
  patterns: [
    {
      group: ['@capacitor/*'],
      message:
        'Capacitor plugins may be imported only in libs/web/core/platform.',
    },
  ],
};

const platformGlobalMessage =
  'Use an abstraction from @starter/web/core/platform (FE-26); browser globals are allowed only there.';

const platformRestrictedGlobals = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
].map((name) => ({ name, message: platformGlobalMessage }));

/** XSS: rely on Angular sanitisation, never on raw HTML or trust bypasses (PRD QA-13). */
const unsafeHtmlRestrictions = [
  {
    selector: 'MemberExpression[property.name=/^(innerHTML|outerHTML)$/]',
    message:
      'Do not write raw HTML; bind text or use Angular templates (QA-13).',
  },
  {
    selector: 'CallExpression[callee.property.name=/^bypassSecurityTrust/]',
    message:
      'Do not bypass Angular sanitisation (QA-13); add an ADR if it is truly needed.',
  },
];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vitest.config.*.timestamp*',
      '**/vite.config.*.timestamp*',
      '**/src/generated/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints,
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'simple-import-sort/imports': ['error', { groups: importGroups }],
      'simple-import-sort/exports': 'error',
      // Secure by default everywhere; only libs/web/core/platform opts out.
      'no-restricted-imports': ['error', platformRestrictedImports],
      'no-restricted-globals': ['error', ...platformRestrictedGlobals],
      'no-restricted-syntax': ['error', ...unsafeHtmlRestrictions],
    },
  },
];
