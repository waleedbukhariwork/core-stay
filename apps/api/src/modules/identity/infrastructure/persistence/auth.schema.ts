import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
const date = (name: string) => timestamp(name, { withTimezone: true });
export const passwordCredentials = pgTable('password_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  passwordChangedAt: date('password_changed_at').notNull(),
  createdAt: date('created_at').notNull().defaultNow(),
  updatedAt: date('updated_at').notNull().defaultNow(),
});
export const verificationChallenges = pgTable(
  'email_verification_challenges',
  {
    id: uuid().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    digest: text().notNull(),
    expiresAt: date('expires_at').notNull(),
    attempts: integer().notNull().default(0),
    consumedAt: date('consumed_at'),
    lastSentAt: date('last_sent_at').notNull(),
    createdAt: date('created_at').notNull(),
  },
  (t) => [check('verification_attempts_nonnegative', sql`${t.attempts} >= 0`)],
);
export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: date('created_at').notNull(),
    lastUsedAt: date('last_used_at').notNull(),
    expiresAt: date('expires_at').notNull(),
    revokedAt: date('revoked_at'),
  },
  (t) => [index('auth_sessions_user_idx').on(t.userId)],
);
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => authSessions.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: date('expires_at').notNull(),
    consumedAt: date('consumed_at'),
    replacedByTokenId: uuid('replaced_by_token_id').references(
      (): AnyPgColumn => refreshTokens.id,
    ),
    createdAt: date('created_at').notNull(),
  },
  (t) => [index('refresh_tokens_session_idx').on(t.sessionId)],
);
