"use client";

import TradingView from "@/components/trading/TradingView";
import { useBondkit } from "@/hooks/useBondkit";
import { TokenInfo } from "@/types/chart";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";

type Action = "buy" | "sell";

function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

interface TokenPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function TokenPage({ params }: TokenPageProps) {
  const { address: userAddress, isConnected } = useAccount();
  const router = useRouter();
  const setB3ModalOpen = useModalStore((state) => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(
    (state) => state.setB3ModalContentType
  );

  // Unwrap the params Promise
  const resolvedParams = use(params);
  const tokenAddress = resolvedParams.address as `0x${string}`;

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
  const [sellAmountToProcess, setSellAmountToProcess] = useState<bigint | null>(
    null
  );

  useEffect(() => {
    if (tokenName && tokenSymbol && holders) {
      // Calculate latest price from holders' transactions if available
      const latestPrice =
        holders.length > 0 ? parseFloat(formatEther(holders[0].balance)) : 0;
      const previousPrice =
        holders.length > 24
          ? parseFloat(formatEther(holders[24].balance))
          : latestPrice;

      // Calculate 24h change percentage
      const change24h =
        previousPrice !== 0
          ? ((latestPrice - previousPrice) / previousPrice) * 100
          : 0;

      // Calculate 24h volume from recent holder transactions
      const volume24h = holders
        .filter((holder) => holder.balance > BigInt(0))
        .reduce(
          (sum, holder) => sum + parseFloat(formatEther(holder.balance)),
          0
        );

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

  const isOwner =
    owner &&
    userAddress &&
    (owner as string).toLowerCase() === userAddress.toLowerCase();

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
    [getBuyQuote, getSellQuote]
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
    if (
      userEthBalance &&
      amount &&
      parseEther(amount) <= userEthBalance.value
    ) {
      return "Buy with ETH";
    }
    return "Buy with AnySpend";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ← Back to Tokens
            </button>
            <h1 className="text-2xl font-bold">Loading Token...</h1>
          </div>
          <ConnectButton />
        </header>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading token information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to Tokens
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {tokenName || "Unknown Token"} ({tokenSymbol || "???"})
            </h1>
            <p className="text-sm text-gray-400">
              {formatAddress(tokenAddress)}
            </p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          {/* Token Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Current Phase</h3>
              <p className="text-2xl font-bold text-blue-400">
                {currentPhase || "Loading..."}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Your Balance</h3>
              <p className="text-2xl font-bold text-green-400">
                {tokenBalance ? formatEther(tokenBalance) : "0.0"}
              </p>
              <p className="text-sm text-gray-400">{tokenSymbol}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Total Holders</h3>
              <p className="text-2xl font-bold text-purple-400">
                {holders?.length || 0}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Progress</h3>
              <p className="text-2xl font-bold text-yellow-400">
                {bondingProgress?.progress?.toFixed(2) || "0.00"}%
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Chart */}
            <div className="xl:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Price Chart</h3>
                <TradingView
                  tokenAddress={tokenAddress}
                  tokenSymbol={tokenSymbol}
                />
              </div>
            </div>

            {/* Right Column - Trading Interface & Token Details */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Trade Token</h3>

                {currentPhase === "Bonding" && bondingProgress && (
                  <>
                    {/* Bonding Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Bonding Progress</span>
                        <span>{bondingProgress.progress.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${bondingProgress.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-gray-400">
                        <span>{formatEther(bondingProgress.raised)} ETH</span>
                        <span>
                          {formatEther(bondingProgress.threshold)} ETH
                        </span>
                      </div>
                    </div>

                    {bondingProgress.progress < 100 ? (
                      <div>
                        {/* Buy/Sell Toggle */}
                        <div className="flex justify-center mb-4 border-b border-gray-600">
                          <button
                            className={`px-6 py-2 font-semibold ${
                              action === "buy"
                                ? "border-b-2 border-blue-500 text-white"
                                : "text-gray-500"
                            }`}
                            onClick={() => setAction("buy")}
                          >
                            Buy
                          </button>
                          <button
                            className={`px-6 py-2 font-semibold ${
                              action === "sell"
                                ? "border-b-2 border-blue-500 text-white"
                                : "text-gray-500"
                            }`}
                            onClick={() => setAction("sell")}
                          >
                            Sell
                          </button>
                        </div>

                        {/* Trading Form */}
                        <div>
                          <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>
                              {action === "buy"
                                ? "You pay (ETH)"
                                : `You sell (${tokenSymbol || ""})`}
                            </span>
                            <span>
                              Balance:{" "}
                              {action === "buy"
                                ? `${
                                    userEthBalance
                                      ? parseFloat(
                                          formatEther(userEthBalance.value)
                                        ).toFixed(4)
                                      : "0.0"
                                  } ETH`
                                : `${
                                    tokenBalance
                                      ? formatEther(tokenBalance)
                                      : "0.0"
                                  }`}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-full bg-gray-600 text-white p-3 rounded-md mb-4"
                          />
                          {quote && (
                            <p className="text-sm text-gray-400 mb-4">
                              You will receive ≈ {parseFloat(quote).toFixed(4)}{" "}
                              {action === "buy" ? tokenSymbol : "ETH"}
                            </p>
                          )}
                          <button
                            onClick={handleAction}
                            disabled={isPending || !isConnected || !amount}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md"
                          >
                            {buttonText()}
                          </button>
                          {hash && (
                            <p className="mt-2 text-center text-xs break-all">
                              Tx: {hash}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h4 className="text-lg font-semibold mb-2">
                          Bonding Complete!
                        </h4>
                        <p className="text-gray-400 mb-4">
                          Waiting for migration to DEX.
                        </p>
                        {isOwner && (
                          <button
                            onClick={() => migrateToDex()}
                            disabled={isPending}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md"
                          >
                            {isPending && txType === "migrate"
                              ? "Migrating..."
                              : "Migrate to DEX"}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {currentPhase !== "Bonding" && (
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-2">
                      Trading Phase
                    </h4>
                    <p className="text-gray-400 mb-4">
                      This token has migrated to a DEX.
                    </p>
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
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Token Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      Contract Address
                    </p>
                    <p className="font-mono text-sm break-all text-blue-400">
                      {tokenAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Network</p>
                    <p className="font-semibold">Base</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Owner</p>
                    <p className="font-mono text-sm">
                      {owner ? formatAddress(owner as string) : "Unknown"}
                      {isOwner && (
                        <span className="ml-2 text-green-400">(You)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Phase</p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
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
                    <p className="text-gray-400 text-sm mb-1">
                      View on Explorer
                    </p>
                    <a
                      href={`https://basescan.org/address/${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-sm"
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
            <div className="mt-8 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Token Holders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Address</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.slice(0, 10).map((holder, index) => (
                      <tr
                        key={holder.address}
                        className="border-b border-gray-700"
                      >
                        <td className="px-4 py-3 font-medium">#{index + 1}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://basescan.org/address/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline font-mono"
                          >
                            {formatAddress(holder.address)}
                          </a>
                          {holder.address.toLowerCase() ===
                            userAddress?.toLowerCase() && (
                            <span className="ml-2 text-green-400 text-xs">
                              (You)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatEther(holder.balance)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {holder.percentage.toFixed(2)}%
                        </td>
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
