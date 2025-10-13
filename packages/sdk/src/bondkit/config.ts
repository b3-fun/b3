import type { Address } from "viem";
import { base, type Chain } from "viem/chains";
import { BaseBondkitTokenFactoryContractAddress, BaseMainnetRpcUrl } from "./constants";

export interface Config {
  chain: Chain;
  rpcUrl: string;
  factoryAddress: Address;
  apiEndpoint: string;
  chartApiEndpoint: string;
}

export type SupportedChainId = typeof base.id;

const baseMainnetConfig: Config = {
  chain: base,
  rpcUrl: BaseMainnetRpcUrl,
  factoryAddress: BaseBondkitTokenFactoryContractAddress,
  apiEndpoint: "https://api.b3.fun/bondkit-tokens",
  chartApiEndpoint: "https://bondkit-chart-api.b3.fun",
};

export const getConfig = (chainId: number, rpcUrl?: string): Config => {
  if (chainId === base.id) {
    return {
      ...baseMainnetConfig,
      rpcUrl: rpcUrl || BaseMainnetRpcUrl,
    };
  }
  throw new Error(`Unsupported chainId: ${chainId}. This SDK is configured for Base (Chain ID: ${base.id}) only.`);
};
