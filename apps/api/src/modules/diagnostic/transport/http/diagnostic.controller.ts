import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DiagnosticService } from '../../application/diagnostic.service.js';
import { DiagnosticGuard, type DiagnosticRequest } from './diagnostic.guard.js';
import {
  DiagnosticAnswerDto,
  DiagnosticConfidenceDto,
} from './dto/diagnostic-request.dto.js';
import { mapDiagnostic } from './diagnostic-response.mapper.js';

@Controller('diagnostic')
@UseGuards(DiagnosticGuard)
export class DiagnosticController {
  constructor(private readonly diagnostics: DiagnosticService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  async read(@Req() request: DiagnosticRequest) {
    return {
      data: mapDiagnostic(await this.diagnostics.read(request.principal)),
    };
  }
  @Post()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async start(@Req() request: DiagnosticRequest) {
    return {
      data: mapDiagnostic(await this.diagnostics.read(request.principal, true)),
    };
  }
  @Post('answers')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async answer(
    @Req() request: DiagnosticRequest,
    @Body() body: DiagnosticAnswerDto,
  ) {
    return {
      data: mapDiagnostic(
        await this.diagnostics.answer(request.principal, body),
      ),
    };
  }
  @Patch('confidence')
  @Header('Cache-Control', 'no-store')
  async confidence(
    @Req() request: DiagnosticRequest,
    @Body() body: DiagnosticConfidenceDto,
  ) {
    return {
      data: mapDiagnostic(
        await this.diagnostics.confidence(
          request.principal,
          body.questionId,
          body.confidence,
        ),
      ),
    };
  }
}
