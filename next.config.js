/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765',
  },
};

module.exports = nextConfig;