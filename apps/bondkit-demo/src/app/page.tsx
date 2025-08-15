"use client";

import { BondkitTokenData } from "@/types";
import { DEFAULT_API_ENDPOINT_BONDKIT } from "@/types/constants";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SignInWithB3OnBase from "./SignInWithB3OnBase";

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

  // format "2025-08-14T17:45:01.000Z"
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
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
      <div className="flex min-h-screen flex-col bg-b3-react-background text-b3-react-foreground">
        <header className="border-b border-b3-react-border bg-b3-react-card">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-b3-react-foreground">Bondkit</h1>
              <SignInWithB3OnBase />
            </div>
          </div>
        </header>
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-b3-react-primary"></div>
            <p className="text-b3-react-muted-foreground">Loading tokens...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-b3-react-background">
      {/* Header */}
      <header className="border-b border-b3-react-border bg-b3-react-card">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-bold text-b3-react-foreground">Bondkit</h1>
              <nav className="hidden md:flex items-center space-x-1">
                <div className="px-4 py-2 rounded-lg bg-b3-react-primary text-b3-react-primary-foreground text-sm font-medium">
                  Tokens
                </div>
                <button
                  onClick={() => router.push("/deploy")}
                  className="px-4 py-2 rounded-lg text-b3-react-muted-foreground hover:text-b3-react-foreground hover:bg-b3-react-subtle text-sm font-medium transition-colors"
                >
                  Deploy Token
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-b3-react-primary px-4 py-2 text-sm text-b3-react-primary-foreground transition-colors hover:bg-b3-react-primary/90 disabled:opacity-50"
              >
                <span className={`${isLoading ? "animate-spin" : ""}`}>🔄</span>
                Refresh
              </button>
              <SignInWithB3OnBase />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Error State */}
          {error && (
            <div className="mb-8 rounded-lg border border-red-500 bg-red-500/10 p-4">
              <p className="text-red-400">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-b3-react-foreground">Token Explorer</h2>
              <p className="mt-1 text-b3-react-muted-foreground">Discover and trade bonding curve tokens</p>
            </div>
            <div className="mt-6 lg:mt-0 flex items-center space-x-6">
              <div className="text-center lg:text-right">
                <p className="text-sm text-b3-react-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold text-b3-react-foreground">{tokens.length}</p>
              </div>
              <button
                onClick={() => router.push("/deploy")}
                className="rounded-lg bg-b3-react-primary px-6 py-3 text-b3-react-primary-foreground font-medium transition-colors hover:bg-b3-react-primary/90 shadow-sm"
              >
                Deploy New Token
              </button>
            </div>
          </div>

          {/* Content */}
          {tokens.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto max-w-md">
                <svg className="mx-auto h-12 w-12 text-b3-react-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-b3-react-foreground mb-2">No tokens found</h3>
                <p className="text-b3-react-muted-foreground mb-6">Get started by deploying your first bonding curve token</p>
                <button
                  onClick={() => router.push("/deploy")}
                  className="rounded-lg bg-b3-react-primary px-6 py-3 text-b3-react-primary-foreground font-medium transition-colors hover:bg-b3-react-primary/90"
                >
                  Deploy Your First Token
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <div className="bg-b3-react-card rounded-xl border border-b3-react-border shadow-sm overflow-hidden">
                {/* Desktop Table View - Always show as table on larger screens */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-b3-react-subtle">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-b3-react-muted-foreground uppercase tracking-wider">
                        Token
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-b3-react-muted-foreground uppercase tracking-wider">
                        Network
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-b3-react-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-b3-react-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-b3-react-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-b3-react-border">
                    {tokens.map((token) => (
                      <tr 
                        key={token._id}
                        className="hover:bg-b3-react-subtle transition-colors cursor-pointer group"
                        onClick={() => handleTokenSelect(token.contractAddress)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {token.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4 min-w-0">
                              <div className="text-sm font-semibold text-b3-react-foreground group-hover:text-b3-react-primary transition-colors">
                                {token.name}
                              </div>
                              <div className="text-sm text-blue-400 font-mono font-medium">${token.symbol}</div>
                              <div className="text-xs text-b3-react-muted-foreground font-mono truncate">
                                {formatAddress(token.contractAddress)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                            <span className="text-sm text-b3-react-foreground font-medium">
                              {getChainName(token.chainId)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              token.isActive 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${token.isActive ? "bg-green-500" : "bg-gray-400"}`}></div>
                            {token.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-b3-react-muted-foreground">
                          {formatDate(token.initializationTimestamp)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTokenSelect(token.contractAddress);
                              }}
                              className="text-b3-react-primary hover:text-b3-react-primary/80 bg-b3-react-primary/10 hover:bg-b3-react-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Trade
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(token.contractAddress);
                              }}
                              className="text-b3-react-muted-foreground hover:text-b3-react-foreground p-2 rounded-lg hover:bg-b3-react-subtle transition-colors"
                              title="Copy contract address"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
