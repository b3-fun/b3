import type { ChainNetworks } from "@b3dotfun/sdk/global-account/types/chain-networks";
import type { Chain as ThirdwebChain } from "thirdweb";
import { defineChain as defineThirdwebChain } from "thirdweb";
import { Chain } from "viem";

export function toViemChain(network: ChainNetworks): Chain {
  return {
    id: network.id,
    name: network.name,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: {
      default: {
        http: [network.rpcUrls.default.http],
        webSocket: network.rpcUrls.default.ws ? [network.rpcUrls.default.ws] : undefined,
      },
    },
    blockExplorers: {
      default: {
        name: network.blockExplorers.explorerTitle,
        url: network.blockExplorers.default,
      },
    },
    contracts: network.contracts,
    testnet: network.testnet,
    sourceId: network.sourceId,
    formatters: network.formatters,
    fees: network.fees,
  };
}

export function toThirdwebChain(network: ChainNetworks): ThirdwebChain {
  return defineThirdwebChain({
    id: network.id,
    name: network.name,
    nativeCurrency: network.nativeCurrency,
    rpc: network.rpcUrls.default.http,
    icon: {
      url: network.icon.url,
      width: network.icon.width,
      height: network.icon.height,
      format: network.icon.format,
    },
    blockExplorers: [
      {
        name: network.blockExplorers.explorerTitle,
        url: network.blockExplorers.default,
      },
    ],
    testnet: network.testnet ? true : undefined,
  });
}
