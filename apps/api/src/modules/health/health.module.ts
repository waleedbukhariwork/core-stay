import { DatabaseProbe } from './application/database-probe.js';
import { DatabaseHealth } from './infrastructure/persistence/database-health.js';
import { Module } from '@nestjs/common';
import { HealthController } from './transport/http/health.controller.js';
import { HealthService } from './application/health.service.js';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealth,
    { provide: DatabaseProbe, useExisting: DatabaseHealth },
  ],
})
export class HealthModule {}
