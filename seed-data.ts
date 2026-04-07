import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from './src/utilities/getPayload'

dotenv.config({ path: path.join(process.cwd(), '.env') })

async function seed() {
  console.log('Initializing Payload...')
  const payload = await getPayload()

  console.log('Seeding data...')

  // 1. Create Admin
  const admin = await payload.create({
    collection: 'admins',
    data: {
      email: 'admin@whitemantis.ae',
      password: 'password123',
      name: 'Super Admin',
      role: 'super-admin',
    },
  })
  console.log('Admin created:', admin.id)

  const shopManager = await payload.create({
    collection: 'admins',
    data: {
      email: 'manager@whitemantis.ae',
      password: 'password123',
      name: 'Shop Manager',
      role: 'shop-manager',
    },
  })
  console.log('Shop Manager created:', shopManager.id)

  // 2. Create Shop
  const shop = await payload.create({
    collection: 'shop',
    data: {
      address: {
        city: 'Dubai',
        street: 'Jumeirah Beach Road',
        emirates: 'dubai',
        country: 'United Arab Emirates',
      },
      operationalSettings: {
        openingTime: new Date('2024-01-01T08:00:00Z').toISOString(),
        closingTime: new Date('2024-01-01T22:00:00Z').toISOString(),
      },
      isShopOpen: true,
      shopManager: shopManager.id,
    },
  })
  console.log('Shop created:', shop.id)

  const appCat = await payload.create({
    collection: 'app-categories',
    data: { title: 'Coffee', slug: 'coffee' },
  })

  const appSubCat = await payload.create({
    collection: 'app-sub-categories',
    data: { title: 'Lattes', parentCategory: appCat.id, slug: 'lattes' },
  })

  const webCat = await payload.create({
    collection: 'web-categories',
    data: { title: 'Beans', slug: 'beans' },
  })

  // Check for existing media to avoid S3 upload errors
  const existingMedia = await payload.find({ collection: 'media', limit: 1 })
  const defaultMediaId =
    existingMedia.docs.length > 0 ? (existingMedia.docs[0].id as number) : (1 as number)

  // 4. Create Menu Item
  // @ts-ignore
  const menuItem = await payload.create({
    collection: 'shop-menu',
    data: {
      name: 'Signature Latte',
      tagline: 'Smooth and creamy with a hint of caramel.',
      regularPrice: 22,
      shop: shop.id,
      category: appCat.id,
      subCategories: [appSubCat.id],
      inStock: true,
      stockCount: 100,
      customizations: [
        {
          title: 'Milk Options',
          sections: [
            {
              title: 'Milk Selection',
              selectionType: 'single',
              options: [
                { label: 'Oat Milk', price: 5 },
                { label: 'Almond Milk', price: 5 },
                { label: 'Full Cream', price: 0 },
              ],
            },
          ],
        },
      ],
    },
  })
  console.log('Menu Item created:', menuItem.id)

  // 5. Create Web Product
  // @ts-ignore
  const product = await payload.create({
    collection: 'web-products',
    data: {
      name: 'Ethiopian Yirgacheffe',
      tagline: 'Floral and citrusy with a medium body.',
      regularPrice: 85,
      description: 'The finest beans from the Yirgacheffe region.',
      categories: webCat.id,
      subCategories: {},
      farm: 'Guji Farm',
      tastingNotes: 'Jasmine, Lemon',
      variety: 'Heirloom',
      process: 'Washed',
      altitude: '2000m',
      finish: 'Clean',
      body: 'Medium',
      aroma: 'Floral',
      roast: 'Light',
      farmDescription: 'Sample farm description',
      slug: 'ethiopian-yirgacheffe',
      _status: 'published',
      inStock: true,
      stockQuantity: 50,
      productImage: defaultMediaId,
      videoBanner: defaultMediaId,
    },
  })
  console.log('Web Product created:', product.id)

  console.log('Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
