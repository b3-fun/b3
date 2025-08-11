"use client";

import { BondkitTokenData } from "@/types";
import { DEFAULT_API_ENDPOINT_BONDKIT } from "@/types/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

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
  const { address, isConnected } = useAccount();
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
    const date =
      timestamp > 1000000000000
        ? new Date(timestamp)
        : new Date(timestamp * 1000);
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
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Bondkit Tokens</h1>
          <ConnectButton />
        </header>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tokens...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Bondkit Tokens</h1>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
          >
            <span className={`${isLoading ? "animate-spin" : ""}`}>🔄</span>
            Refresh
          </button>
        </div>
        <ConnectButton />
      </header>

      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-300">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Available Tokens ({tokens.length})
            </h2>
            <p className="text-gray-400">
              Click on any token to view details and start trading
            </p>
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No tokens found</p>
              <p className="text-gray-500 text-sm mt-2">
                Deploy a new token to get started
              </p>
              <button
                onClick={() => router.push("/deploy")}
                className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Deploy New Token
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokens.map((token) => (
                <div
                  key={token._id}
                  onClick={() => handleTokenSelect(token.contractAddress)}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {token.name}
                      </h3>
                      <p className="text-blue-400 font-mono text-sm">
                        ${token.symbol}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          token.isActive
                            ? "bg-green-600 text-white"
                            : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {token.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">
                        Contract Address
                      </p>
                      <p className="font-mono text-sm text-gray-300 break-all">
                        {formatAddress(token.contractAddress)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Network</p>
                        <p className="text-sm font-medium">
                          {getChainName(token.chainId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Block</p>
                        <p className="text-sm font-mono">
                          #{token.initializationBlockNumber.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Created</p>
                      <p className="text-sm">
                        {formatTimestamp(token.initializationTimestamp)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Initializer</p>
                      <p className="font-mono text-sm text-gray-300">
                        {formatAddress(token.initializer)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
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
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Deploy New Token
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
