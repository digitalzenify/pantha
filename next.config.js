/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

module.exports = nextConfig;
