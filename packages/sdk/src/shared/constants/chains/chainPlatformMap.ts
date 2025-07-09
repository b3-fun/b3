export const CHAIN_PLATFORM_MAP = {
  // Ethereum Mainnet
  1: "ethereum",
  // BNB Smart Chain
  56: "binance-smart-chain",
  // Polygon
  137: "polygon-pos",
  // Arbitrum One
  42161: "arbitrum-one",
  // Optimism
  10: "optimistic-ethereum",
  // Avalanche
  43114: "avalanche",
  // Fantom
  250: "fantom",
  // Cronos
  25: "cronos",
  // Base
  8453: "base",
  // zkSync
  324: "zksync",
  // Arbitrum Nova
  42170: "arbitrum-nova",
  // Linea
  59144: "linea",
  // Polygon zkEVM
  1101: "polygon-zkevm",
  // Scroll
  534352: "scroll",
  // Mantle
  5000: "mantle",
  // Metis
  1088: "metis-andromeda",
  // Celo
  42220: "celo",
  // Gnosis Chain
  100: "xdai",
  // Moonbeam
  1284: "moonbeam",
} as const;

export type ChainId = keyof typeof CHAIN_PLATFORM_MAP;
export type PlatformId = (typeof CHAIN_PLATFORM_MAP)[ChainId];

export function getPlatformId(chainId: ChainId): PlatformId {
  return CHAIN_PLATFORM_MAP[chainId];
}
