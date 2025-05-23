// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'huzmumohpxoxpimmeptl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add other common image domains you might use
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
    // Alternative: Use domains array (deprecated but still works)
    // domains: [
    //   'huzmumohpxoxpimmeptl.supabase.co',
    //   'images.unsplash.com',
    //   'via.placeholder.com'
    // ],
    
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Optional: Configure other Next.js settings
  experimental: {
    // Enable if you're using app directory (Next.js 13+)
    appDir: true,
  },
  
  // Optional: Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Optional: Redirects
  async redirects() {
    return [
      {
        source: '/old-dashboard',
        destination: '/vendor/dashboard',
        permanent: true,
      },
    ]
  },
  
  // Optional: Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}

export default nextConfig;