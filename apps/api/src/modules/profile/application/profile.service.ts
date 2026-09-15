import { Injectable } from '@nestjs/common';
import { ProfileApi } from '../public/profile.api.js';
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
  type ProfilePreferences,
  type ProfileProgress,
} from '../domain/profile.js';
import {
  PREFERENCE_CATALOG,
  type PreferenceCatalog,
} from '../domain/preference-catalog.js';

export type ProfileResult = {
  preferences: ProfilePreferences;
} & ProfileProgress;

@Injectable()
export class ProfileService extends ProfileApi {
  constructor(
    private readonly identity: IdentityApi,
    private readonly profiles: ProfileRepository,
  ) {
    super();
  }
  async isComplete(actor: AuthenticatedActor): Promise<boolean> {
    return (await this.read(actor)).status === 'complete';
  }
  async catalog(actor: AuthenticatedActor): Promise<PreferenceCatalog> {
    await this.identity.assertActiveVerified(actor);
    return PREFERENCE_CATALOG;
  }
  async read(actor: AuthenticatedActor): Promise<ProfileResult> {
    await this.identity.assertActiveVerified(actor);
    const preferences =
      (await this.profiles.find(actor.userId)) ?? emptyPreferences();
    return { preferences, ...profileProgress(preferences) };
  }
  async update(
    actor: AuthenticatedActor,
    input: ProfileUpdate,
  ): Promise<ProfileResult> {
    await this.identity.assertActiveVerified(actor);
    const preferences = await this.profiles.update(
      actor.userId,
      validateUpdate(input),
    );
    return { preferences, ...profileProgress(preferences) };
  }
}
