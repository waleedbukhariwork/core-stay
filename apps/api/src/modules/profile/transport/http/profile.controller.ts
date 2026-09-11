import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from '../../application/profile.service.js';
import { ProfileGuard, type ProfileRequest } from './profile.guard.js';
import {
  UpdateProfileDto,
  ProfileResponseDto,
  PreferenceOptionDto,
} from './profile.dto.js';
import type {
  ProfilePreferences,
  ProfileProgress,
} from '../../domain/profile.js';
function response(
  result: { preferences: ProfilePreferences } & ProfileProgress,
): ProfileResponseDto {
  const p = result.preferences;
  return {
    preferences: {
      goals: p.goals,
      role: p.role,
      experience: p.experience,
      technologies: p.technologies,
      focusAreas: p.focusAreas,
      dailyMinutes: p.dailyMinutes,
      learningPreferences: p.learningPreferences,
    },
    status: result.status,
    nextStep: result.nextStep,
  };
}
@Controller('profile')
@UseGuards(ProfileGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}
  @Get('catalog')
  @Header('Cache-Control', 'no-store')
  async catalog(
    @Req() request: ProfileRequest,
  ): Promise<{ data: Record<string, PreferenceOptionDto[]> }> {
    const catalog = await this.profiles.catalog(request.principal);
    return {
      data: Object.fromEntries(
        Object.entries(catalog).map(([key, options]) => [
          key,
          options.map((option) => ({
            id: option.id,
            label: option.label,
            enabled: option.enabled,
            order: option.order,
            category: option.category,
            exclusiveGroup: option.exclusiveGroup,
            recommended: option.recommended,
          })),
        ]),
      ),
    };
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  async read(
    @Req() request: ProfileRequest,
  ): Promise<{ data: ProfileResponseDto }> {
    return { data: response(await this.profiles.read(request.principal)) };
  }
  @Patch()
  @Header('Cache-Control', 'no-store')
  async update(
    @Req() request: ProfileRequest,
    @Body() body: UpdateProfileDto,
  ): Promise<{ data: ProfileResponseDto }> {
    return {
      data: response(await this.profiles.update(request.principal, body)),
    };
  }
}
