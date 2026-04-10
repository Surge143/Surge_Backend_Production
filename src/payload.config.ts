import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Admins } from './collections/Users/Admins'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { importExportPlugin } from 'payload-import-export'
import { collections, globals } from './collections'
import { getServerSideURL } from '@/utilities/getURL'
import { payloadCloudinaryPlugin } from '@jhb.software/payload-cloudinary-plugin'
import sharp from 'sharp'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const generateTitle: GenerateTitle = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export default buildConfig({
  admin: {
    components: {
      views: {
        ShopManagerDashboard: {
          Component:
            '@/collections/components/ShopManagerCustomComponents/ShopManagerDashboard/ShopManagerDashboard#ShopManagerDashboard',
          path: '/shop-manager-dashboard',
        },
        StoreDashboard: {
          Component:
            '@/collections/components/ShopManagerCustomComponents/StoreDashboard/StoreDashboard#StoreDashboard',
          path: '/store-dashboard',
        },
      },
      beforeNavLinks: [
        '@/collections/components/Navbar/ShopManagerDashboardLink#ShopManagerDashboardLink',
      ],
    },
    user: Admins.slug,
  },
  cors: [
    'http://localhost:8100',
    'http://localhost:5173',
    'https://localhost',
    'capacitor://localhost',
    'https://whitemantis-app.vercel.app',
    'https://whitemantis-frontend-bfag.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
  collections: collections,
  globals: globals,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      options: '-c timezone=Asia/Dubai',
    },
    migrations,
  }),
  sharp,
  plugins: [
    // Cloudinary storage plugin — handles uploads for the media collection.
    // Files are sent directly to Cloudinary; nothing is written to local disk.
    // Credentials are read from .env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    payloadCloudinaryPlugin({
      collections: {
        media: {
          // Return direct Cloudinary URLs in API responses instead of
          // Payload's /api/media/file/ proxy route. Required so the admin
          // product list can render images (isServableUrl blocks proxy URLs).
          disablePayloadAccessControl: true,
        },
      },
      cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
      credentials: {
        apiKey: process.env.CLOUDINARY_API_KEY as string,
        apiSecret: process.env.CLOUDINARY_API_SECRET as string,
      },
      folder: 'surge-uploads', // all uploads go into this Cloudinary folder
    }),
    importExportPlugin({
      collections: ['web-products', 'app-orders'],
    }),
    seoPlugin({
      generateTitle,
      generateURL,
    }),
  ],
})
