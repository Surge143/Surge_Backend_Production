import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── Step 1: Create new tables (IF NOT EXISTS — dev mode may have already created them) ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "app_cart_items_product_highlights_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "point" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "app_cart_items_product_highlights" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "section_title" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "web_cart_items_product_highlights_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "point" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "web_cart_items_product_highlights" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "section_title" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "web_orders_items_product_highlights_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "point" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "web_orders_items_product_highlights" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "section_title" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "careers" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "short_description" varchar NOT NULL,
      "link" varchar NOT NULL,
      "last_updated_by" varchar,
      "created_by" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  // ── Step 2: Rename tables only if the old name still exists ──
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = 'shop_menu_customizations_sections_groups_options'
      ) THEN
        ALTER TABLE "shop_menu_customizations_sections_groups_options" RENAME TO "grp_opts";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = '_shop_menu_v_version_customizations_sections_groups_options'
      ) THEN
        ALTER TABLE "_shop_menu_v_version_customizations_sections_groups_options" RENAME TO "_grp_opts_v";
      END IF;
    END $$;
  `)

  // ── Step 3: Drop old FK constraints and indexes (IF EXISTS — idempotent) ──
  await db.execute(sql`
    ALTER TABLE "grp_opts"   DROP CONSTRAINT IF EXISTS "shop_menu_customizations_sections_groups_options_parent_id_fk";
    ALTER TABLE "_grp_opts_v" DROP CONSTRAINT IF EXISTS "_shop_menu_v_version_customizations_sections_groups_options_parent_id_fk";

    DROP INDEX IF EXISTS "shop_menu_customizations_sections_groups_options_order_idx";
    DROP INDEX IF EXISTS "shop_menu_customizations_sections_groups_options_parent_id_idx";
    DROP INDEX IF EXISTS "_shop_menu_v_version_customizations_sections_groups_options_order_idx";
    DROP INDEX IF EXISTS "_shop_menu_v_version_customizations_sections_groups_options_parent_id_idx";
  `)

  // ── Step 4: Add new columns (IF NOT EXISTS — dev mode may have already added them) ──
  await db.execute(sql`
    ALTER TABLE "menu"        ADD COLUMN IF NOT EXISTS "generate_slug"         boolean DEFAULT true;
    ALTER TABLE "menu"        ADD COLUMN IF NOT EXISTS "slug"                  varchar;
    ALTER TABLE "menu"        ADD COLUMN IF NOT EXISTS "is_latest"             boolean DEFAULT false;

    ALTER TABLE "_menu_v"     ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;
    ALTER TABLE "_menu_v"     ADD COLUMN IF NOT EXISTS "version_slug"          varchar;
    ALTER TABLE "_menu_v"     ADD COLUMN IF NOT EXISTS "version_is_latest"     boolean DEFAULT false;

    ALTER TABLE "shop_menu"   ADD COLUMN IF NOT EXISTS "generate_slug"         boolean DEFAULT true;
    ALTER TABLE "shop_menu"   ADD COLUMN IF NOT EXISTS "slug"                  varchar;
    ALTER TABLE "shop_menu"   ADD COLUMN IF NOT EXISTS "is_latest"             boolean DEFAULT false;

    ALTER TABLE "_shop_menu_v" ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;
    ALTER TABLE "_shop_menu_v" ADD COLUMN IF NOT EXISTS "version_slug"          varchar;
    ALTER TABLE "_shop_menu_v" ADD COLUMN IF NOT EXISTS "version_is_latest"     boolean DEFAULT false;

    ALTER TABLE "web_products"   ADD COLUMN IF NOT EXISTS "is_latest"             boolean DEFAULT false;
    ALTER TABLE "web_products"   ADD COLUMN IF NOT EXISTS "is_bestseller"         boolean DEFAULT false;

    ALTER TABLE "_web_products_v" ADD COLUMN IF NOT EXISTS "version_is_latest"    boolean DEFAULT false;
    ALTER TABLE "_web_products_v" ADD COLUMN IF NOT EXISTS "version_is_bestseller" boolean DEFAULT false;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "careers_id" integer;
  `)

  // ── Step 5: Add FK constraints (only if they don't already exist) ──
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_cart_items_product_highlights_items_parent_id_fk') THEN
        ALTER TABLE "app_cart_items_product_highlights_items"
          ADD CONSTRAINT "app_cart_items_product_highlights_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."app_cart_items_product_highlights"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_cart_items_product_highlights_parent_id_fk') THEN
        ALTER TABLE "app_cart_items_product_highlights"
          ADD CONSTRAINT "app_cart_items_product_highlights_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."app_cart_items"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'web_cart_items_product_highlights_items_parent_id_fk') THEN
        ALTER TABLE "web_cart_items_product_highlights_items"
          ADD CONSTRAINT "web_cart_items_product_highlights_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."web_cart_items_product_highlights"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'web_cart_items_product_highlights_parent_id_fk') THEN
        ALTER TABLE "web_cart_items_product_highlights"
          ADD CONSTRAINT "web_cart_items_product_highlights_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."web_cart_items"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'web_orders_items_product_highlights_items_parent_id_fk') THEN
        ALTER TABLE "web_orders_items_product_highlights_items"
          ADD CONSTRAINT "web_orders_items_product_highlights_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."web_orders_items_product_highlights"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'web_orders_items_product_highlights_parent_id_fk') THEN
        ALTER TABLE "web_orders_items_product_highlights"
          ADD CONSTRAINT "web_orders_items_product_highlights_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."web_orders_items"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grp_opts_parent_id_fk') THEN
        ALTER TABLE "grp_opts"
          ADD CONSTRAINT "grp_opts_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_menu_customizations_sections_groups"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_grp_opts_v_parent_id_fk') THEN
        ALTER TABLE "_grp_opts_v"
          ADD CONSTRAINT "_grp_opts_v_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v_version_customizations_sections_groups"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_careers_fk') THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_careers_fk"
          FOREIGN KEY ("careers_id") REFERENCES "public"."careers"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  // ── Step 6: Create indexes (IF NOT EXISTS — idempotent) ──
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "app_cart_items_product_highlights_items_order_idx"     ON "app_cart_items_product_highlights_items"  USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "app_cart_items_product_highlights_items_parent_id_idx" ON "app_cart_items_product_highlights_items"  USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "app_cart_items_product_highlights_order_idx"           ON "app_cart_items_product_highlights"        USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "app_cart_items_product_highlights_parent_id_idx"       ON "app_cart_items_product_highlights"        USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "web_cart_items_product_highlights_items_order_idx"     ON "web_cart_items_product_highlights_items"  USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "web_cart_items_product_highlights_items_parent_id_idx" ON "web_cart_items_product_highlights_items"  USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "web_cart_items_product_highlights_order_idx"           ON "web_cart_items_product_highlights"        USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "web_cart_items_product_highlights_parent_id_idx"       ON "web_cart_items_product_highlights"        USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "web_orders_items_product_highlights_items_order_idx"     ON "web_orders_items_product_highlights_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "web_orders_items_product_highlights_items_parent_id_idx" ON "web_orders_items_product_highlights_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "web_orders_items_product_highlights_order_idx"           ON "web_orders_items_product_highlights"       USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "web_orders_items_product_highlights_parent_id_idx"       ON "web_orders_items_product_highlights"       USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "careers_updated_at_idx" ON "careers" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "careers_created_at_idx" ON "careers" USING btree ("created_at");

    CREATE UNIQUE INDEX IF NOT EXISTS "menu_slug_idx"                    ON "menu"        USING btree ("slug");
    CREATE INDEX        IF NOT EXISTS "_menu_v_version_version_slug_idx" ON "_menu_v"     USING btree ("version_slug");

    CREATE INDEX IF NOT EXISTS "grp_opts_order_idx"     ON "grp_opts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "grp_opts_parent_id_idx" ON "grp_opts" USING btree ("_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "shop_menu_slug_idx"                    ON "shop_menu"   USING btree ("slug");
    CREATE INDEX        IF NOT EXISTS "_shop_menu_v_version_version_slug_idx" ON "_shop_menu_v" USING btree ("version_slug");

    CREATE INDEX IF NOT EXISTS "_grp_opts_v_order_idx"     ON "_grp_opts_v" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_grp_opts_v_parent_id_idx" ON "_grp_opts_v" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_careers_id_idx" ON "payload_locked_documents_rels" USING btree ("careers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "shop_menu_customizations_sections_groups_options" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "price" numeric DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "_shop_menu_v_version_customizations_sections_groups_options" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "price" numeric DEFAULT 0,
      "_uuid" varchar
    );

    DROP TABLE IF EXISTS "grp_opts" CASCADE;
    DROP TABLE IF EXISTS "_grp_opts_v" CASCADE;
    DROP TABLE IF EXISTS "app_cart_items_product_highlights_items" CASCADE;
    DROP TABLE IF EXISTS "app_cart_items_product_highlights" CASCADE;
    DROP TABLE IF EXISTS "web_cart_items_product_highlights_items" CASCADE;
    DROP TABLE IF EXISTS "web_cart_items_product_highlights" CASCADE;
    DROP TABLE IF EXISTS "web_orders_items_product_highlights_items" CASCADE;
    DROP TABLE IF EXISTS "web_orders_items_product_highlights" CASCADE;
    DROP TABLE IF EXISTS "careers" CASCADE;

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_careers_fk";

    DROP INDEX IF EXISTS "menu_slug_idx";
    DROP INDEX IF EXISTS "_menu_v_version_version_slug_idx";
    DROP INDEX IF EXISTS "shop_menu_slug_idx";
    DROP INDEX IF EXISTS "_shop_menu_v_version_version_slug_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_careers_id_idx";

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_menu_customizations_sections_groups_options_parent_id_fk') THEN
        ALTER TABLE "shop_menu_customizations_sections_groups_options"
          ADD CONSTRAINT "shop_menu_customizations_sections_groups_options_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_menu_customizations_sections_groups"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_shop_menu_v_version_customizations_sections_groups_options_parent_id_fk') THEN
        ALTER TABLE "_shop_menu_v_version_customizations_sections_groups_options"
          ADD CONSTRAINT "_shop_menu_v_version_customizations_sections_groups_options_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_shop_menu_v_version_customizations_sections_groups"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "shop_menu_customizations_sections_groups_options_order_idx"     ON "shop_menu_customizations_sections_groups_options" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "shop_menu_customizations_sections_groups_options_parent_id_idx" ON "shop_menu_customizations_sections_groups_options" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_shop_menu_v_version_customizations_sections_groups_options_order_idx"     ON "_shop_menu_v_version_customizations_sections_groups_options" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_shop_menu_v_version_customizations_sections_groups_options_parent_id_idx" ON "_shop_menu_v_version_customizations_sections_groups_options" USING btree ("_parent_id");

    ALTER TABLE "menu"         DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "menu"         DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "menu"         DROP COLUMN IF EXISTS "is_latest";
    ALTER TABLE "_menu_v"      DROP COLUMN IF EXISTS "version_generate_slug";
    ALTER TABLE "_menu_v"      DROP COLUMN IF EXISTS "version_slug";
    ALTER TABLE "_menu_v"      DROP COLUMN IF EXISTS "version_is_latest";
    ALTER TABLE "shop_menu"    DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "shop_menu"    DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "shop_menu"    DROP COLUMN IF EXISTS "is_latest";
    ALTER TABLE "_shop_menu_v" DROP COLUMN IF EXISTS "version_generate_slug";
    ALTER TABLE "_shop_menu_v" DROP COLUMN IF EXISTS "version_slug";
    ALTER TABLE "_shop_menu_v" DROP COLUMN IF EXISTS "version_is_latest";
    ALTER TABLE "web_products"    DROP COLUMN IF EXISTS "is_latest";
    ALTER TABLE "web_products"    DROP COLUMN IF EXISTS "is_bestseller";
    ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_is_latest";
    ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_is_bestseller";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "careers_id";
  `)
}
