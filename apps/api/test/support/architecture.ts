import ts from 'typescript';

interface Location {
  module?: string;
  layer: string;
}
const locate = (file: string): Location => {
  const parts = file.split('/');
  if (parts[0] === 'modules')
    return {
      module: parts[1],
      layer: parts[2]?.endsWith('.module.ts') ? 'composition' : parts[2]!,
    };
  return { layer: parts[0] === 'platform' ? 'platform' : 'composition' };
};
const diNames = new Set(['Inject', 'Injectable', 'Optional']);
const persistence = (file: string) =>
  file.startsWith('platform/database/') ||
  file.includes('/infrastructure/persistence/');

export function checkArchitecture(
  sources: Map<string, string>,
  resolve: (from: string, specifier: string) => string | undefined,
): string[] {
  const errors: string[] = [];
  const graph = new Map<string, Set<string>>();
  const modules = new Map<string, Set<string>>();
  for (const [file, source] of sources) {
    const origin = locate(file);
    if (
      !origin.module &&
      origin.layer === 'composition' &&
      !['main.ts', 'app.module.ts'].includes(file)
    )
      errors.push(`${file}: root is reserved for process/module composition`);
    const edges = new Set<string>();
    graph.set(file, edges);
    if (
      origin.module &&
      ![
        'composition',
        'public',
        'transport',
        'application',
        'domain',
        'infrastructure',
      ].includes(origin.layer)
    )
      errors.push(`${file}: business code must belong to a defined layer`);
    if (file.startsWith('common/'))
      errors.push(`${file}: shared technical code belongs in platform`);
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const check = (specifier: ts.Node | undefined, statement: ts.Node) => {
      if (!specifier || !ts.isStringLiteralLike(specifier)) {
        errors.push(`${file}: nonliteral module loading cannot be checked`);
        return;
      }
      const name = specifier.text;
      const target = resolve(file, name);
      const fail = (reason: string) =>
        errors.push(`${file} -> ${name}: ${reason}`);
      if (!target) {
        if (
          name.startsWith('.') ||
          name.startsWith('/') ||
          name.startsWith('#')
        ) {
          fail('unresolved local import');
          return;
        }
        if (
          /^(drizzle-orm|drizzle-kit|pg)(\/|$)/.test(name) &&
          !persistence(file)
        )
          fail('database dependency outside persistence');
        if (
          origin.layer === 'infrastructure' &&
          [
            'express',
            '@nestjs/core',
            '@nestjs/platform-express',
            'class-validator',
            'class-transformer',
          ].includes(name)
        )
          fail('HTTP framework dependency in infrastructure');
        if (['domain', 'public'].includes(origin.layer))
          fail('framework/package dependency in a plain contract or domain');
        if (
          ['application', 'infrastructure'].includes(origin.layer) &&
          name === '@nestjs/common'
        ) {
          const bindings = ts.isImportDeclaration(statement)
            ? statement.importClause?.namedBindings
            : undefined;
          if (
            !bindings ||
            !ts.isNamedImports(bindings) ||
            bindings.elements.some(
              (item) => !diNames.has((item.propertyName ?? item.name).text),
            )
          )
            fail('only Nest dependency injection is permitted in this layer');
        } else if (origin.layer === 'application')
          fail('application depends on an external implementation');
        if (
          origin.layer === 'transport' &&
          ![
            '@nestjs/common',
            'express',
            'class-validator',
            'class-transformer',
          ].includes(name)
        )
          fail('transport depends on an external implementation');
        return;
      }
      if (!sources.has(target)) {
        fail('production imports outside production sources');
        return;
      }
      edges.add(target);
      const destination = locate(target);
      if (
        origin.module &&
        destination.module &&
        origin.module !== destination.module
      ) {
        const moduleEdges = modules.get(origin.module) ?? new Set<string>();
        moduleEdges.add(destination.module);
        modules.set(origin.module, moduleEdges);
        if (
          destination.layer !== 'public' &&
          !(
            origin.layer === 'composition' &&
            destination.layer === 'composition'
          )
        )
          fail('cross-module private import');
      }
      if (origin.layer === 'platform' && destination.module) {
        if (!(
          file === 'platform/database/schema.ts' &&
          /^modules\/[^/]+\/infrastructure\/persistence\/[^/]+\.schema\.ts$/.test(
            target,
          )
        ))
          fail(
            'platform cannot own business dependencies; only the schema catalog composes schemas',
          );
      }
      if (origin.layer === 'composition' || origin.layer === 'platform') return;
      const sameModule = origin.module === destination.module;
      const allowed: Record<string, string[]> = {
        domain: ['domain'],
        public: ['public'],
        application: ['application', 'domain', 'public'],
        transport: ['transport', 'application', 'domain', 'public'],
        infrastructure: ['infrastructure', 'application', 'domain', 'public'],
      };
      const publicApi =
        destination.layer === 'public' &&
        !['domain', 'public'].includes(origin.layer);
      const platform =
        destination.layer === 'platform' &&
        ((origin.layer === 'transport' &&
          target.startsWith('platform/http/')) ||
          (origin.layer === 'infrastructure' &&
            /^platform\/(config|database|logging)\//.test(target)));
      if (
        !(sameModule && allowed[origin.layer]?.includes(destination.layer)) &&
        !publicApi &&
        !platform
      )
        fail('layer dependency points outward');
      if (target.startsWith('platform/database/') && !persistence(file))
        fail('database access outside persistence');
    };
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) check(node.moduleSpecifier, node);
      } else if (ts.isExternalModuleReference(node))
        check(node.expression, node);
      else if (ts.isImportTypeNode(node))
        check(
          ts.isLiteralTypeNode(node.argument)
            ? node.argument.literal
            : undefined,
          node,
        );
      else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === 'require'))
      )
        check(node.arguments[0], node);
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  const detectCycles = (edges: Map<string, Set<string>>, label: string) => {
    const visited = new Set<string>();
    const active = new Set<string>();
    const visit = (key: string, path: string[]) => {
      if (active.has(key)) {
        errors.push(`${label}: ${[...path, key].join(' -> ')}`);
        return;
      }
      if (visited.has(key)) return;
      visited.add(key);
      active.add(key);
      for (const next of edges.get(key) ?? []) visit(next, [...path, key]);
      active.delete(key);
    };
    for (const key of edges.keys()) visit(key, []);
  };
  detectCycles(graph, 'source dependency cycle');
  detectCycles(modules, 'business module cycle');
  return errors;
}
