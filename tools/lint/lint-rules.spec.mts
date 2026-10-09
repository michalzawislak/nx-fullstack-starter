import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Regression tests of the lint rules that guard the architecture (PRD sections 4, 9.2).
 * Each case lints a snippet as if it were a file in a given project, with that project's
 * eslint.config.mjs, exactly as `nx lint` does.
 */
const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let eslint: ESLint;

async function ruleIdsFor(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, {
    filePath: join(workspaceRoot, filePath),
  });
  return (result?.messages ?? []).map((message) => message.ruleId ?? 'fatal');
}

beforeAll(() => {
  eslint = new ESLint({
    cwd: workspaceRoot,
    // Use the nearest eslint.config.mjs, like `nx lint` running in each project.
    flags: ['v10_config_lookup_from_file'],
  });
});

const FEATURE_FILE = 'libs/web/feature-home/src/lib/lint-fixture.ts';
const PLATFORM_FILE = 'libs/web/core/platform/src/lib/lint-fixture.ts';
const API_FILE = 'libs/api/users/src/lib/lint-fixture.ts';
const CONTRACTS_FILE = 'libs/shared/contracts/src/lib/lint-fixture.ts';

describe('architecture lint rules', () => {
  it.each([
    [
      'a Capacitor plugin outside the platform layer',
      FEATURE_FILE,
      "import { App } from '@capacitor/app';\nexport const app = App;\n",
      'no-restricted-imports',
    ],
    [
      'a browser global outside the platform layer',
      FEATURE_FILE,
      'export const href = window.location.href;\n',
      'no-restricted-globals',
    ],
    [
      'localStorage outside the platform layer',
      FEATURE_FILE,
      "export const theme = localStorage.getItem('theme');\n",
      'no-restricted-globals',
    ],
    [
      'classic Zod',
      API_FILE,
      "import * as z from 'zod';\nexport const schema = z.string();\n",
      'no-restricted-imports',
    ],
    [
      'any',
      API_FILE,
      'export const value: any = 1;\n',
      '@typescript-eslint/no-explicit-any',
    ],
    [
      'raw HTML',
      FEATURE_FILE,
      "export const render = (element: HTMLElement): void => {\n  element.innerHTML = '<b>x</b>';\n};\n",
      'no-restricted-syntax',
    ],
    [
      'a sanitisation bypass',
      FEATURE_FILE,
      "import { DomSanitizer } from '@angular/platform-browser';\nexport const trust = (sanitizer: DomSanitizer) => sanitizer.bypassSecurityTrustHtml('x');\n",
      'no-restricted-syntax',
    ],
    [
      'frontend code importing the backend',
      FEATURE_FILE,
      "import { PrismaService } from '@starter/api/database';\nexport const service = PrismaService;\n",
      '@nx/enforce-module-boundaries',
    ],
    [
      'backend code importing the frontend',
      API_FILE,
      "import { SessionService } from '@starter/web/core/auth';\nexport const service = SessionService;\n",
      '@nx/enforce-module-boundaries',
    ],
    [
      'the contract importing Angular',
      CONTRACTS_FILE,
      "import { signal } from '@angular/core';\nexport const value = signal(1);\n",
      'no-restricted-imports',
    ],
    [
      'unsorted imports',
      API_FILE,
      "import { b } from './b';\nimport { Injectable } from '@nestjs/common';\nexport const values = [b, Injectable];\n",
      'simple-import-sort/imports',
    ],
  ])('reports %s', async (_case, filePath, code, expectedRule) => {
    // Arrange, Act
    const ruleIds = await ruleIdsFor(filePath, code);

    // Assert
    expect(ruleIds).toContain(expectedRule);
  });

  it('allows Capacitor and browser globals inside libs/web/core/platform', async () => {
    // Arrange
    const code =
      "import { Capacitor } from '@capacitor/core';\n\nexport const isNative = Capacitor.isNativePlatform() && typeof window !== 'undefined';\n";

    // Act
    const ruleIds = await ruleIdsFor(PLATFORM_FILE, code);

    // Assert
    expect(ruleIds).toEqual([]);
  });

  it('allows zod/mini and the shared contract everywhere', async () => {
    // Arrange
    const code =
      "import * as z from 'zod/mini';\n\nimport { emailSchema } from '@starter/shared/contracts';\n\nexport const schema = z.object({ email: emailSchema });\n";

    // Act
    const ruleIds = await ruleIdsFor(FEATURE_FILE, code);

    // Assert
    expect(ruleIds).toEqual([]);
  });
});

describe('templates', () => {
  const findTemplates = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return entry.name === 'node_modules' ? [] : findTemplates(path);
      }
      return entry.name.endsWith('.html') ? [path] : [];
    });

  it('never bind raw HTML (QA-13)', () => {
    // Arrange
    const templates = ['apps', 'libs'].flatMap((directory) =>
      findTemplates(join(workspaceRoot, directory)),
    );

    // Act
    const offenders = templates
      .filter((path) =>
        /\[(innerHTML|outerHTML)\]/i.test(readFileSync(path, 'utf8')),
      )
      .map((path) => relative(workspaceRoot, path));

    // Assert
    expect(templates.length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});
