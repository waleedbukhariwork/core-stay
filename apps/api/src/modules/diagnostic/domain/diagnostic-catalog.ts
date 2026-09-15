import { DiagnosticFailure, type DiagnosticDefinition } from './diagnostic.js';

export const INITIAL_DIAGNOSTIC_ID = 'engineering_diagnostic';
// Published definitions are immutable: retain old versions while sessions reference them.
// Populate only with product-approved, curated questions and answer keys.
const definitions: readonly DiagnosticDefinition[] = [];

export function currentDefinition(): DiagnosticDefinition {
  const definition = definitions.at(-1);
  if (!definition || !definition.questions.length)
    throw new DiagnosticFailure('DIAGNOSTIC_UNAVAILABLE');
  return definition;
}

export function getDefinition(
  id: string,
  version: string,
): DiagnosticDefinition {
  const definition = definitions.find(
    (item) => item.id === id && item.version === version,
  );
  if (!definition) throw new DiagnosticFailure('DIAGNOSTIC_UNAVAILABLE');
  return definition;
}
