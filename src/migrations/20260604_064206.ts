import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "service_areas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"location" varchar NOT NULL,
  	"fee" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "service_areas_id" integer;
  CREATE INDEX "service_areas__order_idx" ON "service_areas" USING btree ("_order");
  CREATE INDEX "service_areas_updated_at_idx" ON "service_areas" USING btree ("updated_at");
  CREATE INDEX "service_areas_created_at_idx" ON "service_areas" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_areas_fk" FOREIGN KEY ("service_areas_id") REFERENCES "public"."service_areas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_service_areas_id_idx" ON "payload_locked_documents_rels" USING btree ("service_areas_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "service_areas" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "service_areas" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_service_areas_fk";

  DROP INDEX "payload_locked_documents_rels_service_areas_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "service_areas_id";`)
}
