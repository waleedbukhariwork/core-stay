import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { APP_ENVIRONMENTS, type AppEnvironment } from './app-environment.js';

export class EnvironmentVariables {
  @IsIn(APP_ENVIRONMENTS)
  APP_ENV: AppEnvironment;

  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^postgres(ql)?:\/\//i, {
    message: 'DATABASE_URL must be a postgres connection string',
  })
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  LOG_LEVEL?: string;
}
