import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// IF NOT EXISTS / IF EXISTS: this environment runs Payload's dev schema-push
// (NODE_ENV !== 'production'), which already synced this column live the moment
// the collection config changed — before this migration ever ran. Written this way
// so it's a safe no-op here now, AND still applies correctly the first time on a
// real production deploy (where push is disabled and this migration is the only
// thing that creates the column).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "web_products_variants" ADD COLUMN IF NOT EXISTS "variant_color" varchar;
  ALTER TABLE "_web_products_v_version_variants" ADD COLUMN IF NOT EXISTS "variant_color" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "web_products_variants" DROP COLUMN IF EXISTS "variant_color";
  ALTER TABLE "_web_products_v_version_variants" DROP COLUMN IF EXISTS "variant_color";`)
}
