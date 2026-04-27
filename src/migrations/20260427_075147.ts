import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_app_categories_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__app_categories_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_app_sub_categories_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__app_sub_categories_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_menu_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__menu_v_version_customizations_sections_selection_type" AS ENUM('single', 'multiple'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__menu_v_version_dietary_type" AS ENUM('veg', 'non-veg', 'vegan'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__menu_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_shop_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__shop_v_version_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__shop_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."sm_sect_sel_type" AS ENUM('single', 'multiple'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_shop_menu_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__shop_menu_v_version_dietary_type" AS ENUM('veg', 'non-veg', 'vegan'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__shop_menu_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_web_categories_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__web_categories_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_web_sub_categories_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__web_sub_categories_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_slots_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__slots_v_version_time_selection" AS ENUM('now', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__slots_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_surge_coins_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__surge_coins_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_ship_and_tax_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__ship_and_tax_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS "_app_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_image_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__app_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_app_sub_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_parent_category_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__app_sub_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_version_customizations_sections_groups_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_version_customizations_sections_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_version_customizations_sections_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_version_customizations_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"selection_type" "enum__menu_v_version_customizations_sections_selection_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_version_customizations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"template_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_tagline" varchar,
  	"version_image_id" integer,
  	"version_description" varchar,
  	"version_category_id" integer,
  	"version_regular_price" numeric,
  	"version_sale_price" numeric,
  	"version_dietary_type" "enum__menu_v_version_dietary_type" DEFAULT 'veg',
  	"version_is_stamp_eligible" boolean,
  	"version_is_stamp_free_product" boolean,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"app_sub_categories_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_operational_settings_opening_time" timestamp(3) with time zone,
  	"version_operational_settings_closing_time" timestamp(3) with time zone,
  	"version_operational_settings_operating_days_monday" boolean DEFAULT true,
  	"version_operational_settings_operating_days_tuesday" boolean DEFAULT true,
  	"version_operational_settings_operating_days_wednesday" boolean DEFAULT true,
  	"version_operational_settings_operating_days_thursday" boolean DEFAULT true,
  	"version_operational_settings_operating_days_friday" boolean DEFAULT true,
  	"version_operational_settings_operating_days_saturday" boolean DEFAULT false,
  	"version_operational_settings_operating_days_sunday" boolean DEFAULT false,
  	"version_address_street" varchar,
  	"version_address_apartment" varchar,
  	"version_address_city" varchar,
  	"version_address_emirates" "enum__shop_v_version_address_emirates",
  	"version_address_country" varchar DEFAULT 'United Arab Emirates',
  	"version_address_latitude" numeric,
  	"version_address_longitude" numeric,
  	"version_is_shop_open" boolean DEFAULT true,
  	"version_shop_manager_id" integer,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__shop_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v_version_customizations_sections_groups_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v_version_customizations_sections_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v_version_customizations_sections_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v_version_customizations_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"selection_type" "sm_sect_sel_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v_version_customizations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"template_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_shop_id" integer,
  	"version_created_by_id" integer,
  	"version_tagline" varchar,
  	"version_image_id" integer,
  	"version_description" varchar,
  	"version_category_id" integer,
  	"version_regular_price" numeric,
  	"version_sale_price" numeric,
  	"version_dietary_type" "enum__shop_menu_v_version_dietary_type",
  	"version_stock_count" numeric,
  	"version_in_stock" boolean DEFAULT false,
  	"version_is_stamp_eligible" boolean DEFAULT false,
  	"version_is_stamp_free_product" boolean DEFAULT false,
  	"version_last_updated_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__shop_menu_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_shop_menu_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_id" integer,
  	"app_sub_categories_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "web_categories_brewing_guide_tabs_parameters" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "web_categories_brewing_guide_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tab_name" varchar,
  	"video_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "_web_categories_v_version_brewing_guide_tabs_parameters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_web_categories_v_version_brewing_guide_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tab_name" varchar,
  	"video_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_web_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_image_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__web_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_web_sub_categories_v_version_level1_level2_level3" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_web_sub_categories_v_version_level1_level2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_web_sub_categories_v_version_level1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_web_sub_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_parent_category_id" integer,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__web_sub_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_slots_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_is_active" boolean DEFAULT true,
  	"version_time_selection" "enum__slots_v_version_time_selection" DEFAULT 'now',
  	"version_slot" timestamp(3) with time zone,
  	"version_max_capacity" numeric DEFAULT 20,
  	"version_current_load" numeric DEFAULT 0,
  	"version_shop_id" integer,
  	"version_shop_manager_id" integer,
  	"version_last_updated_by" varchar,
  	"version_created_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__slots_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_surge_coins_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_points_earn" numeric,
  	"version_points_to_aed" numeric,
  	"version_reward_expiry" numeric DEFAULT 12,
  	"version_max_points_per_order" numeric DEFAULT 0,
  	"version_min_points_per_order" numeric DEFAULT 0,
  	"version_referral_reward_for_referrer" numeric DEFAULT 0,
  	"version_referral_reward_for_referred" numeric DEFAULT 0,
  	"version_last_updated_by" varchar,
  	"version__status" "enum__surge_coins_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_ship_and_tax_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_tax" numeric,
  	"version_emirate_charges_abu_dhabi" numeric,
  	"version_emirate_charges_dubai" numeric,
  	"version_emirate_charges_sharjah" numeric,
  	"version_emirate_charges_ajman" numeric,
  	"version_emirate_charges_umm_al_quwain" numeric,
  	"version_emirate_charges_ras_al_khaimah" numeric,
  	"version_emirate_charges_fujairah" numeric,
  	"version_last_updated_by" varchar,
  	"version__status" "enum__ship_and_tax_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
DO $$ BEGIN   ALTER TABLE "web_products" DROP CONSTRAINT "web_products_updated_by_id_admins_id_fk"; EXCEPTION WHEN undefined_object THEN NULL; END $$;
  
DO $$ BEGIN   ALTER TABLE "_web_products_v" DROP CONSTRAINT "_web_products_v_version_updated_by_id_admins_id_fk"; EXCEPTION WHEN undefined_object THEN NULL; END $$;
  
  DROP INDEX IF EXISTS "web_products_updated_by_idx";
  DROP INDEX IF EXISTS "_web_products_v_version_version_updated_by_idx";
  DROP INDEX IF EXISTS "slots_slot_idx";
  ALTER TABLE "app_categories" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "app_categories" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "app_sub_categories" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "app_sub_categories" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "menu_customizations_sections_groups_options" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "menu_customizations_sections_groups" ALTER COLUMN "group_title" DROP NOT NULL;
  ALTER TABLE "menu_customizations_sections" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "category_id" DROP NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "regular_price" DROP NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "dietary_type" DROP NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "operational_settings_opening_time" DROP NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "operational_settings_closing_time" DROP NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "address_emirates" DROP NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "shop_manager_id" DROP NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections_groups_options" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections_groups" ALTER COLUMN "group_title" DROP NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections" ALTER COLUMN "selection_type" SET DATA TYPE "public"."sm_sect_sel_type" USING "selection_type"::text::"public"."sm_sect_sel_type";
  ALTER TABLE "shop_menu" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "shop_menu" ALTER COLUMN "category_id" DROP NOT NULL;
  ALTER TABLE "shop_menu" ALTER COLUMN "regular_price" DROP NOT NULL;
  ALTER TABLE "web_categories" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "web_categories" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "web_sub_categories_level1" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "web_sub_categories" ALTER COLUMN "parent_category_id" DROP NOT NULL;
  ALTER TABLE "slots" ALTER COLUMN "max_capacity" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "points_earn" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "points_to_aed" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "reward_expiry" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "max_points_per_order" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "min_points_per_order" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "referral_reward_for_referrer" DROP NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "referral_reward_for_referred" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contact_email" varchar;
  ALTER TABLE "app_categories" ADD COLUMN IF NOT EXISTS "image_id" integer;
  ALTER TABLE "app_categories" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "app_categories" ADD COLUMN "created_by" varchar;
  ALTER TABLE "app_categories" ADD COLUMN "_status" "enum_app_categories_status" DEFAULT 'draft';
  ALTER TABLE "app_sub_categories" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "app_sub_categories" ADD COLUMN "created_by" varchar;
  ALTER TABLE "app_sub_categories" ADD COLUMN "_status" "enum_app_sub_categories_status" DEFAULT 'draft';
  ALTER TABLE "menu" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "menu" ADD COLUMN "created_by" varchar;
  ALTER TABLE "menu" ADD COLUMN "_status" "enum_menu_status" DEFAULT 'draft';
  ALTER TABLE "shop" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "shop" ADD COLUMN "created_by" varchar;
  ALTER TABLE "shop" ADD COLUMN "_status" "enum_shop_status" DEFAULT 'draft';
  ALTER TABLE "shop_menu" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "shop_menu" ADD COLUMN "_status" "enum_shop_menu_status" DEFAULT 'draft';
  ALTER TABLE "surge_coupon" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "_surge_coupon_v" ADD COLUMN "version_last_updated_by" varchar;
  ALTER TABLE "surge_shop_coupon" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "_surge_shop_coupon_v" ADD COLUMN "version_last_updated_by" varchar;
  ALTER TABLE "_surge_shop_coupon_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "web_categories" ADD COLUMN IF NOT EXISTS "image_id" integer;
  ALTER TABLE "web_categories" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "web_categories" ADD COLUMN "created_by" varchar;
  ALTER TABLE "web_categories" ADD COLUMN "_status" "enum_web_categories_status" DEFAULT 'draft';
  ALTER TABLE "web_sub_categories" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "web_sub_categories" ADD COLUMN "created_by" varchar;
  ALTER TABLE "web_sub_categories" ADD COLUMN "_status" "enum_web_sub_categories_status" DEFAULT 'draft';
  ALTER TABLE "web_products" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "web_products" ADD COLUMN "created_by" varchar;
  ALTER TABLE "_web_products_v" ADD COLUMN "version_last_updated_by" varchar;
  ALTER TABLE "_web_products_v" ADD COLUMN "version_created_by" varchar;
  ALTER TABLE "slots" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "slots" ADD COLUMN "created_by" varchar;
  ALTER TABLE "slots" ADD COLUMN "_status" "enum_slots_status" DEFAULT 'draft';
  ALTER TABLE "app_best_seller" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "app_best_seller" ADD COLUMN "created_by" varchar;
  ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "short_description" varchar;
  ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "last_updated_by" varchar;
  ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "created_by" varchar;
  ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "version_short_description" varchar;
  ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "version_last_updated_by" varchar;
  ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "version_created_by" varchar;
  ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "surge_coins" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "surge_coins" ADD COLUMN "_status" "enum_surge_coins_status" DEFAULT 'draft';
  ALTER TABLE "ship_and_tax" ADD COLUMN "last_updated_by" varchar;
  ALTER TABLE "ship_and_tax" ADD COLUMN "_status" "enum_ship_and_tax_status" DEFAULT 'draft';
DO $$ BEGIN   ALTER TABLE "_app_categories_v" ADD CONSTRAINT "_app_categories_v_parent_id_app_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_app_categories_v" ADD CONSTRAINT "_app_categories_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_app_sub_categories_v" ADD CONSTRAINT "_app_sub_categories_v_parent_id_app_sub_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."app_sub_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_app_sub_categories_v" ADD CONSTRAINT "_app_sub_categories_v_version_parent_category_id_app_categories_id_fk" FOREIGN KEY ("version_parent_category_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_version_customizations_sections_groups_options" ADD CONSTRAINT "_menu_v_version_customizations_sections_groups_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v_version_customizations_sections_groups"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_version_customizations_sections_groups" ADD CONSTRAINT "_menu_v_version_customizations_sections_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v_version_customizations_sections"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_version_customizations_sections_options" ADD CONSTRAINT "_menu_v_version_customizations_sections_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v_version_customizations_sections"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_version_customizations_sections" ADD CONSTRAINT "_menu_v_version_customizations_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v_version_customizations"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_version_customizations" ADD CONSTRAINT "_menu_v_version_customizations_template_id_customization_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."customization_template"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_version_customizations" ADD CONSTRAINT "_menu_v_version_customizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_parent_id_menu_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_category_id_app_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_rels" ADD CONSTRAINT "_menu_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_menu_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_menu_v_rels" ADD CONSTRAINT "_menu_v_rels_app_sub_categories_fk" FOREIGN KEY ("app_sub_categories_id") REFERENCES "public"."app_sub_categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_v" ADD CONSTRAINT "_shop_v_parent_id_shop_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_v" ADD CONSTRAINT "_shop_v_version_shop_manager_id_admins_id_fk" FOREIGN KEY ("version_shop_manager_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_version_customizations_sections_groups_options" ADD CONSTRAINT "_shop_menu_v_version_customizations_sections_groups_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v_version_customizations_sections_groups"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_version_customizations_sections_groups" ADD CONSTRAINT "_shop_menu_v_version_customizations_sections_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v_version_customizations_sections"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_version_customizations_sections_options" ADD CONSTRAINT "_shop_menu_v_version_customizations_sections_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v_version_customizations_sections"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_version_customizations_sections" ADD CONSTRAINT "_shop_menu_v_version_customizations_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v_version_customizations"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_version_customizations" ADD CONSTRAINT "_shop_menu_v_version_customizations_template_id_customization_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."customization_template"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_version_customizations" ADD CONSTRAINT "_shop_menu_v_version_customizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v" ADD CONSTRAINT "_shop_menu_v_parent_id_shop_menu_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_menu"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v" ADD CONSTRAINT "_shop_menu_v_version_shop_id_shop_id_fk" FOREIGN KEY ("version_shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v" ADD CONSTRAINT "_shop_menu_v_version_created_by_id_admins_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v" ADD CONSTRAINT "_shop_menu_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v" ADD CONSTRAINT "_shop_menu_v_version_category_id_app_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_rels" ADD CONSTRAINT "_shop_menu_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_shop_menu_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_rels" ADD CONSTRAINT "_shop_menu_v_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_shop_menu_v_rels" ADD CONSTRAINT "_shop_menu_v_rels_app_sub_categories_fk" FOREIGN KEY ("app_sub_categories_id") REFERENCES "public"."app_sub_categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "web_categories_brewing_guide_tabs_parameters" ADD CONSTRAINT "web_categories_brewing_guide_tabs_parameters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_categories_brewing_guide_tabs"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "web_categories_brewing_guide_tabs" ADD CONSTRAINT "web_categories_brewing_guide_tabs_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "web_categories_brewing_guide_tabs" ADD CONSTRAINT "web_categories_brewing_guide_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_categories_v_version_brewing_guide_tabs_parameters" ADD CONSTRAINT "_web_categories_v_version_brewing_guide_tabs_parameters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_categories_v_version_brewing_guide_tabs"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_categories_v_version_brewing_guide_tabs" ADD CONSTRAINT "_web_categories_v_version_brewing_guide_tabs_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_categories_v_version_brewing_guide_tabs" ADD CONSTRAINT "_web_categories_v_version_brewing_guide_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_categories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_categories_v" ADD CONSTRAINT "_web_categories_v_parent_id_web_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."web_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_categories_v" ADD CONSTRAINT "_web_categories_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_sub_categories_v_version_level1_level2_level3" ADD CONSTRAINT "_web_sub_categories_v_version_level1_level2_level3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_sub_categories_v_version_level1_level2"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_sub_categories_v_version_level1_level2" ADD CONSTRAINT "_web_sub_categories_v_version_level1_level2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_sub_categories_v_version_level1"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_sub_categories_v_version_level1" ADD CONSTRAINT "_web_sub_categories_v_version_level1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_sub_categories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_sub_categories_v" ADD CONSTRAINT "_web_sub_categories_v_parent_id_web_sub_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."web_sub_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_sub_categories_v" ADD CONSTRAINT "_web_sub_categories_v_version_parent_category_id_web_categories_id_fk" FOREIGN KEY ("version_parent_category_id") REFERENCES "public"."web_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_slots_v" ADD CONSTRAINT "_slots_v_parent_id_slots_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."slots"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_slots_v" ADD CONSTRAINT "_slots_v_version_shop_id_shop_id_fk" FOREIGN KEY ("version_shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_slots_v" ADD CONSTRAINT "_slots_v_version_shop_manager_id_admins_id_fk" FOREIGN KEY ("version_shop_manager_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX "_app_categories_v_parent_idx" ON "_app_categories_v" USING btree ("parent_id");
  CREATE INDEX "_app_categories_v_version_version_image_idx" ON "_app_categories_v" USING btree ("version_image_id");
  CREATE INDEX "_app_categories_v_version_version_slug_idx" ON "_app_categories_v" USING btree ("version_slug");
  CREATE INDEX "_app_categories_v_version_version_updated_at_idx" ON "_app_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_app_categories_v_version_version_created_at_idx" ON "_app_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_app_categories_v_version_version__status_idx" ON "_app_categories_v" USING btree ("version__status");
  CREATE INDEX "_app_categories_v_created_at_idx" ON "_app_categories_v" USING btree ("created_at");
  CREATE INDEX "_app_categories_v_updated_at_idx" ON "_app_categories_v" USING btree ("updated_at");
  CREATE INDEX "_app_categories_v_latest_idx" ON "_app_categories_v" USING btree ("latest");
  CREATE INDEX "_app_categories_v_autosave_idx" ON "_app_categories_v" USING btree ("autosave");
  CREATE INDEX "_app_sub_categories_v_parent_idx" ON "_app_sub_categories_v" USING btree ("parent_id");
  CREATE INDEX "_app_sub_categories_v_version_version_parent_category_idx" ON "_app_sub_categories_v" USING btree ("version_parent_category_id");
  CREATE INDEX "_app_sub_categories_v_version_version_slug_idx" ON "_app_sub_categories_v" USING btree ("version_slug");
  CREATE INDEX "_app_sub_categories_v_version_version_updated_at_idx" ON "_app_sub_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_app_sub_categories_v_version_version_created_at_idx" ON "_app_sub_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_app_sub_categories_v_version_version__status_idx" ON "_app_sub_categories_v" USING btree ("version__status");
  CREATE INDEX "_app_sub_categories_v_created_at_idx" ON "_app_sub_categories_v" USING btree ("created_at");
  CREATE INDEX "_app_sub_categories_v_updated_at_idx" ON "_app_sub_categories_v" USING btree ("updated_at");
  CREATE INDEX "_app_sub_categories_v_latest_idx" ON "_app_sub_categories_v" USING btree ("latest");
  CREATE INDEX "_app_sub_categories_v_autosave_idx" ON "_app_sub_categories_v" USING btree ("autosave");
  CREATE INDEX "_menu_v_version_customizations_sections_groups_options_order_idx" ON "_menu_v_version_customizations_sections_groups_options" USING btree ("_order");
  CREATE INDEX "_menu_v_version_customizations_sections_groups_options_parent_id_idx" ON "_menu_v_version_customizations_sections_groups_options" USING btree ("_parent_id");
  CREATE INDEX "_menu_v_version_customizations_sections_groups_order_idx" ON "_menu_v_version_customizations_sections_groups" USING btree ("_order");
  CREATE INDEX "_menu_v_version_customizations_sections_groups_parent_id_idx" ON "_menu_v_version_customizations_sections_groups" USING btree ("_parent_id");
  CREATE INDEX "_menu_v_version_customizations_sections_options_order_idx" ON "_menu_v_version_customizations_sections_options" USING btree ("_order");
  CREATE INDEX "_menu_v_version_customizations_sections_options_parent_id_idx" ON "_menu_v_version_customizations_sections_options" USING btree ("_parent_id");
  CREATE INDEX "_menu_v_version_customizations_sections_order_idx" ON "_menu_v_version_customizations_sections" USING btree ("_order");
  CREATE INDEX "_menu_v_version_customizations_sections_parent_id_idx" ON "_menu_v_version_customizations_sections" USING btree ("_parent_id");
  CREATE INDEX "_menu_v_version_customizations_order_idx" ON "_menu_v_version_customizations" USING btree ("_order");
  CREATE INDEX "_menu_v_version_customizations_parent_id_idx" ON "_menu_v_version_customizations" USING btree ("_parent_id");
  CREATE INDEX "_menu_v_version_customizations_template_idx" ON "_menu_v_version_customizations" USING btree ("template_id");
  CREATE INDEX "_menu_v_parent_idx" ON "_menu_v" USING btree ("parent_id");
  CREATE INDEX "_menu_v_version_version_image_idx" ON "_menu_v" USING btree ("version_image_id");
  CREATE INDEX "_menu_v_version_version_category_idx" ON "_menu_v" USING btree ("version_category_id");
  CREATE INDEX "_menu_v_version_version_updated_at_idx" ON "_menu_v" USING btree ("version_updated_at");
  CREATE INDEX "_menu_v_version_version_created_at_idx" ON "_menu_v" USING btree ("version_created_at");
  CREATE INDEX "_menu_v_version_version__status_idx" ON "_menu_v" USING btree ("version__status");
  CREATE INDEX "_menu_v_created_at_idx" ON "_menu_v" USING btree ("created_at");
  CREATE INDEX "_menu_v_updated_at_idx" ON "_menu_v" USING btree ("updated_at");
  CREATE INDEX "_menu_v_latest_idx" ON "_menu_v" USING btree ("latest");
  CREATE INDEX "_menu_v_autosave_idx" ON "_menu_v" USING btree ("autosave");
  CREATE INDEX "_menu_v_rels_order_idx" ON "_menu_v_rels" USING btree ("order");
  CREATE INDEX "_menu_v_rels_parent_idx" ON "_menu_v_rels" USING btree ("parent_id");
  CREATE INDEX "_menu_v_rels_path_idx" ON "_menu_v_rels" USING btree ("path");
  CREATE INDEX "_menu_v_rels_app_sub_categories_id_idx" ON "_menu_v_rels" USING btree ("app_sub_categories_id");
  CREATE INDEX "_shop_v_parent_idx" ON "_shop_v" USING btree ("parent_id");
  CREATE INDEX "_shop_v_version_version_shop_manager_idx" ON "_shop_v" USING btree ("version_shop_manager_id");
  CREATE INDEX "_shop_v_version_version_updated_at_idx" ON "_shop_v" USING btree ("version_updated_at");
  CREATE INDEX "_shop_v_version_version_created_at_idx" ON "_shop_v" USING btree ("version_created_at");
  CREATE INDEX "_shop_v_version_version__status_idx" ON "_shop_v" USING btree ("version__status");
  CREATE INDEX "_shop_v_created_at_idx" ON "_shop_v" USING btree ("created_at");
  CREATE INDEX "_shop_v_updated_at_idx" ON "_shop_v" USING btree ("updated_at");
  CREATE INDEX "_shop_v_latest_idx" ON "_shop_v" USING btree ("latest");
  CREATE INDEX "_shop_v_autosave_idx" ON "_shop_v" USING btree ("autosave");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_groups_options_order_idx" ON "_shop_menu_v_version_customizations_sections_groups_options" USING btree ("_order");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_groups_options_parent_id_idx" ON "_shop_menu_v_version_customizations_sections_groups_options" USING btree ("_parent_id");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_groups_order_idx" ON "_shop_menu_v_version_customizations_sections_groups" USING btree ("_order");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_groups_parent_id_idx" ON "_shop_menu_v_version_customizations_sections_groups" USING btree ("_parent_id");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_options_order_idx" ON "_shop_menu_v_version_customizations_sections_options" USING btree ("_order");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_options_parent_id_idx" ON "_shop_menu_v_version_customizations_sections_options" USING btree ("_parent_id");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_order_idx" ON "_shop_menu_v_version_customizations_sections" USING btree ("_order");
  CREATE INDEX "_shop_menu_v_version_customizations_sections_parent_id_idx" ON "_shop_menu_v_version_customizations_sections" USING btree ("_parent_id");
  CREATE INDEX "_shop_menu_v_version_customizations_order_idx" ON "_shop_menu_v_version_customizations" USING btree ("_order");
  CREATE INDEX "_shop_menu_v_version_customizations_parent_id_idx" ON "_shop_menu_v_version_customizations" USING btree ("_parent_id");
  CREATE INDEX "_shop_menu_v_version_customizations_template_idx" ON "_shop_menu_v_version_customizations" USING btree ("template_id");
  CREATE INDEX "_shop_menu_v_parent_idx" ON "_shop_menu_v" USING btree ("parent_id");
  CREATE INDEX "_shop_menu_v_version_version_shop_idx" ON "_shop_menu_v" USING btree ("version_shop_id");
  CREATE INDEX "_shop_menu_v_version_version_created_by_idx" ON "_shop_menu_v" USING btree ("version_created_by_id");
  CREATE INDEX "_shop_menu_v_version_version_image_idx" ON "_shop_menu_v" USING btree ("version_image_id");
  CREATE INDEX "_shop_menu_v_version_version_category_idx" ON "_shop_menu_v" USING btree ("version_category_id");
  CREATE INDEX "_shop_menu_v_version_version_updated_at_idx" ON "_shop_menu_v" USING btree ("version_updated_at");
  CREATE INDEX "_shop_menu_v_version_version_created_at_idx" ON "_shop_menu_v" USING btree ("version_created_at");
  CREATE INDEX "_shop_menu_v_version_version__status_idx" ON "_shop_menu_v" USING btree ("version__status");
  CREATE INDEX "_shop_menu_v_created_at_idx" ON "_shop_menu_v" USING btree ("created_at");
  CREATE INDEX "_shop_menu_v_updated_at_idx" ON "_shop_menu_v" USING btree ("updated_at");
  CREATE INDEX "_shop_menu_v_latest_idx" ON "_shop_menu_v" USING btree ("latest");
  CREATE INDEX "_shop_menu_v_autosave_idx" ON "_shop_menu_v" USING btree ("autosave");
  CREATE INDEX "_shop_menu_v_rels_order_idx" ON "_shop_menu_v_rels" USING btree ("order");
  CREATE INDEX "_shop_menu_v_rels_parent_idx" ON "_shop_menu_v_rels" USING btree ("parent_id");
  CREATE INDEX "_shop_menu_v_rels_path_idx" ON "_shop_menu_v_rels" USING btree ("path");
  CREATE INDEX "_shop_menu_v_rels_menu_id_idx" ON "_shop_menu_v_rels" USING btree ("menu_id");
  CREATE INDEX "_shop_menu_v_rels_app_sub_categories_id_idx" ON "_shop_menu_v_rels" USING btree ("app_sub_categories_id");
  CREATE INDEX "web_categories_brewing_guide_tabs_parameters_order_idx" ON "web_categories_brewing_guide_tabs_parameters" USING btree ("_order");
  CREATE INDEX "web_categories_brewing_guide_tabs_parameters_parent_id_idx" ON "web_categories_brewing_guide_tabs_parameters" USING btree ("_parent_id");
  CREATE INDEX "web_categories_brewing_guide_tabs_order_idx" ON "web_categories_brewing_guide_tabs" USING btree ("_order");
  CREATE INDEX "web_categories_brewing_guide_tabs_parent_id_idx" ON "web_categories_brewing_guide_tabs" USING btree ("_parent_id");
  CREATE INDEX "web_categories_brewing_guide_tabs_video_idx" ON "web_categories_brewing_guide_tabs" USING btree ("video_id");
  CREATE INDEX "_web_categories_v_version_brewing_guide_tabs_parameters_order_idx" ON "_web_categories_v_version_brewing_guide_tabs_parameters" USING btree ("_order");
  CREATE INDEX "_web_categories_v_version_brewing_guide_tabs_parameters_parent_id_idx" ON "_web_categories_v_version_brewing_guide_tabs_parameters" USING btree ("_parent_id");
  CREATE INDEX "_web_categories_v_version_brewing_guide_tabs_order_idx" ON "_web_categories_v_version_brewing_guide_tabs" USING btree ("_order");
  CREATE INDEX "_web_categories_v_version_brewing_guide_tabs_parent_id_idx" ON "_web_categories_v_version_brewing_guide_tabs" USING btree ("_parent_id");
  CREATE INDEX "_web_categories_v_version_brewing_guide_tabs_video_idx" ON "_web_categories_v_version_brewing_guide_tabs" USING btree ("video_id");
  CREATE INDEX "_web_categories_v_parent_idx" ON "_web_categories_v" USING btree ("parent_id");
  CREATE INDEX "_web_categories_v_version_version_image_idx" ON "_web_categories_v" USING btree ("version_image_id");
  CREATE INDEX "_web_categories_v_version_version_slug_idx" ON "_web_categories_v" USING btree ("version_slug");
  CREATE INDEX "_web_categories_v_version_version_updated_at_idx" ON "_web_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_web_categories_v_version_version_created_at_idx" ON "_web_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_web_categories_v_version_version__status_idx" ON "_web_categories_v" USING btree ("version__status");
  CREATE INDEX "_web_categories_v_created_at_idx" ON "_web_categories_v" USING btree ("created_at");
  CREATE INDEX "_web_categories_v_updated_at_idx" ON "_web_categories_v" USING btree ("updated_at");
  CREATE INDEX "_web_categories_v_latest_idx" ON "_web_categories_v" USING btree ("latest");
  CREATE INDEX "_web_categories_v_autosave_idx" ON "_web_categories_v" USING btree ("autosave");
  CREATE INDEX "_web_sub_categories_v_version_level1_level2_level3_order_idx" ON "_web_sub_categories_v_version_level1_level2_level3" USING btree ("_order");
  CREATE INDEX "_web_sub_categories_v_version_level1_level2_level3_parent_id_idx" ON "_web_sub_categories_v_version_level1_level2_level3" USING btree ("_parent_id");
  CREATE INDEX "_web_sub_categories_v_version_level1_level2_order_idx" ON "_web_sub_categories_v_version_level1_level2" USING btree ("_order");
  CREATE INDEX "_web_sub_categories_v_version_level1_level2_parent_id_idx" ON "_web_sub_categories_v_version_level1_level2" USING btree ("_parent_id");
  CREATE INDEX "_web_sub_categories_v_version_level1_order_idx" ON "_web_sub_categories_v_version_level1" USING btree ("_order");
  CREATE INDEX "_web_sub_categories_v_version_level1_parent_id_idx" ON "_web_sub_categories_v_version_level1" USING btree ("_parent_id");
  CREATE INDEX "_web_sub_categories_v_parent_idx" ON "_web_sub_categories_v" USING btree ("parent_id");
  CREATE INDEX "_web_sub_categories_v_version_version_parent_category_idx" ON "_web_sub_categories_v" USING btree ("version_parent_category_id");
  CREATE INDEX "_web_sub_categories_v_version_version_updated_at_idx" ON "_web_sub_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_web_sub_categories_v_version_version_created_at_idx" ON "_web_sub_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_web_sub_categories_v_version_version__status_idx" ON "_web_sub_categories_v" USING btree ("version__status");
  CREATE INDEX "_web_sub_categories_v_created_at_idx" ON "_web_sub_categories_v" USING btree ("created_at");
  CREATE INDEX "_web_sub_categories_v_updated_at_idx" ON "_web_sub_categories_v" USING btree ("updated_at");
  CREATE INDEX "_web_sub_categories_v_latest_idx" ON "_web_sub_categories_v" USING btree ("latest");
  CREATE INDEX "_web_sub_categories_v_autosave_idx" ON "_web_sub_categories_v" USING btree ("autosave");
  CREATE INDEX "_slots_v_parent_idx" ON "_slots_v" USING btree ("parent_id");
  CREATE INDEX "_slots_v_version_version_shop_idx" ON "_slots_v" USING btree ("version_shop_id");
  CREATE INDEX "_slots_v_version_version_shop_manager_idx" ON "_slots_v" USING btree ("version_shop_manager_id");
  CREATE INDEX "_slots_v_version_version_updated_at_idx" ON "_slots_v" USING btree ("version_updated_at");
  CREATE INDEX "_slots_v_version_version_created_at_idx" ON "_slots_v" USING btree ("version_created_at");
  CREATE INDEX "_slots_v_version_version__status_idx" ON "_slots_v" USING btree ("version__status");
  CREATE INDEX "_slots_v_created_at_idx" ON "_slots_v" USING btree ("created_at");
  CREATE INDEX "_slots_v_updated_at_idx" ON "_slots_v" USING btree ("updated_at");
  CREATE INDEX "_slots_v_latest_idx" ON "_slots_v" USING btree ("latest");
  CREATE INDEX "_slots_v_autosave_idx" ON "_slots_v" USING btree ("autosave");
  CREATE INDEX "_surge_coins_v_version_version__status_idx" ON "_surge_coins_v" USING btree ("version__status");
  CREATE INDEX "_surge_coins_v_created_at_idx" ON "_surge_coins_v" USING btree ("created_at");
  CREATE INDEX "_surge_coins_v_updated_at_idx" ON "_surge_coins_v" USING btree ("updated_at");
  CREATE INDEX "_surge_coins_v_latest_idx" ON "_surge_coins_v" USING btree ("latest");
  CREATE INDEX "_surge_coins_v_autosave_idx" ON "_surge_coins_v" USING btree ("autosave");
  CREATE INDEX "_ship_and_tax_v_version_version__status_idx" ON "_ship_and_tax_v" USING btree ("version__status");
  CREATE INDEX "_ship_and_tax_v_created_at_idx" ON "_ship_and_tax_v" USING btree ("created_at");
  CREATE INDEX "_ship_and_tax_v_updated_at_idx" ON "_ship_and_tax_v" USING btree ("updated_at");
  CREATE INDEX "_ship_and_tax_v_latest_idx" ON "_ship_and_tax_v" USING btree ("latest");
  CREATE INDEX "_ship_and_tax_v_autosave_idx" ON "_ship_and_tax_v" USING btree ("autosave");
  DO $$ BEGIN ALTER TABLE "app_categories" ADD CONSTRAINT "app_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "web_categories" ADD CONSTRAINT "web_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "app_categories_image_idx" ON "app_categories" USING btree ("image_id");
  CREATE INDEX "app_categories__status_idx" ON "app_categories" USING btree ("_status");
  CREATE INDEX "app_sub_categories__status_idx" ON "app_sub_categories" USING btree ("_status");
  CREATE INDEX "menu__status_idx" ON "menu" USING btree ("_status");
  CREATE INDEX "shop__status_idx" ON "shop" USING btree ("_status");
  CREATE INDEX "shop_menu__status_idx" ON "shop_menu" USING btree ("_status");
  CREATE INDEX "_surge_shop_coupon_v_autosave_idx" ON "_surge_shop_coupon_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "web_categories_image_idx" ON "web_categories" USING btree ("image_id");
  CREATE INDEX "web_categories__status_idx" ON "web_categories" USING btree ("_status");
  CREATE INDEX "web_sub_categories__status_idx" ON "web_sub_categories" USING btree ("_status");
  CREATE INDEX "slots__status_idx" ON "slots" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_blogs_v_autosave_idx" ON "_blogs_v" USING btree ("autosave");
  CREATE INDEX "surge_coins__status_idx" ON "surge_coins" USING btree ("_status");
  CREATE INDEX "ship_and_tax__status_idx" ON "ship_and_tax" USING btree ("_status");
  ALTER TABLE "media" DROP COLUMN IF EXISTS "cloudinary_public_id";
  ALTER TABLE "web_products" DROP COLUMN IF EXISTS "updated_by_id";
  ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_updated_by_id";
  DO $$ BEGIN DROP TYPE "public"."enum_shop_menu_customizations_sections_selection_type"; EXCEPTION WHEN undefined_object THEN NULL; WHEN dependent_objects_still_exist THEN NULL; END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_shop_menu_customizations_sections_selection_type" AS ENUM('single', 'multiple');
  ALTER TABLE "_app_categories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_app_sub_categories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_version_customizations_sections_groups_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_version_customizations_sections_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_version_customizations_sections_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_version_customizations_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_version_customizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v_version_customizations_sections_groups_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v_version_customizations_sections_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v_version_customizations_sections_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v_version_customizations_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v_version_customizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_shop_menu_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web_categories_brewing_guide_tabs_parameters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web_categories_brewing_guide_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_categories_v_version_brewing_guide_tabs_parameters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_categories_v_version_brewing_guide_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_categories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_sub_categories_v_version_level1_level2_level3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_sub_categories_v_version_level1_level2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_sub_categories_v_version_level1" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_web_sub_categories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_slots_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_surge_coins_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ship_and_tax_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_app_categories_v" CASCADE;
  DROP TABLE "_app_sub_categories_v" CASCADE;
  DROP TABLE "_menu_v_version_customizations_sections_groups_options" CASCADE;
  DROP TABLE "_menu_v_version_customizations_sections_groups" CASCADE;
  DROP TABLE "_menu_v_version_customizations_sections_options" CASCADE;
  DROP TABLE "_menu_v_version_customizations_sections" CASCADE;
  DROP TABLE "_menu_v_version_customizations" CASCADE;
  DROP TABLE "_menu_v" CASCADE;
  DROP TABLE "_menu_v_rels" CASCADE;
  DROP TABLE "_shop_v" CASCADE;
  DROP TABLE "_shop_menu_v_version_customizations_sections_groups_options" CASCADE;
  DROP TABLE "_shop_menu_v_version_customizations_sections_groups" CASCADE;
  DROP TABLE "_shop_menu_v_version_customizations_sections_options" CASCADE;
  DROP TABLE "_shop_menu_v_version_customizations_sections" CASCADE;
  DROP TABLE "_shop_menu_v_version_customizations" CASCADE;
  DROP TABLE "_shop_menu_v" CASCADE;
  DROP TABLE "_shop_menu_v_rels" CASCADE;
  DROP TABLE "web_categories_brewing_guide_tabs_parameters" CASCADE;
  DROP TABLE "web_categories_brewing_guide_tabs" CASCADE;
  DROP TABLE "_web_categories_v_version_brewing_guide_tabs_parameters" CASCADE;
  DROP TABLE "_web_categories_v_version_brewing_guide_tabs" CASCADE;
  DROP TABLE "_web_categories_v" CASCADE;
  DROP TABLE "_web_sub_categories_v_version_level1_level2_level3" CASCADE;
  DROP TABLE "_web_sub_categories_v_version_level1_level2" CASCADE;
  DROP TABLE "_web_sub_categories_v_version_level1" CASCADE;
  DROP TABLE "_web_sub_categories_v" CASCADE;
  DROP TABLE "_slots_v" CASCADE;
  DROP TABLE "_surge_coins_v" CASCADE;
  DROP TABLE "_ship_and_tax_v" CASCADE;
DO $$ BEGIN   ALTER TABLE "app_categories" DROP CONSTRAINT "app_categories_image_id_media_id_fk"; EXCEPTION WHEN undefined_object THEN NULL; END $$;
  
DO $$ BEGIN   ALTER TABLE "web_categories" DROP CONSTRAINT "web_categories_image_id_media_id_fk"; EXCEPTION WHEN undefined_object THEN NULL; END $$;
  
  DROP INDEX IF EXISTS "app_categories_image_idx";
  DROP INDEX IF EXISTS "app_categories__status_idx";
  DROP INDEX IF EXISTS "app_sub_categories__status_idx";
  DROP INDEX IF EXISTS "menu__status_idx";
  DROP INDEX IF EXISTS "shop__status_idx";
  DROP INDEX IF EXISTS "shop_menu__status_idx";
  DROP INDEX IF EXISTS "_surge_shop_coupon_v_autosave_idx";
  DROP INDEX IF EXISTS "web_categories_image_idx";
  DROP INDEX IF EXISTS "web_categories__status_idx";
  DROP INDEX IF EXISTS "web_sub_categories__status_idx";
  DROP INDEX IF EXISTS "slots__status_idx";
  DROP INDEX IF EXISTS "_blogs_v_autosave_idx";
  DROP INDEX IF EXISTS "surge_coins__status_idx";
  DROP INDEX IF EXISTS "ship_and_tax__status_idx";
  ALTER TABLE "app_categories" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "app_categories" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "app_sub_categories" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "app_sub_categories" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "menu_customizations_sections_groups_options" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "menu_customizations_sections_groups" ALTER COLUMN "group_title" SET NOT NULL;
  ALTER TABLE "menu_customizations_sections" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "regular_price" SET NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "dietary_type" SET NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "operational_settings_opening_time" SET NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "operational_settings_closing_time" SET NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "address_emirates" SET NOT NULL;
  ALTER TABLE "shop" ALTER COLUMN "shop_manager_id" SET NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections_groups_options" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections_groups" ALTER COLUMN "group_title" SET NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "shop_menu_customizations_sections" ALTER COLUMN "selection_type" SET DATA TYPE "public"."enum_shop_menu_customizations_sections_selection_type" USING "selection_type"::text::"public"."enum_shop_menu_customizations_sections_selection_type";
  ALTER TABLE "shop_menu" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "shop_menu" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "shop_menu" ALTER COLUMN "regular_price" SET NOT NULL;
  ALTER TABLE "web_categories" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "web_categories" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "web_sub_categories_level1" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "web_sub_categories" ALTER COLUMN "parent_category_id" SET NOT NULL;
  ALTER TABLE "slots" ALTER COLUMN "max_capacity" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "points_earn" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "points_to_aed" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "reward_expiry" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "max_points_per_order" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "min_points_per_order" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "referral_reward_for_referrer" SET NOT NULL;
  ALTER TABLE "surge_coins" ALTER COLUMN "referral_reward_for_referred" SET NOT NULL;
  ALTER TABLE "media" ADD COLUMN "cloudinary_public_id" varchar;
  ALTER TABLE "web_products" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_web_products_v" ADD COLUMN "version_updated_by_id" integer;
DO $$ BEGIN   ALTER TABLE "web_products" ADD CONSTRAINT "web_products_updated_by_id_admins_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN   ALTER TABLE "_web_products_v" ADD CONSTRAINT "_web_products_v_version_updated_by_id_admins_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX "web_products_updated_by_idx" ON "web_products" USING btree ("updated_by_id");
  CREATE INDEX "_web_products_v_version_version_updated_by_idx" ON "_web_products_v" USING btree ("version_updated_by_id");
  CREATE UNIQUE INDEX "slots_slot_idx" ON "slots" USING btree ("slot");
  ALTER TABLE "users" DROP COLUMN "contact_email";
  ALTER TABLE "app_categories" DROP COLUMN "image_id";
  ALTER TABLE "app_categories" DROP COLUMN "last_updated_by";
  ALTER TABLE "app_categories" DROP COLUMN "created_by";
  ALTER TABLE "app_categories" DROP COLUMN "_status";
  ALTER TABLE "app_sub_categories" DROP COLUMN "last_updated_by";
  ALTER TABLE "app_sub_categories" DROP COLUMN "created_by";
  ALTER TABLE "app_sub_categories" DROP COLUMN "_status";
  ALTER TABLE "menu" DROP COLUMN "last_updated_by";
  ALTER TABLE "menu" DROP COLUMN "created_by";
  ALTER TABLE "menu" DROP COLUMN "_status";
  ALTER TABLE "shop" DROP COLUMN "last_updated_by";
  ALTER TABLE "shop" DROP COLUMN "created_by";
  ALTER TABLE "shop" DROP COLUMN "_status";
  ALTER TABLE "shop_menu" DROP COLUMN "last_updated_by";
  ALTER TABLE "shop_menu" DROP COLUMN "_status";
  ALTER TABLE "surge_coupon" DROP COLUMN "last_updated_by";
  ALTER TABLE "_surge_coupon_v" DROP COLUMN "version_last_updated_by";
  ALTER TABLE "surge_shop_coupon" DROP COLUMN "last_updated_by";
  ALTER TABLE "_surge_shop_coupon_v" DROP COLUMN "version_last_updated_by";
  ALTER TABLE "_surge_shop_coupon_v" DROP COLUMN "autosave";
  ALTER TABLE "web_categories" DROP COLUMN "image_id";
  ALTER TABLE "web_categories" DROP COLUMN "last_updated_by";
  ALTER TABLE "web_categories" DROP COLUMN "created_by";
  ALTER TABLE "web_categories" DROP COLUMN "_status";
  ALTER TABLE "web_sub_categories" DROP COLUMN "last_updated_by";
  ALTER TABLE "web_sub_categories" DROP COLUMN "created_by";
  ALTER TABLE "web_sub_categories" DROP COLUMN "_status";
  ALTER TABLE "web_products" DROP COLUMN "last_updated_by";
  ALTER TABLE "web_products" DROP COLUMN "created_by";
  ALTER TABLE "_web_products_v" DROP COLUMN "version_last_updated_by";
  ALTER TABLE "_web_products_v" DROP COLUMN "version_created_by";
  ALTER TABLE "slots" DROP COLUMN "last_updated_by";
  ALTER TABLE "slots" DROP COLUMN "created_by";
  ALTER TABLE "slots" DROP COLUMN "_status";
  ALTER TABLE "app_best_seller" DROP COLUMN "last_updated_by";
  ALTER TABLE "app_best_seller" DROP COLUMN "created_by";
  ALTER TABLE "blogs" DROP COLUMN "short_description";
  ALTER TABLE "blogs" DROP COLUMN "last_updated_by";
  ALTER TABLE "blogs" DROP COLUMN "created_by";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_short_description";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_last_updated_by";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_created_by";
  ALTER TABLE "_blogs_v" DROP COLUMN "autosave";
  ALTER TABLE "surge_coins" DROP COLUMN "last_updated_by";
  ALTER TABLE "surge_coins" DROP COLUMN "_status";
  ALTER TABLE "ship_and_tax" DROP COLUMN "last_updated_by";
  ALTER TABLE "ship_and_tax" DROP COLUMN "_status";
  DROP TYPE "public"."enum_app_categories_status";
  DROP TYPE "public"."enum__app_categories_v_version_status";
  DROP TYPE "public"."enum_app_sub_categories_status";
  DROP TYPE "public"."enum__app_sub_categories_v_version_status";
  DROP TYPE "public"."enum_menu_status";
  DROP TYPE "public"."enum__menu_v_version_customizations_sections_selection_type";
  DROP TYPE "public"."enum__menu_v_version_dietary_type";
  DROP TYPE "public"."enum__menu_v_version_status";
  DROP TYPE "public"."enum_shop_status";
  DROP TYPE "public"."enum__shop_v_version_address_emirates";
  DROP TYPE "public"."enum__shop_v_version_status";
  DROP TYPE "public"."sm_sect_sel_type";
  DROP TYPE "public"."enum_shop_menu_status";
  DROP TYPE "public"."enum__shop_menu_v_version_dietary_type";
  DROP TYPE "public"."enum__shop_menu_v_version_status";
  DROP TYPE "public"."enum_web_categories_status";
  DROP TYPE "public"."enum__web_categories_v_version_status";
  DROP TYPE "public"."enum_web_sub_categories_status";
  DROP TYPE "public"."enum__web_sub_categories_v_version_status";
  DROP TYPE "public"."enum_slots_status";
  DROP TYPE "public"."enum__slots_v_version_time_selection";
  DROP TYPE "public"."enum__slots_v_version_status";
  DROP TYPE "public"."enum_surge_coins_status";
  DROP TYPE "public"."enum__surge_coins_v_version_status";
  DROP TYPE "public"."enum_ship_and_tax_status";
  DROP TYPE "public"."enum__ship_and_tax_v_version_status";`)
}

