import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Fix corrupted enum: enum_app_categories_status was created by dev-mode with
  // values {single,multiple} (selection-type values) instead of {draft,published}.
  // The column shop_menu_customizations_sections.selection_type uses it — migrate
  // that column to sm_sect_sel_type (already exists with correct values), then
  // drop and recreate enum_app_categories_status with correct values.
  await db.execute(sql`
    ALTER TABLE "shop_menu_customizations_sections"
      ALTER COLUMN "selection_type"
      SET DATA TYPE "public"."sm_sect_sel_type"
      USING "selection_type"::text::"public"."sm_sect_sel_type";

    DROP TYPE "public"."enum_app_categories_status";
    CREATE TYPE "public"."enum_app_categories_status" AS ENUM('draft', 'published');

    DO $$ BEGIN
      DROP TYPE "public"."enum_shop_menu_customizations_sections_selection_type";
    EXCEPTION WHEN undefined_object THEN NULL;
              WHEN dependent_objects_still_exist THEN NULL;
    END $$;

    -- Drop old FK constraints before dropping columns
    DO $$ BEGIN
      ALTER TABLE "web_products" DROP CONSTRAINT "web_products_updated_by_id_admins_id_fk";
    EXCEPTION WHEN undefined_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "_web_products_v" DROP CONSTRAINT "_web_products_v_version_updated_by_id_admins_id_fk";
    EXCEPTION WHEN undefined_object THEN NULL; END $$;

    DROP INDEX IF EXISTS "web_products_updated_by_idx";
    DROP INDEX IF EXISTS "_web_products_v_version_version_updated_by_idx";

    -- Drop old relationship-based tracking columns
    ALTER TABLE "web_products"    DROP COLUMN IF EXISTS "updated_by_id";
    ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_updated_by_id";
    ALTER TABLE "media"           DROP COLUMN IF EXISTS "cloudinary_public_id";

    -- Add missing _status columns
    ALTER TABLE "app_categories"    ADD COLUMN IF NOT EXISTS "_status" "enum_app_categories_status"    DEFAULT 'draft';
    ALTER TABLE "app_sub_categories" ADD COLUMN IF NOT EXISTS "_status" "enum_app_sub_categories_status" DEFAULT 'draft';
    ALTER TABLE "menu"              ADD COLUMN IF NOT EXISTS "_status" "enum_menu_status"              DEFAULT 'draft';
    ALTER TABLE "shop"              ADD COLUMN IF NOT EXISTS "_status" "enum_shop_status"              DEFAULT 'draft';
    ALTER TABLE "shop_menu"         ADD COLUMN IF NOT EXISTS "_status" "enum_shop_menu_status"         DEFAULT 'draft';
    ALTER TABLE "web_categories"    ADD COLUMN IF NOT EXISTS "_status" "enum_web_categories_status"    DEFAULT 'draft';
    ALTER TABLE "web_sub_categories" ADD COLUMN IF NOT EXISTS "_status" "enum_web_sub_categories_status" DEFAULT 'draft';
    ALTER TABLE "slots"             ADD COLUMN IF NOT EXISTS "_status" "enum_slots_status"             DEFAULT 'draft';
    ALTER TABLE "surge_coins"       ADD COLUMN IF NOT EXISTS "_status" "enum_surge_coins_status"       DEFAULT 'draft';
    ALTER TABLE "ship_and_tax"      ADD COLUMN IF NOT EXISTS "_status" "enum_ship_and_tax_status"      DEFAULT 'draft';

    -- Add missing last_updated_by / created_by columns (base tables)
    ALTER TABLE "app_categories"    ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "app_categories"    ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "app_sub_categories" ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "app_sub_categories" ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "menu"              ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "menu"              ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "shop"              ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "shop"              ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "shop_menu"         ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "web_categories"    ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "web_categories"    ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "web_sub_categories" ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "web_sub_categories" ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "slots"             ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "slots"             ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "surge_coins"       ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "ship_and_tax"      ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "surge_coupon"      ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "surge_shop_coupon" ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "app_best_seller"   ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "app_best_seller"   ADD COLUMN IF NOT EXISTS "created_by"      varchar;
    ALTER TABLE "web_products"      ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
    ALTER TABLE "web_products"      ADD COLUMN IF NOT EXISTS "created_by"      varchar;

    -- Add missing version tracking columns
    ALTER TABLE "_surge_coupon_v"      ADD COLUMN IF NOT EXISTS "version_last_updated_by" varchar;
    ALTER TABLE "_surge_shop_coupon_v" ADD COLUMN IF NOT EXISTS "version_last_updated_by" varchar;
    ALTER TABLE "_surge_shop_coupon_v" ADD COLUMN IF NOT EXISTS "autosave"                boolean;
    ALTER TABLE "_web_products_v"      ADD COLUMN IF NOT EXISTS "version_last_updated_by" varchar;
    ALTER TABLE "_web_products_v"      ADD COLUMN IF NOT EXISTS "version_created_by"      varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_last_updated_by";
    ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_created_by";
    ALTER TABLE "_surge_coupon_v" DROP COLUMN IF EXISTS "version_last_updated_by";
    ALTER TABLE "_surge_shop_coupon_v" DROP COLUMN IF EXISTS "version_last_updated_by";
    ALTER TABLE "_surge_shop_coupon_v" DROP COLUMN IF EXISTS "autosave";
  `)
}
