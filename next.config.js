/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['firebase', 'undici'],
  },
};

module.exports = nextConfig;
