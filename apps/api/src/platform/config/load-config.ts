import { loadAuthEnvironment } from './auth-environment.js';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { config as loadDotenv } from 'dotenv';
import { AppConfig } from './app-config.js';
import { EnvironmentVariables } from './environment-variables.js';

export function loadAppConfig(raw: NodeJS.ProcessEnv = process.env): AppConfig {
  if (raw === process.env) {
    loadDotenv();
  }
  const candidate = plainToInstance(
    EnvironmentVariables,
    {
      APP_ENV: raw.APP_ENV,
      PORT: raw.PORT,
      DATABASE_URL: raw.DATABASE_URL,
      LOG_LEVEL: raw.LOG_LEVEL,
    },
    { enableImplicitConversion: true },
  );
  const errors = validateSync(candidate, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const summary = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid configuration: ${summary}`);
  }
  return new AppConfig(candidate, loadAuthEnvironment(raw, candidate.APP_ENV));
}
