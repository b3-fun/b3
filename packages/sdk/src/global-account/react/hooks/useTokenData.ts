"use client";

import { useQuery } from "@tanstack/react-query";

// Token API response type
export interface TokenResponse {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

export function useTokenData(chainId?: number, address?: string) {
  return useQuery({
    queryKey: ["tokenData", chainId, address?.toLowerCase()],
    queryFn: async () => {
      try {
        if (!chainId || !address || address.trim() === "") return null;

        const normalizedAddress = address.toLowerCase();

        // Call B3 API - now includes Relay API fallback on the backend
        try {
          const response = await fetch("https://api.b3.fun/tokens", {
            method: "POST",
            headers: {
              "X-Service-Method": "findByAddress",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ chainId, address: normalizedAddress })
          });

          if (response.ok) {
            const data = await response.json();
            if (data) return data as TokenResponse;
          }
        } catch (e) {
          console.error("Error fetching token data:", e);
        }

        return null;
      } catch (error) {
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    enabled: Boolean(chainId) && Boolean(address) && address?.trim() !== "",
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });
}
