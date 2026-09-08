import { APP_ENVIRONMENTS, type AppEnvironment } from './app-environment.js';
import { EnvironmentVariables } from './environment-variables.js';

const LOG_LEVELS = new Set([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

export class AppConfig {
  readonly env: AppEnvironment;
  readonly port: number;
  readonly databaseUrl: string;
  readonly logLevel: string;

  constructor(env: EnvironmentVariables) {
    this.env = env.APP_ENV;
    this.port = env.PORT;
    this.databaseUrl = env.DATABASE_URL;
    this.logLevel = normalizeLogLevel(env.LOG_LEVEL, env.APP_ENV);
  }

  get isLocal(): boolean {
    return this.env === 'local';
  }

  get isProductionLike(): boolean {
    return this.env === 'production' || this.env === 'staging';
  }
}

export function isAppEnvironment(value: string): value is AppEnvironment {
  return (APP_ENVIRONMENTS as readonly string[]).includes(value);
}

function normalizeLogLevel(
  value: string | undefined,
  env: AppEnvironment,
): string {
  if (value && LOG_LEVELS.has(value)) {
    return value;
  }
  return env === 'local' ? 'debug' : 'info';
}
