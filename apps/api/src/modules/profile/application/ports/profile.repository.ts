import type {
  ProfilePreferences,
  ProfileUpdate,
} from '../../domain/profile.js';
export abstract class ProfileRepository {
  abstract find(userId: string): Promise<ProfilePreferences | undefined>;
  abstract update(
    userId: string,
    update: ProfileUpdate,
  ): Promise<ProfilePreferences>;
}
