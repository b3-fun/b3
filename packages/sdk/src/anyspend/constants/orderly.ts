import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from "viem";
import { components } from "../types/api";

/**
 * Orderly Network Omnichain Configuration
 * Supports deposits from any chain where Orderly has a vault
 *
 * @see https://orderly.network/docs/build-on-omnichain/addresses
 */

export interface OrderlyChainConfig {
  /** Chain ID */
  chainId: number;
  /** Display name */
  name: string;
  /** Vault contract address */
  vaultAddress: `0x${string}`;
  /** USDC token address (or USDC.e for some chains) */
  usdcAddress: `0x${string}`;
  /** USDC decimals (usually 6, but some chains may differ) */
  usdcDecimals: number;
  /** Token symbol (USDC or USDC.e) */
  usdcSymbol: string;
  /** Whether USDT is also supported */
  supportsUsdt?: boolean;
  /** USDT address if supported */
  usdtAddress?: `0x${string}`;
  /** Public RPC URL */
  rpcUrl: string;
  /** Block explorer URL */
  explorerUrl: string;
  /** Chain logo URI */
  logoUri?: string;
}

/**
 * All Orderly supported chains with their contract addresses
 * Mainnet addresses only
 */
export const ORDERLY_CHAINS: Record<number, OrderlyChainConfig> = {
  // Arbitrum One
  42161: {
    chainId: 42161,
    name: "Arbitrum",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    supportsUsdt: true,
    usdtAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    rpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    explorerUrl: "https://arbiscan.io",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg",
  },

  // Optimism
  10: {
    chainId: 10,
    name: "Optimism",
    vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    usdcAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://optimism-rpc.publicnode.com",
    explorerUrl: "https://optimistic.etherscan.io",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_optimism.jpg",
  },

  // Base
  8453: {
    chainId: 8453,
    name: "Base",
    vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://base-rpc.publicnode.com",
    explorerUrl: "https://basescan.org",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
  },

  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: "Ethereum",
    vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    supportsUsdt: true,
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    explorerUrl: "https://etherscan.io",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
  },

  // Mantle
  5000: {
    chainId: 5000,
    name: "Mantle",
    vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    usdcAddress: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
    usdcDecimals: 6,
    usdcSymbol: "USDC.e",
    rpcUrl: "https://rpc.mantle.xyz",
    explorerUrl: "https://mantlescan.xyz",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_mantle.jpg",
  },

  // Avalanche C-Chain
  43114: {
    chainId: 43114,
    name: "Avalanche",
    vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://avalanche-c-chain-rpc.publicnode.com",
    explorerUrl: "https://snowtrace.io",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg",
  },

  // BNB Smart Chain
  56: {
    chainId: 56,
    name: "BNB Chain",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    usdcDecimals: 18, // BSC USDC has 18 decimals
    usdcSymbol: "USDC",
    supportsUsdt: true,
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
    rpcUrl: "https://bsc-rpc.publicnode.com",
    explorerUrl: "https://bscscan.com",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_binance.jpg",
  },

  // Polygon PoS
  137: {
    chainId: 137,
    name: "Polygon",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native USDC on Polygon
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    explorerUrl: "https://polygonscan.com",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
  },

  // SEI
  1329: {
    chainId: 1329,
    name: "SEI",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://evm-rpc.sei-apis.com",
    explorerUrl: "https://seitrace.com",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_sei.jpg",
  },

  // Mode
  34443: {
    chainId: 34443,
    name: "Mode",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0xd988097fb8612cc24eeC14542bC03424c656005f",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://mainnet.mode.network",
    explorerUrl: "https://modescan.io",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_mode.jpg",
  },

  // Abstract
  2741: {
    chainId: 2741,
    name: "Abstract",
    vaultAddress: "0xE80F2396A266e898FBbD251b89CFE65B3e41fD18", // Different vault address!
    usdcAddress: "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://api.mainnet.abs.xyz",
    explorerUrl: "https://abscan.org",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_abstract.jpg",
  },

  // Morph
  2818: {
    chainId: 2818,
    name: "Morph",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0xe34c91815d7fc18A9e2148bcD4241d0a5848b693",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://rpc.morphl2.io",
    explorerUrl: "https://explorer.morphl2.io",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_morph.jpg",
  },

  // Sonic (formerly Fantom Sonic)
  146: {
    chainId: 146,
    name: "Sonic",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0x29219dd037d542be3f1a41f28cdafee7a38f5894", // Fixed truncated address
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://rpc.soniclabs.com",
    explorerUrl: "https://sonicscan.org",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_sonic.jpg",
  },

  // Berachain
  80094: {
    chainId: 80094,
    name: "Berachain",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0x549943e04f40284185054145c6e4e9568c1d3241",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://rpc.berachain.com",
    explorerUrl: "https://berascan.com",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_berachain.jpg",
  },

  // Story
  1516: {
    chainId: 1516,
    name: "Story",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://mainnet.storyrpc.io",
    explorerUrl: "https://storyscan.xyz",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_story.jpg",
  },

  // Plume
  98865: {
    chainId: 98865,
    name: "Plume",
    vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    usdcAddress: "0x78adD880A697070c1e765Ac44D65323a0DcCE913",
    usdcDecimals: 6,
    usdcSymbol: "USDC",
    rpcUrl: "https://rpc.plume.org",
    explorerUrl: "https://explorer.plume.org",
    logoUri: "https://icons.llamao.fi/icons/chains/rsz_plume.jpg",
  },
} as const;

/**
 * Get list of all supported Orderly chain IDs
 */
export const ORDERLY_SUPPORTED_CHAIN_IDS = Object.keys(ORDERLY_CHAINS).map(Number);

/**
 * Primary/recommended chains for deposits (most liquid)
 */
export const ORDERLY_PRIMARY_CHAINS = [42161, 10, 8453, 1, 137, 56] as const;

/**
 * Default chain for Orderly deposits
 */
export const ORDERLY_DEFAULT_CHAIN_ID = 42161; // Arbitrum

// Pre-computed hashes for efficiency
export const ORDERLY_HASHES = {
  USDC_TOKEN_HASH: keccak256(toBytes("USDC")),
  USDT_TOKEN_HASH: keccak256(toBytes("USDT")),
} as const;

// Deposit fee buffer (5% like SDK)
export const ORDERLY_DEPOSIT_FEE_BUFFER = 105n;

// Vault ABI for deposit and getDepositFee functions
export const ORDERLY_VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "depositData",
        type: "tuple",
        components: [
          { name: "accountId", type: "bytes32" },
          { name: "brokerHash", type: "bytes32" },
          { name: "tokenHash", type: "bytes32" },
          { name: "tokenAmount", type: "uint128" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "getDepositFee",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      {
        name: "depositData",
        type: "tuple",
        components: [
          { name: "accountId", type: "bytes32" },
          { name: "brokerHash", type: "bytes32" },
          { name: "tokenHash", type: "bytes32" },
          { name: "tokenAmount", type: "uint128" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Get Orderly chain config by chain ID
 */
export function getOrderlyChainConfig(chainId: number): OrderlyChainConfig | undefined {
  return ORDERLY_CHAINS[chainId];
}

/**
 * Check if a chain is supported by Orderly
 */
export function isOrderlyChainSupported(chainId: number): boolean {
  return chainId in ORDERLY_CHAINS;
}

/**
 * Get USDC token definition for AnySpend by chain ID
 */
export function getOrderlyUsdcToken(chainId: number): components["schemas"]["Token"] | undefined {
  const config = ORDERLY_CHAINS[chainId];
  if (!config) return undefined;

  return {
    chainId: config.chainId,
    address: config.usdcAddress,
    symbol: config.usdcSymbol,
    name: config.usdcSymbol === "USDC.e" ? "Bridged USD Coin" : "USD Coin",
    decimals: config.usdcDecimals,
    metadata: {
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    },
  };
}

/**
 * Compute Orderly accountId from wallet address and broker ID
 * Formula: keccak256(abi.encode(address, keccak256(brokerId)))
 */
export function computeOrderlyAccountId(walletAddress: `0x${string}`, brokerId: string): `0x${string}` {
  const brokerIdHash = keccak256(toBytes(brokerId));
  return keccak256(encodeAbiParameters(parseAbiParameters("address, bytes32"), [walletAddress, brokerIdHash]));
}

/**
 * Compute broker hash from broker ID
 */
export function computeBrokerHash(brokerId: string): `0x${string}` {
  return keccak256(toBytes(brokerId));
}
