import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { b3, Chain } from "viem/chains";

const baseChainBaseUrl = "https://basescan.org";

export function getChainById(id: number): Chain | undefined {
  return Object.values(supportedChains).find(chain => chain.id === id);
}

export function chainIdToName(id: number) {
  const name = getChainById(id)?.name;
  return name === "Base Mainnet" ? "Base" : name === "The Open Network" ? "Open Network" : name;
}

export function getExplorerUrl(chain: Chain, txHash: string): string {
  if (chain.id === b3.id) {
    return "https://explorer.b3.fun/b3/tx/" + txHash;
  }
  let baseUrl = chain.blockExplorers?.default.url;
  if (chain.id === 8453) {
    baseUrl = baseChainBaseUrl;
  }
  return baseUrl ? `${baseUrl}/tx/${txHash}` : "";
}

export function getAddressExplorerUrl(chain: Chain, address: string): string {
  let baseUrl = chain.blockExplorers?.default.url;
  if (chain.id === 8453) {
    baseUrl = baseChainBaseUrl;
  }
  return baseUrl ? `${baseUrl}/address/${address}` : "";
}

export function getTokenExplorerUrl(chain: Chain, tokenAddress: string, tokenId?: string): string {
  let baseUrl = chain?.blockExplorers?.default?.url ?? "https://explorer.b3.fun";
  if (chain.id === 8453) {
    baseUrl = baseChainBaseUrl;
  }
  const tokenUrl = `${baseUrl}/token/${tokenAddress}`;
  return tokenId ? `${tokenUrl}/instance/${tokenId}` : tokenUrl;
}
