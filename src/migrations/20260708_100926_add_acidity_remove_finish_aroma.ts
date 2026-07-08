import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "web_products" ADD COLUMN IF NOT EXISTS "acidity" varchar DEFAULT 'Soft, Mellow';
  ALTER TABLE "_web_products_v" ADD COLUMN IF NOT EXISTS "version_acidity" varchar DEFAULT 'Soft, Mellow';
  ALTER TABLE "web_products" DROP COLUMN IF EXISTS "finish";
  ALTER TABLE "web_products" DROP COLUMN IF EXISTS "aroma";
  ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_finish";
  ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_aroma";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "web_products" ADD COLUMN IF NOT EXISTS "finish" varchar;
  ALTER TABLE "web_products" ADD COLUMN IF NOT EXISTS "aroma" varchar;
  ALTER TABLE "_web_products_v" ADD COLUMN IF NOT EXISTS "version_finish" varchar;
  ALTER TABLE "_web_products_v" ADD COLUMN IF NOT EXISTS "version_aroma" varchar;
  ALTER TABLE "web_products" DROP COLUMN IF EXISTS "acidity";
  ALTER TABLE "_web_products_v" DROP COLUMN IF EXISTS "version_acidity";`)
}
