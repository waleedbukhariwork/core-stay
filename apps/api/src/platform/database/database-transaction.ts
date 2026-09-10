import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { schema } from './schema.js';
export type DatabaseTransaction = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];
