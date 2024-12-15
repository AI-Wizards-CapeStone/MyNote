/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable `public` folder for vercel
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
      },
      {
        protocol: "http",
        hostname: "files.edgestore.dev",
      },
    ],
  },
};

module.exports = nextConfig;

