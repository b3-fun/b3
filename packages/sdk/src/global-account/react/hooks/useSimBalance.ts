import { useQuery } from "@tanstack/react-query";

export interface SimTokenMetadata {
  logo?: string;
}

export interface SimBalanceItem {
  chain: string;
  chain_id: number;
  address: string;
  amount: string;
  symbol: string;
  decimals: number;
  price_usd?: number;
  value_usd?: number;
  name?: string;
  token_metadata?: SimTokenMetadata;
  pool_size?: number;
  low_liquidity?: boolean;
}

export interface SimBalanceResponse {
  request_time: string;
  response_time: string;
  wallet_address: string;
  balances: SimBalanceItem[];
}

// SVM-specific types
export interface SvmBalanceItem {
  chain: string;
  address: string;
  amount: string;
  balance: string;
  raw_balance: string;
  value_usd?: number;
  program_id: string | null;
  decimals: number;
  total_supply: string;
  metadata_address?: string;
  name?: string;
  symbol: string;
  uri?: string | null;
  price_usd?: number;
  liquidity_usd?: number;
  pool_type?: string | null;
  pool_address?: string | null;
  mint_authority?: string | null;
}

export interface SvmBalanceResponse {
  processing_time_ms?: number;
  wallet_address: string;
  next_offset?: string;
  balances_count?: number;
  balances: SvmBalanceItem[];
}

async function fetchSimBalance(address: string, chainIdsParam: number[]): Promise<SimBalanceResponse> {
  if (!address) throw new Error("Address is required");

  const chainIds = chainIdsParam.length === 0 ? "mainnet" : chainIdsParam.join(",");
  let url = `https://simdune-api.sean-430.workers.dev/?url=https://api.sim.dune.com/v1/evm/balances/${address}?metadata=logo&chain_ids=${chainIds}&exclude_spam_tokens=true`;
  if (process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET) {
    url += `&localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch balance: ${response.statusText}`);
  }

  const balanceData: SimBalanceResponse = await response.json();
  return balanceData;
}

async function fetchSimTokenBalance(
  walletAddress: string,
  tokenAddress: string,
  chainId: number,
): Promise<SimBalanceResponse> {
  if (!walletAddress) throw new Error("Wallet address is required");
  if (!tokenAddress) throw new Error("Token address is required");

  let url = `https://simdune-api.sean-430.workers.dev/?url=https://api.sim.dune.com/v1/evm/balances/${walletAddress}/token/${tokenAddress}?chain_ids=${chainId}`;
  if (process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET) {
    url += `&localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch token balance: ${response.statusText}`);
  }

  const balanceData: SimBalanceResponse = await response.json();
  return balanceData;
}

async function fetchSimSvmBalance(address: string, chains?: string[], limit?: number): Promise<SvmBalanceResponse> {
  if (!address) throw new Error("Address is required");

  const queryParams = new URLSearchParams();
  if (chains && chains.length > 0) {
    queryParams.append("chains", chains.join(","));
  }
  if (limit) {
    queryParams.append("limit", limit.toString());
  }

  let url = `https://simdune-api.sean-430.workers.dev/?url=https://api.sim.dune.com/beta/svm/balances/${address}`;
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  if (process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET) {
    url += `${queryParams.toString() ? "&" : "?"}localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch SVM balance: ${response.statusText}`);
  }

  const balanceData: SvmBalanceResponse = await response.json();
  return balanceData;
}

export function useSimBalance(address?: string, chainIdsParam?: number[]) {
  return useQuery({
    queryKey: ["simBalance", address, chainIdsParam],
    queryFn: () => {
      if (!address) throw new Error("Address is required");
      return fetchSimBalance(address, chainIdsParam || []);
    },
    enabled: Boolean(address),
  });
}

export function useSimSvmBalance(address?: string, chains?: ("solana" | "eclipse")[], limit?: number) {
  return useQuery({
    queryKey: ["svmBalance", address, chains, limit],
    queryFn: () => {
      if (!address) throw new Error("Address is required");
      return fetchSimSvmBalance(address, chains, limit);
    },
    enabled: Boolean(address),
  });
}

/**
 * Hook to fetch a single token balance for a wallet.
 * @param walletAddress - The wallet address to fetch balance for
 * @param tokenAddress - The token contract address, or "native" for native token (ETH, etc.)
 * @param chainId - Chain ID to query (defaults to 1 for Ethereum mainnet)
 */
export function useSimTokenBalance(walletAddress: string, tokenAddress: string, chainId: number) {
  return useQuery({
    queryKey: ["simTokenBalance", walletAddress, tokenAddress, chainId],
    queryFn: () => {
      return fetchSimTokenBalance(walletAddress, tokenAddress, chainId);
    },
    enabled: Boolean(walletAddress) && Boolean(tokenAddress),
  });
}
