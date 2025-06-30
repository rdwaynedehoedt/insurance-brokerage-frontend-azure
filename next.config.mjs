/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable powered by header for security
  poweredByHeader: false,
  // Optimize output for production
  compress: true,
  // Enable image optimization
  images: {
    domains: ['localhost'],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
  },
  // Environment variables that will be exposed to the browser
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN,
  },
  // Cache optimization
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Enable output file tracing for Azure hosted environments
  output: 'standalone',
  // Add favicon configuration
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/images/CIB-Logo.png',
      },
    ];
  },
}

export default nextConfig 