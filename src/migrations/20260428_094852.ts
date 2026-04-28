import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone_number" varchar NOT NULL,
  	"event_date" timestamp(3) with time zone NOT NULL,
  	"time_window" varchar NOT NULL,
  	"expected_guests" numeric NOT NULL,
  	"event_type" varchar NOT NULL,
  	"package" varchar NOT NULL,
  	"addons" varchar,
  	"location" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at");

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'events_id'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");

  DROP INDEX IF EXISTS "surge_stamps_user_idx";
  CREATE UNIQUE INDEX "surge_stamps_user_idx" ON "surge_stamps" USING btree ("user_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "users" ALTER COLUMN "gender" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_gender";
  CREATE TYPE "public"."enum_users_gender" AS ENUM('male', 'female', 'other');
  ALTER TABLE "users" ALTER COLUMN "gender" SET DATA TYPE "public"."enum_users_gender" USING "gender"::"public"."enum_users_gender";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "surge_stamps_user_idx";
  ALTER TABLE "users" ALTER COLUMN "gender" DROP DEFAULT;
  CREATE INDEX "surge_stamps_user_idx" ON "surge_stamps" USING btree ("user_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";`)
}
