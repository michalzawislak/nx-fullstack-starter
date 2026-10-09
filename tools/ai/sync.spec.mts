import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildExpectedFiles, syncAiContext } from './sync.mts';

const ROOT_AGENTS_MD = `# AGENTS.md

Intro.

<!-- core-rules:start -->
- Rule one.
<!-- core-rules:end -->

<!-- nx configuration start-->
Nx block.
<!-- nx configuration end-->
`;

const MCP_SERVERS = {
  servers: {
    nx: { command: 'npx', args: ['nx', 'mcp'], tools: ['cursor', 'vscode'] },
    'angular-cli': { command: 'npx', args: ['ng', 'mcp'] },
  },
};

describe('syncAiContext', () => {
  let root: string;

  const write = (path: string, content: string): void => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };
  const read = (path: string): string => readFileSync(join(root, path), 'utf8');

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ai-sync-'));
    write('AGENTS.md', ROOT_AGENTS_MD);
    write('libs/web/ui/AGENTS.md', '# libs/web/ui\n\nUI rules.\n');
    write('tools/ai/mcp-servers.json', JSON.stringify(MCP_SERVERS));
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('generates every adapter from AGENTS.md files and the MCP list', () => {
    // Arrange, Act
    const result = syncAiContext(root);

    // Assert
    expect(result.exitCode).toBe(0);
    expect(read('CLAUDE.md')).toBe(
      '@AGENTS.md\n\n<!-- nx configuration start-->\nNx block.\n<!-- nx configuration end-->\n',
    );
    expect(read('libs/web/ui/CLAUDE.md')).toContain('@AGENTS.md');
    expect(read('.github/copilot-instructions.md')).toContain('- Rule one.');
    expect(read('.github/copilot-instructions.md')).not.toContain(
      'core-rules:start',
    );
    expect(read('.github/instructions/libs-web-ui.instructions.md')).toMatch(
      /^---\napplyTo: 'libs\/web\/ui\/\*\*'\n---/,
    );
    expect(JSON.parse(read('.mcp.json'))).toEqual({
      mcpServers: { 'angular-cli': { command: 'npx', args: ['ng', 'mcp'] } },
    });
    expect(
      Object.keys(JSON.parse(read('.cursor/mcp.json')).mcpServers),
    ).toEqual(['nx', 'angular-cli']);
    expect(JSON.parse(read('.vscode/mcp.json')).servers.nx).toEqual({
      type: 'stdio',
      command: 'npx',
      args: ['nx', 'mcp'],
    });
  });

  it('reports nothing to do when the generated files are current', () => {
    // Arrange
    syncAiContext(root);

    // Act
    const result = syncAiContext(root, { check: true });

    // Assert
    expect(result).toEqual({ exitCode: 0, changedFiles: [], staleFiles: [] });
  });

  it('fails the check after a hand edit of a generated file or a source change', () => {
    // Arrange
    syncAiContext(root);
    write('.github/copilot-instructions.md', 'edited by hand\n');
    write('libs/web/ui/AGENTS.md', '# libs/web/ui\n\nChanged rules.\n');

    // Act
    const result = syncAiContext(root, { check: true });

    // Assert
    expect(result.exitCode).toBe(1);
    expect(result.changedFiles).toEqual(
      expect.arrayContaining([
        '.github/copilot-instructions.md',
        '.github/instructions/libs-web-ui.instructions.md',
      ]),
    );
    expect(read('.github/copilot-instructions.md')).toBe('edited by hand\n');
  });

  it('removes generated files whose AGENTS.md is gone, but keeps hand-written ones', () => {
    // Arrange
    syncAiContext(root);
    rmSync(join(root, 'libs/web/ui/AGENTS.md'));
    write('docs/CLAUDE.md', 'Hand-written notes.\n');

    // Act
    const check = syncAiContext(root, { check: true });
    const sync = syncAiContext(root);

    // Assert
    expect(check.exitCode).toBe(1);
    expect(sync.staleFiles).toEqual(
      expect.arrayContaining([
        '.github/instructions/libs-web-ui.instructions.md',
        'libs/web/ui/CLAUDE.md',
      ]),
    );
    expect(() => read('libs/web/ui/CLAUDE.md')).toThrow();
    expect(read('docs/CLAUDE.md')).toBe('Hand-written notes.\n');
  });

  it('skips AGENTS.md files in ignored directories such as node_modules', () => {
    // Arrange
    write('node_modules/some-package/AGENTS.md', '# vendor\n');

    // Act
    const expectedFiles = buildExpectedFiles(root);

    // Assert
    expect([...expectedFiles.keys()]).not.toContain(
      'node_modules/some-package/CLAUDE.md',
    );
  });

  it('stops with a clear error when AGENTS.md lacks a required section', () => {
    // Arrange
    write('AGENTS.md', '# AGENTS.md\n\nNo markers.\n');

    // Act
    const build = (): unknown => buildExpectedFiles(root);

    // Assert
    expect(build).toThrow(/AGENTS.md: missing section/);
  });
});
