import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Skip type errors from supabase client during build without env vars
  typescript: {
    ignoreBuildErrors: false,
  },
  // Required for dynamic server-side routes
  output: 'standalone',
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
}

export default nextConfig
