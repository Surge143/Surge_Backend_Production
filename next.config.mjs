import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // Keep these heavy server-only packages out of the serverless bundle.
  // Without this, they get inlined into each function and push the output
  // past Vercel's 250 MB uncompressed limit → "internal error" on deploy.
  serverExternalPackages: [
    'firebase-admin',
    '@firebase/app',
    '@firebase/app-compat',
    '@firebase/auth',
    '@firebase/database',
    '@firebase/database-compat',
    '@firebase/firestore',
    '@firebase/functions',
    '@firebase/messaging',
    '@firebase/storage',
    '@firebase/util',
    'googleapis',
    'google-auth-library',
    'socket.io',
    'socket.io-client',
    'sharp',
    'csv-stringify',
    '@aws-sdk/client-s3',
    '@aws-sdk/lib-storage',
  ],

  // Prevent Next.js from tracing and including these directories/files
  // into the output bundle – they are not needed at runtime on Vercel.
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/esbuild/bin',
      'node_modules/typescript',
      'node_modules/webpack',
      'tsconfig.tsbuildinfo',
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
