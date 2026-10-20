/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Workspace packages ship TypeScript source, so Next compiles them.
  transpilePackages: ['@hackathonfinder/shared'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
      {
        protocol: 'https',
        hostname: 'assets-global.website-files.com',
      },
    ],
  },
};

module.exports = nextConfig;
