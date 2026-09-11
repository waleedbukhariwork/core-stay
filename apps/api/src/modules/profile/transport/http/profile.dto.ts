import {
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  ArrayMaxSize,
  IsIn,
  IsInt,
  IsString,
  ValidateIf,
} from 'class-validator';
import { supportedValues } from '../../domain/preference-catalog.js';
export class UpdateProfileDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(supportedValues('goals').length)
  @IsString({ each: true })
  @IsIn(supportedValues('goals'), { each: true })
  goals?: string[];
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsIn(supportedValues('role'))
  role?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsIn(supportedValues('experience'))
  experience?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(supportedValues('technologies').length)
  @IsString({ each: true })
  @IsIn(supportedValues('technologies'), { each: true })
  technologies?: string[];
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(supportedValues('focusAreas').length)
  @IsString({ each: true })
  @IsIn(supportedValues('focusAreas'), { each: true })
  focusAreas?: string[];
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @IsIn(supportedValues('dailyMinutes'))
  dailyMinutes?: number;
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(supportedValues('learningPreferences').length)
  @IsString({ each: true })
  @IsIn(supportedValues('learningPreferences'), { each: true })
  learningPreferences?: string[];
}
export class ProfileResponseDto {
  preferences!: {
    goals: string[] | null;
    role: string | null;
    experience: string | null;
    technologies: string[] | null;
    focusAreas: string[] | null;
    dailyMinutes: number | null;
    learningPreferences: string[] | null;
  };
  status!: 'not_started' | 'in_progress' | 'complete';
  nextStep!: string;
}
export class PreferenceOptionDto {
  id!: string | number;
  label!: string;
  enabled!: boolean;
  order!: number;
  category!: string | null;
  exclusiveGroup!: string | null;
  recommended!: boolean;
}
