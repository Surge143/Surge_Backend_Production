import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Drop stale indexes — IF EXISTS because dev-mode push may have already removed them
  await db.execute(sql`DROP INDEX IF EXISTS "_shop_v_autosave_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "shop_menu_slug_idx"`)

  // Add new columns — IF NOT EXISTS so re-runs are safe
  await db.execute(sql`ALTER TABLE "shop" ADD COLUMN IF NOT EXISTS "display_title" varchar`)
  await db.execute(sql`ALTER TABLE "_shop_v" ADD COLUMN IF NOT EXISTS "version_display_title" varchar`)
  await db.execute(sql`ALTER TABLE "web_orders" ADD COLUMN IF NOT EXISTS "pickup_shop_id" integer`)

  // FK constraint — skip silently if already exists
  await db.execute(sql`
    DO $migration$ BEGIN
      ALTER TABLE "web_orders"
        ADD CONSTRAINT "web_orders_pickup_shop_id_shop_id_fk"
        FOREIGN KEY ("pickup_shop_id") REFERENCES "public"."shop"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $migration$
  `)

  // Indexes — IF NOT EXISTS so re-runs are safe
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "web_orders_pickup_shop_idx" ON "web_orders" USING btree ("pickup_shop_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "shop_menu_slug_idx" ON "shop_menu" USING btree ("slug")`)

  // Drop stale columns — IF EXISTS because dev-mode push may have already removed them
  await db.execute(sql`ALTER TABLE "_shop_v" DROP COLUMN IF EXISTS "autosave"`)
  await db.execute(sql`ALTER TABLE "shop_menu" DROP COLUMN IF EXISTS "generate_slug"`)
  await db.execute(sql`ALTER TABLE "_shop_menu_v" DROP COLUMN IF EXISTS "version_generate_slug"`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "web_orders" DROP CONSTRAINT IF EXISTS "web_orders_pickup_shop_id_shop_id_fk"`)
  await db.execute(sql`DROP INDEX IF EXISTS "web_orders_pickup_shop_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "shop_menu_slug_idx"`)
  await db.execute(sql`ALTER TABLE "_shop_v" ADD COLUMN IF NOT EXISTS "autosave" boolean`)
  await db.execute(sql`ALTER TABLE "shop_menu" ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true`)
  await db.execute(sql`ALTER TABLE "_shop_menu_v" ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "_shop_v_autosave_idx" ON "_shop_v" USING btree ("autosave")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "shop_menu_slug_idx" ON "shop_menu" USING btree ("slug")`)
  await db.execute(sql`ALTER TABLE "shop" DROP COLUMN IF EXISTS "display_title"`)
  await db.execute(sql`ALTER TABLE "_shop_v" DROP COLUMN IF EXISTS "version_display_title"`)
  await db.execute(sql`ALTER TABLE "web_orders" DROP COLUMN IF EXISTS "pickup_shop_id"`)
}
