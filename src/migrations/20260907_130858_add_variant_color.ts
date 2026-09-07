import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "web_products_variants" ADD COLUMN "variant_color" varchar;
  ALTER TABLE "_web_products_v_version_variants" ADD COLUMN "variant_color" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "web_products_variants" DROP COLUMN "variant_color";
  ALTER TABLE "_web_products_v_version_variants" DROP COLUMN "variant_color";`)
}
