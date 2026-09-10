import type { LoggerService } from '@nestjs/common';
import type { Logger } from 'pino';

export class NestPinoLogger implements LoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.info(this.context(optionalParams), this.stringify(message));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.error(this.context(optionalParams), this.stringify(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.warn(this.context(optionalParams), this.stringify(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.debug(this.context(optionalParams), this.stringify(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.trace(this.context(optionalParams), this.stringify(message));
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    return JSON.stringify(message);
  }

  private context(optionalParams: unknown[]): { context?: unknown } {
    const context = optionalParams.at(-1);
    return context === undefined ? {} : { context };
  }
}
