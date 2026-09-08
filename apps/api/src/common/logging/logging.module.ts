import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import type { Logger } from 'pino';
import { AppConfig } from '../config/app-config.js';
import { createRootLogger } from './pino-factory.js';

export const PINO_LOGGER = 'PINO_LOGGER';

@Global()
@Module({
  providers: [
    {
      provide: PINO_LOGGER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): Logger => createRootLogger(config),
    },
  ],
  exports: [PINO_LOGGER],
})
export class LoggingModule implements OnModuleDestroy {
  constructor(@Inject(PINO_LOGGER) private readonly logger: Logger) {}

  onModuleDestroy(): void {
    this.logger.flush();
  }
}
