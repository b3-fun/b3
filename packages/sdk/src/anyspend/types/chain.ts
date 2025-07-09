import { Chain } from "viem";
import { Token } from "./token";

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
  defaultToken: Token;
  nativeToken: Token;
}

export interface IEVMChain extends IBaseChain {
  type: ChainType.EVM;
  viem: Chain;
  pollingInterval: number;
  zapperEnum?: string;
  coingeckoName?: string;
}

export interface ISolanaChain extends IBaseChain {
  type: ChainType.SOLANA;
}
