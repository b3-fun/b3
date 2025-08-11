"use client";

import { BondkitTokenData } from "@/types";
import { DEFAULT_API_ENDPOINT_BONDKIT } from "@/types/constants";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import SignInWithB3OnBase from "./SignInWithB3OnBase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// API function to get tokens
async function useGetTokens(apiEndpoint: string) {
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-service-method": "getAllTokens",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export default function Home() {
  const { address } = useAccountWallet();
  const isConnected = !!address;
  const router = useRouter();

  const [tokens, setTokens] = useState<BondkitTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await useGetTokens(DEFAULT_API_ENDPOINT_BONDKIT);

      const data = await response;
      console.log("Fetched tokens:", data);

      // Handle both direct array and nested data structure
      const tokenList = Array.isArray(data) ? data : data.data || [];
      setTokens(tokenList);
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleTokenSelect = (address: string) => {
    router.push(`/token/${address}`);
  };

  const handleRefresh = () => {
    fetchTokens();
  };

  const formatTimestamp = (timestamp: number) => {
    // Handle both milliseconds and seconds timestamps
    const date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 8453:
        return "Base";
      case 1:
        return "Ethereum";
      default:
        return `Chain ${chainId}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900 text-white">
        <header className="flex items-center justify-between border-b border-gray-700 p-4">
          <h1 className="text-2xl font-bold">Bondkit Tokens</h1>
          <SignInWithB3OnBase />
        </header>
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Loading tokens...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <header className="flex items-center justify-between border-b border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Bondkit Tokens</h1>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:bg-gray-600"
          >
            <span className={`${isLoading ? "animate-spin" : ""}`}>🔄</span>
            Refresh
          </button>
        </div>
        <SignInWithB3OnBase />
      </header>

      <main className="flex-grow p-8">
        <div className="mx-auto max-w-7xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-600 bg-red-900/20 p-4">
              <p className="text-red-300">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">Available Tokens ({tokens.length})</h2>
            <p className="text-gray-400">Click on any token to view details and start trading</p>
          </div>

          {tokens.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-400">No tokens found</p>
              <p className="mt-2 text-sm text-gray-500">Deploy a new token to get started</p>
              <button
                onClick={() => router.push("/deploy")}
                className="mt-4 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700"
              >
                Deploy New Token
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tokens.map(token => (
                <div
                  key={token._id}
                  onClick={() => handleTokenSelect(token.contractAddress)}
                  className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{token.name}</h3>
                      <p className="font-mono text-sm text-blue-400">${token.symbol}</p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          token.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {token.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-xs text-gray-400">Contract Address</p>
                      <p className="break-all font-mono text-sm text-gray-300">
                        {formatAddress(token.contractAddress)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Network</p>
                        <p className="text-sm font-medium">{getChainName(token.chainId)}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Block</p>
                        <p className="font-mono text-sm">#{token.initializationBlockNumber.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-gray-400">Created</p>
                      <p className="text-sm">{formatTimestamp(token.initializationTimestamp)}</p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-gray-400">Initializer</p>
                      <p className="font-mono text-sm text-gray-300">{formatAddress(token.initializer)}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">View Details</span>
                      <span className="text-blue-400">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/deploy")}
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              Deploy New Token
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
