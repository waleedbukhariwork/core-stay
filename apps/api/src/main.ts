import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { pinoHttp } from 'pino-http';
import { AppModule } from './app.module.js';
import { AppConfig } from './platform/config/app-config.js';
import { applyHttpGlobals } from './platform/http/http.module.js';
import { PINO_LOGGER } from './platform/logging/logging.module.js';
import { NestPinoLogger } from './platform/logging/nest-pino-logger.js';
import { requestLogOptions } from './platform/logging/pino-factory.js';
import type { Logger } from 'pino';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(AppConfig);
  const logger = app.get<Logger>(PINO_LOGGER);

  app.useLogger(new NestPinoLogger(logger));
  app.use(pinoHttp(requestLogOptions(logger)));
  applyHttpGlobals(app);

  await app.listen(config.port, '0.0.0.0');
}

await bootstrap();
