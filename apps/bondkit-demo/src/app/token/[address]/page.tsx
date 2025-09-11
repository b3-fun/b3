"use client";

import { useBondkit } from "@/hooks/useBondkit";
import { TokenInfo } from "@/types/chart";
import { TokenPhase } from "@/types";
import { TradingView } from "@b3dotfun/sdk/bondkit";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import SignInWithB3OnBase from "../../SignInWithB3OnBase";
import SwapInterface from "../../../components/SwapInterface";

type Action = "buy" | "sell";

function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

interface TokenPageProps {
  params: {
    address: string;
  };
}

export default function TokenPage({ params }: TokenPageProps) {
  const { address: userAddress, isConnected } = useAccount();
  const router = useRouter();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const tokenAddress = params.address as `0x${string}`;

  const {
    tokenName,
    tokenSymbol,
    tokenBalance,
    userEthBalance,
    tradingTokenBalance,
    tradingTokenAddress,
    currentPhase,
    bondingProgress,
    holders,
    owner,
    getBuyQuote,
    getSellQuote,
    buy,
    approve,
    sell,
    migrateToDex,
    isPending,
    hash,
    txType,
    isConfirmed,
    allowance,
    // Use computed values from hook
    isEthTradingToken,
    tradingTokenSymbol,
    userTradingTokenBalance,
  } = useBondkit(tokenAddress);

  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<Action>("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [sellAmountToProcess, setSellAmountToProcess] = useState<bigint | null>(null);

  useEffect(() => {
    if (tokenName && tokenSymbol && holders) {
      // Calculate latest price from holders' transactions if available
      const latestPrice = holders.length > 0 ? parseFloat(formatEther(holders[0].balance)) : 0;
      const previousPrice = holders.length > 24 ? parseFloat(formatEther(holders[24].balance)) : latestPrice;

      // Calculate 24h change percentage
      const change24h = previousPrice !== 0 ? ((latestPrice - previousPrice) / previousPrice) * 100 : 0;

      // Calculate 24h volume from recent holder transactions
      const volume24h = holders
        .filter(holder => holder.balance > BigInt(0))
        .reduce((sum, holder) => sum + parseFloat(formatEther(holder.balance)), 0);

      setTokenInfo({
        name: tokenName,
        symbol: tokenSymbol,
        currentPrice: latestPrice,
        change24h: change24h,
        volume24h: volume24h,
      });
      setIsLoading(false);
    }
  }, [tokenName, tokenSymbol, holders]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isOwner = owner && userAddress && (owner as string).toLowerCase() === userAddress.toLowerCase();

  const needsApproval = useMemo(() => {
    if (action !== "sell" || !amount) return false;
    const parsedAmount = parseEther(amount);
    return parsedAmount > (allowance || BigInt(0));
  }, [action, amount, allowance]);

  const debouncedGetQuote = useMemo(
    () =>
      debounce(async (val: string, currentAction: Action) => {
        if (!val || Number(val) <= 0) {
          setQuote(null);
          return;
        }
        const parsedAmount = parseEther(val);
        if (currentAction === "buy") {
          const buyQuote = await getBuyQuote(parsedAmount);
          setQuote(buyQuote ? formatEther(buyQuote) : null);
        } else {
          const sellQuote = await getSellQuote(parsedAmount);
          setQuote(sellQuote ? formatEther(sellQuote) : null);
        }
      }, 500),
    [getBuyQuote, getSellQuote],
  );

  useEffect(() => {
    debouncedGetQuote(amount, action);
  }, [amount, action, debouncedGetQuote]);

  useEffect(() => {
    if (isConfirmed && txType === "approve" && sellAmountToProcess) {
      sell(sellAmountToProcess);
      setSellAmountToProcess(null);
    }
  }, [isConfirmed, txType, sell, sellAmountToProcess]);

  const handleAction = async () => {
    if (!amount) return;
    const parsedAmount = parseEther(amount);
    if (action === "buy") {
      // Check if user has sufficient trading token balance
      if (userTradingTokenBalance && parsedAmount <= userTradingTokenBalance) {
        buy(parsedAmount);
      } else {
        // If insufficient balance or no balance, open AnySpend (for ETH trading tokens) or show error
        if (isEthTradingToken) {
          setB3ModalOpen(true);
          setB3ModalContentType({
            type: "anySpendBondKit",
            recipientAddress: userAddress || "",
            contractAddress: tokenAddress,
            b3Amount: formatEther(parsedAmount),
            minTokensOut: "0",
          });
        } else {
          // For ERC20 trading tokens, user needs to get tokens elsewhere
          alert(`Insufficient ${tradingTokenSymbol} balance. Please get more ${tradingTokenSymbol} tokens first.`);
        }
      }
    } else {
      if (needsApproval) {
        setSellAmountToProcess(parsedAmount);
        approve(parsedAmount);
      } else {
        sell(parsedAmount);
      }
    }
  };

  const buttonText = () => {
    if (!isConnected) return "Please Connect";
    if (isPending) return "Processing...";
    if (action === "sell") {
      if (needsApproval) return `Approve ${tokenSymbol || "Token"}`;
      return "Sell Token";
    }
    // Check if user has sufficient trading token balance
    if (userTradingTokenBalance && amount && parseEther(amount) <= userTradingTokenBalance) {
      return `Buy with ${tradingTokenSymbol}`;
    }
    return isEthTradingToken ? "Buy with AnySpend" : `Insufficient ${tradingTokenSymbol}`;
  };

  if (isLoading) {
    return (
      <div className="bg-b3-react-background min-h-screen">
        {/* Header - Match Homepage */}
        <header className="border-b3-react-border bg-b3-react-card border-b">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h1 className="text-b3-react-foreground text-3xl font-bold">Bondkit</h1>
                <nav className="hidden items-center space-x-1 md:flex">
                  <button
                    onClick={() => router.push("/")}
                    className="text-b3-react-muted-foreground hover:text-b3-react-foreground hover:bg-b3-react-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Tokens
                  </button>
                  <button
                    onClick={() => router.push("/deploy")}
                    className="text-b3-react-muted-foreground hover:text-b3-react-foreground hover:bg-b3-react-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Deploy Token
                  </button>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/")}
                  className="text-b3-react-primary hover:text-b3-react-primary/80 group flex items-center space-x-2 transition-colors"
                >
                  <svg
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back to Tokens</span>
                </button>
                <SignInWithB3OnBase />
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-[60vh] flex-grow items-center justify-center">
          <div className="text-center">
            <div className="border-b3-react-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-b3-react-muted-foreground">Loading token information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-b3-react-background min-h-screen">
      {/* Header - Match Homepage */}
      <header className="border-b3-react-border bg-b3-react-card border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-b3-react-foreground text-3xl font-bold">Bondkit</h1>
              <nav className="hidden items-center space-x-1 md:flex">
                <button
                  onClick={() => router.push("/")}
                  className="text-b3-react-muted-foreground hover:text-b3-react-foreground hover:bg-b3-react-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Tokens
                </button>
                <button
                  onClick={() => router.push("/deploy")}
                  className="text-b3-react-muted-foreground hover:text-b3-react-foreground hover:bg-b3-react-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Deploy Token
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="text-b3-react-primary hover:text-b3-react-primary/80 group flex items-center space-x-2 transition-colors"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to Tokens</span>
              </button>
              <SignInWithB3OnBase />
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Token Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-b3-react-foreground text-3xl font-bold">{tokenName || "Unknown Token"}</h2>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="bg-b3-react-subtle border-b3-react-border text-b3-react-foreground rounded-full border px-3 py-1 text-sm font-medium">
                    ${tokenSymbol || "???"}
                  </span>
                  <span className="text-b3-react-muted-foreground font-mono text-sm">
                    {formatAddress(tokenAddress)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href={`https://basescan.org/address/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-b3-react-subtle border-b3-react-border text-b3-react-foreground hover:bg-b3-react-muted flex items-center space-x-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <span>View on BaseScan</span>
                </a>
              </div>
            </div>
          </div>

          {/* Token Overview Stats */}
          <div className="mx-auto mb-8 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-b3-react-muted-foreground text-sm font-medium">Current Phase</h3>
                  <p className="text-2xl font-bold text-blue-500">{currentPhase || "Loading..."}</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-b3-react-muted-foreground text-sm font-medium">Your Balance</h3>
                  <p className="text-2xl font-bold text-green-500">
                    {tokenBalance ? formatEther(tokenBalance) : "0.0"}
                  </p>
                  <p className="text-b3-react-muted-foreground text-sm">{tokenSymbol}</p>
                </div>
                <div className="rounded-xl bg-green-500/10 p-3">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-b3-react-muted-foreground text-sm font-medium">Total Holders</h3>
                  <p className="text-2xl font-bold text-purple-500">{holders?.length || 0}</p>
                </div>
                <div className="rounded-xl bg-purple-500/10 p-3">
                  <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-b3-react-muted-foreground text-sm font-medium">Bonding Progress</h3>
                  <p className="text-2xl font-bold text-orange-500">
                    {bondingProgress?.progress?.toFixed(2) || "0.00"}%
                  </p>
                </div>
                <div className="rounded-xl bg-orange-500/10 p-3">
                  <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
            {/* Left Column - Chart */}
            <div className="xl:col-span-3">
              <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-b3-react-foreground text-xl font-semibold">Price Chart</h3>
                  <div className="text-b3-react-muted-foreground flex items-center space-x-2 text-sm">
                    <span>Live Trading Data</span>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                  </div>
                </div>
                <TradingView tokenAddress={tokenAddress} tokenSymbol={tokenSymbol} />
              </div>
            </div>

            {/* Right Column - Trading Interface */}
            <div className="xl:col-span-1">
              <div className="sticky top-8 mx-auto max-w-sm space-y-6 xl:mx-0 xl:max-w-none">
                <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6 shadow-lg">
                  <h3 className="text-b3-react-foreground mb-6 text-xl font-semibold">Trade Token</h3>

                  {currentPhase === TokenPhase.Bonding && bondingProgress && (
                    <>
                      {/* Bonding Progress */}
                      <div className="mb-6">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-b3-react-muted-foreground">Bonding Progress</span>
                          <span className="text-b3-react-foreground font-medium">
                            {bondingProgress.progress.toFixed(2)}%
                          </span>
                        </div>
                        <div className="bg-b3-react-subtle h-2 w-full rounded-full">
                          <div
                            className="bg-b3-react-primary h-2 rounded-full"
                            style={{ width: `${bondingProgress.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-b3-react-muted-foreground mt-1 flex justify-between text-xs">
                          <span>
                            {formatEther(bondingProgress.raised)} {tradingTokenSymbol}
                          </span>
                          <span>
                            {formatEther(bondingProgress.threshold)} {tradingTokenSymbol}
                          </span>
                        </div>
                      </div>

                      {bondingProgress.progress < 100 ? (
                        <div>
                          {/* Buy/Sell Toggle */}
                          <div className="border-b3-react-border mb-4 flex justify-center border-b">
                            <button
                              className={`px-6 py-2 font-semibold transition-colors ${
                                action === "buy"
                                  ? "border-b3-react-primary text-b3-react-foreground border-b-2"
                                  : "text-b3-react-muted-foreground hover:text-b3-react-foreground"
                              }`}
                              onClick={() => setAction("buy")}
                            >
                              Buy
                            </button>
                            <button
                              className={`px-6 py-2 font-semibold transition-colors ${
                                action === "sell"
                                  ? "border-b3-react-primary text-b3-react-foreground border-b-2"
                                  : "text-b3-react-muted-foreground hover:text-b3-react-foreground"
                              }`}
                              onClick={() => setAction("sell")}
                            >
                              Sell
                            </button>
                          </div>

                          {/* Trading Form */}
                          <div>
                            <div className="text-b3-react-muted-foreground mb-2 flex justify-between text-sm">
                              <span>
                                {action === "buy"
                                  ? `You pay (${tradingTokenSymbol})`
                                  : `You sell (${tokenSymbol || ""})`}
                              </span>
                              <span>
                                Balance:{" "}
                                {action === "buy"
                                  ? `${
                                      userTradingTokenBalance
                                        ? parseFloat(formatEther(userTradingTokenBalance)).toFixed(4)
                                        : "0.0"
                                    } ${tradingTokenSymbol}`
                                  : `${tokenBalance ? formatEther(tokenBalance) : "0.0"}`}
                              </span>
                            </div>
                            <input
                              type="number"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                              placeholder="Amount"
                              className="bg-b3-react-subtle border-b3-react-border text-b3-react-foreground placeholder-b3-react-muted-foreground focus:border-b3-react-primary mb-4 w-full rounded-lg border p-3 focus:outline-none"
                            />
                            {quote && (
                              <p className="text-b3-react-muted-foreground mb-4 text-sm">
                                You will receive ≈ {parseFloat(quote).toFixed(4)}{" "}
                                {action === "buy" ? tokenSymbol : tradingTokenSymbol}
                              </p>
                            )}
                            <button
                              onClick={handleAction}
                              disabled={isPending || !isConnected || !amount}
                              className="bg-b3-react-primary text-b3-react-primary-foreground hover:bg-b3-react-primary/90 disabled:bg-b3-react-muted disabled:text-b3-react-muted-foreground w-full rounded-lg px-4 py-3 font-bold transition-colors"
                            >
                              {buttonText()}
                            </button>
                            {hash && (
                              <p className="text-b3-react-muted-foreground mt-2 break-all text-center font-mono text-xs">
                                Tx: {hash}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <h4 className="text-b3-react-foreground mb-2 text-lg font-semibold">Bonding Complete!</h4>
                          <p className="text-b3-react-muted-foreground mb-4">Waiting for migration to DEX.</p>
                          {isOwner && (
                            <button
                              onClick={() => migrateToDex()}
                              disabled={isPending}
                              className="group relative w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none"
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {isPending && txType === "migrate" ? (
                                  <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    <span>Migrating...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                      />
                                    </svg>
                                    <span>Migrate to DEX</span>
                                    <svg
                                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </>
                                )}
                              </div>
                              {/* Shine effect on hover */}
                              <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {currentPhase === TokenPhase.DEX && <SwapInterface tokenAddress={tokenAddress} />}
                </div>

                {/* Token Details */}
                <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
                  <h3 className="text-b3-react-foreground mb-4 text-lg font-semibold">Token Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-b3-react-muted-foreground mb-1 text-sm">Contract Address</p>
                      <p className="text-b3-react-primary break-all font-mono text-sm">{tokenAddress}</p>
                    </div>
                    <div>
                      <p className="text-b3-react-muted-foreground mb-1 text-sm">Network</p>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-b3-react-foreground font-semibold">Base</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-b3-react-muted-foreground mb-1 text-sm">Owner</p>
                      <p className="text-b3-react-foreground font-mono text-sm">
                        {owner ? formatAddress(owner as string) : "Unknown"}
                        {isOwner && <span className="ml-2 text-green-500">(You)</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-b3-react-muted-foreground mb-1 text-sm">Phase</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          currentPhase === TokenPhase.Bonding
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            : currentPhase === TokenPhase.DEX
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                        }`}
                      >
                        {currentPhase || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Holders */}
          {holders && holders.length > 0 && (
            <div className="mx-auto mt-8 max-w-5xl">
              <div className="bg-b3-react-card border-b3-react-border rounded-xl border p-6">
                <h3 className="text-b3-react-foreground mb-6 text-xl font-semibold">Top Token Holders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-b3-react-subtle">
                      <tr>
                        <th className="text-b3-react-muted-foreground px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="text-b3-react-muted-foreground px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                          Address
                        </th>
                        <th className="text-b3-react-muted-foreground px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="text-b3-react-muted-foreground px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-b3-react-border divide-y">
                      {holders.slice(0, 10).map((holder, index) => (
                        <tr key={holder.address} className="hover:bg-b3-react-subtle transition-colors">
                          <td className="text-b3-react-foreground px-6 py-4 font-medium">#{index + 1}</td>
                          <td className="px-6 py-4">
                            <a
                              href={`https://basescan.org/address/${holder.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-b3-react-primary font-mono hover:underline"
                            >
                              {formatAddress(holder.address)}
                            </a>
                            {holder.address.toLowerCase() === userAddress?.toLowerCase() && (
                              <span className="ml-2 text-xs text-green-500">(You)</span>
                            )}
                          </td>
                          <td className="text-b3-react-foreground px-6 py-4 text-right font-mono">
                            {formatEther(holder.balance)}
                          </td>
                          <td className="text-b3-react-foreground px-6 py-4 text-right font-semibold">
                            {holder.percentage.toFixed(2)}%
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
