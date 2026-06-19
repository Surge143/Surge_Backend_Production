import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "web_products_product_highlights_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" varchar
  );

  CREATE TABLE IF NOT EXISTS "web_products_product_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_title" varchar
  );

  CREATE TABLE IF NOT EXISTS "_web_products_v_version_product_highlights_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_web_products_v_version_product_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section_title" varchar,
  	"_uuid" varchar
  );

  DO $$ BEGIN
    ALTER TABLE "web_products_product_highlights_items" ADD CONSTRAINT "web_products_product_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products_product_highlights"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "web_products_product_highlights" ADD CONSTRAINT "web_products_product_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_web_products_v_version_product_highlights_items" ADD CONSTRAINT "_web_products_v_version_product_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v_version_product_highlights"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_web_products_v_version_product_highlights" ADD CONSTRAINT "_web_products_v_version_product_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "web_products_product_highlights_items_order_idx" ON "web_products_product_highlights_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "web_products_product_highlights_items_parent_id_idx" ON "web_products_product_highlights_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "web_products_product_highlights_order_idx" ON "web_products_product_highlights" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "web_products_product_highlights_parent_id_idx" ON "web_products_product_highlights" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_web_products_v_version_product_highlights_items_order_idx" ON "_web_products_v_version_product_highlights_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_web_products_v_version_product_highlights_items_parent_id_idx" ON "_web_products_v_version_product_highlights_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_web_products_v_version_product_highlights_order_idx" ON "_web_products_v_version_product_highlights" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_web_products_v_version_product_highlights_parent_id_idx" ON "_web_products_v_version_product_highlights" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "web_products_product_highlights_items" CASCADE;
  DROP TABLE "web_products_product_highlights" CASCADE;
  DROP TABLE "_web_products_v_version_product_highlights_items" CASCADE;
  DROP TABLE "_web_products_v_version_product_highlights" CASCADE;`)
}
