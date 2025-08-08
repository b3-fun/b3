import type { ChainNetworks } from "@b3dotfun/sdk/global-account/types/chain-networks";
import { toThirdwebChain, toViemChain } from "@b3dotfun/sdk/shared/utils/chain-transformers";
import invariant from "invariant";

import type { Chain as ThirdwebChain } from "thirdweb";
// Import the JSON directly
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import chainNetworksJSON from "../../generated/chain-networks.json" with { type: "json" };
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import coingeckoChainsJSON from "../../generated/coingecko-chains.json" with { type: "json" };

const chainNetworks = chainNetworksJSON as ChainNetworks[];

// Convert custom chains to Viem format
const viemChains = chainNetworks.map(toViemChain);

// TODO: link to doc explaining why we don't support all chains and how to add more
// These are the chains that are supported for things such as bridging and fetching balances
export const supportedChains = [...viemChains];

// ThirdWeb format chains
export const supportedChainsTW: ThirdwebChain[] = [
  ...chainNetworks
    .map(chain => {
      const networkData = chainNetworks.find(n => n.id === chain.id);
      return networkData ? toThirdwebChain(networkData) : undefined;
    })
    .filter((chain): chain is NonNullable<typeof chain> => chain !== undefined),
];

// Original format from chain-networks.json
export const supportedChainNetworks = chainNetworks;

// CoinGecko chain mapping
export const coingeckoChains = coingeckoChainsJSON as Record<
  number,
  {
    coingecko_id: string;
    name: string;
    native_coin_id: string;
  }
>;
// Helper function to get CoinGecko chain info
export function getCoingeckoChainInfo(chainId: number) {
  return coingeckoChains[chainId];
}

const _b3MainnetThirdWeb: ThirdwebChain | undefined = supportedChainsTW.find(chain => chain.id === 8333);
invariant(_b3MainnetThirdWeb, "B3 mainnet chain not found in supported chains TW");
export const b3MainnetThirdWeb = _b3MainnetThirdWeb;

const _b3TestnetThirdWeb: ThirdwebChain | undefined = supportedChainsTW.find(chain => chain.id === 1993);
invariant(_b3TestnetThirdWeb, "B3 testnet chain not found in supported chains TW");
export const b3TestnetThirdWeb = _b3TestnetThirdWeb;

const _b3Mainnet = supportedChains.find(chain => chain.id === 8333);
invariant(_b3Mainnet, "B3 mainnet chain not found in supported chains");
export const b3Mainnet = _b3Mainnet;

const _b3Testnet = supportedChains.find(chain => chain.id === 1993);
invariant(_b3Testnet, "B3 testnet chain not found in supported chains");
export const b3Testnet = _b3Testnet;

const _baseMainnet = supportedChains.find(chain => chain.id === 8453);
invariant(_baseMainnet, "Base mainnet chain not found in supported chains");
export const baseMainnet = _baseMainnet;

/**
 * Get a Thirdweb chain by chain ID from supportedChainsTW
 */
export function getThirdwebChain(chainId: number): ThirdwebChain {
  const chain = supportedChainsTW.find(c => c.id === chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} is not supported`);
  }
  return chain;
}
