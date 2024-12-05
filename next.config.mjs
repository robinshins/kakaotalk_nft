/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'replicate.com',
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'localhost',
      'ipfs.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
    ],
    unoptimized: true
  }
};

export default nextConfig;
