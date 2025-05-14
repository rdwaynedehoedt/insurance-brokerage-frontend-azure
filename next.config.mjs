/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static optimization for better performance
  poweredByHeader: false,
  // Enable image optimization
  images: {
    domains: [],
  },
  // Environment variables that will be exposed to the browser
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN,
  },
}

export default nextConfig 