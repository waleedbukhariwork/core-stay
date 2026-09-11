import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module.js';
import { ProfileController } from './transport/http/profile.controller.js';
import { ProfileGuard } from './transport/http/profile.guard.js';
import { ProfileService } from './application/profile.service.js';
import { ProfileRepository } from './application/ports/profile.repository.js';
import { DrizzleProfileRepository } from './infrastructure/persistence/drizzle-profile.repository.js';
@Module({
  imports: [IdentityModule],
  controllers: [ProfileController],
  providers: [
    ProfileGuard,
    ProfileService,
    { provide: ProfileRepository, useClass: DrizzleProfileRepository },
  ],
})
export class ProfileModule {}
