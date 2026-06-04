import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "addons_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "addons_menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"subtitle" varchar NOT NULL,
  	"tagline" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "addons_menu_id" integer;
  ALTER TABLE "addons_menu_items" ADD CONSTRAINT "addons_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."addons_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "addons_menu_items_order_idx" ON "addons_menu_items" USING btree ("_order");
  CREATE INDEX "addons_menu_items_parent_id_idx" ON "addons_menu_items" USING btree ("_parent_id");
  CREATE INDEX "addons_menu__order_idx" ON "addons_menu" USING btree ("_order");
  CREATE INDEX "addons_menu_updated_at_idx" ON "addons_menu" USING btree ("updated_at");
  CREATE INDEX "addons_menu_created_at_idx" ON "addons_menu" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_addons_menu_fk" FOREIGN KEY ("addons_menu_id") REFERENCES "public"."addons_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_addons_menu_id_idx" ON "payload_locked_documents_rels" USING btree ("addons_menu_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "addons_menu_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "addons_menu" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "addons_menu_items" CASCADE;
  DROP TABLE "addons_menu" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_addons_menu_fk";
  
  DROP INDEX "payload_locked_documents_rels_addons_menu_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "addons_menu_id";`)
}
