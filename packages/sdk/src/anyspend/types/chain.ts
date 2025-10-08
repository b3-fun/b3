import { Chain } from "viem";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

export enum ChainType {
  EVM = "evm",
  SOLANA = "solana",
}

export interface IBaseChain {
  id: number;
  name: string;
  type: ChainType;
  logoUrl: string;
  nativeRequired: bigint;
  canDepositNative: boolean;
  defaultToken: components["schemas"]["Token"];
  nativeToken: components["schemas"]["Token"];
}

export interface IEVMChain extends IBaseChain {
  type: ChainType.EVM;
  viem: Chain;
  pollingInterval: number;
  zapperEnum?: string;
  coingeckoName: string | null;
}

export interface ISolanaChain extends IBaseChain {
  type: ChainType.SOLANA;
  coingeckoName: string;
}
