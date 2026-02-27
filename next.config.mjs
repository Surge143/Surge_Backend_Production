import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },

  // CORS is handled dynamically per-origin in src/middleware.ts
  // so that Access-Control-Allow-Credentials can be used alongside specific origins.
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
