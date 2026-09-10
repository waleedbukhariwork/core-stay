import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url =
  process.env.DATABASE_URL ??
  'postgres://codecore:codecore_local_only_not_for_prod@localhost:55432/codecore';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/platform/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url,
  },
});
