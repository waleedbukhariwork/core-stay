import 'reflect-metadata';

process.env.APP_ENV ??= 'local';
process.env.PORT ??= '4999';
process.env.DATABASE_URL ??=
  'postgres://codecore:codecore_local_only_not_for_prod@localhost:5432/codecore';
process.env.LOG_LEVEL ??= 'silent';
