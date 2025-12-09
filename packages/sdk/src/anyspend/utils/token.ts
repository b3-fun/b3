import { RELAY_SOL_ADDRESS, RELAY_SOLANA_MAINNET_CHAIN_ID, ZERO_ADDRESS } from "@b3dotfun/sdk/anyspend/constants";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { avalanche, bsc, polygon } from "viem/chains";

export const HYPERLIQUID_CHAIN_ID = 1337;
export const HYPEREVM_CHAIN_ID = 999;

export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS || address.toLowerCase() === RELAY_SOL_ADDRESS;
}

export function getSolanaToken(): components["schemas"]["Token"] {
  return {
    chainId: RELAY_SOLANA_MAINNET_CHAIN_ID,
    address: RELAY_SOL_ADDRESS,
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    metadata: {
      logoURI: "https://assets.relay.link/icons/square/792703809/light.png",
    },
  };
}

export function getEthToken(chainId: number): components["schemas"]["Token"] {
  return {
    chainId: chainId,
    address: ZERO_ADDRESS,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    metadata: {
      logoURI: "https://assets.relay.link/icons/square/1/light.png",
    },
  };
}

export function getPolToken(): components["schemas"]["Token"] {
  return {
    chainId: polygon.id,
    address: ZERO_ADDRESS,
    symbol: "POL",
    name: "Polygon",
    decimals: 18,
    metadata: {
      logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/28321.png",
    },
  };
}

export function getBnbToken(): components["schemas"]["Token"] {
  return {
    chainId: bsc.id,
    address: ZERO_ADDRESS,
    symbol: "BNB",
    name: "BNB",
    decimals: 18,
    metadata: {
      logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    },
  };
}

export function getAvaxToken(): components["schemas"]["Token"] {
  return {
    chainId: avalanche.id,
    address: ZERO_ADDRESS,
    symbol: "AVAX",
    name: "AVAX",
    decimals: 18,
    metadata: {
      logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
    },
  };
}

export function getHyperEVMNativeToken(): components["schemas"]["Token"] {
  return {
    chainId: HYPEREVM_CHAIN_ID,
    address: ZERO_ADDRESS,
    symbol: "HYPE",
    name: "HYPE",
    decimals: 18,
    metadata: {
      logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png",
    },
  };
}

export function getHyperliquidUSDCToken(): components["schemas"]["Token"] {
  return {
    chainId: HYPERLIQUID_CHAIN_ID,
    address: ZERO_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    metadata: {
      logoURI: "https://ethereum-optimism.github.io/data/USDC/logo.png",
    },
  };
}
