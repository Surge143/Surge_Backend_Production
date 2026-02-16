import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_customer_type" AS ENUM('guest', 'user');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_delivery_option" AS ENUM('delivery', 'pickup');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_shipping_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_billing_address_emirates" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_payment_status" AS ENUM('pending', 'completed', 'refunded');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_subs_status" AS ENUM('active', 'inactive', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "web_subscription" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_type" "enum_web_subscription_customer_type" DEFAULT 'guest',
        "user_id" integer,
        "delivery_option" "enum_web_subscription_delivery_option" NOT NULL,
        "stripe_subscription_i_d" varchar,
        "next_payment_date" timestamp(3) with time zone,
        "news_and_offers" boolean DEFAULT false,
        "shipping_address_address_line1" varchar,
        "shipping_address_address_line2" varchar,
        "shipping_address_city" varchar,
        "shipping_address_emirates" "enum_web_subscription_shipping_address_emirates",
        "shipping_address_phone_number" varchar,
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

    CREATE TABLE IF NOT EXISTS "web_subscription_items" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "product_id" integer NOT NULL,
        "variant_i_d" varchar NOT NULL,
        "sub_freq_i_d" varchar NOT NULL,
        "quantity" numeric NOT NULL,
        "price" numeric NOT NULL
    );

    DO $$ BEGIN
        ALTER TABLE "web_subscription_items" ADD CONSTRAINT "web_subscription_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web_subscription"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
    DROP TABLE IF EXISTS "web_subscription_items" CASCADE;
    DROP TABLE IF EXISTS "web_subscription" CASCADE;
    DROP TYPE IF EXISTS "enum_web_subscription_customer_type";
    DROP TYPE IF EXISTS "enum_web_subscription_delivery_option";
    DROP TYPE IF EXISTS "enum_web_subscription_shipping_address_emirates";
    DROP TYPE IF EXISTS "enum_web_subscription_billing_address_emirates";
    DROP TYPE IF EXISTS "enum_web_subscription_payment_status";
    DROP TYPE IF EXISTS "enum_web_subscription_subs_status";
  `)
}
