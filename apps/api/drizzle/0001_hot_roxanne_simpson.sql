CREATE TABLE "engineering_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"goals" text[],
	"role" text,
	"experience" text,
	"technologies" text[],
	"focus_areas" text[],
	"daily_minutes" smallint,
	"learning_preferences" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_daily_minutes" CHECK ("engineering_profiles"."daily_minutes" IN (5, 10, 15)),
	CONSTRAINT "profile_role" CHECK ("engineering_profiles"."role" IN ('backend','frontend','full_stack','mobile','platform','data','other')),
	CONSTRAINT "profile_experience" CHECK ("engineering_profiles"."experience" IN ('under_1','years_1_3','years_3_5','years_5_8','years_8_plus')),
	CONSTRAINT "profile_goals_nonempty" CHECK ("engineering_profiles"."goals" IS NULL OR (cardinality("engineering_profiles"."goals") > 0 AND array_ndims("engineering_profiles"."goals") = 1 AND array_position("engineering_profiles"."goals", NULL) IS NULL)),
	CONSTRAINT "profile_technologies_nonempty" CHECK ("engineering_profiles"."technologies" IS NULL OR (cardinality("engineering_profiles"."technologies") > 0 AND array_ndims("engineering_profiles"."technologies") = 1 AND array_position("engineering_profiles"."technologies", NULL) IS NULL)),
	CONSTRAINT "profile_focus_areas_nonempty" CHECK ("engineering_profiles"."focus_areas" IS NULL OR (cardinality("engineering_profiles"."focus_areas") > 0 AND array_ndims("engineering_profiles"."focus_areas") = 1 AND array_position("engineering_profiles"."focus_areas", NULL) IS NULL)),
	CONSTRAINT "profile_learning_preferences_nonempty" CHECK ("engineering_profiles"."learning_preferences" IS NULL OR (cardinality("engineering_profiles"."learning_preferences") > 0 AND array_ndims("engineering_profiles"."learning_preferences") = 1 AND array_position("engineering_profiles"."learning_preferences", NULL) IS NULL)),
	CONSTRAINT "profile_learning_approach" CHECK (NOT ("engineering_profiles"."learning_preferences" @> ARRAY['challenge_first','explain_first']::text[]))
);

--> statement-breakpoint
-- Cross-capability ownership stays a database constraint without a private schema import.
ALTER TABLE "engineering_profiles" ADD CONSTRAINT "engineering_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
