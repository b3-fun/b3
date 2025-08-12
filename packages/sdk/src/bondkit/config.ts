import type { Address } from "viem";
import { base, type Chain } from "viem/chains";
import { BaseBondkitTokenFactoryContractAddress, BaseMainnetRpcUrl } from "./constants";

export interface Config {
  chain: Chain;
  rpcUrl: string;
  factoryAddress: Address;
  apiEndpoint: string;
}

export type SupportedChainId = typeof base.id;

const baseMainnetConfig: Config = {
  chain: base,
  rpcUrl: BaseMainnetRpcUrl,
  factoryAddress: BaseBondkitTokenFactoryContractAddress,
  apiEndpoint: "https://api.b3.fun/bondkit-tokens",
};

export const getConfig = (chainId: number): Config => {
  if (chainId === base.id) {
    return baseMainnetConfig;
  }
  throw new Error(`Unsupported chainId: ${chainId}. This SDK is configured for Base (Chain ID: ${base.id}) only.`);
};
