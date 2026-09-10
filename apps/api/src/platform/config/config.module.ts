import { Global, Module } from '@nestjs/common';
import { AppConfig } from './app-config.js';
import { loadAppConfig } from './load-config.js';

@Global()
@Module({
  providers: [
    {
      provide: AppConfig,
      useFactory: () => loadAppConfig(),
    },
  ],
  exports: [AppConfig],
})
export class AppConfigModule {}
