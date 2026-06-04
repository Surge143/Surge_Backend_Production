import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "coffee_packages_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "coffee_packages_serving_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cups" numeric NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "coffee_packages_optional_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "coffee_packages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "coffee_packages_id" integer;
  ALTER TABLE "coffee_packages_features" ADD CONSTRAINT "coffee_packages_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coffee_packages_serving_tiers" ADD CONSTRAINT "coffee_packages_serving_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coffee_packages_optional_add_ons" ADD CONSTRAINT "coffee_packages_optional_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "coffee_packages_features_order_idx" ON "coffee_packages_features" USING btree ("_order");
  CREATE INDEX "coffee_packages_features_parent_id_idx" ON "coffee_packages_features" USING btree ("_parent_id");
  CREATE INDEX "coffee_packages_serving_tiers_order_idx" ON "coffee_packages_serving_tiers" USING btree ("_order");
  CREATE INDEX "coffee_packages_serving_tiers_parent_id_idx" ON "coffee_packages_serving_tiers" USING btree ("_parent_id");
  CREATE INDEX "coffee_packages_optional_add_ons_order_idx" ON "coffee_packages_optional_add_ons" USING btree ("_order");
  CREATE INDEX "coffee_packages_optional_add_ons_parent_id_idx" ON "coffee_packages_optional_add_ons" USING btree ("_parent_id");
  CREATE INDEX "coffee_packages__order_idx" ON "coffee_packages" USING btree ("_order");
  CREATE INDEX "coffee_packages_updated_at_idx" ON "coffee_packages" USING btree ("updated_at");
  CREATE INDEX "coffee_packages_created_at_idx" ON "coffee_packages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coffee_packages_fk" FOREIGN KEY ("coffee_packages_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_coffee_packages_id_idx" ON "payload_locked_documents_rels" USING btree ("coffee_packages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "coffee_packages_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coffee_packages_serving_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coffee_packages_optional_add_ons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coffee_packages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "coffee_packages_features" CASCADE;
  DROP TABLE "coffee_packages_serving_tiers" CASCADE;
  DROP TABLE "coffee_packages_optional_add_ons" CASCADE;
  DROP TABLE "coffee_packages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_coffee_packages_fk";
  
  DROP INDEX "payload_locked_documents_rels_coffee_packages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "coffee_packages_id";`)
}
