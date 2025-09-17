import type { Address, Hex } from "viem";

export type TokenDetails = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner: Address;
};

// From BondkitTokenFactoryABI for deployBondkitToken function
export type BondkitTokenConfig = {
  name: string;
  symbol: string;
  feeRecipient: Address;
  finalTokenSupply: bigint;
  aggressivenessFactor: number; // uint8
  lpSplitRatioFeeRecipientBps: bigint;
  targetAmount: bigint;
  tradingToken: Address;
  migrationAdminAddress: Address;
  bondingPhaseSplitter: Address;
  v4PoolManager: Address;
  v4Hook: Address;
  v4PoolFee: number;
  v4TickSpacing: number;
};

// Event type for BondkitTokenCreated from BondkitTokenFactoryABI
export type BondkitTokenCreatedEventArgs = {
  tokenAddress: Address;
  implementationAddress: Address;
  name: string;
  symbol: string;
  feeRecipient: Address;
  migrationAdmin: Address;
};

// From BondkitTokenABI for initialize function
// This is the same structure as BondkitTokenConfig from the factory, re-using it.
// If they can diverge, define a separate type here.
export type BondkitTokenInitializationConfig = BondkitTokenConfig;

// Event type for Bought from BondkitTokenABI
export type BoughtEventArgs = {
  buyer: Address;
  ethIn: bigint;
  tokensOut: bigint;
  feeRecipientFee: bigint;
};

// Event type for Sold from BondkitTokenABI
export type SoldEventArgs = {
  seller: Address;
  tokensIn: bigint;
  ethOut: bigint;
  feeRecipientFee: bigint;
};

// Event type for DexMigration from BondkitTokenABI
export type DexMigrationEventArgs = {
  ethForLp: bigint;
  tokensForLp: bigint;
  ethForFeeRecipient: bigint;
};

// Enum for Status (matches contract Status enum exactly)
export enum TokenStatus {
  Uninitialized = 0,
  Bonding = 1,
  Dex = 2,
}

export interface GetTransactionHistoryOptions {
  userAddress?: Address;
  type?: "buy" | "sell";
  from?: number;
  to?: number;
  // The number of records to return. Minimum 1, maximum 100.
  limit?: number;
  offset?: number;
}

export interface Transaction {
  timestamp: number;
  price: number;
  amount: string; // API returns amount as a string
  type: "buy" | "sell";
  userAddress: Address;
  txHash: Hex;
  chainId: number;
  blockNumber?: number;
  totalEthRaisedBonding?: string;
  value?: string;
}

export interface TransactionResponse {
  total: number;
  limit: number;
  skip: number;
  data: Transaction[];
}

export interface SwapQuote {
  amountOut: string;
  amountOutMin: string;
  priceImpact: string;
  executionPrice: string;
  fee: string;
}
