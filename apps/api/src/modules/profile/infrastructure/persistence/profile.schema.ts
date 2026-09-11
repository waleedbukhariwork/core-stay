import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  smallint,
  timestamp,
  check,
} from 'drizzle-orm/pg-core';
export const engineeringProfiles = pgTable(
  'engineering_profiles',
  {
    userId: uuid('user_id').primaryKey(),
    goals: text('goals').array(),
    role: text('role'),
    experience: text('experience'),
    technologies: text('technologies').array(),
    focusAreas: text('focus_areas').array(),
    dailyMinutes: smallint('daily_minutes'),
    learningPreferences: text('learning_preferences').array(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('profile_daily_minutes', sql`${table.dailyMinutes} IN (5, 10, 15)`),
    check(
      'profile_role',
      sql`${table.role} IN ('backend','frontend','full_stack','mobile','platform','data','other')`,
    ),
    check(
      'profile_experience',
      sql`${table.experience} IN ('under_1','years_1_3','years_3_5','years_5_8','years_8_plus')`,
    ),
    ...[
      table.goals,
      table.technologies,
      table.focusAreas,
      table.learningPreferences,
    ].map((column) =>
      check(
        `profile_${column.name}_nonempty`,
        sql`${column} IS NULL OR (cardinality(${column}) > 0 AND array_ndims(${column}) = 1 AND array_position(${column}, NULL) IS NULL)`,
      ),
    ),
    check(
      'profile_learning_approach',
      sql`NOT (${table.learningPreferences} @> ARRAY['challenge_first','explain_first']::text[])`,
    ),
  ],
);
