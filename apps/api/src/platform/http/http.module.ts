import {
  APPLICATION_ERROR_MAPPERS,
  type ApplicationErrorMapper,
} from './errors/application-error-mapper.js';
import {
  Global,
  DynamicModule,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ProblemDetailsFilter } from './errors/problem-details.filter.js';
import { createValidationPipe } from './validation-pipe.js';

export function applyHttpGlobals(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
}

@Global()
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useFactory: (): ValidationPipe => createValidationPipe(),
    },
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
  ],
})
export class HttpModule {
  static withErrorMappers(mappers: ApplicationErrorMapper[]): DynamicModule {
    return {
      module: HttpModule,
      providers: [{ provide: APPLICATION_ERROR_MAPPERS, useValue: mappers }],
    };
  }
}
