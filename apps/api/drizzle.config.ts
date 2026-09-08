import { defineConfig } from 'drizzle-kit';

const url =
  process.env.DATABASE_URL ??
  'postgres://codecore:codecore_local_only_not_for_prod@localhost:5432/codecore';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/common/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url,
  },
});
