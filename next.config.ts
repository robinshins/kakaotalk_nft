import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'replicate.com',
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'localhost'
    ],
    unoptimized: true
  }
};

export default nextConfig;
