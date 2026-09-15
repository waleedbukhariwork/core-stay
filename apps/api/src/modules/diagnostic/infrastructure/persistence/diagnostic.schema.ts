import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';

export const diagnosticSessions = pgTable(
  'diagnostic_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    diagnosticId: text('diagnostic_id').notNull(),
    definitionVersion: text('definition_version').notNull(),
    status: text('status')
      .$type<'active' | 'completed'>()
      .notNull()
      .default('active'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('diagnostic_user_definition_unique').on(
      table.userId,
      table.diagnosticId,
    ),
    uniqueIndex('diagnostic_one_active_per_user')
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    check(
      'diagnostic_status_completion',
      sql`(${table.status} = 'active' AND ${table.completedAt} IS NULL) OR (${table.status} = 'completed' AND ${table.completedAt} IS NOT NULL AND ${table.completedAt} >= ${table.startedAt})`,
    ),
  ],
);

export const diagnosticAttempts = pgTable(
  'diagnostic_attempts',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => diagnosticSessions.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull(),
    skillId: text('skill_id').notNull(),
    conceptId: text('concept_id').notNull(),
    difficultyId: text('difficulty_id').notNull(),
    interactionType: text('interaction_type').notNull(),
    selectedOptionId: text('selected_option_id').notNull(),
    correct: boolean('correct').notNull(),
    responseDurationMs: integer('response_duration_ms'),
    confidence: text('confidence').$type<
      'guessing' | 'somewhat_sure' | 'very_sure'
    >(),
    answeredAt: timestamp('answered_at', { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.questionId] }),
    check(
      'diagnostic_confidence',
      sql`${table.confidence} IN ('guessing', 'somewhat_sure', 'very_sure')`,
    ),
    check(
      'diagnostic_response_duration',
      sql`${table.responseDurationMs} BETWEEN 0 AND 86400000`,
    ),
  ],
);
