import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
export const userStatus = pgEnum('user_status', ['active', 'disabled']);
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 254 }).notNull(),
  emailNormalized: varchar('email_normalized', { length: 254 })
    .notNull()
    .unique(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  status: userStatus().notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
