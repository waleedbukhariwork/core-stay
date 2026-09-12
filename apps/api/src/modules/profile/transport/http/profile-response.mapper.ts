import type { ProfileResult } from '../../application/profile.service.js';
import type {
  PreferenceCatalog,
  PreferenceOption,
} from '../../domain/preference-catalog.js';
import type { ProfileResponseDto } from './dto/profile-response.dto.js';
import type {
  PreferenceCatalogResponseDto,
  PreferenceOptionDto,
} from './dto/preference-catalog-response.dto.js';

export function mapProfile(result: ProfileResult): ProfileResponseDto {
  const preferences = result.preferences;
  return {
    preferences: {
      goals: preferences.goals,
      role: preferences.role,
      experience: preferences.experience,
      technologies: preferences.technologies,
      focusAreas: preferences.focusAreas,
      dailyMinutes: preferences.dailyMinutes,
      learningPreferences: preferences.learningPreferences,
    },
    status: result.status,
    nextStep: result.nextStep,
  };
}

function mapOptions(
  options: readonly PreferenceOption[],
): PreferenceOptionDto[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label,
    enabled: option.enabled,
    order: option.order,
    category: option.category,
    exclusiveGroup: option.exclusiveGroup,
    recommended: option.recommended,
  }));
}

export function mapPreferenceCatalog(
  catalog: PreferenceCatalog,
): PreferenceCatalogResponseDto {
  return {
    goals: mapOptions(catalog.goals),
    role: mapOptions(catalog.role),
    experience: mapOptions(catalog.experience),
    technologies: mapOptions(catalog.technologies),
    focusAreas: mapOptions(catalog.focusAreas),
    dailyMinutes: mapOptions(catalog.dailyMinutes),
    learningPreferences: mapOptions(catalog.learningPreferences),
  };
}
