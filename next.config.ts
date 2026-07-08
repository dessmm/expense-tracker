import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Skip type errors from supabase client during build without env vars
  typescript: {
    ignoreBuildErrors: false,
  },
  // Required for dynamic server-side routes
  output: 'standalone',
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@opentelemetry/api': path.resolve(__dirname, 'lib/supabase/otel-stub.ts'),
    }
    return config
  },
  turbopack: {
    resolveAlias: {
      '@opentelemetry/api': './lib/supabase/otel-stub.ts',
    },
  },
}

export default nextConfig
