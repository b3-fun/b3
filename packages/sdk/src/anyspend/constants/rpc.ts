/**
 * Public RPC endpoints for EVM chains.
 * These are free, public endpoints that can be used without API keys.
 *
 * Sources:
 * - https://publicnode.com
 * - https://chainlist.org
 */

// PublicNode endpoints
export const ETHEREUM_PUBLIC_RPC = "https://ethereum-rpc.publicnode.com";
export const ARBITRUM_PUBLIC_RPC = "https://arbitrum-one-rpc.publicnode.com";
export const BASE_PUBLIC_RPC = "https://base-rpc.publicnode.com";
export const OPTIMISM_PUBLIC_RPC = "https://optimism-rpc.publicnode.com";
export const POLYGON_PUBLIC_RPC = "https://polygon-bor-rpc.publicnode.com";
export const AVALANCHE_PUBLIC_RPC = "https://avalanche-c-chain-rpc.publicnode.com";
export const BSC_PUBLIC_RPC = "https://bsc-rpc.publicnode.com";

// Chain-specific public endpoints
export const B3_PUBLIC_RPC = "https://mainnet-rpc.b3.fun/http";
export const ABSTRACT_PUBLIC_RPC = "https://api.mainnet.abs.xyz";
export const HYPEREVM_PUBLIC_RPC = "https://rpc.hyperliquid.xyz/evm";

/**
 * Map of chain IDs to their default public RPC URLs.
 */
export const PUBLIC_RPC_URLS: Record<number, string> = {
  1: ETHEREUM_PUBLIC_RPC, // Ethereum Mainnet
  42161: ARBITRUM_PUBLIC_RPC, // Arbitrum One
  8453: BASE_PUBLIC_RPC, // Base
  10: OPTIMISM_PUBLIC_RPC, // Optimism
  137: POLYGON_PUBLIC_RPC, // Polygon
  43114: AVALANCHE_PUBLIC_RPC, // Avalanche C-Chain
  56: BSC_PUBLIC_RPC, // BNB Smart Chain
  8333: B3_PUBLIC_RPC, // B3
  2741: ABSTRACT_PUBLIC_RPC, // Abstract
  999: HYPEREVM_PUBLIC_RPC, // HyperEVM
};
