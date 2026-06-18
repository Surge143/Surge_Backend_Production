import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- web_products: convert regular_price and sale_price from numeric to varchar
    -- ROUND(..., 2)::text on a numeric column produces '50.00', '45.50', etc.
    ALTER TABLE "web_products"
      ALTER COLUMN "regular_price" TYPE varchar
      USING ROUND("regular_price", 2)::text;

    ALTER TABLE "web_products"
      ALTER COLUMN "sale_price" TYPE varchar
      USING ROUND("sale_price", 2)::text;

    -- _web_products_v: same columns in the version table
    ALTER TABLE "_web_products_v"
      ALTER COLUMN "version_regular_price" TYPE varchar
      USING ROUND("version_regular_price", 2)::text;

    ALTER TABLE "_web_products_v"
      ALTER COLUMN "version_sale_price" TYPE varchar
      USING ROUND("version_sale_price", 2)::text;

    -- web_products_variants: variant price columns
    ALTER TABLE "web_products_variants"
      ALTER COLUMN "variant_regular_price" TYPE varchar
      USING ROUND("variant_regular_price", 2)::text;

    ALTER TABLE "web_products_variants"
      ALTER COLUMN "variant_sale_price" TYPE varchar
      USING ROUND("variant_sale_price", 2)::text;

    -- _web_products_v_version_variants: version of variant price columns
    ALTER TABLE "_web_products_v_version_variants"
      ALTER COLUMN "variant_regular_price" TYPE varchar
      USING ROUND("variant_regular_price", 2)::text;

    ALTER TABLE "_web_products_v_version_variants"
      ALTER COLUMN "variant_sale_price" TYPE varchar
      USING ROUND("variant_sale_price", 2)::text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "web_products"
      ALTER COLUMN "regular_price" TYPE numeric USING "regular_price"::numeric;
    ALTER TABLE "web_products"
      ALTER COLUMN "sale_price" TYPE numeric USING "sale_price"::numeric;

    ALTER TABLE "_web_products_v"
      ALTER COLUMN "version_regular_price" TYPE numeric USING "version_regular_price"::numeric;
    ALTER TABLE "_web_products_v"
      ALTER COLUMN "version_sale_price" TYPE numeric USING "version_sale_price"::numeric;

    ALTER TABLE "web_products_variants"
      ALTER COLUMN "variant_regular_price" TYPE numeric USING "variant_regular_price"::numeric;
    ALTER TABLE "web_products_variants"
      ALTER COLUMN "variant_sale_price" TYPE numeric USING "variant_sale_price"::numeric;

    ALTER TABLE "_web_products_v_version_variants"
      ALTER COLUMN "variant_regular_price" TYPE numeric USING "variant_regular_price"::numeric;
    ALTER TABLE "_web_products_v_version_variants"
      ALTER COLUMN "variant_sale_price" TYPE numeric USING "variant_sale_price"::numeric;
  `)
}
