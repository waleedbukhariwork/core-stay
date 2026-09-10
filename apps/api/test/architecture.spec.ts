import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { checkArchitecture } from './support/architecture.js';

const root = resolve('src');
function readSources(directory: string): [string, string][] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? readSources(file)
      : entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
        ? [[relative(root, file), readFileSync(file, 'utf8')]]
        : [];
  });
}
const fixture = (files: Record<string, string>) =>
  checkArchitecture(new Map(Object.entries(files)), (from, name) =>
    name.startsWith('.')
      ? join(dirname(from), name).replace(/\.js$/, '.ts')
      : undefined,
  );
describe('Architecture boundaries', () => {
  it('checks every production import, re-export and module dependency', () => {
    const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      process.cwd(),
    );
    expect(
      checkArchitecture(new Map(readSources(root)), (from, name) => {
        const result = ts.resolveModuleName(
          name,
          join(root, from),
          parsed.options,
          ts.sys,
        ).resolvedModule;
        return result && !result.isExternalLibraryImport
          ? relative(root, result.resolvedFileName)
          : undefined;
      }),
    ).toEqual([]);
  });
  it.each([
    'import type { X } from "../../two/infrastructure/x.js";',
    'export { X } from "../../two/infrastructure/x.js";',
    'const x = import("../../two/infrastructure/x.js");',
    'type X = import("../../two/infrastructure/x.js").X;',
    'const x = require("../../two/infrastructure/x.js");',
  ])('rejects private module access: %s', (source) => {
    expect(
      fixture({
        'modules/one/application/use.ts': source,
        'modules/two/infrastructure/x.ts': '',
      }).join(),
    ).toContain('cross-module private import');
  });
  it.each([
    ['domain', 'import { Injectable } from "@nestjs/common"'],
    ['application', 'import { sql } from "drizzle-orm"'],
    [
      'application',
      'import { HttpException as Failure } from "@nestjs/common"',
    ],
    ['transport', 'import { Pool } from "pg"'],
    ['infrastructure', 'import { Request } from "express"'],
    ['public', 'export { X } from "../domain/x.js"'],
  ])('rejects outward dependencies in %s', (layer, source) => {
    expect(
      fixture({
        [`modules/one/${layer}/use.ts`]: source,
        'modules/one/domain/x.ts': '',
      }).length,
    ).toBeGreaterThan(0);
  });
  it('rejects dynamic paths and dependency cycles, including public APIs', () => {
    expect(
      fixture({ 'modules/one/application/use.ts': 'import(path)' }).join(),
    ).toContain('nonliteral');
    expect(
      fixture({
        'modules/one/application/use.ts': 'import "../../two/public/api.js"',
        'modules/two/application/use.ts': 'import "../../one/public/api.js"',
        'modules/one/public/api.ts': '',
        'modules/two/public/api.ts': '',
      }).join(),
    ).toContain('business module cycle');
    expect(
      fixture({
        'modules/one/domain/a.ts': 'import "./b.js"',
        'modules/one/domain/b.ts': 'import "./a.js"',
      }).join(),
    ).toContain('source dependency cycle');
  });
  it('reserves the source root for explicit composition', () => {
    expect(fixture({ 'business.service.ts': '' }).join()).toContain(
      'root is reserved',
    );
  });
  it('allows DI, owning persistence, public capabilities and schema composition', () => {
    expect(
      fixture({
        'modules/one/application/use.ts':
          'import { Injectable } from "@nestjs/common"; import "../../two/public/api.js"',
        'modules/two/public/api.ts': '',
        'modules/one/infrastructure/persistence/x.ts':
          'import { sql } from "drizzle-orm"; import "../../application/use.js"',
        'modules/one/one.module.ts':
          'import "./infrastructure/persistence/x.js"',
        'modules/one/infrastructure/persistence/users.schema.ts':
          'import "drizzle-orm/pg-core"',
        'platform/database/schema.ts':
          'export * from "../../modules/one/infrastructure/persistence/users.schema.js"',
      }),
    ).toEqual([]);
  });
});
