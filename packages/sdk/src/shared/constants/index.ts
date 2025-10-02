export * from "./currency";

export const siteURL = "https://basement.fun";

export const b3CoinIcon = "https://cdn.b3.fun/b3-coin-3d.png";

export const ecosystemWalletId = (process.env.NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID ||
  process.env.EXPO_PUBLIC_THIRDWEB_ECOSYSTEM_ID ||
  "ecosystem.b3-open-gaming") as `ecosystem.${string}`; // Fallback to prod key lookup

export const tokenIcons = {
  ETH: "https://cdn.b3.fun/ethereum.svg",
  WETH: "https://cdn.b3.fun/wrapped-ethereum.svg",
  USDC: "https://cdn.b3.fun/usd-coin.svg",
  USDT: "https://cdn.b3.fun/usdt.svg",
  DAI: "https://cdn.b3.fun/dai.svg",
  B3: b3CoinIcon,
  // Add more asset icons as needed
};

export const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY || "";

export const THIRDWEB_CLIENT_ID =
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ||
  "f393c7eb287696dc4db76d980cc68328";

export const CLIENT_APP_BUNDLE_ID = process.env.EXPO_PUBLIC_B3_BUNDLE_ID || "";

export const B3_AUTH_COOKIE_NAME = "b3-auth";

export const ENS_GATEWAY_URL = "https://ens-gateway.b3.fun/";

export const PUBLIC_BASE_RPC_URL = "https://base-rpc.publicnode.com";
