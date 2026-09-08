import { Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/config.module.js';
import { DatabaseModule } from './common/database/database.module.js';
import { HttpModule } from './common/http/http.module.js';
import { LoggingModule } from './common/logging/logging.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    HttpModule,
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
