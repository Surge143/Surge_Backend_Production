import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create enum types — skip if already exists (pushed via prior dev mode run)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_event_type" AS ENUM('private', 'corporate');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_package" AS ENUM('30-cups', '50-cups', '100-cups', 'additional-cups');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_emirate" AS ENUM('dubai', 'sharjah', 'ras-al-khaimah', 'ajman', 'abu-dhabi');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Create featured_news table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "featured_news" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  // Alter events enum columns — skip if already the correct type
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_events_event_type" USING "event_type"::"public"."enum_events_event_type";
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ALTER COLUMN "package" SET DATA TYPE "public"."enum_events_package" USING "package"::"public"."enum_events_package";
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `)

  // Add columns — IF NOT EXISTS handles already-pushed columns safely
  await db.execute(sql`ALTER TABLE "shop_menu" ADD COLUMN IF NOT EXISTS "_order" varchar;`)
  await db.execute(sql`ALTER TABLE "_shop_menu_v" ADD COLUMN IF NOT EXISTS "version__order" varchar;`)
  await db.execute(sql`ALTER TABLE "web_products" ADD COLUMN IF NOT EXISTS "_order" varchar;`)
  await db.execute(sql`ALTER TABLE "_web_products_v" ADD COLUMN IF NOT EXISTS "version__order" varchar;`)
  await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "first_name" varchar NOT NULL DEFAULT '';`)
  await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "last_name" varchar NOT NULL DEFAULT '';`)
  await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "city" varchar NOT NULL DEFAULT '';`)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "emirate" "public"."enum_events_emirate" NOT NULL DEFAULT 'dubai';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "featured_news_id" integer;
  `)

  // Indexes
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "featured_news_slug_idx" ON "featured_news" USING btree ("slug");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "featured_news_updated_at_idx" ON "featured_news" USING btree ("updated_at");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "featured_news_created_at_idx" ON "featured_news" USING btree ("created_at");`)

  // Foreign key constraint — skip if already exists
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_featured_news_fk"
        FOREIGN KEY ("featured_news_id") REFERENCES "public"."featured_news"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "shop_menu__order_idx" ON "shop_menu" USING btree ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "_shop_menu_v_version_version__order_idx" ON "_shop_menu_v" USING btree ("version__order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "web_products__order_idx" ON "web_products" USING btree ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "_web_products_v_version_version__order_idx" ON "_web_products_v" USING btree ("version__order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_featured_news_id_idx" ON "payload_locked_documents_rels" USING btree ("featured_news_id");`)

  // Drop old events columns — IF EXISTS handles already-dropped columns
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "full_name";`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "location";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "featured_news" DISABLE ROW LEVEL SECURITY;`)
  await db.execute(sql`DROP TABLE IF EXISTS "featured_news" CASCADE;`)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        DROP CONSTRAINT "payload_locked_documents_rels_featured_news_fk";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`DROP INDEX IF EXISTS "shop_menu__order_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "_shop_menu_v_version_version__order_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "web_products__order_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "_web_products_v_version_version__order_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "payload_locked_documents_rels_featured_news_id_idx";`)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE varchar;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ALTER COLUMN "package" SET DATA TYPE varchar;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `)

  await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "full_name" varchar NOT NULL DEFAULT '';`)
  await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "location" varchar NOT NULL DEFAULT '';`)
  await db.execute(sql`ALTER TABLE "shop_menu" DROP COLUMN IF EXISTS "_order";`)
  await db.execute(sql`ALTER TABLE "_shop_menu_v" DROP COLUMN IF EXISTS "version__order";`)
  await db.execute(sql`ALTER TABLE "web_products" DROP COLUMN IF EXISTS "_order";`)
  await db.execute(sql`ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version__order";`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "first_name";`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "last_name";`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "city";`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "emirate";`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "featured_news_id";`)

  await db.execute(sql`
    DO $$ BEGIN
      DROP TYPE "public"."enum_events_event_type";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      DROP TYPE "public"."enum_events_package";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      DROP TYPE "public"."enum_events_emirate";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;
  `)
}
