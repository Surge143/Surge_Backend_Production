import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop old child tables (from the previously applied migration)
  await db.execute(sql`
    ALTER TABLE "coffee_packages_serving_tiers" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "coffee_packages_optional_add_ons" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "coffee_packages_serving_tiers" CASCADE;
    DROP TABLE "coffee_packages_optional_add_ons" CASCADE;
  `)

  // Add new title columns to the existing coffee_packages table
  await db.execute(sql`
    ALTER TABLE "coffee_packages" ADD COLUMN "serving_options_title" varchar DEFAULT 'Serving Options' NOT NULL;
    ALTER TABLE "coffee_packages" ADD COLUMN "optional_add_ons_title" varchar DEFAULT 'Optional Add-ons' NOT NULL;
  `)

  // Create new child tables with updated naming
  await db.execute(sql`
    CREATE TABLE "coffee_packages_serving_options_tiers" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "cups" numeric NOT NULL,
      "price" numeric NOT NULL
    );

    CREATE TABLE "coffee_packages_optional_add_ons_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL
    );

    ALTER TABLE "coffee_packages_serving_options_tiers" ADD CONSTRAINT "coffee_packages_serving_options_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "coffee_packages_optional_add_ons_items" ADD CONSTRAINT "coffee_packages_optional_add_ons_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "coffee_packages_serving_options_tiers_order_idx" ON "coffee_packages_serving_options_tiers" USING btree ("_order");
    CREATE INDEX "coffee_packages_serving_options_tiers_parent_id_idx" ON "coffee_packages_serving_options_tiers" USING btree ("_parent_id");
    CREATE INDEX "coffee_packages_optional_add_ons_items_order_idx" ON "coffee_packages_optional_add_ons_items" USING btree ("_order");
    CREATE INDEX "coffee_packages_optional_add_ons_items_parent_id_idx" ON "coffee_packages_optional_add_ons_items" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop new tables
  await db.execute(sql`
    ALTER TABLE "coffee_packages_serving_options_tiers" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "coffee_packages_optional_add_ons_items" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "coffee_packages_serving_options_tiers" CASCADE;
    DROP TABLE "coffee_packages_optional_add_ons_items" CASCADE;
  `)

  // Remove new title columns
  await db.execute(sql`
    ALTER TABLE "coffee_packages" DROP COLUMN "serving_options_title";
    ALTER TABLE "coffee_packages" DROP COLUMN "optional_add_ons_title";
  `)

  // Restore old child tables
  await db.execute(sql`
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

    ALTER TABLE "coffee_packages_serving_tiers" ADD CONSTRAINT "coffee_packages_serving_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "coffee_packages_optional_add_ons" ADD CONSTRAINT "coffee_packages_optional_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coffee_packages"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "coffee_packages_serving_tiers_order_idx" ON "coffee_packages_serving_tiers" USING btree ("_order");
    CREATE INDEX "coffee_packages_serving_tiers_parent_id_idx" ON "coffee_packages_serving_tiers" USING btree ("_parent_id");
    CREATE INDEX "coffee_packages_optional_add_ons_order_idx" ON "coffee_packages_optional_add_ons" USING btree ("_order");
    CREATE INDEX "coffee_packages_optional_add_ons_parent_id_idx" ON "coffee_packages_optional_add_ons" USING btree ("_parent_id");
  `)
}
