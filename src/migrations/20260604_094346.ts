import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "ship_and_tax_order_notification_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar
  );
  
  CREATE TABLE "_ship_and_tax_v_version_order_notification_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "ship_and_tax_order_notification_emails" ADD CONSTRAINT "ship_and_tax_order_notification_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ship_and_tax"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ship_and_tax_v_version_order_notification_emails" ADD CONSTRAINT "_ship_and_tax_v_version_order_notification_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ship_and_tax_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ship_and_tax_order_notification_emails_order_idx" ON "ship_and_tax_order_notification_emails" USING btree ("_order");
  CREATE INDEX "ship_and_tax_order_notification_emails_parent_id_idx" ON "ship_and_tax_order_notification_emails" USING btree ("_parent_id");
  CREATE INDEX "_ship_and_tax_v_version_order_notification_emails_order_idx" ON "_ship_and_tax_v_version_order_notification_emails" USING btree ("_order");
  CREATE INDEX "_ship_and_tax_v_version_order_notification_emails_parent_id_idx" ON "_ship_and_tax_v_version_order_notification_emails" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "ship_and_tax_order_notification_emails" CASCADE;
  DROP TABLE "_ship_and_tax_v_version_order_notification_emails" CASCADE;`)
}
