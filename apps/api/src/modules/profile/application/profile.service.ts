import { Injectable } from '@nestjs/common';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../../identity/public/identity.api.js';
import { ProfileRepository } from './ports/profile.repository.js';
import {
  emptyPreferences,
  profileProgress,
  validateUpdate,
  type ProfileUpdate,
} from '../domain/profile.js';
import { PREFERENCE_CATALOG } from '../domain/preference-catalog.js';
@Injectable()
export class ProfileService {
  constructor(
    private readonly identity: IdentityApi,
    private readonly profiles: ProfileRepository,
  ) {}
  async catalog(actor: AuthenticatedActor) {
    await this.identity.assertActiveVerified(actor);
    return PREFERENCE_CATALOG;
  }
  async read(actor: AuthenticatedActor) {
    await this.identity.assertActiveVerified(actor);
    const preferences =
      (await this.profiles.find(actor.userId)) ?? emptyPreferences();
    return { preferences, ...profileProgress(preferences) };
  }
  async update(actor: AuthenticatedActor, input: ProfileUpdate) {
    await this.identity.assertActiveVerified(actor);
    const preferences = await this.profiles.update(
      actor.userId,
      validateUpdate(input),
    );
    return { preferences, ...profileProgress(preferences) };
  }
}
