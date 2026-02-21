import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_addresses_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
  CREATE TYPE "public"."enum_users_role" AS ENUM('customer');
  CREATE TYPE "public"."enum_users_gender" AS ENUM('male', 'female', 'other');
  CREATE TYPE "public"."enum_admins_role" AS ENUM('super-admin', 'admin', 'shop-manager', 'barista');
  CREATE TYPE "public"."enum_admins_gender" AS ENUM('male', 'female', 'other');
  CREATE TYPE "public"."enum_customization_template_sections_selection_type" AS ENUM('single', 'multiple');
  CREATE TYPE "public"."enum_menu_dietary_type" AS ENUM('veg', 'non-veg', 'vegan');
  CREATE TYPE "public"."enum_shop_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
  CREATE TYPE "public"."enum_shop_menu_dietary_type" AS ENUM('veg', 'non-veg', 'vegan');
  CREATE TYPE "public"."enum_coupon_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_coupon_applicability" AS ENUM('all', 'products');
  CREATE TYPE "public"."enum_coupon_discount_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum_shop_coupon_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_shop_coupon_applicability" AS ENUM('all', 'products');
  CREATE TYPE "public"."enum_shop_coupon_discount_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum_app_cart_origin" AS ENUM('cafe', 'store');
  CREATE TYPE "public"."enum_app_orders_order_acceptance" AS ENUM('pending', 'accepted', 'rejected');
  CREATE TYPE "public"."enum_app_orders_app_order_status" AS ENUM('pending', 'preparing', 'pickup', 'refunded', 'pickedup');
  CREATE TYPE "public"."enum_app_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');
  CREATE TYPE "public"."enum_app_orders_order_type" AS ENUM('take-away', 'dine-in');
  CREATE TYPE "public"."enum_app_orders_time_selection" AS ENUM('now', 'custom');
  CREATE TYPE "public"."enum_web_products_variants_sub_freq_interval" AS ENUM('year', 'month', 'week', 'day');
  CREATE TYPE "public"."enum_web_products_sub_freq_interval" AS ENUM('year', 'month', 'week', 'day');
  CREATE TYPE "public"."enum_web_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__web_products_v_version_variants_sub_freq_interval" AS ENUM('year', 'month', 'week', 'day');
  CREATE TYPE "public"."enum__web_products_v_version_sub_freq_interval" AS ENUM('year', 'month', 'week', 'day');
  CREATE TYPE "public"."enum__web_products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_web_orders_customer_type" AS ENUM('guest', 'user');
  CREATE TYPE "public"."enum_web_orders_delivery_option" AS ENUM('delivery', 'pickup');
  CREATE TYPE "public"."enum_web_orders_origin" AS ENUM('subscription', 'one-time');
  CREATE TYPE "public"."enum_web_orders_shipping_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
  CREATE TYPE "public"."enum_web_orders_billing_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
  CREATE TYPE "public"."enum_web_orders_payment_status" AS ENUM('pending', 'completed', 'refunded');
  CREATE TYPE "public"."enum_web_orders_delivery_status" AS ENUM('placed', 'shipped', 'delivered');
  CREATE TYPE "public"."enum_slots_time_selection" AS ENUM('now', 'custom');
  CREATE TYPE "public"."enum_web_subscription_customer_type" AS ENUM('guest', 'user');
  CREATE TYPE "public"."enum_web_subscription_delivery_option" AS ENUM('delivery', 'pickup');
  CREATE TYPE "public"."enum_web_subscription_shipping_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
  CREATE TYPE "public"."enum_web_subscription_billing_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
  CREATE TYPE "public"."enum_web_subscription_payment_status" AS ENUM('pending', 'completed', 'refunded');
  CREATE TYPE "public"."enum_web_subscription_subs_status" AS ENUM('active', 'inactive', 'cancelled');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TABLE "users_addresses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"address_first_name" varchar,
  	"address_last_name" varchar,
  	"street" varchar,
  	"apartment" varchar,
  	"city" varchar,
  	"emirates" "enum_users_addresses_emirates" NOT NULL,
  	"country" varchar DEFAULT 'United Arab Emirates',
  	"phone_number" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'customer' NOT NULL,
  	"gender" "enum_users_gender",
  	"phone" varchar,
  	"first_name" varchar,
  	"last_name" varchar,
  	"profile_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_admins_role" NOT NULL,
  	"name" varchar NOT NULL,
  	"gender" "enum_admins_gender",
  	"speciality" varchar,
  	"shop_id" integer,
  	"profile_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "app_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" jsonb,
  	"prefix" varchar DEFAULT 'uploads',
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "app_sub_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"parent_category_id" integer,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customization_template_sections_groups_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"price" numeric DEFAULT 0
  );
  
  CREATE TABLE "customization_template_sections_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group_title" varchar NOT NULL
  );
  
  CREATE TABLE "customization_template_sections_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric DEFAULT 0
  );
  
  CREATE TABLE "customization_template_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"selection_type" "enum_customization_template_sections_selection_type" NOT NULL
  );
  
  CREATE TABLE "customization_template" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"tagline" varchar,
  	"image_id" integer,
  	"description" varchar,
  	"category_id" integer NOT NULL,
  	"regular_price" numeric NOT NULL,
  	"sale_price" numeric,
  	"dietary_type" "enum_menu_dietary_type",
  	"customizations" jsonb,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"app_sub_categories_id" integer
  );
  
  CREATE TABLE "shop" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"tagline" varchar,
  	"image_id" integer,
  	"opening_time" timestamp(3) with time zone NOT NULL,
  	"closing_time" timestamp(3) with time zone NOT NULL,
  	"address_street" varchar,
  	"address_apartment" varchar,
  	"address_city" varchar,
  	"address_emirates" "enum_shop_address_emirates" NOT NULL,
  	"address_country" varchar DEFAULT 'United Arab Emirates',
  	"shop_manager_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"shop_id" integer,
  	"created_by_id" integer,
  	"tagline" varchar,
  	"image_id" integer,
  	"description" varchar,
  	"category_id" integer NOT NULL,
  	"regular_price" numeric NOT NULL,
  	"sale_price" numeric,
  	"dietary_type" "enum_shop_menu_dietary_type",
  	"stock_count" numeric,
  	"in_stock" boolean DEFAULT false,
  	"customizations" jsonb,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_menu_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_id" integer,
  	"app_sub_categories_id" integer
  );
  
  CREATE TABLE "coupon" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"created_by_id" integer,
  	"status" "enum_coupon_status" DEFAULT 'active' NOT NULL,
  	"code" varchar NOT NULL,
  	"coupon_for_website" boolean,
  	"coupon_for_app" boolean,
  	"is_publicly_visible" boolean DEFAULT true,
  	"applicability" "enum_coupon_applicability" DEFAULT 'all' NOT NULL,
  	"discount_type" "enum_coupon_discount_type" DEFAULT 'percentage' NOT NULL,
  	"discount_amount" numeric NOT NULL,
  	"expiry_date" timestamp(3) with time zone NOT NULL,
  	"minimum_amount" numeric NOT NULL,
  	"usage_limit" numeric,
  	"usage_limit_per_user" numeric DEFAULT 1 NOT NULL,
  	"usage_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupon_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"shop_menu_id" integer,
  	"web_products_id" integer
  );
  
  CREATE TABLE "shop_coupon" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"shop_id" integer,
  	"created_by_id" integer,
  	"status" "enum_shop_coupon_status" DEFAULT 'active' NOT NULL,
  	"code" varchar NOT NULL,
  	"coupon_for_website" boolean,
  	"coupon_for_app" boolean,
  	"is_publicly_visible" boolean DEFAULT true,
  	"applicability" "enum_shop_coupon_applicability" DEFAULT 'all' NOT NULL,
  	"discount_type" "enum_shop_coupon_discount_type" DEFAULT 'percentage' NOT NULL,
  	"discount_amount" numeric NOT NULL,
  	"expiry_date" timestamp(3) with time zone NOT NULL,
  	"minimum_amount" numeric NOT NULL,
  	"usage_limit" numeric,
  	"usage_limit_per_user" numeric DEFAULT 1 NOT NULL,
  	"usage_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_coupon_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"coupon_id" integer,
  	"shop_menu_id" integer,
  	"web_products_id" integer
  );
  
  CREATE TABLE "otp" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"otp" varchar NOT NULL,
  	"is_used" boolean DEFAULT false,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"request_history" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_cart_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"v_id" varchar,
  	"quantity" numeric DEFAULT 1,
  	"customizations" jsonb
  );
  
  CREATE TABLE "app_cart" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"origin" "enum_app_cart_origin" NOT NULL,
  	"shop_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_cart_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"shop_menu_id" integer,
  	"web_products_id" integer
  );
  
  CREATE TABLE "app_wishlist_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "app_wishlist" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_wishlist_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"shop_menu_id" integer,
  	"web_products_id" integer
  );
  
  CREATE TABLE "app_orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"quantity" numeric DEFAULT 1,
  	"customizations" jsonb
  );
  
  CREATE TABLE "app_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"order_acceptance" "enum_app_orders_order_acceptance" DEFAULT 'pending' NOT NULL,
  	"app_order_status" "enum_app_orders_app_order_status" DEFAULT 'pending',
  	"payment_status" "enum_app_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"shop_id" integer NOT NULL,
  	"barista_id" integer,
  	"special_instructions" varchar,
  	"order_type" "enum_app_orders_order_type" NOT NULL,
  	"time_selection" "enum_app_orders_time_selection" DEFAULT 'now',
  	"slot_id" integer,
  	"is_coupon_used" boolean,
  	"coupon_id" integer,
  	"coins_used" numeric,
  	"financials_subtotal" numeric,
  	"financials_discount_amount" numeric,
  	"financials_total" numeric,
  	"stripe_order_id" varchar,
  	"stripe_data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_orders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"shop_menu_id" integer
  );
  
  CREATE TABLE "web_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web_sub_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"parent_category_id" integer,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web_products_variants_sub_freq" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"duration" numeric,
  	"interval" "enum_web_products_variants_sub_freq_interval" DEFAULT 'month'
  );
  
  CREATE TABLE "web_products_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant_name" varchar,
  	"variant_image_id" integer,
  	"has_variant_sub" boolean DEFAULT false,
  	"subscription_discount" numeric,
  	"variant_regular_price" numeric,
  	"variant_sale_price" numeric,
  	"variant_in_stock" boolean DEFAULT false,
  	"variant_stock_quantity" numeric
  );
  
  CREATE TABLE "web_products_sub_freq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"duration" numeric,
  	"interval" "enum_web_products_sub_freq_interval" DEFAULT 'month'
  );
  
  CREATE TABLE "web_products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"tagline" varchar,
  	"has_variant_options" boolean DEFAULT false,
  	"regular_price" numeric,
  	"sale_price" numeric,
  	"in_stock" boolean DEFAULT false,
  	"stock_quantity" numeric,
  	"has_simple_sub" boolean DEFAULT false,
  	"subscription_discount" numeric,
  	"product_image_id" integer,
  	"description" jsonb,
  	"farm" varchar,
  	"tasting_notes" varchar,
  	"variety" varchar,
  	"process" varchar,
  	"altitude" varchar,
  	"body" varchar,
  	"aroma" varchar,
  	"roast" varchar,
  	"finish" varchar,
  	"farm_description" jsonb,
  	"video_banner_id" integer,
  	"brew_guide_filter" boolean,
  	"brew_guide_espresso" boolean,
  	"brew_guide_milk" boolean,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_web_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web_products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"web_categories_id" integer,
  	"web_sub_categories_id" integer
  );
  
  CREATE TABLE "_web_products_v_version_variants_sub_freq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"duration" numeric,
  	"interval" "enum__web_products_v_version_variants_sub_freq_interval" DEFAULT 'month',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_web_products_v_version_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant_name" varchar,
  	"variant_image_id" integer,
  	"has_variant_sub" boolean DEFAULT false,
  	"subscription_discount" numeric,
  	"variant_regular_price" numeric,
  	"variant_sale_price" numeric,
  	"variant_in_stock" boolean DEFAULT false,
  	"variant_stock_quantity" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_web_products_v_version_sub_freq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"duration" numeric,
  	"interval" "enum__web_products_v_version_sub_freq_interval" DEFAULT 'month',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_web_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_tagline" varchar,
  	"version_has_variant_options" boolean DEFAULT false,
  	"version_regular_price" numeric,
  	"version_sale_price" numeric,
  	"version_in_stock" boolean DEFAULT false,
  	"version_stock_quantity" numeric,
  	"version_has_simple_sub" boolean DEFAULT false,
  	"version_subscription_discount" numeric,
  	"version_product_image_id" integer,
  	"version_description" jsonb,
  	"version_farm" varchar,
  	"version_tasting_notes" varchar,
  	"version_variety" varchar,
  	"version_process" varchar,
  	"version_altitude" varchar,
  	"version_body" varchar,
  	"version_aroma" varchar,
  	"version_roast" varchar,
  	"version_finish" varchar,
  	"version_farm_description" jsonb,
  	"version_video_banner_id" integer,
  	"version_brew_guide_filter" boolean,
  	"version_brew_guide_espresso" boolean,
  	"version_brew_guide_milk" boolean,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__web_products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_web_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"web_categories_id" integer,
  	"web_sub_categories_id" integer
  );
  
  CREATE TABLE "web_cart_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"v_id" varchar,
  	"quantity" numeric DEFAULT 1
  );
  
  CREATE TABLE "web_cart" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_wt_coins_coin_earning_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" numeric NOT NULL,
  	"earned_at" timestamp(3) with time zone,
  	"expiry_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "user_wt_coins_points_redemption_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"redeemed_points" numeric NOT NULL
  );
  
  CREATE TABLE "user_wt_coins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"total_balance" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_wt_coins_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"web_orders_id" integer,
  	"app_orders_id" integer
  );
  
  CREATE TABLE "web_orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"variant_i_d" varchar NOT NULL,
  	"quantity" numeric NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "web_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_type" "enum_web_orders_customer_type" DEFAULT 'guest',
  	"user_id" integer,
  	"delivery_option" "enum_web_orders_delivery_option" NOT NULL,
  	"stripe_order_id" varchar,
  	"origin" "enum_web_orders_origin" NOT NULL,
  	"news_and_offers" boolean DEFAULT false,
  	"shipping_address_address_first_name" varchar,
  	"shipping_address_address_last_name" varchar,
  	"shipping_address_address_line1" varchar,
  	"shipping_address_address_line2" varchar,
  	"shipping_address_city" varchar,
  	"shipping_address_emirates" "enum_web_orders_shipping_address_emirates",
  	"shipping_address_phone_number" varchar,
  	"billing_address_address_first_name" varchar,
  	"billing_address_address_last_name" varchar,
  	"billing_address_address_line1" varchar,
  	"billing_address_address_line2" varchar,
  	"billing_address_city" varchar,
  	"billing_address_emirates" "enum_web_orders_billing_address_emirates",
  	"billing_address_phone_number" varchar,
  	"payment_status" "enum_web_orders_payment_status" NOT NULL,
  	"delivery_status" "enum_web_orders_delivery_status" DEFAULT 'placed',
  	"coupon_code_id" integer,
  	"points_used" numeric,
  	"financials_subtotal" numeric NOT NULL,
  	"financials_discount_amount" numeric,
  	"financials_total" numeric NOT NULL,
  	"wt_coins_awarded" boolean DEFAULT false,
  	"stripe_data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "slots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"time_selection" "enum_slots_time_selection" DEFAULT 'now',
  	"slot" timestamp(3) with time zone,
  	"max_capacity" numeric DEFAULT 20 NOT NULL,
  	"current_load" numeric DEFAULT 0,
  	"shop_id" integer,
  	"shop_manager_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web_subscription_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"variant_i_d" varchar NOT NULL,
  	"sub_freq_i_d" varchar NOT NULL,
  	"quantity" numeric NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "web_subscription" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_type" "enum_web_subscription_customer_type" DEFAULT 'guest',
  	"user_id" integer,
  	"delivery_option" "enum_web_subscription_delivery_option" NOT NULL,
  	"stripe_subscription_i_d" varchar,
  	"next_payment_date" timestamp(3) with time zone,
  	"news_and_offers" boolean DEFAULT false,
  	"shipping_address_address_first_name" varchar,
  	"shipping_address_address_last_name" varchar,
  	"shipping_address_address_line1" varchar,
  	"shipping_address_address_line2" varchar,
  	"shipping_address_city" varchar,
  	"shipping_address_emirates" "enum_web_subscription_shipping_address_emirates",
  	"shipping_address_phone_number" varchar,
  	"billing_address_address_first_name" varchar,
  	"billing_address_address_last_name" varchar,
  	"billing_address_address_line1" varchar,
  	"billing_address_city" varchar,
  	"billing_address_emirates" "enum_web_subscription_billing_address_emirates",
  	"billing_address_phone_number" varchar,
  	"payment_status" "enum_web_subscription_payment_status" NOT NULL,
  	"subs_status" "enum_web_subscription_subs_status" DEFAULT 'active',
  	"points_used" numeric,
  	"financials_subtotal" numeric NOT NULL,
  	"financials_discount_amount" numeric,
  	"financials_wt_discount" numeric,
  	"financials_total" numeric NOT NULL,
  	"stripe_data" jsonb,
  	"guest_access_token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web_wishlist_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL
  );
  
  CREATE TABLE "web_wishlist" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "wt_stamps_stamp_earning_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stamps" numeric NOT NULL,
  	"earned_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "wt_stamps_stamps_redemption_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"redeemed_stamps" numeric NOT NULL
  );
  
  CREATE TABLE "wt_stamps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"stamp_count" numeric DEFAULT 0 NOT NULL,
  	"stamp_reward" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "wt_stamps_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"web_orders_id" integer,
  	"app_orders_id" integer
  );
  
  CREATE TABLE "user_preferences_cafe_product_preferences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" varchar NOT NULL,
  	"customizations" jsonb,
  	"saved_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "user_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv',
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "import_export_plugin_imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"collection_slug" varchar NOT NULL,
  	"json_data" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"app_categories_id" integer,
  	"media_id" integer,
  	"app_sub_categories_id" integer,
  	"customization_template_id" integer,
  	"menu_id" integer,
  	"shop_id" integer,
  	"shop_menu_id" integer,
  	"coupon_id" integer,
  	"shop_coupon_id" integer,
  	"otp_id" integer,
  	"app_cart_id" integer,
  	"app_wishlist_id" integer,
  	"app_orders_id" integer,
  	"web_categories_id" integer,
  	"web_sub_categories_id" integer,
  	"web_products_id" integer,
  	"web_cart_id" integer,
  	"user_wt_coins_id" integer,
  	"web_orders_id" integer,
  	"slots_id" integer,
  	"web_subscription_id" integer,
  	"web_wishlist_id" integer,
  	"wt_stamps_id" integer,
  	"user_preferences_id" integer,
  	"exports_id" integer,
  	"import_export_plugin_imports_id" integer,
  	"payload_folders_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"admins_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "wt_coins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"points_earn" numeric NOT NULL,
  	"points_to_aed" numeric NOT NULL,
  	"reward_expiry" numeric DEFAULT 12 NOT NULL,
  	"max_points_per_order" numeric DEFAULT 0 NOT NULL,
  	"min_points_per_order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ship_and_tax" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tax" numeric,
  	"emirate_charges_abu_dhabi" numeric,
  	"emirate_charges_dubai" numeric,
  	"emirate_charges_sharjah" numeric,
  	"emirate_charges_ajman" numeric,
  	"emirate_charges_umm_al_quwain" numeric,
  	"emirate_charges_ras_al_khaimah" numeric,
  	"emirate_charges_fujairah" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "stamp_reward_products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "stamp_reward_products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"shop_menu_id" integer
  );
  
  ALTER TABLE "users_addresses" ADD CONSTRAINT "users_addresses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_profile_image_id_media_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins" ADD CONSTRAINT "admins_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "admins" ADD CONSTRAINT "admins_profile_image_id_media_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_sub_categories" ADD CONSTRAINT "app_sub_categories_parent_category_id_app_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "customization_template_sections_groups_options" ADD CONSTRAINT "customization_template_sections_groups_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customization_template_sections_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customization_template_sections_groups" ADD CONSTRAINT "customization_template_sections_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customization_template_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customization_template_sections_options" ADD CONSTRAINT "customization_template_sections_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customization_template_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customization_template_sections" ADD CONSTRAINT "customization_template_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customization_template"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu" ADD CONSTRAINT "menu_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu" ADD CONSTRAINT "menu_category_id_app_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_rels" ADD CONSTRAINT "menu_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_rels" ADD CONSTRAINT "menu_rels_app_sub_categories_fk" FOREIGN KEY ("app_sub_categories_id") REFERENCES "public"."app_sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop" ADD CONSTRAINT "shop_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop" ADD CONSTRAINT "shop_shop_manager_id_admins_id_fk" FOREIGN KEY ("shop_manager_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_menu" ADD CONSTRAINT "shop_menu_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_menu" ADD CONSTRAINT "shop_menu_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_menu" ADD CONSTRAINT "shop_menu_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_menu" ADD CONSTRAINT "shop_menu_category_id_app_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."app_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_menu_rels" ADD CONSTRAINT "shop_menu_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_menu_rels" ADD CONSTRAINT "shop_menu_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_menu_rels" ADD CONSTRAINT "shop_menu_rels_app_sub_categories_fk" FOREIGN KEY ("app_sub_categories_id") REFERENCES "public"."app_sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupon" ADD CONSTRAINT "coupon_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "coupon_rels" ADD CONSTRAINT "coupon_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupon_rels" ADD CONSTRAINT "coupon_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupon_rels" ADD CONSTRAINT "coupon_rels_web_products_fk" FOREIGN KEY ("web_products_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_coupon" ADD CONSTRAINT "shop_coupon_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_coupon" ADD CONSTRAINT "shop_coupon_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_coupon_rels" ADD CONSTRAINT "shop_coupon_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_coupon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_coupon_rels" ADD CONSTRAINT "shop_coupon_rels_coupon_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_coupon_rels" ADD CONSTRAINT "shop_coupon_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_coupon_rels" ADD CONSTRAINT "shop_coupon_rels_web_products_fk" FOREIGN KEY ("web_products_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_cart_items" ADD CONSTRAINT "app_cart_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_cart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_cart" ADD CONSTRAINT "app_cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_cart" ADD CONSTRAINT "app_cart_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_cart_rels" ADD CONSTRAINT "app_cart_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."app_cart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_cart_rels" ADD CONSTRAINT "app_cart_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_cart_rels" ADD CONSTRAINT "app_cart_rels_web_products_fk" FOREIGN KEY ("web_products_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_wishlist_items" ADD CONSTRAINT "app_wishlist_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_wishlist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_wishlist" ADD CONSTRAINT "app_wishlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_wishlist_rels" ADD CONSTRAINT "app_wishlist_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."app_wishlist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_wishlist_rels" ADD CONSTRAINT "app_wishlist_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_wishlist_rels" ADD CONSTRAINT "app_wishlist_rels_web_products_fk" FOREIGN KEY ("web_products_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_orders_items" ADD CONSTRAINT "app_orders_items_product_id_shop_menu_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."shop_menu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_orders_items" ADD CONSTRAINT "app_orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_barista_id_admins_id_fk" FOREIGN KEY ("barista_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_coupon_id_shop_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."shop_coupon"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_orders_rels" ADD CONSTRAINT "app_orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."app_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_orders_rels" ADD CONSTRAINT "app_orders_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_sub_categories" ADD CONSTRAINT "web_sub_categories_parent_category_id_web_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."web_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products_variants_sub_freq" ADD CONSTRAINT "web_products_variants_sub_freq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_products_variants" ADD CONSTRAINT "web_products_variants_variant_image_id_media_id_fk" FOREIGN KEY ("variant_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products_variants" ADD CONSTRAINT "web_products_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_products_sub_freq" ADD CONSTRAINT "web_products_sub_freq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_products" ADD CONSTRAINT "web_products_product_image_id_media_id_fk" FOREIGN KEY ("product_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products" ADD CONSTRAINT "web_products_video_banner_id_media_id_fk" FOREIGN KEY ("video_banner_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products" ADD CONSTRAINT "web_products_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products_rels" ADD CONSTRAINT "web_products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_products_rels" ADD CONSTRAINT "web_products_rels_web_categories_fk" FOREIGN KEY ("web_categories_id") REFERENCES "public"."web_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_products_rels" ADD CONSTRAINT "web_products_rels_web_sub_categories_fk" FOREIGN KEY ("web_sub_categories_id") REFERENCES "public"."web_sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_variants_sub_freq" ADD CONSTRAINT "_web_products_v_version_variants_sub_freq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v_version_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_variants" ADD CONSTRAINT "_web_products_v_version_variants_variant_image_id_media_id_fk" FOREIGN KEY ("variant_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_variants" ADD CONSTRAINT "_web_products_v_version_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_sub_freq" ADD CONSTRAINT "_web_products_v_version_sub_freq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v" ADD CONSTRAINT "_web_products_v_parent_id_web_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."web_products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v" ADD CONSTRAINT "_web_products_v_version_product_image_id_media_id_fk" FOREIGN KEY ("version_product_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v" ADD CONSTRAINT "_web_products_v_version_video_banner_id_media_id_fk" FOREIGN KEY ("version_video_banner_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v" ADD CONSTRAINT "_web_products_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v_rels" ADD CONSTRAINT "_web_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_web_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_rels" ADD CONSTRAINT "_web_products_v_rels_web_categories_fk" FOREIGN KEY ("web_categories_id") REFERENCES "public"."web_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_rels" ADD CONSTRAINT "_web_products_v_rels_web_sub_categories_fk" FOREIGN KEY ("web_sub_categories_id") REFERENCES "public"."web_sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_cart_items" ADD CONSTRAINT "web_cart_items_product_id_web_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."web_products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_cart_items" ADD CONSTRAINT "web_cart_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_cart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_cart" ADD CONSTRAINT "web_cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_wt_coins_coin_earning_history" ADD CONSTRAINT "user_wt_coins_coin_earning_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."user_wt_coins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_wt_coins_points_redemption_history" ADD CONSTRAINT "user_wt_coins_points_redemption_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."user_wt_coins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_wt_coins" ADD CONSTRAINT "user_wt_coins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_wt_coins_rels" ADD CONSTRAINT "user_wt_coins_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_wt_coins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_wt_coins_rels" ADD CONSTRAINT "user_wt_coins_rels_web_orders_fk" FOREIGN KEY ("web_orders_id") REFERENCES "public"."web_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_wt_coins_rels" ADD CONSTRAINT "user_wt_coins_rels_app_orders_fk" FOREIGN KEY ("app_orders_id") REFERENCES "public"."app_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_orders_items" ADD CONSTRAINT "web_orders_items_product_id_web_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."web_products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_orders_items" ADD CONSTRAINT "web_orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_orders" ADD CONSTRAINT "web_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_orders" ADD CONSTRAINT "web_orders_coupon_code_id_coupon_id_fk" FOREIGN KEY ("coupon_code_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slots" ADD CONSTRAINT "slots_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slots" ADD CONSTRAINT "slots_shop_manager_id_admins_id_fk" FOREIGN KEY ("shop_manager_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_subscription_items" ADD CONSTRAINT "web_subscription_items_product_id_web_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."web_products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_subscription_items" ADD CONSTRAINT "web_subscription_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_subscription"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_subscription" ADD CONSTRAINT "web_subscription_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_wishlist_items" ADD CONSTRAINT "web_wishlist_items_product_id_web_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."web_products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_wishlist_items" ADD CONSTRAINT "web_wishlist_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_wishlist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_wishlist" ADD CONSTRAINT "web_wishlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wt_stamps_stamp_earning_history" ADD CONSTRAINT "wt_stamps_stamp_earning_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wt_stamps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wt_stamps_stamps_redemption_history" ADD CONSTRAINT "wt_stamps_stamps_redemption_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wt_stamps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wt_stamps" ADD CONSTRAINT "wt_stamps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wt_stamps_rels" ADD CONSTRAINT "wt_stamps_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wt_stamps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wt_stamps_rels" ADD CONSTRAINT "wt_stamps_rels_web_orders_fk" FOREIGN KEY ("web_orders_id") REFERENCES "public"."web_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wt_stamps_rels" ADD CONSTRAINT "wt_stamps_rels_app_orders_fk" FOREIGN KEY ("app_orders_id") REFERENCES "public"."app_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_preferences_cafe_product_preferences" ADD CONSTRAINT "user_preferences_cafe_product_preferences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."user_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_app_categories_fk" FOREIGN KEY ("app_categories_id") REFERENCES "public"."app_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_app_sub_categories_fk" FOREIGN KEY ("app_sub_categories_id") REFERENCES "public"."app_sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customization_template_fk" FOREIGN KEY ("customization_template_id") REFERENCES "public"."customization_template"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shop_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupon_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shop_coupon_fk" FOREIGN KEY ("shop_coupon_id") REFERENCES "public"."shop_coupon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_fk" FOREIGN KEY ("otp_id") REFERENCES "public"."otp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_app_cart_fk" FOREIGN KEY ("app_cart_id") REFERENCES "public"."app_cart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_app_wishlist_fk" FOREIGN KEY ("app_wishlist_id") REFERENCES "public"."app_wishlist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_app_orders_fk" FOREIGN KEY ("app_orders_id") REFERENCES "public"."app_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_categories_fk" FOREIGN KEY ("web_categories_id") REFERENCES "public"."web_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_sub_categories_fk" FOREIGN KEY ("web_sub_categories_id") REFERENCES "public"."web_sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_products_fk" FOREIGN KEY ("web_products_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_cart_fk" FOREIGN KEY ("web_cart_id") REFERENCES "public"."web_cart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_wt_coins_fk" FOREIGN KEY ("user_wt_coins_id") REFERENCES "public"."user_wt_coins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_orders_fk" FOREIGN KEY ("web_orders_id") REFERENCES "public"."web_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_slots_fk" FOREIGN KEY ("slots_id") REFERENCES "public"."slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_subscription_fk" FOREIGN KEY ("web_subscription_id") REFERENCES "public"."web_subscription"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_wishlist_fk" FOREIGN KEY ("web_wishlist_id") REFERENCES "public"."web_wishlist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wt_stamps_fk" FOREIGN KEY ("wt_stamps_id") REFERENCES "public"."wt_stamps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_preferences_fk" FOREIGN KEY ("user_preferences_id") REFERENCES "public"."user_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exports_fk" FOREIGN KEY ("exports_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_export_plugin_import_fk" FOREIGN KEY ("import_export_plugin_imports_id") REFERENCES "public"."import_export_plugin_imports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stamp_reward_products_rels" ADD CONSTRAINT "stamp_reward_products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stamp_reward_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stamp_reward_products_rels" ADD CONSTRAINT "stamp_reward_products_rels_shop_menu_fk" FOREIGN KEY ("shop_menu_id") REFERENCES "public"."shop_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_addresses_order_idx" ON "users_addresses" USING btree ("_order");
  CREATE INDEX "users_addresses_parent_id_idx" ON "users_addresses" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_profile_image_idx" ON "users" USING btree ("profile_image_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "admins_sessions_order_idx" ON "admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_shop_idx" ON "admins" USING btree ("shop_id");
  CREATE INDEX "admins_profile_image_idx" ON "admins" USING btree ("profile_image_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");
  CREATE UNIQUE INDEX "app_categories_slug_idx" ON "app_categories" USING btree ("slug");
  CREATE INDEX "app_categories_updated_at_idx" ON "app_categories" USING btree ("updated_at");
  CREATE INDEX "app_categories_created_at_idx" ON "app_categories" USING btree ("created_at");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "app_sub_categories_parent_category_idx" ON "app_sub_categories" USING btree ("parent_category_id");
  CREATE UNIQUE INDEX "app_sub_categories_slug_idx" ON "app_sub_categories" USING btree ("slug");
  CREATE INDEX "app_sub_categories_updated_at_idx" ON "app_sub_categories" USING btree ("updated_at");
  CREATE INDEX "app_sub_categories_created_at_idx" ON "app_sub_categories" USING btree ("created_at");
  CREATE INDEX "customization_template_sections_groups_options_order_idx" ON "customization_template_sections_groups_options" USING btree ("_order");
  CREATE INDEX "customization_template_sections_groups_options_parent_id_idx" ON "customization_template_sections_groups_options" USING btree ("_parent_id");
  CREATE INDEX "customization_template_sections_groups_order_idx" ON "customization_template_sections_groups" USING btree ("_order");
  CREATE INDEX "customization_template_sections_groups_parent_id_idx" ON "customization_template_sections_groups" USING btree ("_parent_id");
  CREATE INDEX "customization_template_sections_options_order_idx" ON "customization_template_sections_options" USING btree ("_order");
  CREATE INDEX "customization_template_sections_options_parent_id_idx" ON "customization_template_sections_options" USING btree ("_parent_id");
  CREATE INDEX "customization_template_sections_order_idx" ON "customization_template_sections" USING btree ("_order");
  CREATE INDEX "customization_template_sections_parent_id_idx" ON "customization_template_sections" USING btree ("_parent_id");
  CREATE INDEX "customization_template_updated_at_idx" ON "customization_template" USING btree ("updated_at");
  CREATE INDEX "customization_template_created_at_idx" ON "customization_template" USING btree ("created_at");
  CREATE INDEX "menu_image_idx" ON "menu" USING btree ("image_id");
  CREATE INDEX "menu_category_idx" ON "menu" USING btree ("category_id");
  CREATE UNIQUE INDEX "menu_slug_idx" ON "menu" USING btree ("slug");
  CREATE INDEX "menu_updated_at_idx" ON "menu" USING btree ("updated_at");
  CREATE INDEX "menu_created_at_idx" ON "menu" USING btree ("created_at");
  CREATE INDEX "menu_rels_order_idx" ON "menu_rels" USING btree ("order");
  CREATE INDEX "menu_rels_parent_idx" ON "menu_rels" USING btree ("parent_id");
  CREATE INDEX "menu_rels_path_idx" ON "menu_rels" USING btree ("path");
  CREATE INDEX "menu_rels_app_sub_categories_id_idx" ON "menu_rels" USING btree ("app_sub_categories_id");
  CREATE INDEX "shop_image_idx" ON "shop" USING btree ("image_id");
  CREATE INDEX "shop_shop_manager_idx" ON "shop" USING btree ("shop_manager_id");
  CREATE INDEX "shop_updated_at_idx" ON "shop" USING btree ("updated_at");
  CREATE INDEX "shop_created_at_idx" ON "shop" USING btree ("created_at");
  CREATE INDEX "shop_menu_shop_idx" ON "shop_menu" USING btree ("shop_id");
  CREATE INDEX "shop_menu_created_by_idx" ON "shop_menu" USING btree ("created_by_id");
  CREATE INDEX "shop_menu_image_idx" ON "shop_menu" USING btree ("image_id");
  CREATE INDEX "shop_menu_category_idx" ON "shop_menu" USING btree ("category_id");
  CREATE UNIQUE INDEX "shop_menu_slug_idx" ON "shop_menu" USING btree ("slug");
  CREATE INDEX "shop_menu_updated_at_idx" ON "shop_menu" USING btree ("updated_at");
  CREATE INDEX "shop_menu_created_at_idx" ON "shop_menu" USING btree ("created_at");
  CREATE INDEX "shop_menu_rels_order_idx" ON "shop_menu_rels" USING btree ("order");
  CREATE INDEX "shop_menu_rels_parent_idx" ON "shop_menu_rels" USING btree ("parent_id");
  CREATE INDEX "shop_menu_rels_path_idx" ON "shop_menu_rels" USING btree ("path");
  CREATE INDEX "shop_menu_rels_menu_id_idx" ON "shop_menu_rels" USING btree ("menu_id");
  CREATE INDEX "shop_menu_rels_app_sub_categories_id_idx" ON "shop_menu_rels" USING btree ("app_sub_categories_id");
  CREATE INDEX "coupon_created_by_idx" ON "coupon" USING btree ("created_by_id");
  CREATE INDEX "coupon_updated_at_idx" ON "coupon" USING btree ("updated_at");
  CREATE INDEX "coupon_created_at_idx" ON "coupon" USING btree ("created_at");
  CREATE INDEX "coupon_rels_order_idx" ON "coupon_rels" USING btree ("order");
  CREATE INDEX "coupon_rels_parent_idx" ON "coupon_rels" USING btree ("parent_id");
  CREATE INDEX "coupon_rels_path_idx" ON "coupon_rels" USING btree ("path");
  CREATE INDEX "coupon_rels_shop_menu_id_idx" ON "coupon_rels" USING btree ("shop_menu_id");
  CREATE INDEX "coupon_rels_web_products_id_idx" ON "coupon_rels" USING btree ("web_products_id");
  CREATE INDEX "shop_coupon_shop_idx" ON "shop_coupon" USING btree ("shop_id");
  CREATE INDEX "shop_coupon_created_by_idx" ON "shop_coupon" USING btree ("created_by_id");
  CREATE INDEX "shop_coupon_updated_at_idx" ON "shop_coupon" USING btree ("updated_at");
  CREATE INDEX "shop_coupon_created_at_idx" ON "shop_coupon" USING btree ("created_at");
  CREATE INDEX "shop_coupon_rels_order_idx" ON "shop_coupon_rels" USING btree ("order");
  CREATE INDEX "shop_coupon_rels_parent_idx" ON "shop_coupon_rels" USING btree ("parent_id");
  CREATE INDEX "shop_coupon_rels_path_idx" ON "shop_coupon_rels" USING btree ("path");
  CREATE INDEX "shop_coupon_rels_coupon_id_idx" ON "shop_coupon_rels" USING btree ("coupon_id");
  CREATE INDEX "shop_coupon_rels_shop_menu_id_idx" ON "shop_coupon_rels" USING btree ("shop_menu_id");
  CREATE INDEX "shop_coupon_rels_web_products_id_idx" ON "shop_coupon_rels" USING btree ("web_products_id");
  CREATE INDEX "otp_email_idx" ON "otp" USING btree ("email");
  CREATE INDEX "otp_updated_at_idx" ON "otp" USING btree ("updated_at");
  CREATE INDEX "otp_created_at_idx" ON "otp" USING btree ("created_at");
  CREATE INDEX "app_cart_items_order_idx" ON "app_cart_items" USING btree ("_order");
  CREATE INDEX "app_cart_items_parent_id_idx" ON "app_cart_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "app_cart_user_idx" ON "app_cart" USING btree ("user_id");
  CREATE INDEX "app_cart_shop_idx" ON "app_cart" USING btree ("shop_id");
  CREATE INDEX "app_cart_updated_at_idx" ON "app_cart" USING btree ("updated_at");
  CREATE INDEX "app_cart_created_at_idx" ON "app_cart" USING btree ("created_at");
  CREATE INDEX "app_cart_rels_order_idx" ON "app_cart_rels" USING btree ("order");
  CREATE INDEX "app_cart_rels_parent_idx" ON "app_cart_rels" USING btree ("parent_id");
  CREATE INDEX "app_cart_rels_path_idx" ON "app_cart_rels" USING btree ("path");
  CREATE INDEX "app_cart_rels_shop_menu_id_idx" ON "app_cart_rels" USING btree ("shop_menu_id");
  CREATE INDEX "app_cart_rels_web_products_id_idx" ON "app_cart_rels" USING btree ("web_products_id");
  CREATE INDEX "app_wishlist_items_order_idx" ON "app_wishlist_items" USING btree ("_order");
  CREATE INDEX "app_wishlist_items_parent_id_idx" ON "app_wishlist_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "app_wishlist_user_idx" ON "app_wishlist" USING btree ("user_id");
  CREATE INDEX "app_wishlist_updated_at_idx" ON "app_wishlist" USING btree ("updated_at");
  CREATE INDEX "app_wishlist_created_at_idx" ON "app_wishlist" USING btree ("created_at");
  CREATE INDEX "app_wishlist_rels_order_idx" ON "app_wishlist_rels" USING btree ("order");
  CREATE INDEX "app_wishlist_rels_parent_idx" ON "app_wishlist_rels" USING btree ("parent_id");
  CREATE INDEX "app_wishlist_rels_path_idx" ON "app_wishlist_rels" USING btree ("path");
  CREATE INDEX "app_wishlist_rels_shop_menu_id_idx" ON "app_wishlist_rels" USING btree ("shop_menu_id");
  CREATE INDEX "app_wishlist_rels_web_products_id_idx" ON "app_wishlist_rels" USING btree ("web_products_id");
  CREATE INDEX "app_orders_items_order_idx" ON "app_orders_items" USING btree ("_order");
  CREATE INDEX "app_orders_items_parent_id_idx" ON "app_orders_items" USING btree ("_parent_id");
  CREATE INDEX "app_orders_items_product_idx" ON "app_orders_items" USING btree ("product_id");
  CREATE INDEX "app_orders_user_idx" ON "app_orders" USING btree ("user_id");
  CREATE INDEX "app_orders_shop_idx" ON "app_orders" USING btree ("shop_id");
  CREATE INDEX "app_orders_barista_idx" ON "app_orders" USING btree ("barista_id");
  CREATE INDEX "app_orders_slot_idx" ON "app_orders" USING btree ("slot_id");
  CREATE INDEX "app_orders_coupon_idx" ON "app_orders" USING btree ("coupon_id");
  CREATE INDEX "app_orders_updated_at_idx" ON "app_orders" USING btree ("updated_at");
  CREATE INDEX "app_orders_created_at_idx" ON "app_orders" USING btree ("created_at");
  CREATE INDEX "app_orders_rels_order_idx" ON "app_orders_rels" USING btree ("order");
  CREATE INDEX "app_orders_rels_parent_idx" ON "app_orders_rels" USING btree ("parent_id");
  CREATE INDEX "app_orders_rels_path_idx" ON "app_orders_rels" USING btree ("path");
  CREATE INDEX "app_orders_rels_shop_menu_id_idx" ON "app_orders_rels" USING btree ("shop_menu_id");
  CREATE UNIQUE INDEX "web_categories_slug_idx" ON "web_categories" USING btree ("slug");
  CREATE INDEX "web_categories_updated_at_idx" ON "web_categories" USING btree ("updated_at");
  CREATE INDEX "web_categories_created_at_idx" ON "web_categories" USING btree ("created_at");
  CREATE INDEX "web_sub_categories_parent_category_idx" ON "web_sub_categories" USING btree ("parent_category_id");
  CREATE UNIQUE INDEX "web_sub_categories_slug_idx" ON "web_sub_categories" USING btree ("slug");
  CREATE INDEX "web_sub_categories_updated_at_idx" ON "web_sub_categories" USING btree ("updated_at");
  CREATE INDEX "web_sub_categories_created_at_idx" ON "web_sub_categories" USING btree ("created_at");
  CREATE INDEX "web_products_variants_sub_freq_order_idx" ON "web_products_variants_sub_freq" USING btree ("_order");
  CREATE INDEX "web_products_variants_sub_freq_parent_id_idx" ON "web_products_variants_sub_freq" USING btree ("_parent_id");
  CREATE INDEX "web_products_variants_order_idx" ON "web_products_variants" USING btree ("_order");
  CREATE INDEX "web_products_variants_parent_id_idx" ON "web_products_variants" USING btree ("_parent_id");
  CREATE INDEX "web_products_variants_variant_image_idx" ON "web_products_variants" USING btree ("variant_image_id");
  CREATE INDEX "web_products_sub_freq_order_idx" ON "web_products_sub_freq" USING btree ("_order");
  CREATE INDEX "web_products_sub_freq_parent_id_idx" ON "web_products_sub_freq" USING btree ("_parent_id");
  CREATE INDEX "web_products_product_image_idx" ON "web_products" USING btree ("product_image_id");
  CREATE INDEX "web_products_video_banner_idx" ON "web_products" USING btree ("video_banner_id");
  CREATE INDEX "web_products_meta_meta_image_idx" ON "web_products" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "web_products_slug_idx" ON "web_products" USING btree ("slug");
  CREATE INDEX "web_products_updated_at_idx" ON "web_products" USING btree ("updated_at");
  CREATE INDEX "web_products_created_at_idx" ON "web_products" USING btree ("created_at");
  CREATE INDEX "web_products__status_idx" ON "web_products" USING btree ("_status");
  CREATE INDEX "web_products_rels_order_idx" ON "web_products_rels" USING btree ("order");
  CREATE INDEX "web_products_rels_parent_idx" ON "web_products_rels" USING btree ("parent_id");
  CREATE INDEX "web_products_rels_path_idx" ON "web_products_rels" USING btree ("path");
  CREATE INDEX "web_products_rels_web_categories_id_idx" ON "web_products_rels" USING btree ("web_categories_id");
  CREATE INDEX "web_products_rels_web_sub_categories_id_idx" ON "web_products_rels" USING btree ("web_sub_categories_id");
  CREATE INDEX "_web_products_v_version_variants_sub_freq_order_idx" ON "_web_products_v_version_variants_sub_freq" USING btree ("_order");
  CREATE INDEX "_web_products_v_version_variants_sub_freq_parent_id_idx" ON "_web_products_v_version_variants_sub_freq" USING btree ("_parent_id");
  CREATE INDEX "_web_products_v_version_variants_order_idx" ON "_web_products_v_version_variants" USING btree ("_order");
  CREATE INDEX "_web_products_v_version_variants_parent_id_idx" ON "_web_products_v_version_variants" USING btree ("_parent_id");
  CREATE INDEX "_web_products_v_version_variants_variant_image_idx" ON "_web_products_v_version_variants" USING btree ("variant_image_id");
  CREATE INDEX "_web_products_v_version_sub_freq_order_idx" ON "_web_products_v_version_sub_freq" USING btree ("_order");
  CREATE INDEX "_web_products_v_version_sub_freq_parent_id_idx" ON "_web_products_v_version_sub_freq" USING btree ("_parent_id");
  CREATE INDEX "_web_products_v_parent_idx" ON "_web_products_v" USING btree ("parent_id");
  CREATE INDEX "_web_products_v_version_version_product_image_idx" ON "_web_products_v" USING btree ("version_product_image_id");
  CREATE INDEX "_web_products_v_version_version_video_banner_idx" ON "_web_products_v" USING btree ("version_video_banner_id");
  CREATE INDEX "_web_products_v_version_meta_version_meta_image_idx" ON "_web_products_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_web_products_v_version_version_slug_idx" ON "_web_products_v" USING btree ("version_slug");
  CREATE INDEX "_web_products_v_version_version_updated_at_idx" ON "_web_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_web_products_v_version_version_created_at_idx" ON "_web_products_v" USING btree ("version_created_at");
  CREATE INDEX "_web_products_v_version_version__status_idx" ON "_web_products_v" USING btree ("version__status");
  CREATE INDEX "_web_products_v_created_at_idx" ON "_web_products_v" USING btree ("created_at");
  CREATE INDEX "_web_products_v_updated_at_idx" ON "_web_products_v" USING btree ("updated_at");
  CREATE INDEX "_web_products_v_latest_idx" ON "_web_products_v" USING btree ("latest");
  CREATE INDEX "_web_products_v_autosave_idx" ON "_web_products_v" USING btree ("autosave");
  CREATE INDEX "_web_products_v_rels_order_idx" ON "_web_products_v_rels" USING btree ("order");
  CREATE INDEX "_web_products_v_rels_parent_idx" ON "_web_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_web_products_v_rels_path_idx" ON "_web_products_v_rels" USING btree ("path");
  CREATE INDEX "_web_products_v_rels_web_categories_id_idx" ON "_web_products_v_rels" USING btree ("web_categories_id");
  CREATE INDEX "_web_products_v_rels_web_sub_categories_id_idx" ON "_web_products_v_rels" USING btree ("web_sub_categories_id");
  CREATE INDEX "web_cart_items_order_idx" ON "web_cart_items" USING btree ("_order");
  CREATE INDEX "web_cart_items_parent_id_idx" ON "web_cart_items" USING btree ("_parent_id");
  CREATE INDEX "web_cart_items_product_idx" ON "web_cart_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "web_cart_user_idx" ON "web_cart" USING btree ("user_id");
  CREATE INDEX "web_cart_updated_at_idx" ON "web_cart" USING btree ("updated_at");
  CREATE INDEX "web_cart_created_at_idx" ON "web_cart" USING btree ("created_at");
  CREATE INDEX "user_wt_coins_coin_earning_history_order_idx" ON "user_wt_coins_coin_earning_history" USING btree ("_order");
  CREATE INDEX "user_wt_coins_coin_earning_history_parent_id_idx" ON "user_wt_coins_coin_earning_history" USING btree ("_parent_id");
  CREATE INDEX "user_wt_coins_points_redemption_history_order_idx" ON "user_wt_coins_points_redemption_history" USING btree ("_order");
  CREATE INDEX "user_wt_coins_points_redemption_history_parent_id_idx" ON "user_wt_coins_points_redemption_history" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "user_wt_coins_user_idx" ON "user_wt_coins" USING btree ("user_id");
  CREATE INDEX "user_wt_coins_updated_at_idx" ON "user_wt_coins" USING btree ("updated_at");
  CREATE INDEX "user_wt_coins_created_at_idx" ON "user_wt_coins" USING btree ("created_at");
  CREATE INDEX "user_wt_coins_rels_order_idx" ON "user_wt_coins_rels" USING btree ("order");
  CREATE INDEX "user_wt_coins_rels_parent_idx" ON "user_wt_coins_rels" USING btree ("parent_id");
  CREATE INDEX "user_wt_coins_rels_path_idx" ON "user_wt_coins_rels" USING btree ("path");
  CREATE INDEX "user_wt_coins_rels_web_orders_id_idx" ON "user_wt_coins_rels" USING btree ("web_orders_id");
  CREATE INDEX "user_wt_coins_rels_app_orders_id_idx" ON "user_wt_coins_rels" USING btree ("app_orders_id");
  CREATE INDEX "web_orders_items_order_idx" ON "web_orders_items" USING btree ("_order");
  CREATE INDEX "web_orders_items_parent_id_idx" ON "web_orders_items" USING btree ("_parent_id");
  CREATE INDEX "web_orders_items_product_idx" ON "web_orders_items" USING btree ("product_id");
  CREATE INDEX "web_orders_user_idx" ON "web_orders" USING btree ("user_id");
  CREATE INDEX "web_orders_coupon_code_idx" ON "web_orders" USING btree ("coupon_code_id");
  CREATE INDEX "web_orders_updated_at_idx" ON "web_orders" USING btree ("updated_at");
  CREATE INDEX "web_orders_created_at_idx" ON "web_orders" USING btree ("created_at");
  CREATE INDEX "slots_shop_idx" ON "slots" USING btree ("shop_id");
  CREATE INDEX "slots_shop_manager_idx" ON "slots" USING btree ("shop_manager_id");
  CREATE INDEX "slots_updated_at_idx" ON "slots" USING btree ("updated_at");
  CREATE INDEX "slots_created_at_idx" ON "slots" USING btree ("created_at");
  CREATE INDEX "web_subscription_items_order_idx" ON "web_subscription_items" USING btree ("_order");
  CREATE INDEX "web_subscription_items_parent_id_idx" ON "web_subscription_items" USING btree ("_parent_id");
  CREATE INDEX "web_subscription_items_product_idx" ON "web_subscription_items" USING btree ("product_id");
  CREATE INDEX "web_subscription_user_idx" ON "web_subscription" USING btree ("user_id");
  CREATE INDEX "web_subscription_updated_at_idx" ON "web_subscription" USING btree ("updated_at");
  CREATE INDEX "web_subscription_created_at_idx" ON "web_subscription" USING btree ("created_at");
  CREATE INDEX "web_wishlist_items_order_idx" ON "web_wishlist_items" USING btree ("_order");
  CREATE INDEX "web_wishlist_items_parent_id_idx" ON "web_wishlist_items" USING btree ("_parent_id");
  CREATE INDEX "web_wishlist_items_product_idx" ON "web_wishlist_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "web_wishlist_user_idx" ON "web_wishlist" USING btree ("user_id");
  CREATE INDEX "web_wishlist_updated_at_idx" ON "web_wishlist" USING btree ("updated_at");
  CREATE INDEX "web_wishlist_created_at_idx" ON "web_wishlist" USING btree ("created_at");
  CREATE INDEX "wt_stamps_stamp_earning_history_order_idx" ON "wt_stamps_stamp_earning_history" USING btree ("_order");
  CREATE INDEX "wt_stamps_stamp_earning_history_parent_id_idx" ON "wt_stamps_stamp_earning_history" USING btree ("_parent_id");
  CREATE INDEX "wt_stamps_stamps_redemption_history_order_idx" ON "wt_stamps_stamps_redemption_history" USING btree ("_order");
  CREATE INDEX "wt_stamps_stamps_redemption_history_parent_id_idx" ON "wt_stamps_stamps_redemption_history" USING btree ("_parent_id");
  CREATE INDEX "wt_stamps_user_idx" ON "wt_stamps" USING btree ("user_id");
  CREATE INDEX "wt_stamps_updated_at_idx" ON "wt_stamps" USING btree ("updated_at");
  CREATE INDEX "wt_stamps_created_at_idx" ON "wt_stamps" USING btree ("created_at");
  CREATE INDEX "wt_stamps_rels_order_idx" ON "wt_stamps_rels" USING btree ("order");
  CREATE INDEX "wt_stamps_rels_parent_idx" ON "wt_stamps_rels" USING btree ("parent_id");
  CREATE INDEX "wt_stamps_rels_path_idx" ON "wt_stamps_rels" USING btree ("path");
  CREATE INDEX "wt_stamps_rels_web_orders_id_idx" ON "wt_stamps_rels" USING btree ("web_orders_id");
  CREATE INDEX "wt_stamps_rels_app_orders_id_idx" ON "wt_stamps_rels" USING btree ("app_orders_id");
  CREATE INDEX "user_preferences_cafe_product_preferences_order_idx" ON "user_preferences_cafe_product_preferences" USING btree ("_order");
  CREATE INDEX "user_preferences_cafe_product_preferences_parent_id_idx" ON "user_preferences_cafe_product_preferences" USING btree ("_parent_id");
  CREATE INDEX "user_preferences_cafe_product_preferences_product_id_idx" ON "user_preferences_cafe_product_preferences" USING btree ("product_id");
  CREATE UNIQUE INDEX "user_preferences_user_idx" ON "user_preferences" USING btree ("user_id");
  CREATE INDEX "user_preferences_updated_at_idx" ON "user_preferences" USING btree ("updated_at");
  CREATE INDEX "user_preferences_created_at_idx" ON "user_preferences" USING btree ("created_at");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "import_export_plugin_imports_updated_at_idx" ON "import_export_plugin_imports" USING btree ("updated_at");
  CREATE INDEX "import_export_plugin_imports_created_at_idx" ON "import_export_plugin_imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "import_export_plugin_imports_filename_idx" ON "import_export_plugin_imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_app_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("app_categories_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_app_sub_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("app_sub_categories_id");
  CREATE INDEX "payload_locked_documents_rels_customization_template_id_idx" ON "payload_locked_documents_rels" USING btree ("customization_template_id");
  CREATE INDEX "payload_locked_documents_rels_menu_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_id");
  CREATE INDEX "payload_locked_documents_rels_shop_id_idx" ON "payload_locked_documents_rels" USING btree ("shop_id");
  CREATE INDEX "payload_locked_documents_rels_shop_menu_id_idx" ON "payload_locked_documents_rels" USING btree ("shop_menu_id");
  CREATE INDEX "payload_locked_documents_rels_coupon_id_idx" ON "payload_locked_documents_rels" USING btree ("coupon_id");
  CREATE INDEX "payload_locked_documents_rels_shop_coupon_id_idx" ON "payload_locked_documents_rels" USING btree ("shop_coupon_id");
  CREATE INDEX "payload_locked_documents_rels_otp_id_idx" ON "payload_locked_documents_rels" USING btree ("otp_id");
  CREATE INDEX "payload_locked_documents_rels_app_cart_id_idx" ON "payload_locked_documents_rels" USING btree ("app_cart_id");
  CREATE INDEX "payload_locked_documents_rels_app_wishlist_id_idx" ON "payload_locked_documents_rels" USING btree ("app_wishlist_id");
  CREATE INDEX "payload_locked_documents_rels_app_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("app_orders_id");
  CREATE INDEX "payload_locked_documents_rels_web_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("web_categories_id");
  CREATE INDEX "payload_locked_documents_rels_web_sub_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("web_sub_categories_id");
  CREATE INDEX "payload_locked_documents_rels_web_products_id_idx" ON "payload_locked_documents_rels" USING btree ("web_products_id");
  CREATE INDEX "payload_locked_documents_rels_web_cart_id_idx" ON "payload_locked_documents_rels" USING btree ("web_cart_id");
  CREATE INDEX "payload_locked_documents_rels_user_wt_coins_id_idx" ON "payload_locked_documents_rels" USING btree ("user_wt_coins_id");
  CREATE INDEX "payload_locked_documents_rels_web_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("web_orders_id");
  CREATE INDEX "payload_locked_documents_rels_slots_id_idx" ON "payload_locked_documents_rels" USING btree ("slots_id");
  CREATE INDEX "payload_locked_documents_rels_web_subscription_id_idx" ON "payload_locked_documents_rels" USING btree ("web_subscription_id");
  CREATE INDEX "payload_locked_documents_rels_web_wishlist_id_idx" ON "payload_locked_documents_rels" USING btree ("web_wishlist_id");
  CREATE INDEX "payload_locked_documents_rels_wt_stamps_id_idx" ON "payload_locked_documents_rels" USING btree ("wt_stamps_id");
  CREATE INDEX "payload_locked_documents_rels_user_preferences_id_idx" ON "payload_locked_documents_rels" USING btree ("user_preferences_id");
  CREATE INDEX "payload_locked_documents_rels_exports_id_idx" ON "payload_locked_documents_rels" USING btree ("exports_id");
  CREATE INDEX "payload_locked_documents_rels_import_export_plugin_impor_idx" ON "payload_locked_documents_rels" USING btree ("import_export_plugin_imports_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "stamp_reward_products_rels_order_idx" ON "stamp_reward_products_rels" USING btree ("order");
  CREATE INDEX "stamp_reward_products_rels_parent_idx" ON "stamp_reward_products_rels" USING btree ("parent_id");
  CREATE INDEX "stamp_reward_products_rels_path_idx" ON "stamp_reward_products_rels" USING btree ("path");
  CREATE INDEX "stamp_reward_products_rels_shop_menu_id_idx" ON "stamp_reward_products_rels" USING btree ("shop_menu_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_addresses" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "admins_sessions" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "app_categories" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "app_sub_categories" CASCADE;
  DROP TABLE "customization_template_sections_groups_options" CASCADE;
  DROP TABLE "customization_template_sections_groups" CASCADE;
  DROP TABLE "customization_template_sections_options" CASCADE;
  DROP TABLE "customization_template_sections" CASCADE;
  DROP TABLE "customization_template" CASCADE;
  DROP TABLE "menu" CASCADE;
  DROP TABLE "menu_rels" CASCADE;
  DROP TABLE "shop" CASCADE;
  DROP TABLE "shop_menu" CASCADE;
  DROP TABLE "shop_menu_rels" CASCADE;
  DROP TABLE "coupon" CASCADE;
  DROP TABLE "coupon_rels" CASCADE;
  DROP TABLE "shop_coupon" CASCADE;
  DROP TABLE "shop_coupon_rels" CASCADE;
  DROP TABLE "otp" CASCADE;
  DROP TABLE "app_cart_items" CASCADE;
  DROP TABLE "app_cart" CASCADE;
  DROP TABLE "app_cart_rels" CASCADE;
  DROP TABLE "app_wishlist_items" CASCADE;
  DROP TABLE "app_wishlist" CASCADE;
  DROP TABLE "app_wishlist_rels" CASCADE;
  DROP TABLE "app_orders_items" CASCADE;
  DROP TABLE "app_orders" CASCADE;
  DROP TABLE "app_orders_rels" CASCADE;
  DROP TABLE "web_categories" CASCADE;
  DROP TABLE "web_sub_categories" CASCADE;
  DROP TABLE "web_products_variants_sub_freq" CASCADE;
  DROP TABLE "web_products_variants" CASCADE;
  DROP TABLE "web_products_sub_freq" CASCADE;
  DROP TABLE "web_products" CASCADE;
  DROP TABLE "web_products_rels" CASCADE;
  DROP TABLE "_web_products_v_version_variants_sub_freq" CASCADE;
  DROP TABLE "_web_products_v_version_variants" CASCADE;
  DROP TABLE "_web_products_v_version_sub_freq" CASCADE;
  DROP TABLE "_web_products_v" CASCADE;
  DROP TABLE "_web_products_v_rels" CASCADE;
  DROP TABLE "web_cart_items" CASCADE;
  DROP TABLE "web_cart" CASCADE;
  DROP TABLE "user_wt_coins_coin_earning_history" CASCADE;
  DROP TABLE "user_wt_coins_points_redemption_history" CASCADE;
  DROP TABLE "user_wt_coins" CASCADE;
  DROP TABLE "user_wt_coins_rels" CASCADE;
  DROP TABLE "web_orders_items" CASCADE;
  DROP TABLE "web_orders" CASCADE;
  DROP TABLE "slots" CASCADE;
  DROP TABLE "web_subscription_items" CASCADE;
  DROP TABLE "web_subscription" CASCADE;
  DROP TABLE "web_wishlist_items" CASCADE;
  DROP TABLE "web_wishlist" CASCADE;
  DROP TABLE "wt_stamps_stamp_earning_history" CASCADE;
  DROP TABLE "wt_stamps_stamps_redemption_history" CASCADE;
  DROP TABLE "wt_stamps" CASCADE;
  DROP TABLE "wt_stamps_rels" CASCADE;
  DROP TABLE "user_preferences_cafe_product_preferences" CASCADE;
  DROP TABLE "user_preferences" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "import_export_plugin_imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "wt_coins" CASCADE;
  DROP TABLE "ship_and_tax" CASCADE;
  DROP TABLE "stamp_reward_products" CASCADE;
  DROP TABLE "stamp_reward_products_rels" CASCADE;
  DROP TYPE "public"."enum_users_addresses_emirates";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_gender";
  DROP TYPE "public"."enum_admins_role";
  DROP TYPE "public"."enum_admins_gender";
  DROP TYPE "public"."enum_customization_template_sections_selection_type";
  DROP TYPE "public"."enum_menu_dietary_type";
  DROP TYPE "public"."enum_shop_address_emirates";
  DROP TYPE "public"."enum_shop_menu_dietary_type";
  DROP TYPE "public"."enum_coupon_status";
  DROP TYPE "public"."enum_coupon_applicability";
  DROP TYPE "public"."enum_coupon_discount_type";
  DROP TYPE "public"."enum_shop_coupon_status";
  DROP TYPE "public"."enum_shop_coupon_applicability";
  DROP TYPE "public"."enum_shop_coupon_discount_type";
  DROP TYPE "public"."enum_app_cart_origin";
  DROP TYPE "public"."enum_app_orders_order_acceptance";
  DROP TYPE "public"."enum_app_orders_app_order_status";
  DROP TYPE "public"."enum_app_orders_payment_status";
  DROP TYPE "public"."enum_app_orders_order_type";
  DROP TYPE "public"."enum_app_orders_time_selection";
  DROP TYPE "public"."enum_web_products_variants_sub_freq_interval";
  DROP TYPE "public"."enum_web_products_sub_freq_interval";
  DROP TYPE "public"."enum_web_products_status";
  DROP TYPE "public"."enum__web_products_v_version_variants_sub_freq_interval";
  DROP TYPE "public"."enum__web_products_v_version_sub_freq_interval";
  DROP TYPE "public"."enum__web_products_v_version_status";
  DROP TYPE "public"."enum_web_orders_customer_type";
  DROP TYPE "public"."enum_web_orders_delivery_option";
  DROP TYPE "public"."enum_web_orders_origin";
  DROP TYPE "public"."enum_web_orders_shipping_address_emirates";
  DROP TYPE "public"."enum_web_orders_billing_address_emirates";
  DROP TYPE "public"."enum_web_orders_payment_status";
  DROP TYPE "public"."enum_web_orders_delivery_status";
  DROP TYPE "public"."enum_slots_time_selection";
  DROP TYPE "public"."enum_web_subscription_customer_type";
  DROP TYPE "public"."enum_web_subscription_delivery_option";
  DROP TYPE "public"."enum_web_subscription_shipping_address_emirates";
  DROP TYPE "public"."enum_web_subscription_billing_address_emirates";
  DROP TYPE "public"."enum_web_subscription_payment_status";
  DROP TYPE "public"."enum_web_subscription_subs_status";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_payload_folders_folder_type";`)
}
