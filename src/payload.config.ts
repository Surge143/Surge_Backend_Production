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
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

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
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Admins.slug,
  },
  cors: [
    'http://localhost:8100',
    'http://localhost:5173',
    'https://localhost',
    'capacitor://localhost',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://surge-frontend-sigma.vercel.app',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.FRONTEND_URL || '',
    process.env.FRONTEND_URL2 || '',
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
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET as string,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY as string,
          secretAccessKey: process.env.S3_SECRET_KEY as string,
        },
        endpoint: process.env.S3_ENDPOINT as string,
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: true,
      },
      acl: 'public-read',
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
