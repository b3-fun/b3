"use client";

import { useBondkit } from "@/hooks/useBondkit";
import { TokenInfo } from "@/types/chart";
import { TradingView } from "@b3dotfun/sdk/bondkit";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import SignInWithB3OnBase from "../../SignInWithB3OnBase";

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
      // Check if user has sufficient ETH balance
      if (userEthBalance && parsedAmount <= userEthBalance.value) {
        buy(parsedAmount);
      } else {
        // If insufficient balance or no balance, open AnySpend
        setB3ModalOpen(true);
        setB3ModalContentType({
          type: "anySpendBondKit",
          recipientAddress: userAddress || "",
          contractAddress: tokenAddress,
          ethAmount: formatEther(parsedAmount),
          minTokensOut: "0",
        });
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
    // Check if user has sufficient ETH balance
    if (userEthBalance && amount && parseEther(amount) <= userEthBalance.value) {
      return "Buy with ETH";
    }
    return "Buy with AnySpend";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900 text-white">
        <header className="flex items-center justify-between border-b border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push("/")} className="text-blue-400 underline hover:text-blue-300">
              ← Back to Tokens
            </button>
            <h1 className="text-2xl font-bold">Loading Token...</h1>
          </div>
          <SignInWithB3OnBase />
        </header>
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Loading token information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <header className="flex items-center justify-between border-b border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push("/")} className="text-blue-400 underline hover:text-blue-300">
            ← Back to Tokens
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {tokenName || "Unknown Token"} ({tokenSymbol || "???"})
            </h1>
            <p className="text-sm text-gray-400">{formatAddress(tokenAddress)}</p>
          </div>
        </div>
        <SignInWithB3OnBase />
      </header>

      <main className="flex-grow p-8">
        <div className="mx-auto max-w-7xl">
          {/* Token Overview */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-lg bg-gray-800 p-6">
              <h3 className="mb-2 text-lg font-semibold">Current Phase</h3>
              <p className="text-2xl font-bold text-blue-400">{currentPhase || "Loading..."}</p>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <h3 className="mb-2 text-lg font-semibold">Your Balance</h3>
              <p className="text-2xl font-bold text-green-400">{tokenBalance ? formatEther(tokenBalance) : "0.0"}</p>
              <p className="text-sm text-gray-400">{tokenSymbol}</p>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <h3 className="mb-2 text-lg font-semibold">Total Holders</h3>
              <p className="text-2xl font-bold text-purple-400">{holders?.length || 0}</p>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <h3 className="mb-2 text-lg font-semibold">Progress</h3>
              <p className="text-2xl font-bold text-yellow-400">{bondingProgress?.progress?.toFixed(2) || "0.00"}%</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            {/* Left Column - Chart */}
            <div className="xl:col-span-2">
              <div className="rounded-lg bg-gray-800 p-6">
                <h3 className="mb-4 text-lg font-semibold">Price Chart</h3>
                <TradingView tokenAddress={tokenAddress} tokenSymbol={tokenSymbol} />
              </div>
            </div>

            {/* Right Column - Trading Interface & Token Details */}
            <div className="space-y-6 xl:col-span-1">
              <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold">Trade Token</h3>

                {currentPhase === "Bonding" && bondingProgress && (
                  <>
                    {/* Bonding Progress */}
                    <div className="mb-6">
                      <div className="mb-2 flex justify-between text-sm">
                        <span>Bonding Progress</span>
                        <span>{bondingProgress.progress.toFixed(2)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-600">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${bondingProgress.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>{formatEther(bondingProgress.raised)} ETH</span>
                        <span>{formatEther(bondingProgress.threshold)} ETH</span>
                      </div>
                    </div>

                    {bondingProgress.progress < 100 ? (
                      <div>
                        {/* Buy/Sell Toggle */}
                        <div className="mb-4 flex justify-center border-b border-gray-600">
                          <button
                            className={`px-6 py-2 font-semibold ${
                              action === "buy" ? "border-b-2 border-blue-500 text-white" : "text-gray-500"
                            }`}
                            onClick={() => setAction("buy")}
                          >
                            Buy
                          </button>
                          <button
                            className={`px-6 py-2 font-semibold ${
                              action === "sell" ? "border-b-2 border-blue-500 text-white" : "text-gray-500"
                            }`}
                            onClick={() => setAction("sell")}
                          >
                            Sell
                          </button>
                        </div>

                        {/* Trading Form */}
                        <div>
                          <div className="mb-2 flex justify-between text-sm text-gray-400">
                            <span>{action === "buy" ? "You pay (ETH)" : `You sell (${tokenSymbol || ""})`}</span>
                            <span>
                              Balance:{" "}
                              {action === "buy"
                                ? `${
                                    userEthBalance ? parseFloat(formatEther(userEthBalance.value)).toFixed(4) : "0.0"
                                  } ETH`
                                : `${tokenBalance ? formatEther(tokenBalance) : "0.0"}`}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Amount"
                            className="mb-4 w-full rounded-md bg-gray-600 p-3 text-white"
                          />
                          {quote && (
                            <p className="mb-4 text-sm text-gray-400">
                              You will receive ≈ {parseFloat(quote).toFixed(4)} {action === "buy" ? tokenSymbol : "ETH"}
                            </p>
                          )}
                          <button
                            onClick={handleAction}
                            disabled={isPending || !isConnected || !amount}
                            className="w-full rounded-md bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-500"
                          >
                            {buttonText()}
                          </button>
                          {hash && <p className="mt-2 break-all text-center text-xs">Tx: {hash}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h4 className="mb-2 text-lg font-semibold">Bonding Complete!</h4>
                        <p className="mb-4 text-gray-400">Waiting for migration to DEX.</p>
                        {isOwner && (
                          <button
                            onClick={() => migrateToDex()}
                            disabled={isPending}
                            className="w-full rounded-md bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700 disabled:bg-gray-500"
                          >
                            {isPending && txType === "migrate" ? "Migrating..." : "Migrate to DEX"}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {currentPhase !== "Bonding" && (
                  <div className="text-center">
                    <h4 className="mb-2 text-lg font-semibold">Trading Phase</h4>
                    <p className="mb-4 text-gray-400">This token has migrated to a DEX.</p>
                    <div className="mt-4 space-y-2">
                      <a
                        href={`https://dexscreener.com/base/${tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full rounded-md bg-gray-700 px-4 py-3 font-bold text-white hover:bg-gray-600"
                      >
                        View on DexScreener
                      </a>
                      <a
                        href={`https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=${tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full rounded-md bg-pink-600 px-4 py-3 font-bold text-white hover:bg-pink-700"
                      >
                        Swap on Uniswap
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Token Details */}
              <div className="rounded-lg bg-gray-800 p-6">
                <h3 className="mb-4 text-lg font-semibold">Token Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Contract Address</p>
                    <p className="break-all font-mono text-sm text-blue-400">{tokenAddress}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Network</p>
                    <p className="font-semibold">Base</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Owner</p>
                    <p className="font-mono text-sm">
                      {owner ? formatAddress(owner as string) : "Unknown"}
                      {isOwner && <span className="ml-2 text-green-400">(You)</span>}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Phase</p>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        currentPhase === "Bonding"
                          ? "bg-blue-600"
                          : currentPhase === "Trading"
                            ? "bg-green-600"
                            : "bg-gray-600"
                      }`}
                    >
                      {currentPhase || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-400">View on Explorer</p>
                    <a
                      href={`https://basescan.org/address/${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 underline hover:text-blue-300"
                    >
                      BaseScan →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Holders */}
          {holders && holders.length > 0 && (
            <div className="mt-8 rounded-lg bg-gray-800 p-6">
              <h3 className="mb-4 text-lg font-semibold">Top Token Holders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Address</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.slice(0, 10).map((holder, index) => (
                      <tr key={holder.address} className="border-b border-gray-700">
                        <td className="px-4 py-3 font-medium">#{index + 1}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://basescan.org/address/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-400 hover:underline"
                          >
                            {formatAddress(holder.address)}
                          </a>
                          {holder.address.toLowerCase() === userAddress?.toLowerCase() && (
                            <span className="ml-2 text-xs text-green-400">(You)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatEther(holder.balance)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{holder.percentage.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
