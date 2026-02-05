/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@b3dotfun/sdk"],
  env: {
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "eb17a5ec4314526d42fc567821aeb9a6",
    NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID:
      process.env.NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID || "b9aac999-efef-4625-96d6-8043f20ec615",
    NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: process.env.NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID || "ecosystem.b3dotfun",
    NEXT_PUBLIC_B3_API: process.env.NEXT_PUBLIC_B3_API || "https://b3-api-development.up.railway.app",
    NEXT_PUBLIC_ANYSPEND_BASE_URL: process.env.NEXT_PUBLIC_ANYSPEND_BASE_URL || "https://mainnet.anyspend.com",
    NEXT_PUBLIC_DEVMODE_SHARED_SECRET:
      process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET || "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
  },
};

module.exports = nextConfig;
