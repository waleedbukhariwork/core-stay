import { ProfileModule } from './modules/profile/profile.module.js';
import { mapProfileFailure } from './modules/profile/transport/http/profile-error.mapper.js';
import { mapIdentityFailure } from './modules/identity/transport/http/identity-error.mapper.js';
import { mapHealthFailure } from './modules/health/transport/http/health-error.mapper.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { Module } from '@nestjs/common';
import { AppConfigModule } from './platform/config/config.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HttpModule } from './platform/http/http.module.js';
import { LoggingModule } from './platform/logging/logging.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    HttpModule.withErrorMappers([
      mapHealthFailure,
      mapIdentityFailure,
      mapProfileFailure,
    ]),
    DatabaseModule,
    HealthModule,
    IdentityModule,
    ProfileModule,
  ],
})
export class AppModule {}
