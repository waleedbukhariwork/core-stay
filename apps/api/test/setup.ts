import { randomBytes } from 'node:crypto';
import 'reflect-metadata';

process.env.APP_ENV ??= 'local';
process.env.PORT ??= '4999';
process.env.DATABASE_URL ??=
  'postgres://codecore:codecore_local_only_not_for_prod@localhost:5432/codecore';
process.env.LOG_LEVEL ??= 'silent';

process.env.AUTH_JWT_SECRET ??= randomBytes(32).toString('base64');
process.env.AUTH_VERIFICATION_SECRET ??= randomBytes(32).toString('base64');
process.env.AUTH_ISSUER ??= 'codecore-test';
process.env.AUTH_AUDIENCE ??= 'codecore-mobile-test';
process.env.AUTH_EMAIL_MODE ??= 'file';
