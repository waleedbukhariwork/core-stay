import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { DiagnosticService } from './application/diagnostic.service.js';
import { DiagnosticUnitOfWork } from './application/ports/diagnostic.unit-of-work.js';
import { DrizzleDiagnosticUnitOfWork } from './infrastructure/persistence/drizzle-diagnostic.unit-of-work.js';
import { DiagnosticController } from './transport/http/diagnostic.controller.js';
import { DiagnosticGuard } from './transport/http/diagnostic.guard.js';

@Module({
  imports: [IdentityModule, ProfileModule],
  controllers: [DiagnosticController],
  providers: [
    DiagnosticService,
    DiagnosticGuard,
    { provide: DiagnosticUnitOfWork, useClass: DrizzleDiagnosticUnitOfWork },
  ],
})
export class DiagnosticModule {}
