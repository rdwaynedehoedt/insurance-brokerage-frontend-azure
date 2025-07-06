/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable powered by header for security
  poweredByHeader: false,
  // Optimize output for production
  compress: true,
  // Enable image optimization
  images: {
    domains: [],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
  },
  // Environment variables that will be exposed to the browser
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN,
    NEXT_PUBLIC_SALES_API_URL: process.env.NEXT_PUBLIC_SALES_API_URL,
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
}

export default nextConfig 