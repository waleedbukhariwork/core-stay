import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../../../platform/database/database.tokens.js';
import { ProfileRepository } from '../../application/ports/profile.repository.js';
import type {
  ProfilePreferences,
  ProfileUpdate,
} from '../../domain/profile.js';
import { engineeringProfiles as profiles } from './profile.schema.js';
const selection = {
  goals: profiles.goals,
  role: profiles.role,
  experience: profiles.experience,
  technologies: profiles.technologies,
  focusAreas: profiles.focusAreas,
  dailyMinutes: profiles.dailyMinutes,
  learningPreferences: profiles.learningPreferences,
};
@Injectable()
export class DrizzleProfileRepository extends ProfileRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {
    super();
  }
  async find(userId: string): Promise<ProfilePreferences | undefined> {
    return (
      await this.db
        .select(selection)
        .from(profiles)
        .where(eq(profiles.userId, userId))
    )[0];
  }
  async update(
    userId: string,
    update: ProfileUpdate,
  ): Promise<ProfilePreferences> {
    // One atomic upsert replaces only supplied fields, including during concurrent first saves.
    const [result] = await this.db
      .insert(profiles)
      .values({ userId, ...update })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { ...update, updatedAt: sql`now()` },
      })
      .returning(selection);
    return result!;
  }
}
