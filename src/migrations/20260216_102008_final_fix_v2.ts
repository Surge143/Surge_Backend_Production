import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
        CREATE TYPE "public"."enum_web_subscription_subs_status" AS ENUM('active', 'inactive', 'cancelled');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "web_subscription" ADD COLUMN IF NOT EXISTS "subs_status" "enum_web_subscription_subs_status" DEFAULT 'active';
    ALTER TABLE "web_subscription" ADD COLUMN IF NOT EXISTS "financials_wt_discount" numeric;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "web_subscription" DROP COLUMN IF EXISTS "subs_status";
    ALTER TABLE "web_subscription" DROP COLUMN IF EXISTS "financials_wt_discount";
  `)
}
