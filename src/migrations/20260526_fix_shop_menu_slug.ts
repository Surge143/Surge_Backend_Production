import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ShopMenu slug was switched from slugField() (required, unique) to a plain text field
 * (non-unique, not required) because multiple shops can share the same slug when they
 * carry the same Menu item.
 *
 * This migration:
 *  1. Drops the orphaned generate_slug columns (created by the old slugField helper)
 *  2. Replaces the UNIQUE index on shop_menu.slug with a plain (non-unique) index
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop orphaned generate_slug columns left behind by the removed slugField helper
  await db.execute(sql`
    ALTER TABLE "shop_menu"    DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "_shop_menu_v" DROP COLUMN IF EXISTS "version_generate_slug";
  `)

  // Replace UNIQUE slug index with a plain index — slugs are synced from Menu so
  // every shop carrying the same item gets the same slug value.
  await db.execute(sql`
    DROP INDEX IF EXISTS "shop_menu_slug_idx";
    CREATE INDEX IF NOT EXISTS "shop_menu_slug_idx" ON "shop_menu" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "shop_menu"    ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true;
    ALTER TABLE "_shop_menu_v" ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;

    DROP INDEX IF EXISTS "shop_menu_slug_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "shop_menu_slug_idx" ON "shop_menu" USING btree ("slug");
  `)
}
