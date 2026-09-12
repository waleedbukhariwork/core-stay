import type { HealthResponseDto } from './dto/health-response.dto.js';

export function toHealthResponse(): HealthResponseDto {
  return {
    data: {
      status: 'ok',
    },
  };
}
