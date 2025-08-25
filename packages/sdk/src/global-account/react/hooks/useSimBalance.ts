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

async function fetchSimBalance(address: string): Promise<SimBalanceResponse> {
  if (!address) throw new Error("Address is required");

  let url = `https://simdune-api.sean-430.workers.dev/?url=https://api.sim.dune.com/v1/evm/balances/${address}?metadata=logo&chain_ids=mainnet`;
  if (process.env.PUBLIC_LOCAL_KEY) {
    url += `&localkey=${process.env.PUBLIC_LOCAL_KEY}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch balance: ${response.statusText}`);
  }

  const balanceData: SimBalanceResponse = await response.json();
  return balanceData;
}

export function useSimBalance(address?: string) {
  return useQuery({
    queryKey: ["simBalance", address],
    queryFn: () => {
      if (!address) throw new Error("Address is required");
      return fetchSimBalance(address);
    },
    enabled: Boolean(address),
  });
}
