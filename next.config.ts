import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/~offline', revision: '1' }],
})

const nextConfig: NextConfig = {
  // Skip type errors from supabase client during build without env vars
  typescript: {
    ignoreBuildErrors: false,
  },
  // Required for dynamic server-side routes
  output: 'standalone',
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
}

export default withSerwist(nextConfig)

