CREATE TABLE "diagnostic_attempts" (
	"session_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"difficulty_id" text NOT NULL,
	"interaction_type" text NOT NULL,
	"selected_option_id" text NOT NULL,
	"correct" boolean NOT NULL,
	"response_duration_ms" integer,
	"confidence" text,
	"answered_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "diagnostic_attempts_session_id_question_id_pk" PRIMARY KEY("session_id","question_id"),
	CONSTRAINT "diagnostic_confidence" CHECK ("diagnostic_attempts"."confidence" IN ('guessing', 'somewhat_sure', 'very_sure')),
	CONSTRAINT "diagnostic_response_duration" CHECK ("diagnostic_attempts"."response_duration_ms" BETWEEN 0 AND 86400000)
);
--> statement-breakpoint
CREATE TABLE "diagnostic_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"diagnostic_id" text NOT NULL,
	"definition_version" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "diagnostic_status_completion" CHECK (("diagnostic_sessions"."status" = 'active' AND "diagnostic_sessions"."completed_at" IS NULL) OR ("diagnostic_sessions"."status" = 'completed' AND "diagnostic_sessions"."completed_at" IS NOT NULL AND "diagnostic_sessions"."completed_at" >= "diagnostic_sessions"."started_at"))
);
--> statement-breakpoint
ALTER TABLE "diagnostic_attempts" ADD CONSTRAINT "diagnostic_attempts_session_id_diagnostic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."diagnostic_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "diagnostic_user_definition_unique" ON "diagnostic_sessions" USING btree ("user_id","diagnostic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "diagnostic_one_active_per_user" ON "diagnostic_sessions" USING btree ("user_id") WHERE "diagnostic_sessions"."status" = 'active';
--> statement-breakpoint
-- Cross-capability ownership remains migration-owned, preserving private schema boundaries.
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
