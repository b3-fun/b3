/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@b3dotfun/sdk"],
  env: {
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "f393c7eb287696dc4db76d980cc68328",
    NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3-open-gaming",
    NEXT_PUBLIC_THIRDWEB_PARTNER_ID: "68b6cf34-2699-42f6-8cbc-0d5ea40c6b52",
    NEXT_PUBLIC_B3_API: "https://api.b3.fun",
  },
};

module.exports = nextConfig;
