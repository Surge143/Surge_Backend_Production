import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "web_products_variants_variant_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "web_products_product_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "_web_products_v_version_variants_variant_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_web_products_v_version_product_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  ALTER TABLE "web_products_variants_variant_gallery_images" ADD CONSTRAINT "web_products_variants_variant_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products_variants_variant_gallery_images" ADD CONSTRAINT "web_products_variants_variant_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web_products_product_gallery_images" ADD CONSTRAINT "web_products_product_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web_products_product_gallery_images" ADD CONSTRAINT "web_products_product_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."web_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_variants_variant_gallery_images" ADD CONSTRAINT "_web_products_v_version_variants_variant_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_variants_variant_gallery_images" ADD CONSTRAINT "_web_products_v_version_variants_variant_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v_version_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_product_gallery_images" ADD CONSTRAINT "_web_products_v_version_product_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_web_products_v_version_product_gallery_images" ADD CONSTRAINT "_web_products_v_version_product_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_web_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "web_products_variants_variant_gallery_images_order_idx" ON "web_products_variants_variant_gallery_images" USING btree ("_order");
  CREATE INDEX "web_products_variants_variant_gallery_images_parent_id_idx" ON "web_products_variants_variant_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "web_products_variants_variant_gallery_images_image_idx" ON "web_products_variants_variant_gallery_images" USING btree ("image_id");
  CREATE INDEX "web_products_product_gallery_images_order_idx" ON "web_products_product_gallery_images" USING btree ("_order");
  CREATE INDEX "web_products_product_gallery_images_parent_id_idx" ON "web_products_product_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "web_products_product_gallery_images_image_idx" ON "web_products_product_gallery_images" USING btree ("image_id");
  CREATE INDEX "_web_products_v_version_variants_variant_gallery_images_order_idx" ON "_web_products_v_version_variants_variant_gallery_images" USING btree ("_order");
  CREATE INDEX "_web_products_v_version_variants_variant_gallery_images_parent_id_idx" ON "_web_products_v_version_variants_variant_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_web_products_v_version_variants_variant_gallery_images__idx" ON "_web_products_v_version_variants_variant_gallery_images" USING btree ("image_id");
  CREATE INDEX "_web_products_v_version_product_gallery_images_order_idx" ON "_web_products_v_version_product_gallery_images" USING btree ("_order");
  CREATE INDEX "_web_products_v_version_product_gallery_images_parent_id_idx" ON "_web_products_v_version_product_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_web_products_v_version_product_gallery_images_image_idx" ON "_web_products_v_version_product_gallery_images" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "web_products_variants_variant_gallery_images" CASCADE;
  DROP TABLE "web_products_product_gallery_images" CASCADE;
  DROP TABLE "_web_products_v_version_variants_variant_gallery_images" CASCADE;
  DROP TABLE "_web_products_v_version_product_gallery_images" CASCADE;`)
}
