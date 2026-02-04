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
        MyCustomView: {
          Component:
            '@/collections/components/ShopManagerCustomComponents/pendingOrders#pendingOrders',
          path: '/pending-orders',
        },
      },
      afterNavLinks: ['@/collections/components/Navbar/MySidebarLink#MySidebarLink'],
    },
    user: Admins.slug,
  },
  cors: [
    'http://localhost:8100',
    'http://localhost:5173',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
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
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'uploads',
          generateFileURL: ({ filename, prefix }) => {
            return `https://storage-admin-api.whitemantis.ae/whitemantis/${prefix}/${filename}`
          },
        },
      },
      bucket: process.env.S3_BUCKET as string,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY as string,
          secretAccessKey: process.env.S3_SECRET_KEY as string,
        },
        endpoint: process.env.S3_ENDPOINT!,
        region: 'us-east-1',
        forcePathStyle: true,
      },
    }),
    importExportPlugin({
      collections: ['web-products'],
    }),
    seoPlugin({
      generateTitle,
      generateURL,
    }),
  ],
})
