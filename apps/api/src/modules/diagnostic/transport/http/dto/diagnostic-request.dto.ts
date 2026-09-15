import {
  IsString,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
  ValidateIf,
  IsIn,
} from 'class-validator';

export class DiagnosticAnswerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  questionId!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  selectedOptionId!: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(86400000)
  responseDurationMs?: number;
}
export class DiagnosticConfidenceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  questionId!: string;
  @IsIn(['guessing', 'somewhat_sure', 'very_sure'])
  confidence!: 'guessing' | 'somewhat_sure' | 'very_sure';
}
