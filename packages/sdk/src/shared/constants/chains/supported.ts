import type { ChainNetworks } from "@b3dotfun/sdk/global-account/types/chain-networks";
import { toThirdwebChain, toViemChain } from "@b3dotfun/sdk/shared/utils/chain-transformers";
import invariant from "invariant";
import type { Chain as ThirdwebChain } from "thirdweb";

// Import the JSON directly
// @ts-ignore
import chainNetworksJSON from "../../generated/chain-networks.json" with { type: "json" };
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

export const b3MainnetThirdWeb: ThirdwebChain = supportedChainsTW.find(chain => chain.id === 8333)!;
invariant(b3MainnetThirdWeb, "B3 mainnet chain not found in supported chains TW");

export const b3TestnetThirdWeb: ThirdwebChain = supportedChainsTW.find(chain => chain.id === 1993)!;
invariant(b3TestnetThirdWeb, "B3 testnet chain not found in supported chains TW");

export const b3Mainnet = supportedChains.find(chain => chain.id === 8333)!;
invariant(b3Mainnet, "B3 mainnet chain not found in supported chains");

export const b3Testnet = supportedChains.find(chain => chain.id === 1993)!;
invariant(b3Testnet, "B3 testnet chain not found in supported chains");

export const baseMainnet = supportedChains.find(chain => chain.id === 8453)!;
invariant(baseMainnet, "Base mainnet chain not found in supported chains");
