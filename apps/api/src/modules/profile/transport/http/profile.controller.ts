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
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { ProfileResponseDto } from './dto/profile-response.dto.js';
import type { PreferenceCatalogResponseDto } from './dto/preference-catalog-response.dto.js';
import { mapProfile, mapPreferenceCatalog } from './profile-response.mapper.js';
@Controller('profile')
@UseGuards(ProfileGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}
  @Get('catalog')
  @Header('Cache-Control', 'no-store')
  async catalog(
    @Req() request: ProfileRequest,
  ): Promise<{ data: PreferenceCatalogResponseDto }> {
    const catalog = await this.profiles.catalog(request.principal);
    return {
      data: mapPreferenceCatalog(catalog),
    };
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  async read(
    @Req() request: ProfileRequest,
  ): Promise<{ data: ProfileResponseDto }> {
    return { data: mapProfile(await this.profiles.read(request.principal)) };
  }
  @Patch()
  @Header('Cache-Control', 'no-store')
  async update(
    @Req() request: ProfileRequest,
    @Body() body: UpdateProfileDto,
  ): Promise<{ data: ProfileResponseDto }> {
    return {
      data: mapProfile(await this.profiles.update(request.principal, body)),
    };
  }
}
