/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@b3dotfun/sdk"],
  env: {
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "f393c7eb287696dc4db76d980cc68328",
    NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: process.env.NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID || "ecosystem.b3-open-gaming",
    PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID:
      process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID || "dbcd5e9b-564e-4ba0-91a0-becf0edabb61",
    NEXT_PUBLIC_B3_API: "https://api.b3.fun",
  },
};

module.exports = nextConfig;
