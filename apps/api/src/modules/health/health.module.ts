import { DatabaseProbe } from './application/database-probe.js';
import { DatabaseHealth } from './infrastructure/persistence/database-health.js';
import { Module } from '@nestjs/common';
import { HealthController } from './transport/http/health.controller.js';

@Module({
  controllers: [HealthController],
  providers: [
    DatabaseHealth,
    { provide: DatabaseProbe, useExisting: DatabaseHealth },
  ],
})
export class HealthModule {}
