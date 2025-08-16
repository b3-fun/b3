/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@b3dotfun/sdk"],
  env: {
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "eb17a5ec4314526d42fc567821aeb9a6",
    PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID:
      process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID || "ceba2f84-45ff-4717-b3e9-0acf0d062abd",
    NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: process.env.NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID || "ecosystem.b3dotfun",
    NEXT_PUBLIC_B3_API: process.env.NEXT_PUBLIC_B3_API || "https://b3-api-development.up.railway.app",
  },
};

module.exports = nextConfig;
