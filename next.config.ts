import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set the port for the development server
  devServer: {
    port: 9876,
  },
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765',
  },
};

export default nextConfig;
