export class HealthDataDto {
  status: 'ok';
}

export class HealthResponseDto {
  data: HealthDataDto;
}

export function toHealthResponse(): HealthResponseDto {
  return {
    data: {
      status: 'ok',
    },
  };
}
