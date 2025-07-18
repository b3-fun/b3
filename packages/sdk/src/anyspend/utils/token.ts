import { avalanche, bsc, polygon } from "viem/chains";
import { RELAY_ETH_ADDRESS, RELAY_SOL_ADDRESS, RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend/constants";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === RELAY_ETH_ADDRESS || address.toLowerCase() === RELAY_SOL_ADDRESS;
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
    address: RELAY_ETH_ADDRESS,
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
    address: RELAY_ETH_ADDRESS,
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
    address: RELAY_ETH_ADDRESS,
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
    address: RELAY_ETH_ADDRESS,
    symbol: "AVAX",
    name: "AVAX",
    decimals: 18,
    metadata: {
      logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
    },
  };
}
