import {
  Body,
  Controller,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  HttpModule,
  applyHttpGlobals,
} from '../src/common/http/http.module.js';

class ProbeDto {
  @IsString()
  name!: string;
}

@Controller('probe')
class ProbeController {
  @Post()
  accept(@Body() body: ProbeDto): { data: ProbeDto } {
    return { data: body };
  }
}

@Module({
  imports: [HttpModule],
  controllers: [ProbeController],
})
class ProbeModule {}

describe('Validation contract (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ProbeModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    applyHttpGlobals(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unknown fields and returns field errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .send({ name: 'ok', extra: true });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'extra' })]),
    );
  });
});
